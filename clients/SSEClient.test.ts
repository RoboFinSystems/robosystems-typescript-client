import { beforeEach, describe, expect, it, vi } from 'vitest'
import { installStreamFetch, tick, type StreamFetch } from '../test/sseStream'
import { EventType, SSEClient } from './SSEClient'

const BASE_URL = 'http://localhost:8000'

let net: StreamFetch

beforeEach(() => {
  net = installStreamFetch()
})

/** A client connected to a live stream, with reading already started. */
async function connected(config: Partial<ConstructorParameters<typeof SSEClient>[0]> = {}) {
  const client = new SSEClient({ baseUrl: BASE_URL, retryDelay: 1, ...config })
  await client.connect('op_123')
  await tick()
  return { client, stream: net.last() }
}

describe('SSEClient connect', () => {
  it('opens the operation stream', async () => {
    const { client, stream } = await connected()

    expect(client.isConnected()).toBe(true)
    expect(new URL(stream.url).pathname).toBe('/v1/operations/op_123/stream')
    expect(stream.headers.get('Accept')).toBe('text/event-stream')
    client.close()
  })

  it('sends from_sequence', async () => {
    const client = new SSEClient({ baseUrl: BASE_URL })

    await client.connect('op_123', 42)

    expect(new URL(net.last().url).searchParams.get('from_sequence')).toBe('42')
    client.close()
  })

  it('sends a JWT as a bearer header and never in the URL', async () => {
    const { client, stream } = await connected({ token: 'my-jwt-token' })

    expect(stream.headers.get('Authorization')).toBe('Bearer my-jwt-token')
    expect(stream.headers.get('X-API-Key')).toBeNull()
    expect(stream.url).not.toContain('my-jwt-token')
    expect(new URL(stream.url).searchParams.has('token')).toBe(false)
    client.close()
  })

  it('sends an API key as X-API-Key and never in the URL', async () => {
    const { client, stream } = await connected({ token: 'rfs_secret_key' })

    expect(stream.headers.get('X-API-Key')).toBe('rfs_secret_key')
    expect(stream.headers.get('Authorization')).toBeNull()
    expect(stream.url).not.toContain('rfs_secret_key')
    expect(new URL(stream.url).searchParams.has('token')).toBe(false)
    client.close()
  })

  it('passes configured headers, with the resolved credential replacing any they carry', async () => {
    const { client, stream } = await connected({
      token: 'rfs_current',
      headers: { 'X-API-Key': 'rfs_stale', Authorization: 'Bearer stale', 'X-App-Source': 'app' },
    })

    expect(stream.headers.get('X-API-Key')).toBe('rfs_current')
    expect(stream.headers.get('Authorization')).toBeNull()
    expect(stream.headers.get('X-App-Source')).toBe('app')
    client.close()
  })

  it('sends no header the API CORS policy would refuse', async () => {
    const { client, stream } = await connected({ token: 'jwt' })

    expect(stream.headers.has('Cache-Control')).toBe(false)
    expect(stream.init.cache).toBe('no-store')
    client.close()
  })

  it('passes credentials through to fetch only when configured', async () => {
    const withCredentials = await connected({ credentials: 'include' })
    expect(withCredentials.stream.init.credentials).toBe('include')
    withCredentials.client.close()

    const without = await connected()
    expect(without.stream.init).not.toHaveProperty('credentials')
    without.client.close()
  })

  it('rejects a refused connect with the status and the detail, without retrying', async () => {
    net.answerNext(new Response(JSON.stringify({ detail: 'Invalid API key' }), { status: 401 }))
    const client = new SSEClient({ baseUrl: BASE_URL, retryDelay: 1 })
    const onReconnecting = vi.fn()
    client.on('reconnecting', onReconnecting)

    await expect(client.connect('op_123')).rejects.toThrow(
      'SSE connection failed: HTTP 401 Invalid API key'
    )
    await tick()

    expect(onReconnecting).not.toHaveBeenCalled()
    expect(net.fetch).toHaveBeenCalledTimes(1)
    expect(client.isConnected()).toBe(false)
  })

  it('rejects when the network fails on the first connect', async () => {
    net.answerNext(new TypeError('fetch failed'))
    const client = new SSEClient({ baseUrl: BASE_URL })

    await expect(client.connect('op_123')).rejects.toThrow(
      'SSE connection error before open: fetch failed'
    )
  })

  it('rejects when the stream does not open in time', async () => {
    vi.useFakeTimers()
    try {
      globalThis.fetch = vi.fn(
        (_url: any, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener('abort', () => reject(new Error('aborted')))
          })
      ) as any
      const client = new SSEClient({ baseUrl: BASE_URL })

      const pending = client.connect('op_123')
      const assertion = expect(pending).rejects.toThrow('SSE connection timed out before opening')
      await vi.advanceTimersByTimeAsync(10000)
      await assertion
    } finally {
      vi.useRealTimers()
    }
  })

  it('rejects a connect closed before the stream opens', async () => {
    let answer!: (response: Response) => void
    net.answerNext(() => new Promise<Response>((resolve) => (answer = resolve)))
    const client = new SSEClient({ baseUrl: BASE_URL })

    const pending = client.connect('op_123')
    await tick()
    client.close()
    answer(new Response('', { status: 503 }))

    await expect(pending).rejects.toThrow('SSE stream closed before opening')
  })
})

