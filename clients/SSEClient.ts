'use client'

/**
 * Core SSE (Server-Sent Events) client for RoboSystems API
 * Provides automatic reconnection, event replay, and type-safe event handling
 *
 * The stream is read over `fetch` rather than `EventSource`, so a credential
 * travels in a header, never in the URL, and the same code runs in browsers
 * and Node.
 *
 * CREDENTIAL ROTATION: the backend revokes the previous JWT on every session
 * refresh. A `token` captured once therefore goes dead the moment the session
 * rotates (about every 25 minutes in the browser apps); pass a `tokenProvider`
 * and it is consulted on every connect, including automatic reconnects.
 */

import type { TokenProvider } from './graphql/client'
import { applyAuthHeader, pathSegment } from './graphql/client'

export interface SSEConfig {
  baseUrl: string
  credentials?: 'include' | 'same-origin' | 'omit'
  headers?: Record<string, string>
  /**
   * Static credential captured at construction: an API key or a JWT. Fine for
   * API keys and server-side flows; browser sessions should use `tokenProvider`.
   */
  token?: string
  /**
   * Dynamic credential callback, consulted on every `connect()` and
   * preferred over `token` when both are set. Return `null` to connect
   * without a token. See the class documentation for why a static token
   * is not enough in the browser.
   */
  tokenProvider?: TokenProvider
  maxRetries?: number
  retryDelay?: number
  heartbeatInterval?: number
}

export interface SSEEvent {
  event: string
  data: any
  id?: string
  retry?: number
  timestamp: Date
}

export enum EventType {
  OPERATION_STARTED = 'operation_started',
  OPERATION_PROGRESS = 'operation_progress',
  OPERATION_COMPLETED = 'operation_completed',
  OPERATION_ERROR = 'operation_error',
  OPERATION_CANCELLED = 'operation_cancelled',
  DATA_CHUNK = 'data_chunk',
  METADATA = 'metadata',
  HEARTBEAT = 'heartbeat',
  QUEUE_UPDATE = 'queue_update',
}

const CONNECT_TIMEOUT_MS = 10000

/** Names this client emits itself, which a stream must not be able to trigger. */
const CLIENT_EVENTS = new Set([
  'connected',
  'closed',
  'reconnecting',
  'max_retries_exceeded',
  'parse_error',
])

interface ParsedEvent {
  type: string
  data: string
  lastEventId: string
}

export class SSEClient {
  private config: SSEConfig
  private connection?: AbortController
  private opened: boolean = false
  private reconnectAttempts: number = 0
  private lastEventId?: string
  private closed: boolean = false
  private listeners: Map<string, Set<(data: any) => void>> = new Map()

  constructor(config: SSEConfig) {
    this.config = {
      maxRetries: 5,
      retryDelay: 1000,
      heartbeatInterval: 30000,
      ...config,
    }
  }

  async connect(operationId: string, fromSequence: number = 0): Promise<void> {
    this.closed = false
    return this.open(operationId, fromSequence, false)
  }

  private async open(operationId: string, fromSequence: number, reconnect: boolean): Promise<void> {
    // Resolved per attempt so a rotated JWT is picked up by every connect,
    // not just the first one after construction.
    const token = await this.resolveToken()

    // A close() during the backoff or the token lookup ends the attempt.
    if (this.closed) {
      if (reconnect) return
      throw new Error('SSE stream closed before opening')
    }

    const url = `${this.config.baseUrl}/v1/operations/${pathSegment(operationId, 'operationId')}/stream?from_sequence=${encodeURIComponent(String(fromSequence))}`
    // Accept is the only stream header the API's CORS policy needs; `cache`
    // below stands in for Cache-Control, which the preflight would refuse.
    const headers = new Headers({ ...this.config.headers, Accept: 'text/event-stream' })
    if (token) applyAuthHeader(headers, token)

    // Never leave a previous stream running beside its replacement: two live
    // streams deliver every event twice.
    this.connection?.abort()
    const connection = new AbortController()
    this.connection = connection
    this.opened = false

    let timedOut = false
    const connectionTimeout = setTimeout(() => {
      timedOut = true
      connection.abort()
    }, CONNECT_TIMEOUT_MS)

    let response: Response
    try {
      response = await fetch(url, {
        headers,
        cache: 'no-store',
        signal: connection.signal,
        ...(this.config.credentials ? { credentials: this.config.credentials } : {}),
      })
    } catch (error) {
      clearTimeout(connectionTimeout)
      const message = timedOut
        ? 'SSE connection timed out before opening'
        : `SSE connection error before open: ${error instanceof Error ? error.message : String(error)}`
      return this.failToOpen(
        connection,
        new Error(message),
        true,
        operationId,
        fromSequence,
        reconnect
      )
    }
    clearTimeout(connectionTimeout)

    if (!response.ok || !response.body) {
      const retryable = response.status === 429 || response.status >= 500
      return this.failToOpen(
        connection,
        new Error(`SSE connection failed: HTTP ${response.status}${await readDetail(response)}`),
        retryable,
        operationId,
        fromSequence,
        reconnect
      )
    }

    if (this.connection !== connection) return

    this.opened = true
    this.emit('connected', null)

    // Callers attach their listeners when connect() resolves, so reading waits
    // a tick: an event that is already buffered must not be delivered to nobody.
    const body = response.body
    setTimeout(() => {
      void this.readStream(body, connection, operationId, fromSequence)
    }, 0)
  }

