import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueuedQueryError } from './QueryClient'

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

describe('QueryClient', () => {
  let queryClient: QueryClient
  let mockFetch: any

  beforeEach(() => {
    queryClient = new QueryClient({
      baseUrl: 'http://localhost:8000',
      headers: { 'X-API-Key': 'test-key' },
    })

    // Mock global fetch (also set globalThis for SDK client compatibility)
    mockFetch = vi.fn()
    global.fetch = mockFetch
    globalThis.fetch = mockFetch

    // Reset all mocks
    vi.clearAllMocks()
  })

  describe('executeQuery - immediate response', () => {
    it('should execute a sync query successfully', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          data: [
            { name: 'Alice', age: 30 },
            { name: 'Bob', age: 25 },
          ],
          columns: ['name', 'age'],
          row_count: 2,
          execution_time_ms: 45,
          timestamp: '2025-01-01T00:00:00Z',
        })
      )

      const result = await queryClient.executeQuery('graph_123', {
        query: 'MATCH (n:Person) RETURN n.name, n.age',
      })

      // Should be a QueryResult, not an iterator
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('columns')

      const queryResult = result as any
      expect(queryResult.data).toHaveLength(2)
      expect(queryResult.columns).toEqual(['name', 'age'])
      expect(queryResult.row_count).toBe(2)
      expect(queryResult.execution_time_ms).toBe(45)
      expect(queryResult.graph_id).toBe('graph_123')
    })

    it('should handle query with parameters', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          data: [{ name: 'Alice' }],
          columns: ['name'],
          row_count: 1,
          execution_time_ms: 20,
        })
      )

      const result = await queryClient.executeQuery(
        'graph_123',
        {
          query: 'MATCH (n:Person {age: $age}) RETURN n.name',
          parameters: { age: 30 },
        },
        { mode: 'sync' }
      )

      const queryResult = result as any
      expect(queryResult.data).toHaveLength(1)
      expect(queryResult.data[0].name).toBe('Alice')
    })

    it('should default row_count if not provided', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          data: [{ a: 1 }, { b: 2 }, { c: 3 }],
          columns: ['value'],
        })
      )

      const result = await queryClient.executeQuery('graph_123', {
        query: 'RETURN 1',
      })

      const queryResult = result as any
      expect(queryResult.row_count).toBe(3) // Should default to data.length
    })

    it('should default execution_time_ms if not provided', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          data: [],
          columns: [],
        })
      )

      const result = await queryClient.executeQuery('graph_123', {
        query: 'RETURN 1',
      })

      const queryResult = result as any
      expect(queryResult.execution_time_ms).toBe(0)
    })
  })

  describe('executeQuery - queued response', () => {
    it('should throw QueuedQueryError when maxWait is 0', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          status: 'queued',
          operation_id: 'op_123',
          queue_position: 5,
          estimated_wait_seconds: 30,
          message: 'Query queued',
        })
      )

      await expect(
        queryClient.executeQuery(
          'graph_123',
          { query: 'RETURN 1' },
          { maxWait: 0 } // Don't wait for queued queries
        )
      ).rejects.toThrow(QueuedQueryError)
    })

    it('should call onQueueUpdate when query is queued', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          status: 'queued',
          operation_id: 'op_123',
          queue_position: 3,
          estimated_wait_seconds: 15,
          message: 'Query queued',
        })
      )

      const queueUpdates: Array<{ position: number; wait: number }> = []

      try {
        await queryClient.executeQuery(
          'graph_123',
          { query: 'RETURN 1' },
          {
            maxWait: 0,
            onQueueUpdate: (position, estimatedWait) => {
              queueUpdates.push({ position, wait: estimatedWait })
            },
          }
        )
      } catch (error) {
        // Expected to throw QueuedQueryError
        expect(error).toBeInstanceOf(QueuedQueryError)
        expect((error as QueuedQueryError).queueInfo.queue_position).toBe(3)
      }

      expect(queueUpdates).toHaveLength(1)
      expect(queueUpdates[0].position).toBe(3)
      expect(queueUpdates[0].wait).toBe(15)
    })
  })

  describe('executeQuery - error handling', () => {
    it('should throw error for unexpected response format', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          unexpected: 'format',
        })
      )

      await expect(queryClient.executeQuery('graph_123', { query: 'RETURN 1' })).rejects.toThrow(
        'Unexpected response format'
      )
    })

    it('should handle fetch errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(queryClient.executeQuery('graph_123', { query: 'RETURN 1' })).rejects.toThrow(
        'Network error'
      )
    })
  })

  describe('query (convenience method)', () => {
    it('should execute a simple query', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          data: [{ result: 42 }],
          columns: ['result'],
          row_count: 1,
          execution_time_ms: 10,
        })
      )

      const result = await queryClient.query('graph_123', 'RETURN 42 as result')

      expect(result.data).toHaveLength(1)
      expect(result.data[0].result).toBe(42)
    })

    it('should execute query with parameters', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          data: [{ sum: 10 }],
          columns: ['sum'],
          row_count: 1,
          execution_time_ms: 5,
        })
      )

      const result = await queryClient.query('graph_123', 'RETURN $a + $b as sum', {
        a: 3,
        b: 7,
      })

      expect(result.data[0].sum).toBe(10)
    })
  })

  describe('close', () => {
    it('should close without error when no SSE client exists', () => {
      expect(() => queryClient.close()).not.toThrow()
    })
  })

  describe('QueuedQueryError', () => {
    it('should create error with queue info', () => {
      const queueInfo = {
        status: 'queued' as const,
        operation_id: 'op_123',
        queue_position: 5,
        estimated_wait_seconds: 30,
        message: 'Query queued',
      }

      const error = new QueuedQueryError(queueInfo)

      expect(error.message).toBe('Query was queued')
      expect(error.name).toBe('QueuedQueryError')
      expect(error.queueInfo).toEqual(queueInfo)
    })
  })
})
