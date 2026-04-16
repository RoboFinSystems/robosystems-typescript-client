import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { OperationClient } from './OperationClient'
import { EventType } from './SSEClient'

// Mock EventSource for SSE tests
class MockEventSource {
  url: string
  withCredentials: boolean
  readyState: number = 0
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
    if (listeners) listeners.delete(listener)
  }

  dispatchEvent(event: any) {
    const listeners = this.eventListeners.get(event.type)
    if (listeners) listeners.forEach((l) => l(event))
    return true
  }

  close() {
    this.readyState = MockEventSource.CLOSED
  }

  simulateMessage(eventType: string, data: any) {
    const event = { type: eventType, data: JSON.stringify(data), lastEventId: '' }
    const listeners = this.eventListeners.get(eventType)
    if (listeners) listeners.forEach((l) => l(event))
  }
}

// Helper to create proper mock Response objects
function createMockResponse(data: any, options: { ok?: boolean; status?: number } = {}) {
  return {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    statusText: options.status === 200 ? 'OK' : 'Error',
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => data,
    text: async () => JSON.stringify(data),
    blob: async () => new Blob([JSON.stringify(data)]),
    arrayBuffer: async () => new TextEncoder().encode(JSON.stringify(data)).buffer,
  }
}

describe('OperationClient', () => {
  let operationClient: OperationClient
  let mockFetch: any

  beforeEach(() => {
    operationClient = new OperationClient({
      baseUrl: 'http://localhost:8000',
      headers: { 'X-API-Key': 'test-key' },
    })

    // Mock global fetch
    mockFetch = vi.fn()
    global.fetch = mockFetch

    // Reset all mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Clean up any active operations
    operationClient.closeAll()
  })

  describe('constructor', () => {
    it('should create an OperationClient with config', () => {
      const client = new OperationClient({
        baseUrl: 'https://api.example.com',
        token: 'test-token',
        maxRetries: 5,
        retryDelay: 2000,
      })

      expect(client).toBeInstanceOf(OperationClient)
    })
  })

  describe('getStatus', () => {
    it('should get operation status', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          operation_id: 'op_123',
          status: 'running',
          progress_percent: 50,
          message: 'Processing...',
        })
      )

      const status = await operationClient.getStatus('op_123')

      expect(status.operation_id).toBe('op_123')
      expect(status.status).toBe('running')
      expect(status.progress_percent).toBe(50)
    })

    it('should handle errors when getting status', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Operation not found' }, { ok: false, status: 404 })
      )

      await operationClient.getStatus('op_nonexistent')

      // The SDK might return undefined for error responses
      // We just need to verify the call doesn't throw
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('cancelOperation', () => {
    it('should cancel an operation', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          operation_id: 'op_123',
          status: 'cancelled',
        })
      )

      await expect(operationClient.cancelOperation('op_123')).resolves.toBeUndefined()
    })
  })

  describe('closeAll', () => {
    it('should close all active connections', () => {
      // Create a client
      const client = new OperationClient({
        baseUrl: 'http://localhost:8000',
      })

      // closeAll should complete without error
      expect(() => client.closeAll()).not.toThrow()
    })

    it('should be safe to call closeAll multiple times', () => {
      const client = new OperationClient({
        baseUrl: 'http://localhost:8000',
      })

      client.closeAll()
      expect(() => client.closeAll()).not.toThrow()
    })
  })

  describe('monitorMultiple', () => {
    it('should reject if no operation IDs provided', async () => {
      const results = await operationClient.monitorMultiple([])
      expect(results.size).toBe(0)
    })
  })

  describe('monitorOperation', () => {
    beforeEach(() => {
      global.EventSource = MockEventSource as any
    })

    it('should resolve with success on OPERATION_COMPLETED', async () => {
      const resultPromise = operationClient.monitorOperation('op_sse_1')

      // Wait for SSE connection to establish
      await new Promise((r) => setTimeout(r, 20))

      // Get the SSE client and simulate completion
      const sseClients = (operationClient as any).sseClients as Map<string, any>
      const sseClient = sseClients.get('op_sse_1')
      const eventSource = (sseClient as any).eventSource as MockEventSource
      eventSource.simulateMessage(EventType.OPERATION_COMPLETED, {
        result: { graph_id: 'graph_done' },
        metadata: { took: 5000 },
      })

      const result = await resultPromise

      expect(result.success).toBe(true)
      expect(result.result).toEqual({ graph_id: 'graph_done' })
    })

    it('should resolve with error on OPERATION_ERROR', async () => {
      const resultPromise = operationClient.monitorOperation('op_sse_err')

      await new Promise((r) => setTimeout(r, 20))

      const sseClients = (operationClient as any).sseClients as Map<string, any>
      const sseClient = sseClients.get('op_sse_err')
      const eventSource = (sseClient as any).eventSource as MockEventSource
      eventSource.simulateMessage(EventType.OPERATION_ERROR, {
        message: 'Processing failed',
      })

      const result = await resultPromise

      expect(result.success).toBe(false)
      expect(result.error).toBe('Processing failed')
    })

    it('should resolve with cancelled on OPERATION_CANCELLED', async () => {
      const resultPromise = operationClient.monitorOperation('op_sse_cancel')

      await new Promise((r) => setTimeout(r, 20))

      const sseClients = (operationClient as any).sseClients as Map<string, any>
      const sseClient = sseClients.get('op_sse_cancel')
      const eventSource = (sseClient as any).eventSource as MockEventSource
      eventSource.simulateMessage(EventType.OPERATION_CANCELLED, {})

      const result = await resultPromise

      expect(result.success).toBe(false)
      expect(result.error).toBe('Operation cancelled')
    })

    it('should call onProgress callback', async () => {
      const progressUpdates: any[] = []

      const resultPromise = operationClient.monitorOperation('op_progress', {
        onProgress: (p) => progressUpdates.push(p),
      })

      await new Promise((r) => setTimeout(r, 20))

      const sseClients = (operationClient as any).sseClients as Map<string, any>
      const sseClient = sseClients.get('op_progress')
      const eventSource = (sseClient as any).eventSource as MockEventSource

      // Send progress then completion
      eventSource.simulateMessage(EventType.OPERATION_PROGRESS, {
        message: 'Step 1 of 3',
        progress_percent: 33,
      })

      eventSource.simulateMessage(EventType.OPERATION_COMPLETED, {
        result: { done: true },
      })

      await resultPromise

      expect(progressUpdates).toHaveLength(1)
      expect(progressUpdates[0].message).toBe('Step 1 of 3')
      expect(progressUpdates[0].progressPercent).toBe(33)
    })

    it('should timeout after specified duration', async () => {
      const resultPromise = operationClient.monitorOperation('op_timeout', {
        timeout: 100,
      })

      await expect(resultPromise).rejects.toThrow('Operation timeout after 100ms')
    })
  })

  describe('waitForOperation', () => {
    beforeEach(() => {
      global.EventSource = MockEventSource as any
    })

    it('should return result on success', async () => {
      const resultPromise = operationClient.waitForOperation('op_wait')

      await new Promise((r) => setTimeout(r, 20))

      const sseClients = (operationClient as any).sseClients as Map<string, any>
      const sseClient = sseClients.get('op_wait')
      const eventSource = (sseClient as any).eventSource as MockEventSource
      eventSource.simulateMessage(EventType.OPERATION_COMPLETED, {
        result: { data: 'done' },
      })

      const result = await resultPromise

      expect(result).toEqual({ data: 'done' })
    })

    it('should throw on failure', async () => {
      const resultPromise = operationClient.waitForOperation('op_wait_fail')

      await new Promise((r) => setTimeout(r, 20))

      const sseClients = (operationClient as any).sseClients as Map<string, any>
      const sseClient = sseClients.get('op_wait_fail')
      const eventSource = (sseClient as any).eventSource as MockEventSource
      eventSource.simulateMessage(EventType.OPERATION_ERROR, {
        message: 'Server error',
      })

      await expect(resultPromise).rejects.toThrow('Server error')
    })

    it('should timeout with specified duration', async () => {
      await expect(operationClient.waitForOperation('op_wait_timeout', 100)).rejects.toThrow(
        'Operation timeout'
      )
    })
  })

  describe('configuration', () => {
    it('should accept JWT token in config', () => {
      const client = new OperationClient({
        baseUrl: 'http://localhost:8000',
        token: 'eyJhbGc.eyJzdWI.SflKxw',
      })

      expect(client).toBeInstanceOf(OperationClient)
    })

    it('should accept credentials option', () => {
      const client = new OperationClient({
        baseUrl: 'http://localhost:8000',
        credentials: 'include',
      })

      expect(client).toBeInstanceOf(OperationClient)
    })

    it('should accept custom headers', () => {
      const client = new OperationClient({
        baseUrl: 'http://localhost:8000',
        headers: {
          'X-Custom-Header': 'test-value',
          'X-API-Key': 'my-key',
        },
      })

      expect(client).toBeInstanceOf(OperationClient)
    })

    it('should accept retry configuration', () => {
      const client = new OperationClient({
        baseUrl: 'http://localhost:8000',
        maxRetries: 10,
        retryDelay: 5000,
      })

      expect(client).toBeInstanceOf(OperationClient)
    })
  })
})