  /**
   * A connect that never opened. The first connect reports it to the caller; a
   * reconnect retries what could pass, such as a 503 during a deploy, and
   * otherwise tells the listeners, since no caller is waiting on it.
   */
  private failToOpen(
    connection: AbortController,
    error: Error,
    retryable: boolean,
    operationId: string,
    fromSequence: number,
    reconnect: boolean
  ): void {
    if (this.connection !== connection) {
      if (!reconnect) throw new Error('SSE stream closed before opening')
      return
    }
    if (!reconnect) {
      this.close()
      throw error
    }
    if (retryable) {
      this.handleError(error, operationId, fromSequence)
      return
    }
    this.emit('error', { error: error.message })
    this.close()
  }

  private async readStream(
    body: ReadableStream<Uint8Array>,
    connection: AbortController,
    operationId: string,
    fromSequence: number
  ): Promise<void> {
    const reader = body.getReader()
    const decoder = new TextDecoder()
    const parser = new SSEParser((event) => {
      if (this.connection === connection) this.dispatch(event)
    })

    let failure: unknown
    try {
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        parser.feed(decoder.decode(value, { stream: true }))
        if (this.connection !== connection) break
      }
    } catch (error) {
      failure = error
    }
    reader.cancel().catch(() => {})

    // Still current means the server went away without saying it was finished.
    if (this.connection === connection && !this.closed) {
      this.handleError(
        failure ?? new Error('SSE stream ended before the operation finished'),
        operationId,
        fromSequence
      )
    }
  }

  private dispatch(event: ParsedEvent): void {
    if (event.type === 'message') {
      this.handleMessage(event)
    } else if (event.type === 'error') {
      // The server's own `event: error` — the per-user connection cap, an
      // unknown or foreign operation, a failed stream — ends the stream for
      // good. Reconnecting would only repeat it.
      this.emit('error', readServerError(event.data))
      this.close()
    } else if (event.type !== 'keepalive' && !CLIENT_EVENTS.has(event.type)) {
      this.handleTypedEvent(event.type, event)
    }
  }

  /**
   * Credential for one connect attempt: the `tokenProvider` result when one
   * is configured (`null`/`undefined` connects unauthenticated), otherwise
   * the static `token`. A throwing provider fails the connect — matching the
   * GraphQL client — because the caller intended to authenticate, and a
   * silent unauthenticated attempt would surface as an unrelated-looking 401.
   */
  private async resolveToken(): Promise<string | undefined> {
    if (!this.config.tokenProvider) {
      return this.config.token
    }
    let token: string | null | undefined
    try {
      token = await this.config.tokenProvider()
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err)
      throw new Error(
        `RoboSystems SDK: tokenProvider threw while resolving the SSE credential (${detail}). ` +
          'Fix the tokenProvider passed in the client config (or via setSDKClientConfig) so it ' +
          'returns the current token, or null to connect without one.',
        { cause: err }
      )
    }
    return token || undefined
  }

  private handleMessage(event: ParsedEvent): void {
    try {
      const data = JSON.parse(event.data)
      const sseEvent: SSEEvent = {
        event: event.type || 'message',
        data,
        id: event.lastEventId,
        timestamp: new Date(),
      }

      this.lastEventId = event.lastEventId
      this.emit('event', sseEvent)
    } catch (error) {
      this.emit('parse_error', { error, rawData: event.data })
    }
  }

  private handleTypedEvent(eventType: string, event: ParsedEvent): void {
    try {
      const data = JSON.parse(event.data)
      this.lastEventId = event.lastEventId
      // Only a real event shows the stream got anywhere. Resetting when a
      // stream opens would let one that opens and ends retry forever.
      this.reconnectAttempts = 0
      this.emit(eventType, data)

      // `stream_end` covers an operation that paused: nothing more arrives
      // until a resume, so reconnecting would only replay it.
      if (
        eventType === EventType.OPERATION_COMPLETED ||
        eventType === EventType.OPERATION_ERROR ||
        eventType === EventType.OPERATION_CANCELLED ||
        eventType === 'stream_end'
      ) {
        this.close()
      }
    } catch (error) {
      this.emit('parse_error', { error, rawData: event.data })
    }
  }

  private handleError(error: any, operationId: string, fromSequence: number): void {
    if (this.closed) return

    this.connection?.abort()
    this.connection = undefined
    this.opened = false

    if (this.reconnectAttempts < this.config.maxRetries!) {
      this.reconnectAttempts++
      const delay = this.config.retryDelay! * Math.pow(2, this.reconnectAttempts - 1)

      this.emit('reconnecting', {
        attempt: this.reconnectAttempts,
        delay,
        lastEventId: this.lastEventId,
      })

      setTimeout(() => {
        if (this.closed) return
        const resumeFrom = this.lastEventId ? parseInt(this.lastEventId) + 1 : fromSequence
        this.open(operationId, resumeFrom, true).catch((err) => {
          // A throwing tokenProvider: there is no caller left to reject.
          this.emit('error', { error: err instanceof Error ? err.message : String(err) })
          this.close()
        })
      }, delay)
    } else {
      this.emit('max_retries_exceeded', error)
      this.close()
    }
  }

  on(event: string, listener: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(listener)
  }

  off(event: string, listener: (data: any) => void): void {
    const listeners = this.listeners.get(event)
    if (listeners) {
      listeners.delete(listener)
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.listeners.get(event)
    if (listeners) {
      listeners.forEach((listener) => listener(data))
    }
  }

  close(): void {
    this.closed = true
    this.connection?.abort()
    this.connection = undefined
    this.opened = false
    this.emit('closed', null)
    this.listeners.clear()
  }

  isConnected(): boolean {
    return this.opened
  }
}

