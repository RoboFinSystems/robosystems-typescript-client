'use client'

/**
 * GraphQL client factory used internally by the facade clients.
 *
 * This is an implementation detail — consumers never interact with it
 * directly. They call methods on LedgerClient / InvestorClient / etc.,
 * which use this to execute GraphQL queries against
 * `/extensions/{graph_id}/graphql`.
 *
 * **Graph scoping.** The GraphQL endpoint is mounted per-graph at
 * `/extensions/{graph_id}/graphql`. Resolvers read the graph from the URL
 * path parameter — never from GraphQL variables. Every facade method
 * takes a `graphId` and resolves the correct per-graph client via
 * `getGraphQLClient(graphId)`, which caches one `GraphQLClient` instance
 * per graph to avoid rebuilding headers + URLs on every call.
 *
 * We pick graphql-request (tiny, no React, no caching) because the facade
 * doesn't need the hook ergonomics that urql/Apollo provide. Type safety
 * comes from GraphQL Code Generator, which produces typed DocumentNodes
 * from the query files in clients/graphql/queries/.
 */

import { ClientError, GraphQLClient } from 'graphql-request'

/**
 * Default request timeout for GraphQL calls, in milliseconds.
 *
 * Matches the Python client's httpx default (60 seconds). Without a
 * timeout a hung backend hangs callers forever — every GraphQL request
 * carries an `AbortSignal.timeout(...)` so transport stalls surface as
 * an abort error instead of an eternal pending promise. Override
 * per-client via `GraphQLClientConfig.timeout`.
 */
export const DEFAULT_GRAPHQL_TIMEOUT_MS = 60_000

/**
 * Structured error thrown by facade GraphQL reads.
 *
 * Mirrors the Python client's `GraphQLError` (message, `errors`,
 * `status_code`): the message keeps the legacy
 * `"<label> failed: <json>"` format so string-matching consumers keep
 * working, while the raw GraphQL error objects and HTTP status are
 * available as structured fields for programmatic handling.
 */
export class GraphQLError extends Error {
  /** Raw GraphQL error objects from the response body (empty for HTTP-level failures). */
  readonly errors: unknown[]
  /** HTTP status code, when known. */
  readonly statusCode?: number

  constructor(message: string, options?: { errors?: unknown[]; statusCode?: number }) {
    super(message)
    this.name = 'GraphQLError'
    this.errors = options?.errors ?? []
    this.statusCode = options?.statusCode
  }
}

/**
 * Convert a graphql-request `ClientError` into the facade's structured
 * {@link GraphQLError}, preserving the legacy message format
 * (`"<label> failed: <json>"`). Shared by the LedgerClient /
 * InvestorClient / LibraryClient `gqlQuery` catch paths.
 */
export function toGraphQLError(label: string, err: ClientError): GraphQLError {
  const errors = err.response.errors ?? []
  return new GraphQLError(
    `${label} failed: ${JSON.stringify(err.response.errors ?? err.message)}`,
    {
      errors,
      statusCode: err.response.status,
    }
  )
}

/**
 * Callback that returns the current auth credential on demand.
 *
 * Use this instead of the static `token` field when the credential
 * can rotate during the lifetime of the client — the primary case
 * is short-lived JWTs that auto-refresh from browser token storage.
 * The provider is invoked on **every** GraphQL request, so the
 * returned value should be cheap to obtain (a localStorage read or
 * an in-memory lookup, not a network call if avoidable).
 *
 * May return `null`/`undefined` to indicate "no credential available
 * right now" — the request will be sent unauthenticated in that
 * case, which lets the caller distinguish auth-expired errors from
 * never-authed errors at the transport layer.
 */
export type TokenProvider = () => string | null | undefined | Promise<string | null | undefined>

export interface GraphQLClientConfig {
  baseUrl: string
  /**
   * Static credential captured at construction time. Use this when
   * the token won't rotate (e.g. CLI/server flows using a long-lived
   * API key). For JWT flows prefer `tokenProvider` so refreshes are
   * picked up without rebuilding the client.
   */
  token?: string
  /**
   * Dynamic credential callback, read on every request. Wins over
   * `token` when both are set. See `TokenProvider` for semantics.
   */
  tokenProvider?: TokenProvider
  headers?: Record<string, string>
  credentials?: 'include' | 'same-origin' | 'omit'
  /**
   * Request timeout in milliseconds. Defaults to
   * {@link DEFAULT_GRAPHQL_TIMEOUT_MS} (60s, matching the Python
   * client). Applied per request via `AbortSignal.timeout(...)`.
   */
  timeout?: number
}

/**
 * Wrap the global `fetch` so every request carries a timeout
 * `AbortSignal`. If a signal is already present on the request we
 * combine the two via `AbortSignal.any` (whichever aborts first wins);
 * in environments without `AbortSignal.timeout` support the wrapper
 * degrades to plain `fetch`.
 *
 * `fetch` is resolved from the global scope at call time (not
 * captured at construction) so test harnesses that swap
 * `globalThis.fetch` keep working.
 */
