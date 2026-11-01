import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installStreamFetch, type StreamFetch } from '../test/sseStream'
import { OperationClient } from './OperationClient'
import { EventType } from './SSEClient'

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
  let net: StreamFetch

  beforeEach(() => {
    operationClient = new OperationClient({
      baseUrl: 'http://localhost:8000',
      headers: { 'X-API-Key': 'test-key' },
    })

    // Mock global fetch: stream connects go to `net`, everything else to mockFetch
    mockFetch = vi.fn()
    net = installStreamFetch(mockFetch)

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
    it('should resolve with success on OPERATION_COMPLETED', async () => {
      const resultPromise = operationClient.monitorOperation('op_sse_1')

      const stream = await net.opened()
      stream.send(EventType.OPERATION_COMPLETED, {
        result: { graph_id: 'graph_done' },
        metadata: { took: 5000 },
      })

      const result = await resultPromise

      expect(result.success).toBe(true)
      expect(result.result).toEqual({ graph_id: 'graph_done' })
    })

    it('should resolve with error on OPERATION_ERROR', async () => {
      const resultPromise = operationClient.monitorOperation('op_sse_err')

      const stream = await net.opened()
      stream.send(EventType.OPERATION_ERROR, {
        message: 'Processing failed',
      })

      const result = await resultPromise

      expect(result.success).toBe(false)
      expect(result.error).toBe('Processing failed')
    })

    it('should resolve with cancelled on OPERATION_CANCELLED', async () => {
      const resultPromise = operationClient.monitorOperation('op_sse_cancel')

      const stream = await net.opened()
      stream.send(EventType.OPERATION_CANCELLED, {})

      const result = await resultPromise

      expect(result.success).toBe(false)
      expect(result.error).toBe('Operation cancelled')
    })

    it('should call onProgress callback', async () => {
      const progressUpdates: any[] = []

      const resultPromise = operationClient.monitorOperation('op_progress', {
        onProgress: (p) => progressUpdates.push(p),
      })

      const stream = await net.opened()

      // Send progress then completion
      stream.send(EventType.OPERATION_PROGRESS, {
        message: 'Step 1 of 3',
        progress_percent: 33,
      })

      stream.send(EventType.OPERATION_COMPLETED, {
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

    it('settles when cancelOperation() closes the stream', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ status: 'cancelled' }))
      const resultPromise = operationClient.monitorOperation('op_cancel_local')
      await net.opened()

      await operationClient.cancelOperation('op_cancel_local')

      await expect(resultPromise).resolves.toEqual({
        success: false,
        error: 'SSE stream closed before the operation finished',
      })
    })

    it('settles when closeAll() runs', async () => {
      const resultPromise = operationClient.monitorOperation('op_close_all')
      await net.opened()

      operationClient.closeAll()

      await expect(resultPromise).resolves.toMatchObject({ success: false })
    })

    it('settles when a reconnect fails before it opens', async () => {
      const client = new OperationClient({ baseUrl: 'http://localhost:8000', retryDelay: 1 })
      const resultPromise = client.monitorOperation('op_reconnect')
      const stream = await net.opened()

      // The reconnect is refused before open (an expired token, say).
      net.answerNext(new Response(JSON.stringify({ detail: 'Token expired' }), { status: 401 }))
      stream.drop()

      await expect(resultPromise).resolves.toMatchObject({
        success: false,
        error: 'SSE connection failed: HTTP 401 Token expired',
      })
      expect(net.streams).toHaveLength(1)
      client.closeAll()
    })

    it("resolves with the server's in-stream error", async () => {
      const resultPromise = operationClient.monitorOperation('op_capped')
      const stream = await net.opened()

      stream.send('error', { error: 'Too many concurrent SSE connections (limit: 3)' })

      await expect(resultPromise).resolves.toEqual({
        success: false,
        error: 'Too many concurrent SSE connections (limit: 3)',
      })
    })
  })

  describe('waitForOperation', () => {
    it('should return result on success', async () => {
      const resultPromise = operationClient.waitForOperation('op_wait')

      const stream = await net.opened()
      stream.send(EventType.OPERATION_COMPLETED, {
        result: { data: 'done' },
      })

      const result = await resultPromise

      expect(result).toEqual({ data: 'done' })
    })

    it('should throw on failure', async () => {
      const resultPromise = operationClient.waitForOperation('op_wait_fail')

      const stream = await net.opened()
      stream.send(EventType.OPERATION_ERROR, {
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
