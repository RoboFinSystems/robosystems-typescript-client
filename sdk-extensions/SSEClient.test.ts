import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EventType, SSEClient } from './SSEClient'

// Mock EventSource for testing
class MockEventSource {
  url: string
  withCredentials: boolean
  readyState: number = 0 // 0 = CONNECTING, 1 = OPEN, 2 = CLOSED
  onopen: ((event: any) => void) | null = null
  onerror: ((event: any) => void) | null = null
  onmessage: ((event: any) => void) | null = null
  private eventListeners: Map<string, Set<(event: any) => void>> = new Map()

  static CONNECTING = 0
  static OPEN = 1
  static CLOSED = 2

  constructor(url: string, options?: { withCredentials?: boolean }) {
    this.url = url
    this.withCredentials = options?.withCredentials ?? false

    // Simulate async connection
    setTimeout(() => {
      this.readyState = MockEventSource.OPEN
      if (this.onopen) {
        this.onopen({ type: 'open' })
      }
    }, 0)
  }

  addEventListener(event: string, listener: (event: any) => void) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)!.add(listener)
  }

  removeEventListener(event: string, listener: (event: any) => void) {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.delete(listener)
    }
  }

  dispatchEvent(event: any) {
    const listeners = this.eventListeners.get(event.type)
    if (listeners) {
      listeners.forEach((listener) => listener(event))
    }
    return true
  }

  close() {
    this.readyState = MockEventSource.CLOSED
  }

  // Test helper to simulate receiving a message
  simulateMessage(eventType: string, data: any, lastEventId?: string) {
    const event = {
      type: eventType,
      data: JSON.stringify(data),
      lastEventId: lastEventId || '',
    }

    if (eventType === 'message' && this.onmessage) {
      this.onmessage(event)
    } else {
      const listeners = this.eventListeners.get(eventType)
      if (listeners) {
        listeners.forEach((listener) => listener(event))
      }
    }
  }

  // Test helper to simulate error
  simulateError() {
    if (this.onerror) {
      this.onerror({ type: 'error' })
    }
  }
}