function createTimeoutFetch(timeoutMs: number): typeof fetch {
  return (input, init) => {
    if (typeof AbortSignal.timeout !== 'function') {
      return fetch(input, init)
    }
    const timeoutSignal = AbortSignal.timeout(timeoutMs)
    const signal =
      init?.signal != null
        ? typeof AbortSignal.any === 'function'
          ? AbortSignal.any([init.signal, timeoutSignal])
          : init.signal
        : timeoutSignal
    return fetch(input, { ...init, signal })
  }
}

/**
 * Apply a credential to an in-progress request's headers, choosing
 * the right header based on token shape:
 *
 *   - `rfs…` prefix → `X-API-Key` (long-lived API key, validated
 *     against the database's api_keys table).
 *   - anything else → `Authorization: Bearer …` (short-lived JWT,
 *     validated by JWT middleware).
 *
 * The two credential types are NOT interchangeable at the backend —
 * sending a JWT as `X-API-Key` or an API key as Bearer both 401.
 */
function applyAuthHeader(headers: Headers, token: string): void {
  if (token.startsWith('rfs')) {
    headers.set('X-API-Key', token)
  } else {
    headers.set('Authorization', `Bearer ${token}`)
  }
}

/**
 * Build a new GraphQL client for the given graph. Prefer
 * `GraphQLClientCache.get(graphId)` in facade code — this is the raw
 * factory and bypasses the cache.
 */
export function createGraphQLClient(config: GraphQLClientConfig, graphId: string): GraphQLClient {
  if (!graphId) {
    throw new Error('createGraphQLClient requires a non-empty graphId')
  }
  const url = `${config.baseUrl.replace(/\/$/, '')}/extensions/${graphId}/graphql`
  const staticHeaders: Record<string, string> = {
    ...(config.headers ?? {}),
  }
  const timeoutFetch = createTimeoutFetch(config.timeout ?? DEFAULT_GRAPHQL_TIMEOUT_MS)

  // Dynamic-token path: defer credential injection to a per-request
  // middleware so JWT refreshes are picked up without rebuilding or
  // clearing the client. This is the recommended path for browser
  // flows where the token in localStorage rotates every ~30 minutes.
  if (config.tokenProvider) {
    const providerFn = config.tokenProvider
    return new GraphQLClient(url, {
      headers: staticHeaders,
      credentials: config.credentials,
      fetch: timeoutFetch,
      requestMiddleware: async (request) => {
        let token: string | null | undefined
        try {
          token = await providerFn()
        } catch (err) {
          // Fail fast — a throwing provider means the caller *intended*
          // to authenticate but couldn't produce a credential. Sending
          // the request unauthenticated would surface as a confusing
          // 401 far from the real failure. (Matches the Python client,
          // which raises when its credential is missing.) A provider
          // that deliberately has no credential should return `null`
          // instead — that still sends an unauthenticated request.
          const detail = err instanceof Error ? err.message : String(err)
          throw new Error(
            `RoboSystems SDK: tokenProvider threw while resolving the request credential (${detail}). ` +
              'Fix the tokenProvider passed in the client config (or via setSDKClientConfig) so it ' +
              'returns the current token, or null to send an unauthenticated (cookie-based) request.'
          )
        }
        if (!token) {
          return request
        }
        // `request.headers` is a HeadersInit (Headers | string[][] |
        // Record<string, string>), so normalize via Headers before
        // mutating. Spreading it directly loses keys when it's a
        // Headers instance.
        const merged = new Headers(request.headers as HeadersInit | undefined)
        applyAuthHeader(merged, token)
        return { ...request, headers: merged }
      },
    })
  }

  // Static-token path: pick the right header at construction time.
  // Suitable for long-lived API keys that never rotate.
  if (config.token) {
    const headers = new Headers(staticHeaders)
    applyAuthHeader(headers, config.token)
    return new GraphQLClient(url, {
      headers,
      credentials: config.credentials,
      fetch: timeoutFetch,
    })
  }

  // No credentials at all — used by unauthenticated introspection
  // queries against public dev endpoints.
  return new GraphQLClient(url, {
    headers: staticHeaders,
    credentials: config.credentials,
    fetch: timeoutFetch,
  })
}

/**
 * Per-graph cache of GraphQL clients. Facade clients own one instance of
 * this and call `.get(graphId)` on every GraphQL method — cheap after the
 * first call per graph.
 */
export class GraphQLClientCache {
  private clients = new Map<string, GraphQLClient>()

  constructor(private config: GraphQLClientConfig) {}

  get(graphId: string): GraphQLClient {
    const existing = this.clients.get(graphId)
    if (existing !== undefined) {
      return existing
    }
    const client = createGraphQLClient(this.config, graphId)
    this.clients.set(graphId, client)
    return client
  }

  /**
   * Drop all cached clients. Only needed when swapping **static**
   * credentials — e.g. replacing the `token` field on a long-lived
   * facade between tenants, or resetting a CLI session. When the
   * cache was built from a `tokenProvider`, rotation is handled
   * per-request inside `requestMiddleware` and `clear()` is a no-op
   * for auth purposes (the cached `GraphQLClient` instances keep
   * using the same provider reference and will pick up the next
   * token automatically).
   */
  clear(): void {
    this.clients.clear()
  }
}