describe('SSEClient closed during the credential lookup', () => {
  it('rejects the connect instead of opening a stream nobody can reach', async () => {
    let provide!: (token: string) => void
    const client = new SSEClient({
      baseUrl: BASE_URL,
      tokenProvider: () => new Promise<string>((resolve) => (provide = resolve)),
    })

    const pending = client.connect('op_123')
    await tick()
    client.close()
    provide('jwt')

    await expect(pending).rejects.toThrow('SSE stream closed before opening')
    expect(net.fetch).not.toHaveBeenCalled()
    expect(client.isConnected()).toBe(false)
  })
})

describe('SSEClient events', () => {
  it('emits connected once, ignoring the server event of the same name', async () => {
    const client = new SSEClient({ baseUrl: BASE_URL })
    const onConnected = vi.fn()
    client.on('connected', onConnected)

    await client.connect('op_123')
    await tick()
    net.last().send('connected', { operation_id: 'op_123' })
    await tick()

    expect(onConnected).toHaveBeenCalledTimes(1)
    expect(onConnected).toHaveBeenCalledWith(null)
    client.close()
  })

  it('delivers an event already buffered to listeners attached after connect resolves', async () => {
    let body!: ReadableStreamDefaultController<Uint8Array>
    const stream = new ReadableStream<Uint8Array>({
      start: (controller) => {
        body = controller
        controller.enqueue(new TextEncoder().encode('event: operation_started\ndata: {"n":1}\n\n'))
      },
    })
    net.answerNext(new Response(stream, { status: 200 }))
    const client = new SSEClient({ baseUrl: BASE_URL })

    await client.connect('op_123')
    const received = vi.fn()
    client.on(EventType.OPERATION_STARTED, received)
    await tick()

    expect(received).toHaveBeenCalledWith({ n: 1 })
    client.close()
    body.close()
  })

  it('delivers named events by name', async () => {
    const { client, stream } = await connected()
    const progress = vi.fn()
    client.on(EventType.OPERATION_PROGRESS, progress)

    stream.send(EventType.OPERATION_PROGRESS, { message: 'Processing...', progress_percent: 50 })
    await tick()

    expect(progress).toHaveBeenCalledWith({ message: 'Processing...', progress_percent: 50 })
    client.close()
  })

  it('delivers names outside EventType too', async () => {
    const { client, stream } = await connected()
    const paused = vi.fn()
    client.on('operation_awaiting_input', paused)

    stream.send('operation_awaiting_input', { prompt: 'Confirm?' })
    await tick()

    expect(paused).toHaveBeenCalledWith({ prompt: 'Confirm?' })
    client.close()
  })

  it('delivers unnamed messages as event', async () => {
    const { client, stream } = await connected()
    const onEvent = vi.fn()
    client.on('event', onEvent)

    stream.send('message', { hello: 'world' })
    await tick()

    expect(onEvent).toHaveBeenCalledTimes(1)
    expect(onEvent.mock.calls[0][0]).toMatchObject({ event: 'message', data: { hello: 'world' } })
    client.close()
  })

  it('reports data that is not JSON as parse_error', async () => {
    const { client, stream } = await connected()
    const onParseError = vi.fn()
    client.on('parse_error', onParseError)

    stream.raw('event: operation_progress\ndata: not json\n\n')
    await tick()

    expect(onParseError.mock.calls[0][0].rawData).toBe('not json')
    client.close()
  })

  it.each(['\n', '\r\n', '\r'])('parses %j line endings', async (eol) => {
    const { client, stream } = await connected()
    const progress = vi.fn()
    client.on(EventType.OPERATION_PROGRESS, progress)

    stream.raw(`event: operation_progress${eol}data: {"n":1}${eol}${eol}`)
    stream.raw(`event: operation_progress${eol}data: {"n":2}${eol}${eol}`)
    // A trailing CR could be half of a CRLF, so a bare-CR event waits for a byte.
    stream.raw(`: ping${eol}`)
    await tick()

    expect(progress.mock.calls.map(([data]) => data.n)).toEqual([1, 2])
    client.close()
  })

  it('reassembles an event split across chunks, including inside a CRLF', async () => {
    const { client, stream } = await connected()
    const progress = vi.fn()
    client.on(EventType.OPERATION_PROGRESS, progress)

    for (const chunk of ['event: operation_', 'progress\r', '\ndata: {"n"', ':1}\r\n\r', '\n']) {
      stream.raw(chunk)
      await tick(1)
    }
    await tick()

    expect(progress).toHaveBeenCalledTimes(1)
    expect(progress).toHaveBeenCalledWith({ n: 1 })
    client.close()
  })

  it('decodes a multi-byte character split across chunks', async () => {
    const { client, stream } = await connected()
    const progress = vi.fn()
    client.on(EventType.OPERATION_PROGRESS, progress)
    const bytes = new TextEncoder().encode('event: operation_progress\ndata: {"m":"é"}\n\n')
    const split = bytes.indexOf(0xc3) + 1
    const controller = (stream as any).controller as ReadableStreamDefaultController<Uint8Array>

    controller.enqueue(bytes.slice(0, split))
    await tick(1)
    controller.enqueue(bytes.slice(split))
    await tick()

    expect(progress).toHaveBeenCalledWith({ m: 'é' })
    client.close()
  })

  it('joins data lines and ignores comments and fieldless events', async () => {
    const { client, stream } = await connected()
    const onEvent = vi.fn()
    const onParseError = vi.fn()
    client.on(EventType.OPERATION_PROGRESS, onEvent)
    client.on('parse_error', onParseError)

    stream.raw(': ping - 2026-11-01\n\n')
    stream.raw('event: operation_progress\n\n')
    stream.raw('event: operation_progress\ndata: {"a":\ndata: 1}\n\n')
    await tick()

    expect(onEvent).toHaveBeenCalledTimes(1)
    expect(onEvent).toHaveBeenCalledWith({ a: 1 })
    expect(onParseError).not.toHaveBeenCalled()
    client.close()
  })
})

