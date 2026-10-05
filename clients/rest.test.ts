import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { client } from '../sdk/client.gen'
import { resetSDKClientConfig, setSDKClientConfig } from './config'
import { RoboSystemsClients } from './index'
import { OperationClient } from './OperationClient'
import { OperatorClient } from './OperatorClient'
import { QueryClient } from './QueryClient'

// The apps configure the module-level generated client once —
// `client.setConfig({ baseUrl })` plus a request interceptor that adds the
// session's Bearer token — and reach the facades through
// `RoboSystemsClients`, with `setSDKClientConfig({ tokenProvider })` for the
// credential. Facade writes now carry their own per-call options; this
// suite pins that the apps' setup behaves exactly as before.

function envelope(result: unknown) {
  return new Response(
    JSON.stringify({
      operation: 'update-entity',
      operationId: 'op_1',
      status: 'completed',
      result,
    }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  )
}

describe('facade writes under an app-configured generated client', () => {
  let mockFetch: ReturnType<typeof vi.fn>
  let interceptor: number

  beforeEach(() => {
    mockFetch = vi.fn()
    globalThis.fetch = mockFetch as unknown as typeof fetch
    client.setConfig({
      baseUrl: 'https://api.app.example',
      credentials: 'include',
      headers: { 'X-App-Source': 'roboledger' },
    })
    interceptor = client.interceptors.request.use(async (request) => {
      request.headers.set('Authorization', 'Bearer interceptor-jwt')
      return request
    })
    setSDKClientConfig({ tokenProvider: async () => 'session-jwt' })
  })

  afterEach(() => {
    client.interceptors.request.eject(interceptor)
    client.setConfig({
      baseUrl: 'http://localhost:8000',
      fetch: undefined,
      headers: { 'X-App-Source': null },
    })
    resetSDKClientConfig()
  })

  it('reaches the app-configured server with the session credential', async () => {
    const clients = new RoboSystemsClients()
    mockFetch.mockResolvedValueOnce(envelope({ id: 'ent_1', name: 'ACME' }))

    await clients.ledger.updateEntity('kg_1', { name: 'ACME' })

    const req = mockFetch.mock.calls[0][0] as Request
    expect(req.url).toBe(
      'https://api.app.example/extensions/roboledger/kg_1/operations/update-entity'
    )
    // The shared client's interceptors run after the per-call options, so
    // the app's own credential still has the last word; its headers apply too.
    expect(req.headers.get('Authorization')).toBe('Bearer interceptor-jwt')
    expect(req.headers.get('X-App-Source')).toBe('roboledger')
    expect(req.credentials).toBe('include')
  })

  it("keeps the shared client's credential when the facade has none", async () => {
    resetSDKClientConfig()
    client.interceptors.request.eject(interceptor)
    client.setConfig({ headers: { 'X-API-Key': 'rfs_global' } })
    const clients = new RoboSystemsClients()
    mockFetch.mockResolvedValueOnce(envelope({ id: 'ent_1', name: 'ACME' }))

    await clients.ledger.updateEntity('kg_1', { name: 'ACME' })

    const req = mockFetch.mock.calls[0][0] as Request
    expect(req.headers.get('X-API-Key')).toBe('rfs_global')
    expect(req.headers.get('Authorization')).toBeNull()
    client.setConfig({ headers: { 'X-API-Key': null } })
  })

  it("routes the write through the shared client's fetch", async () => {
    const appFetch = vi.fn(async () => envelope({ id: 'ent_1', name: 'ACME' }))
    client.setConfig({ fetch: appFetch as unknown as typeof fetch })
    const clients = new RoboSystemsClients()

    await clients.ledger.updateEntity('kg_1', { name: 'ACME' })

    expect(appFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).not.toHaveBeenCalled()
  })
})

describe('standalone facades reach their own server', () => {
  // An integrator outside the apps builds a facade with its own baseUrl and
  // API key, and never touches the module-level generated client.
  let mockFetch: ReturnType<typeof vi.fn>
  const config = { baseUrl: 'https://api.integrator.example', token: 'rfs_integrator_key' }

  function json(body: unknown) {
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }

  function sent(): Request {
    return mockFetch.mock.calls[0][0] as Request
  }

  beforeEach(() => {
    mockFetch = vi.fn()
    globalThis.fetch = mockFetch as unknown as typeof fetch
  })

  it('sends a Cypher query to the facade server with its API key', async () => {
    mockFetch.mockResolvedValueOnce(json({ data: [], columns: [] }))

    await new QueryClient(config).executeQuery('kg_1', { query: 'RETURN 1' }, { mode: 'sync' })

    expect(new URL(sent().url).origin).toBe('https://api.integrator.example')
    expect(sent().headers.get('X-API-Key')).toBe('rfs_integrator_key')
  })

  it('sends an operator run to the facade server with its API key', async () => {
    mockFetch.mockResolvedValueOnce(
      json({ content: 'done', operator_used: 'financial', mode_used: 'standard' })
    )

    await new OperatorClient(config).executeQuery('kg_1', { message: 'hi' })

    expect(new URL(sent().url).origin).toBe('https://api.integrator.example')
    expect(sent().headers.get('X-API-Key')).toBe('rfs_integrator_key')
  })

  it('reads operation status from the facade server with its API key', async () => {
    mockFetch.mockResolvedValueOnce(json({ operation_id: 'op_1', status: 'running' }))
    const operations = new OperationClient(config)

    try {
      await operations.getStatus('op_1')
    } finally {
      operations.closeAll()
    }

    expect(new URL(sent().url).origin).toBe('https://api.integrator.example')
    expect(sent().headers.get('X-API-Key')).toBe('rfs_integrator_key')
  })
})
