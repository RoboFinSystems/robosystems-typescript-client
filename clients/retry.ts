/**
 * Rate-limit-aware `fetch` wrapper shared by the facade clients.
 *
 * The API rate-limits per user per endpoint category and answers an
 * exhausted budget with `429` plus `Retry-After` / `X-RateLimit-*`
 * headers. That rejection is raised by a request dependency *before*
 * the endpoint handler runs, so the request had no effect and is always
 * safe to replay — including a `POST` carrying no idempotency key.
 * Nothing other than `429` is retried here, precisely because nothing
 * else carries that guarantee.
 *
 * Mirrors `robosystems_client/clients/retry.py` in the Python client.
 */

/** The one status a rejected request is known to have had no effect for. */
export const RETRY_STATUS_CODES = new Set([429])

export const DEFAULT_MAX_RETRIES = 5
export const DEFAULT_RETRY_DELAY_MS = 1000
export const MAX_BACKOFF_MS = 30_000

export interface RetryOptions {
  /** Replays after the first attempt. `0` disables retrying entirely. */
  maxRetries?: number
  /** Base of the exponential backoff, in milliseconds. */
  retryDelay?: number
  /** Underlying fetch to wrap. Defaults to the global one, resolved per call. */
  fetch?: typeof fetch
}

/**
 * Parse `Retry-After` as a delta-seconds value, in milliseconds.
 *
 * The API always sends the numeric form. The HTTP-date form is ignored
 * rather than parsed, since treating an unreadable value as "no hint"
 * degrades to plain backoff instead of to a wrong sleep.
 */
export function retryAfterMs(response: Response): number | null {
  const raw = response.headers.get('retry-after')
  if (!raw) {
    return null
  }
  const seconds = Number(raw.trim())
  if (!Number.isFinite(seconds) || seconds < 0) {
    return null
  }
  return seconds * 1000
}

/**
 * Milliseconds to wait before replaying a rate-limited request.
 *
 * Exponential with full jitter, and `Retry-After` applied as a
 * *ceiling* rather than as the delay itself. The limiter is a sliding
 * window, so `Retry-After` reports the whole window — the worst case
 * for a client that filled its budget instantaneously. A caller that
 * merely ran at the sustained rate has slots freeing up within a second
 * or two, and obeying the header literally would turn a handful of
 * rejections into minutes of idling.
 */
export function backoffMs(attempt: number, retryDelay: number, retryAfter: number | null): number {
  let ceiling = Math.min(retryDelay * 2 ** attempt, MAX_BACKOFF_MS)
  if (retryAfter !== null) {
    ceiling = Math.min(ceiling, retryAfter)
  }
  return ceiling / 2 + Math.random() * (ceiling / 2)
}

/**
 * Whether a request can be sent a second time.
 *
 * A `ReadableStream` body is consumed by the first attempt, so
 * replaying it would send nothing. Strings, `FormData`, `Blob` and
 * typed arrays — everything the SDK and the GraphQL client actually
 * produce — are re-readable.
 */
function isReplayable(init: RequestInit | undefined): boolean {
  const body = init?.body
  return !(typeof ReadableStream !== 'undefined' && body instanceof ReadableStream)
}

function sleep(ms: number, signal?: AbortSignal | null): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    function onAbort() {
      clearTimeout(timer)
      reject(signal?.reason ?? new DOMException('Aborted', 'AbortError'))
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

/**
 * Wrap a `fetch` so rate-limited requests are replayed.
 *
 * Composes over an existing fetch rather than replacing it, so a
 * per-request timeout wrapper stays in place and each attempt gets its
 * own timeout. The global `fetch` is resolved at call time (not
 * captured) so test harnesses that swap `globalThis.fetch` keep
 * working.
 *
 * Set `maxRetries: 0` to opt out — an interactive surface may well
 * prefer to surface the rejection immediately rather than wait.
 */
export function createRetryingFetch(options: RetryOptions = {}): typeof fetch {
  const maxRetries = Math.max(0, options.maxRetries ?? DEFAULT_MAX_RETRIES)
  const retryDelay = Math.max(1, options.retryDelay ?? DEFAULT_RETRY_DELAY_MS)
  const inner = options.fetch

  return async (input, init) => {
    const send = () => (inner ?? fetch)(input, init)
    let response = await send()

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      if (!RETRY_STATUS_CODES.has(response.status) || !isReplayable(init)) {
        return response
      }
      if (init?.signal?.aborted) {
        return response
      }
      const delay = backoffMs(attempt, retryDelay, retryAfterMs(response))
      // The rejection body goes unused, but leaving it undrained keeps
      // the connection pinned in some runtimes.
      await response.body?.cancel().catch(() => {})
      await sleep(delay, init?.signal)
      response = await send()
    }

    return response
  }
}