/** The payload of a server-sent `event: error`, normalised to carry `error`. */
function readServerError(raw: string): { error: string; [key: string]: any } {
  try {
    const data = JSON.parse(raw)
    const message = data?.error ?? data?.message ?? data?.detail
    return { ...(typeof data === 'object' ? data : {}), error: String(message ?? raw) }
  } catch {
    return { error: raw }
  }
}

/** The API's `detail` from a refused connect, as a suffix for the error message. */
async function readDetail(response: Response): Promise<string> {
  try {
    const body = await response.text()
    try {
      const detail = JSON.parse(body)?.detail
      if (detail) return ` ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`
    } catch {
      // Not JSON; fall through to the raw text.
    }
    return body ? ` ${body.slice(0, 200)}` : ''
  } catch {
    return ''
  }
}

/** The `text/event-stream` format, fed in chunks that can split anywhere. */
class SSEParser {
  private buffer = ''
  private type = ''
  private data: string[] = []
  private lastEventId = ''

  constructor(private onEvent: (event: ParsedEvent) => void) {}

  feed(text: string): void {
    this.buffer += text
    // A trailing CR may be half of a CRLF split across chunks, so it waits.
    const heldCR = this.buffer.endsWith('\r')
    const lines = (heldCR ? this.buffer.slice(0, -1) : this.buffer).split(/\r\n|\n|\r/)
    this.buffer = (lines.pop() ?? '') + (heldCR ? '\r' : '')
    for (const line of lines) this.readLine(line)
  }

  private readLine(line: string): void {
    if (line === '') {
      if (this.data.length > 0) {
        this.onEvent({
          type: this.type || 'message',
          data: this.data.join('\n'),
          lastEventId: this.lastEventId,
        })
      }
      this.type = ''
      this.data = []
      return
    }
    if (line.startsWith(':')) return

    const colon = line.indexOf(':')
    const field = colon === -1 ? line : line.slice(0, colon)
    const value = colon === -1 ? '' : line.slice(colon + 1).replace(/^ /, '')
    if (field === 'event') this.type = value
    else if (field === 'data') this.data.push(value)
    else if (field === 'id' && !value.includes('\0')) this.lastEventId = value
  }
}
