'use client'

/**
 * Per-call transport options for the facades' REST calls.
 *
 * The generated ops default to the module-level `client` from
 * `../sdk/client.gen`, which knows nothing of a facade's own `baseUrl` or
 * credential. Facade REST calls (writes, Cypher queries, operator runs,
 * operation status) pass these options per call instead, so they reach
 * the same server, with the same credential, as the facade's GraphQL
 * reads. They still run through the shared client, so
 * its `fetch` (the retrying one `RoboSystemsClients` installs),
 * interceptors and default headers keep applying underneath.
 */

import type { GraphQLClientConfig } from './graphql/client'
import { authHeaderFor, resolveCredential } from './graphql/client'

export interface RestCallOptions {
  baseUrl: string
  headers: Record<string, string>
  credentials?: 'include' | 'same-origin' | 'omit'
}

export type RestCallConfig = Pick<
  GraphQLClientConfig,
  'baseUrl' | 'headers' | 'credentials' | 'token' | 'tokenProvider'
>

const CREDENTIAL_HEADERS = new Set(['x-api-key', 'authorization'])

export async function restCallOptions(config: RestCallConfig): Promise<RestCallOptions> {
  const headers: Record<string, string> = { ...(config.headers ?? {}) }
  const token = await resolveCredential(config)
  if (token) {
    // The resolved credential replaces any the static headers carry, so
    // exactly one is sent.
    for (const name of Object.keys(headers)) {
      if (CREDENTIAL_HEADERS.has(name.toLowerCase())) {
        delete headers[name]
      }
    }
    Object.assign(headers, authHeaderFor(token))
  }
  const options: RestCallOptions = { baseUrl: config.baseUrl.replace(/\/$/, ''), headers }
  // Set only when configured: an explicit `undefined` would override the
  // shared client's own `credentials`.
  if (config.credentials) {
    options.credentials = config.credentials
  }
  return options
}

/** Per-call options plus an `Idempotency-Key` header when one is given. */
export function withIdempotencyKey(
  options: RestCallOptions,
  idempotencyKey?: string | null
): RestCallOptions {
  if (!idempotencyKey) {
    return options
  }
  return { ...options, headers: { ...options.headers, 'Idempotency-Key': idempotencyKey } }
}