describe('SSEClient terminal events', () => {
  it.each([
    EventType.OPERATION_COMPLETED,
    EventType.OPERATION_ERROR,
    EventType.OPERATION_CANCELLED,
  ])('closes on %s without reconnecting', async (eventType) => {
    const { client, stream } = await connected()
    const received = vi.fn()
    const onClosed = vi.fn()
    client.on(eventType, received)
    client.on('closed', onClosed)

    stream.send(eventType, { done: true })
    await tick()

    expect(received).toHaveBeenCalledTimes(1)
    expect(onClosed).toHaveBeenCalledTimes(1)
    expect(client.isConnected()).toBe(false)
    expect(net.streams).toHaveLength(1)
  })

  it('closes on stream_end, so a paused operation is not replayed in a loop', async () => {
    const { client, stream } = await connected()
    const onReconnecting = vi.fn()
    const onClosed = vi.fn()
    client.on('reconnecting', onReconnecting)
    client.on('closed', onClosed)

    stream.send('operation_awaiting_input', { prompt: 'Confirm?' })
    stream.send('stream_end', { status: 'awaiting_input' })
    stream.end()
    await tick(20)

    expect(onClosed).toHaveBeenCalledTimes(1)
    expect(onReconnecting).not.toHaveBeenCalled()
    expect(net.streams).toHaveLength(1)
  })

  it("treats the server's in-stream error as terminal", async () => {
    const { client, stream } = await connected()
    const onError = vi.fn()
    const onClosed = vi.fn()
    const onReconnecting = vi.fn()
    client.on('error', onError)
    client.on('closed', onClosed)
    client.on('reconnecting', onReconnecting)

    stream.send('error', { error: 'Too many concurrent SSE connections (limit: 3)' })
    await tick()

    expect(onError).toHaveBeenCalledWith({
      error: 'Too many concurrent SSE connections (limit: 3)',
    })
    expect(onClosed).toHaveBeenCalledTimes(1)
    expect(onReconnecting).not.toHaveBeenCalled()
    expect(net.streams).toHaveLength(1)
    expect(stream.closed).toBe(true)
  })
})

