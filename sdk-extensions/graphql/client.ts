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
 * from the query files in sdk-extensions/graphql/queries/.
 */

import { GraphQLClient } from 'graphql-request'

export interface GraphQLClientConfig {
  baseUrl: string
  token?: string
  headers?: Record<string, string>
  credentials?: 'include' | 'same-origin' | 'omit'
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
  const headers: Record<string, string> = {
    ...(config.headers ?? {}),
  }
  if (config.token) {
    // The backend accepts both Authorization: Bearer and X-API-Key. Match
    // the existing facade convention of sending the token as X-API-Key,
    // which is what the local dev workflow uses.
    headers['X-API-Key'] = config.token
  }
  return new GraphQLClient(url, {
    headers,
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

  /** Drop all cached clients. Useful after a token rotation. */
  clear(): void {
    this.clients.clear()
  }
}
