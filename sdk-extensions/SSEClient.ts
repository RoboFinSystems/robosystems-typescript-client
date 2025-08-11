'use client'

/**
 * Core SSE (Server-Sent Events) client for RoboSystems API
 * Provides automatic reconnection, event replay, and type-safe event handling
 */

export interface SSEConfig {
  baseUrl: string
  credentials?: 'include' | 'same-origin' | 'omit'
  headers?: Record<string, string>
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
    return new Promise((resolve, reject) => {
      const url = `${this.config.baseUrl}/v1/operations/${operationId}/stream?from_sequence=${fromSequence}`

      this.eventSource = new EventSource(url, {
        withCredentials: this.config.credentials === 'include',
      } as any)

      const connectionTimeout = setTimeout(() => {
        reject(new Error('Connection timeout'))
        this.close()
      }, 10000)

      this.eventSource.onopen = () => {
        clearTimeout(connectionTimeout)
        this.reconnectAttempts = 0
        this.emit('connected', null)
        resolve()
      }

      this.eventSource.onerror = (error) => {
        clearTimeout(connectionTimeout)
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