describe('SSEClient reconnects', () => {
  it.each([
    ['is lost', (s: any) => s.drop()],
    ['ends without a final event', (s: any) => s.end()],
  ])('reconnects when the stream %s', async (_label, stop) => {
    const { client, stream } = await connected()
    const onReconnecting = vi.fn()
    const completed = vi.fn()
    client.on('reconnecting', onReconnecting)
    client.on(EventType.OPERATION_COMPLETED, completed)

    stop(stream)
    const second = await net.opened(2)
    second.send(EventType.OPERATION_COMPLETED, { result: { ok: true } })
    await tick()

    expect(onReconnecting).toHaveBeenCalledTimes(1)
    expect(completed).toHaveBeenCalledWith({ result: { ok: true } })
  })

  it('leaves only one stream live after reconnecting', async () => {
    const { client, stream } = await connected()

    stream.drop()
    const second = await net.opened(2)

    expect(net.streams.filter((s) => !s.closed)).toEqual([second])
    client.close()
    expect(second.closed).toBe(true)
  })

  it('does not reopen a stream closed during the backoff', async () => {
    const { client, stream } = await connected({ retryDelay: 5 })

    stream.drop()
    await tick(1)
    client.close()
    await tick(20)

    expect(net.streams).toHaveLength(1)
  })

  it('gives up when a stream keeps opening and ending without progress', async () => {
    const { client, stream } = await connected({ maxRetries: 2 })
    const onExhausted = vi.fn()
    const onReconnecting = vi.fn()
    const onClosed = vi.fn()
    client.on('max_retries_exceeded', onExhausted)
    client.on('reconnecting', onReconnecting)
    client.on('closed', onClosed)

    stream.send('connected', {})
    stream.raw(': ping\n\n')
    stream.send('keepalive', {})
    stream.end()
    for (const n of [2, 3]) {
      const next = await net.opened(n)
      next.send('connected', {})
      next.send('keepalive', {})
      next.end()
    }
    await tick(20)

    expect(net.streams).toHaveLength(3)
    expect(onReconnecting).toHaveBeenCalledTimes(2)
    expect(onExhausted).toHaveBeenCalledTimes(1)
    expect(onClosed).toHaveBeenCalledTimes(1)
  })

  it('resets the retry budget when a real event arrives', async () => {
    const { client, stream } = await connected({ maxRetries: 1 })
    const onExhausted = vi.fn()
    client.on('max_retries_exceeded', onExhausted)

    stream.send(EventType.OPERATION_PROGRESS, { n: 1 })
    await tick()
    stream.drop()
    const second = await net.opened(2)
    second.send(EventType.OPERATION_PROGRESS, { n: 2 })
    await tick()
    second.drop()
    const third = await net.opened(3)

    expect(onExhausted).not.toHaveBeenCalled()
    expect(client.isConnected()).toBe(true)
    client.close()
    expect(third.closed).toBe(true)
  })

  it('retries a 503 while reconnecting', async () => {
    const { client, stream } = await connected()
    const onError = vi.fn()
    client.on('error', onError)

    net.answerNext(new Response('unavailable', { status: 503 }))
    stream.drop()
    const second = await net.opened(2)

    expect(onError).not.toHaveBeenCalled()
    expect(client.isConnected()).toBe(true)
    client.close()
    expect(second.closed).toBe(true)
  })

  it('retries a network failure while reconnecting', async () => {
    const { client, stream } = await connected()

    net.answerNext(new TypeError('fetch failed'))
    stream.drop()
    await net.opened(2)

    expect(client.isConnected()).toBe(true)
    client.close()
  })

  it('stops with an error when a reconnect is refused', async () => {
    const { client, stream } = await connected()
    const onError = vi.fn()
    const onClosed = vi.fn()
    client.on('error', onError)
    client.on('closed', onClosed)

    net.answerNext(new Response(JSON.stringify({ detail: 'Token expired' }), { status: 401 }))
    stream.drop()
    await tick(20)

    expect(onError).toHaveBeenCalledWith({
      error: 'SSE connection failed: HTTP 401 Token expired',
    })
    expect(onClosed).toHaveBeenCalledTimes(1)
    expect(net.streams).toHaveLength(1)
  })

  it('uses a rotated credential on the reconnect', async () => {
    let current = 'jwt-1'
    const { client, stream } = await connected({ tokenProvider: () => current })
    expect(stream.headers.get('Authorization')).toBe('Bearer jwt-1')

    current = 'jwt-2'
    stream.drop()
    const second = await net.opened(2)

    expect(second.headers.get('Authorization')).toBe('Bearer jwt-2')
    client.close()
  })

  it('reports a tokenProvider that throws on a reconnect', async () => {
    let fail = false
    const { client, stream } = await connected({
      tokenProvider: () => {
        if (fail) throw new Error('storage unavailable')
        return 'jwt'
      },
    })
    const onError = vi.fn()
    const onClosed = vi.fn()
    client.on('error', onError)
    client.on('closed', onClosed)

    fail = true
    stream.drop()
    await tick(20)

    expect(onError.mock.calls[0][0].error).toMatch(/storage unavailable/)
    expect(onClosed).toHaveBeenCalledTimes(1)
  })
})

