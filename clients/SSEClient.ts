'use client'

/**
 * Core SSE (Server-Sent Events) client for RoboSystems API
 * Provides automatic reconnection, event replay, and type-safe event handling
 *
 * SECURITY NOTE: When using JWT authentication, tokens are passed as query parameters
 * due to EventSource API limitations. This means tokens may appear in:
 * - Server access logs
 * - Proxy logs
 * - Browser history
 * - Referer headers
 *
 * For production environments with sensitive data, consider:
 * - Using cookie-based authentication instead
 * - Implementing a WebSocket-based alternative
 * - Using short-lived tokens that expire quickly
 * - Ensuring all connections use HTTPS
 *
 * CREDENTIAL ROTATION: the stream endpoint authenticates the JWT it finds in
 * the URL, and the backend revokes the previous JWT on every session refresh.
 * A `token` captured once therefore goes dead the moment the session rotates
 * (about every 25 minutes in the browser apps); pass a `tokenProvider` and it
 * is consulted on every connect — including automatic reconnects — instead.
 */

import type { TokenProvider } from './graphql/client'

export interface SSEConfig {
  baseUrl: string
  credentials?: 'include' | 'same-origin' | 'omit'
  headers?: Record<string, string>
  /**
   * Static JWT captured at construction. Fine for long-lived API keys and
   * server-side flows; browser sessions should use `tokenProvider`.
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

export class SSEClient {
  private config: SSEConfig
  private eventSource?: EventSource
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
    // Resolved per attempt so a rotated JWT is picked up by every connect,
    // not just the first one after construction.
    const token = await this.resolveToken()

    return new Promise((resolve, reject) => {
      let url = `${this.config.baseUrl}/v1/operations/${operationId}/stream?from_sequence=${fromSequence}`

      // Add JWT token as query parameter if provided
      // WARNING: EventSource API doesn't support custom headers, so tokens are passed via query param
      // This has security implications - see class documentation
      if (token) {
        url += `&token=${encodeURIComponent(token)}`
      }

      this.eventSource = new EventSource(url, {
        withCredentials: this.config.credentials === 'include',
      } as any)

      let opened = false

      const connectionTimeout = setTimeout(() => {
        if (!opened) {
          reject(new Error('SSE connection timed out before opening'))
          this.close()
        }
      }, 10000)

      this.eventSource.onopen = () => {
        opened = true
        clearTimeout(connectionTimeout)
        this.reconnectAttempts = 0
        this.emit('connected', null)
        resolve()
      }

      this.eventSource.onerror = (error) => {
        if (!opened) {
          // Failed before the stream ever opened. Browser EventSource doesn't
          // expose the HTTP status, but a CLOSED readyState at this point
          // means a non-retryable response (commonly 401/403/404). Reject
          // the initial promise so callers surface a clear error instead of
          // waiting out the 10s connectionTimeout or spinning retries that
          // can never satisfy this promise.
          clearTimeout(connectionTimeout)
          const nonRetryable = this.eventSource?.readyState === EventSource.CLOSED
          this.close()
          reject(
            new Error(
              nonRetryable
                ? 'SSE connection failed before open (likely auth/not-found; EventSource hides the HTTP status)'
                : 'SSE connection error before open'
            )
          )
          return
        }
        if (!this.closed) {
          this.handleError(error, operationId, fromSequence)
        }
      }

      this.eventSource.onmessage = (event) => {
        this.handleMessage(event)
      }

      // Set up specific event listeners
      Object.values(EventType).forEach((eventType) => {
        this.eventSource!.addEventListener(eventType, (event: any) => {
          this.handleTypedEvent(eventType, event)
        })
      })
    })
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
          'returns the current token, or null to connect without one.'
      )
    }
    return token || undefined
  }

  private handleMessage(event: MessageEvent): void {
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

  private handleTypedEvent(eventType: string, event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data)
      this.lastEventId = event.lastEventId
      this.emit(eventType, data)

      // Check for completion events
      if (
        eventType === EventType.OPERATION_COMPLETED ||
        eventType === EventType.OPERATION_ERROR ||
        eventType === EventType.OPERATION_CANCELLED
      ) {
        this.close()
      }
    } catch (error) {
      this.emit('parse_error', { error, rawData: event.data })
    }
  }

  private async handleError(error: any, operationId: string, fromSequence: number): Promise<void> {
    if (this.closed) return

    if (this.reconnectAttempts < this.config.maxRetries!) {
      this.reconnectAttempts++
      const delay = this.config.retryDelay! * Math.pow(2, this.reconnectAttempts - 1)

      this.emit('reconnecting', {
        attempt: this.reconnectAttempts,
        delay,
        lastEventId: this.lastEventId,
      })

      setTimeout(() => {
        const resumeFrom = this.lastEventId ? parseInt(this.lastEventId) + 1 : fromSequence
        this.connect(operationId, resumeFrom).catch(() => {
          // Error handled in connect
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
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = undefined
    }
    this.emit('closed', null)
    this.listeners.clear()
  }

  isConnected(): boolean {
    return this.eventSource !== undefined && this.eventSource.readyState === EventSource.OPEN
  }
}
