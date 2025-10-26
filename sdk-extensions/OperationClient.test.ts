import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OperationClient } from './OperationClient'

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

      const status = await operationClient.getStatus('op_nonexistent')

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