describe('SSEClient tokenProvider', () => {
  it('resolves the token from the provider on every connect', async () => {
    let current = 'jwt-1'
    const tokenProvider = vi.fn(async () => current)
    const client = new SSEClient({ baseUrl: BASE_URL, tokenProvider })

    await client.connect('op_123')
    expect(net.last().headers.get('Authorization')).toBe('Bearer jwt-1')

    // Session refresh rotates the credential; the next connect must carry it.
    current = 'jwt-2'
    client.close()
    await client.connect('op_123', 7)
    expect(net.last().headers.get('Authorization')).toBe('Bearer jwt-2')
    expect(net.last().url).toContain('from_sequence=7')
    expect(tokenProvider).toHaveBeenCalledTimes(2)
    client.close()
  })

  it('prefers the provider over a static token', async () => {
    const { client, stream } = await connected({
      token: 'stale-static',
      tokenProvider: () => 'fresh',
    })

    expect(stream.headers.get('Authorization')).toBe('Bearer fresh')
    client.close()
  })

  it('connects without a credential when the provider returns null', async () => {
    const { client, stream } = await connected({
      token: 'stale-static',
      tokenProvider: () => null,
    })

    expect(stream.headers.get('Authorization')).toBeNull()
    expect(stream.headers.get('X-API-Key')).toBeNull()
    client.close()
  })

  it('rejects the connect when the provider throws', async () => {
    const client = new SSEClient({
      baseUrl: BASE_URL,
      tokenProvider: () => {
        throw new Error('storage unavailable')
      },
    })

    await expect(client.connect('op_123')).rejects.toThrow(
      /tokenProvider threw while resolving the SSE credential \(storage unavailable\)/
    )
    // The provider's own failure is preserved as `cause`, so the original
    // stack survives the rethrow.
    const causeErr = await client.connect('op_123').catch((e: unknown) => e)
    expect((causeErr as Error).cause).toBeInstanceOf(Error)
    expect(((causeErr as Error).cause as Error).message).toBe('storage unavailable')
    expect(net.fetch).not.toHaveBeenCalled()
  })
})

describe('SSEClient listeners and close', () => {
  it('adds and removes listeners', () => {
    const client = new SSEClient({ baseUrl: BASE_URL })
    const listener = vi.fn()

    client.on('test-event', listener)
    ;(client as any).emit('test-event', { value: 1 })
    client.off('test-event', listener)
    ;(client as any).emit('test-event', { value: 2 })

    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('supports several listeners for one event', () => {
    const client = new SSEClient({ baseUrl: BASE_URL })
    const first = vi.fn()
    const second = vi.fn()

    client.on('test-event', first)
    client.on('test-event', second)
    ;(client as any).emit('test-event', { value: 1 })

    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('aborts the stream, emits closed and clears listeners on close', async () => {
    const { client, stream } = await connected()
    const onClosed = vi.fn()
    const later = vi.fn()
    client.on('closed', onClosed)
    client.on('test-event', later)

    client.close()
    ;(client as any).emit('test-event', { value: 1 })

    expect(client.isConnected()).toBe(false)
    expect(stream.closed).toBe(true)
    expect(onClosed).toHaveBeenCalledTimes(1)
    expect(later).not.toHaveBeenCalled()
  })

  it('is safe to close more than once, and does not reconnect afterwards', async () => {
    const { client } = await connected()

    client.close()
    expect(() => client.close()).not.toThrow()
    await tick(20)

    expect(net.streams).toHaveLength(1)
  })
})
