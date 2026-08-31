import { describe, expect, it, vi } from 'vitest'

import {
  backoffMs,
  createRetryingFetch,
  DEFAULT_MAX_RETRIES,
  MAX_BACKOFF_MS,
  retryAfterMs,
} from './retry'

// ── Helpers ───────────────────────────────────────────────────────────
//
// The rejection the API actually sends: 429 with `Retry-After` set to the
// whole rate-limit window, plus the `X-RateLimit-*` set.

function rateLimited(): Response {
  return new Response('{"detail":"Rate limit exceeded for extensions write operations."}', {
    status: 429,
    headers: {
      'Retry-After': '60',
      'X-RateLimit-Limit': '300',
      'X-RateLimit-Remaining': '0',
      'Content-Type': 'application/json',
    },
  })
}

function ok(body = '{"ok":true}'): Response {
  return new Response(body, { status: 200, headers: { 'Content-Type': 'application/json' } })
}

/** A fetch that rejects the first `failures` calls, then succeeds. */
function stub(failures: number) {
  let calls = 0
  const fn = vi.fn(async () => {
    calls += 1
    return calls <= failures ? rateLimited() : ok()
  })
  return {
    fn,
    get calls() {
      return fn.mock.calls.length
    },
  }
}

describe('backoff', () => {
  it('treats Retry-After as a ceiling, never as the delay', () => {
    // The limiter is a sliding window, so Retry-After reports the whole
    // window. Sleeping it literally turns a few rejections into minutes.
    for (let i = 0; i < 50; i++) {
      expect(backoffMs(0, 1000, 60_000)).toBeLessThanOrEqual(1000)
      expect(backoffMs(4, 1000, 2000)).toBeLessThanOrEqual(2000)
    }
  })

  it('grows exponentially but stays bounded', () => {
    expect(backoffMs(0, 1000, null)).toBeLessThanOrEqual(1000)
    expect(backoffMs(4, 1000, null)).toBeLessThanOrEqual(16_000)
    expect(backoffMs(20, 1000, null)).toBeLessThanOrEqual(MAX_BACKOFF_MS)
  })

  it('never returns zero, so a replay is always spaced', () => {
    expect(backoffMs(0, 1000, null)).toBeGreaterThan(0)
  })
})

describe('retryAfterMs', () => {
  it('parses the numeric delta-seconds form', () => {
    expect(retryAfterMs(rateLimited())).toBe(60_000)
  })

  it('returns null when absent', () => {
    expect(retryAfterMs(ok())).toBeNull()
  })

  it('ignores the HTTP-date form rather than mis-parsing it', () => {
    const response = new Response(null, {
      status: 429,
      headers: { 'Retry-After': 'Wed, 21 Oct 2026 07:28:00 GMT' },
    })
    expect(retryAfterMs(response)).toBeNull()
  })
})

describe('createRetryingFetch', () => {
  it('replays until the request is accepted', async () => {
    const inner = stub(3)
    const retrying = createRetryingFetch({ fetch: inner.fn, maxRetries: 5, retryDelay: 1 })

    const response = await retrying('https://api.test/x', { method: 'POST', body: '{}' })

    expect(response.status).toBe(200)
    expect(inner.calls).toBe(4)
  })

  it('surfaces the 429 once retries are exhausted', async () => {
    const inner = stub(Number.MAX_SAFE_INTEGER)
    const retrying = createRetryingFetch({ fetch: inner.fn, maxRetries: 2, retryDelay: 1 })

    const response = await retrying('https://api.test/x', { method: 'POST', body: '{}' })

    expect(response.status).toBe(429)
    expect(inner.calls).toBe(3)
  })

  it('sends exactly once when retrying is disabled', async () => {
    const inner = stub(Number.MAX_SAFE_INTEGER)
    const retrying = createRetryingFetch({ fetch: inner.fn, maxRetries: 0, retryDelay: 1 })

    const response = await retrying('https://api.test/x', { method: 'POST', body: '{}' })

    expect(response.status).toBe(429)
    expect(inner.calls).toBe(1)
  })

  it('leaves every other status untouched', async () => {
    const inner = vi.fn(async () => new Response('nope', { status: 500 }))
    const retrying = createRetryingFetch({ fetch: inner, maxRetries: 5, retryDelay: 1 })

    const response = await retrying('https://api.test/x')

    expect(response.status).toBe(500)
    expect(inner).toHaveBeenCalledTimes(1)
  })

  it('does not replay a streamed body', async () => {
    // A ReadableStream body is consumed by the first attempt, so a replay
    // would send nothing.
    const inner = stub(Number.MAX_SAFE_INTEGER)
    const retrying = createRetryingFetch({ fetch: inner.fn, maxRetries: 3, retryDelay: 1 })
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{}'))
        controller.close()
      },
    })

    const response = await retrying('https://api.test/x', { method: 'POST', body })

    expect(response.status).toBe(429)
    expect(inner.calls).toBe(1)
  })

  it('stops replaying once the caller aborts', async () => {
    const inner = stub(Number.MAX_SAFE_INTEGER)
    const retrying = createRetryingFetch({ fetch: inner.fn, maxRetries: 5, retryDelay: 1 })
    const controller = new AbortController()
    controller.abort()

    const response = await retrying('https://api.test/x', {
      method: 'POST',
      body: '{}',
      signal: controller.signal,
    })

    expect(response.status).toBe(429)
    expect(inner.calls).toBe(1)
  })

  it('resolves the global fetch per call so test harnesses can swap it', async () => {
    const retrying = createRetryingFetch({ maxRetries: 1, retryDelay: 1 })
    const spy = vi.fn(async () => ok('{"swapped":true}'))
    const original = globalThis.fetch
    globalThis.fetch = spy as unknown as typeof fetch
    try {
      const response = await retrying('https://api.test/x')
      expect(await response.json()).toEqual({ swapped: true })
    } finally {
      globalThis.fetch = original
    }
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('composes over an inner fetch so each attempt gets its own timeout', async () => {
    // Retry wraps timeout, not the reverse — the inner wrapper must run
    // again on every replay.
    let wrapped = 0
    const inner = stub(2)
    const timeoutish: typeof fetch = (input, init) => {
      wrapped += 1
      return inner.fn(input, init)
    }
    const retrying = createRetryingFetch({ fetch: timeoutish, maxRetries: 5, retryDelay: 1 })

    await retrying('https://api.test/x', { method: 'POST', body: '{}' })

    expect(wrapped).toBe(3)
  })

  it('defaults to the shared retry budget', () => {
    expect(DEFAULT_MAX_RETRIES).toBe(5)
  })
})