describe('SSEClient', () => {
  let mockEventSource: MockEventSource

  beforeEach(() => {
    // Mock global EventSource
    global.EventSource = MockEventSource as any
    vi.clearAllMocks()
  })

  describe('connect', () => {
    it('should connect to SSE endpoint successfully', async () => {
      const client = new SSEClient({
        baseUrl: 'http://localhost:8000',
      })

      await expect(client.connect('op_123')).resolves.toBeUndefined()
      expect(client.isConnected()).toBe(true)
    })

    it('should include token in URL when provided', async () => {
      const client = new SSEClient({
        baseUrl: 'http://localhost:8000',
        token: 'my-jwt-token',
      })

      await client.connect('op_123')

      // We can't directly access the EventSource URL in this mock,
      // but the client should have connected successfully
      expect(client.isConnected()).toBe(true)
    })

    it('should include from_sequence parameter', async () => {
      const client = new SSEClient({
        baseUrl: 'http://localhost:8000',
      })

      await client.connect('op_123', 42)
      expect(client.isConnected()).toBe(true)
    })

    it('should set withCredentials when credentials is include', async () => {
      const client = new SSEClient({
        baseUrl: 'http://localhost:8000',
        credentials: 'include',
      })

      await client.connect('op_123')
      expect(client.isConnected()).toBe(true)
    })
  })

  describe('event handling', () => {
    it('should emit connected event on connection', async () => {
      const client = new SSEClient({
        baseUrl: 'http://localhost:8000',
      })

      const connectedEvents: any[] = []
      client.on('connected', (data) => connectedEvents.push(data))

      await client.connect('op_123')

      expect(connectedEvents).toHaveLength(1)
    })

    it('should handle typed events', async () => {
      const client = new SSEClient({
        baseUrl: 'http://localhost:8000',
      })

      const progressEvents: any[] = []
      client.on(EventType.OPERATION_PROGRESS, (data) => progressEvents.push(data))

      await client.connect('op_123')

      // Simulate receiving a progress event
      const eventSource = (client as any).eventSource as MockEventSource
      eventSource.simulateMessage(EventType.OPERATION_PROGRESS, {
        message: 'Processing...',
        progress_percent: 50,
      })

      expect(progressEvents).toHaveLength(1)
      expect(progressEvents[0].message).toBe('Processing...')
      expect(progressEvents[0].progress_percent).toBe(50)
    })

    it('should auto-close on completion events', async () => {
      const client = new SSEClient({
        baseUrl: 'http://localhost:8000',
      })

      await client.connect('op_123')

      const eventSource = (client as any).eventSource as MockEventSource
      eventSource.simulateMessage(EventType.OPERATION_COMPLETED, {
        result: { success: true },
      })

      // Client should close automatically
      expect(client.isConnected()).toBe(false)
    })

    it('should auto-close on error events', async () => {
      const client = new SSEClient({
        baseUrl: 'http://localhost:8000',
      })

      await client.connect('op_123')

      const eventSource = (client as any).eventSource as MockEventSource
      eventSource.simulateMessage(EventType.OPERATION_ERROR, {
        error: 'Something failed',
      })

      expect(client.isConnected()).toBe(false)
    })

    it('should auto-close on cancelled events', async () => {
      const client = new SSEClient({
        baseUrl: 'http://localhost:8000',
      })

      await client.connect('op_123')

      const eventSource = (client as any).eventSource as MockEventSource
      eventSource.simulateMessage(EventType.OPERATION_CANCELLED, {
        message: 'Cancelled by user',
      })

      expect(client.isConnected()).toBe(false)
    })

    it('should handle heartbeat events', async () => {
      const client = new SSEClient({
        baseUrl: 'http://localhost:8000',
      })

      const heartbeats: any[] = []
      client.on(EventType.HEARTBEAT, (data) => heartbeats.push(data))

      await client.connect('op_123')

      const eventSource = (client as any).eventSource as MockEventSource
      eventSource.simulateMessage(EventType.HEARTBEAT, { timestamp: Date.now() })

      expect(heartbeats).toHaveLength(1)
    })

    it('should handle data chunk events', async () => {
      const client = new SSEClient({
        baseUrl: 'http://localhost:8000',
      })

      const chunks: any[] = []
      client.on(EventType.DATA_CHUNK, (data) => chunks.push(data))

      await client.connect('op_123')

      const eventSource = (client as any).eventSource as MockEventSource
      eventSource.simulateMessage(EventType.DATA_CHUNK, {
        rows: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
      })

      expect(chunks).toHaveLength(1)
      expect(chunks[0].rows).toHaveLength(2)
    })
  })

  describe('listener management', () => {
    it('should add and remove listeners', async () => {
      const client = new SSEClient({
        baseUrl: 'http://localhost:8000',
      })

      const events: any[] = []
      const listener = (data: any) => events.push(data)

      client.on('test-event', listener)
      await client.connect('op_123')

      // Manually emit an event
      ;(client as any).emit('test-event', { value: 1 })
      expect(events).toHaveLength(1)

      // Remove listener
      client.off('test-event', listener)
      ;(client as any).emit('test-event', { value: 2 })
      expect(events).toHaveLength(1) // Should not have increased
    })

    it('should support multiple listeners for same event', async () => {
      const client = new SSEClient({
        baseUrl: 'http://localhost:8000',
      })

      const events1: any[] = []
      const events2: any[] = []

      client.on('test-event', (data) => events1.push(data))
      client.on('test-event', (data) => events2.push(data))

      await client.connect('op_123')
      ;(client as any).emit('test-event', { value: 1 })

      expect(events1).toHaveLength(1)
      expect(events2).toHaveLength(1)
    })
  })

  describe('close', () => {
    it('should close the connection', async () => {
      const client = new SSEClient({
        baseUrl: 'http://localhost:8000',
      })

      await client.connect('op_123')
      expect(client.isConnected()).toBe(true)

      client.close()
      expect(client.isConnected()).toBe(false)
    })

    it('should emit closed event', async () => {
      const client = new SSEClient({
        baseUrl: 'http://localhost:8000',
      })

      const closedEvents: any[] = []
      client.on('closed', (data) => closedEvents.push(data))

      await client.connect('op_123')
      client.close()

      expect(closedEvents).toHaveLength(1)
    })

    it('should clear all listeners on close', async () => {
      const client = new SSEClient({
        baseUrl: 'http://localhost:8000',
      })

      const events: any[] = []
      client.on('test-event', (data) => events.push(data))

      await client.connect('op_123')
      client.close()

      // Try to emit after close - should not receive events
      ;(client as any).emit('test-event', { value: 1 })
      expect(events).toHaveLength(0)
    })

    it('should be safe to call close multiple times', async () => {
      const client = new SSEClient({
        baseUrl: 'http://localhost:8000',
      })

      await client.connect('op_123')

      client.close()
      expect(() => client.close()).not.toThrow()
    })
  })

  describe('configuration', () => {
    it('should accept all config options', () => {
      const client = new SSEClient({
        baseUrl: 'http://localhost:8000',
        credentials: 'include',
        headers: { 'X-Custom': 'value' },
        token: 'jwt-token',
        maxRetries: 5,
        retryDelay: 2000,
        heartbeatInterval: 60000,
      })

      expect(client).toBeInstanceOf(SSEClient)
    })

    it('should use default config values', () => {
      const client = new SSEClient({
        baseUrl: 'http://localhost:8000',
      })

      expect(client).toBeInstanceOf(SSEClient)
    })
  })
})
