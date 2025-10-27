import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { GraphMetadataInput, InitialEntityInput } from './GraphClient'
import { GraphClient } from './GraphClient'

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

describe('GraphClient', () => {
  let graphClient: GraphClient
  let mockFetch: any

  beforeEach(() => {
    graphClient = new GraphClient({
      baseUrl: 'http://localhost:8000',
      token: 'test-api-key',
      headers: { 'X-API-Key': 'test-api-key' },
    })

    // Mock global fetch
    mockFetch = vi.fn()
    global.fetch = mockFetch

    // Reset all mocks
    vi.clearAllMocks()
  })

  describe('createGraphAndWait', () => {
    const mockMetadata: GraphMetadataInput = {
      graphName: 'Test Graph',
      description: 'A test graph',
      schemaExtensions: ['custom_prop'],
      tags: ['test'],
    }

    it('should create graph with immediate response', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          graph_id: 'graph_123',
        })
      )

      const graphId = await graphClient.createGraphAndWait(mockMetadata)

      expect(graphId).toBe('graph_123')
      expect(mockFetch).toHaveBeenCalled()
    })

    it('should create graph with initial entity', async () => {
      const mockInitialEntity: InitialEntityInput = {
        name: 'ACME Corp',
        uri: 'https://example.com/acme',
        category: 'Technology',
        sic: '7372',
        sicDescription: 'Prepackaged Software',
      }

      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          graph_id: 'graph_456',
        })
      )

      const graphId = await graphClient.createGraphAndWait(mockMetadata, mockInitialEntity)

      expect(graphId).toBe('graph_456')
      expect(mockFetch).toHaveBeenCalled()
    })

    it('should poll operation status when queued', async () => {
      // First call: createGraph returns operation_id
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          operation_id: 'op_789',
        })
      )

      // Second call: getOperationStatus returns pending
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          status: 'pending',
        })
      )

      // Third call: getOperationStatus returns completed
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          status: 'completed',
          result: {
            graph_id: 'graph_completed',
          },
        })
      )

      const graphId = await graphClient.createGraphAndWait(mockMetadata, undefined, {
        pollInterval: 100,
      })

      expect(graphId).toBe('graph_completed')
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })

    it('should handle operation failure', async () => {
      mockFetch
        .mockResolvedValueOnce(
          createMockResponse({
            operation_id: 'op_fail',
          })
        )
        .mockResolvedValueOnce(
          createMockResponse({
            status: 'failed',
            error: 'Graph creation failed',
          })
        )

      await expect(
        graphClient.createGraphAndWait(mockMetadata, undefined, { pollInterval: 100 })
      ).rejects.toThrow('Graph creation failed')
    })

    it('should timeout if operation takes too long', async () => {
      mockFetch
        .mockResolvedValueOnce(
          createMockResponse({
            operation_id: 'op_timeout',
          })
        )
        .mockResolvedValue(
          createMockResponse({
            status: 'pending',
          })
        )

      await expect(
        graphClient.createGraphAndWait(mockMetadata, undefined, {
          timeout: 500,
          pollInterval: 100,
        })
      ).rejects.toThrow('timed out')
    })

    it('should call onProgress callback', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          graph_id: 'graph_progress',
        })
      )

      const onProgress = vi.fn()

      await graphClient.createGraphAndWait(mockMetadata, undefined, { onProgress })

      expect(onProgress).toHaveBeenCalledWith(expect.stringContaining('Creating graph'))
      expect(onProgress).toHaveBeenCalledWith(expect.stringContaining('Graph created'))
    })

    it('should throw error if no token provided', async () => {
      const clientNoToken = new GraphClient({
        baseUrl: 'http://localhost:8000',
      })

      await expect(clientNoToken.createGraphAndWait(mockMetadata)).rejects.toThrow(
        'No API key provided'
      )
    })
  })

  describe('getGraphInfo', () => {
    it('should get graph info by ID', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          graphs: [
            {
              graph_id: 'graph_123',
              graph_name: 'Test Graph',
              description: 'Test description',
              schema_extensions: ['prop1'],
              tags: ['test'],
              created_at: '2024-01-01T00:00:00Z',
              status: 'active',
            },
            {
              graph_id: 'graph_456',
              graph_name: 'Other Graph',
            },
          ],
        })
      )

      const info = await graphClient.getGraphInfo('graph_123')

      expect(info.graphId).toBe('graph_123')
      expect(info.graphName).toBe('Test Graph')
      expect(info.description).toBe('Test description')
      expect(info.tags).toEqual(['test'])
    })

    it('should throw error if graph not found', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          graphs: [
            {
              graph_id: 'graph_other',
              graph_name: 'Other Graph',
            },
          ],
        })
      )

      await expect(graphClient.getGraphInfo('graph_notfound')).rejects.toThrow('Graph not found')
    })

    it('should throw error if no token provided', async () => {
      const clientNoToken = new GraphClient({
        baseUrl: 'http://localhost:8000',
      })

      await expect(clientNoToken.getGraphInfo('graph_123')).rejects.toThrow('No API key provided')
    })
  })

  describe('listGraphs', () => {
    it('should list all graphs', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          graphs: [
            {
              graph_id: 'graph_1',
              graph_name: 'Graph 1',
              description: 'First graph',
            },
            {
              graph_id: 'graph_2',
              graph_name: 'Graph 2',
              tags: ['production'],
            },
          ],
        })
      )

      const graphs = await graphClient.listGraphs()

      expect(graphs).toHaveLength(2)
      expect(graphs[0].graphId).toBe('graph_1')
      expect(graphs[0].graphName).toBe('Graph 1')
      expect(graphs[1].graphId).toBe('graph_2')
      expect(graphs[1].tags).toEqual(['production'])
    })

    it('should return empty array if no graphs', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          graphs: [],
        })
      )

      const graphs = await graphClient.listGraphs()

      expect(graphs).toEqual([])
    })
  })

  describe('deleteGraph', () => {
    it('should throw not implemented error', async () => {
      await expect(graphClient.deleteGraph('graph_123')).rejects.toThrow('not yet implemented')
    })
  })

  describe('close', () => {
    it('should close without errors', () => {
      expect(() => graphClient.close()).not.toThrow()
    })
  })
})
