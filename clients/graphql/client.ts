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

import { GraphQLClient } from 'graphql-request'

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

  // Dynamic-token path: defer credential injection to a per-request
  // middleware so JWT refreshes are picked up without rebuilding or
  // clearing the client. This is the recommended path for browser
  // flows where the token in localStorage rotates every ~30 minutes.
  if (config.tokenProvider) {
    const providerFn = config.tokenProvider
    return new GraphQLClient(url, {
      headers: staticHeaders,
      credentials: config.credentials,
      requestMiddleware: async (request) => {
        let token: string | null | undefined
        try {
          token = await providerFn()
        } catch (err) {
          // A provider failure shouldn't crash the request — fall
          // through unauthenticated so the backend returns a clean
          // 401, which is easier to diagnose than a thrown middleware.
          // We still log a breadcrumb so the failure is visible in
          // devtools/log aggregators instead of silently disappearing;
          // silently swallowing provider bugs in production is worse
          // than the noise.

          console.warn(
            '[RoboSystems SDK] tokenProvider threw — sending unauthenticated request:',
            err
          )
          token = undefined
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
    })
  }

  // No credentials at all — used by unauthenticated introspection
  // queries against public dev endpoints.
  return new GraphQLClient(url, {
    headers: staticHeaders,
    credentials: config.credentials,
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
