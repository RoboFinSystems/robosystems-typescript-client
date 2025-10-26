import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TableIngestClient } from './TableIngestClient'

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

describe('TableIngestClient', () => {
  let tableClient: TableIngestClient
  let mockFetch: any

  beforeEach(() => {
    tableClient = new TableIngestClient({
      baseUrl: 'http://localhost:8000',
      headers: { 'X-API-Key': 'test-key' },
    })

    // Mock global fetch
    mockFetch = vi.fn()
    global.fetch = mockFetch

    // Reset all mocks
    vi.clearAllMocks()
  })

  describe('uploadParquetFile', () => {
    it('should upload a Buffer successfully', async () => {
      mockFetch
        // 1. Get upload URL
        .mockResolvedValueOnce(
          createMockResponse({
            upload_url: 'https://s3.amazonaws.com/bucket/file.parquet',
            file_id: 'file_123',
          })
        )
        // 2. S3 upload
        .mockResolvedValueOnce(createMockResponse(null))
        // 3. Update metadata
        .mockResolvedValueOnce(createMockResponse({ success: true }))

      const buffer = Buffer.from('test parquet data')
      const result = await tableClient.uploadParquetFile('graph_123', 'Entity', buffer, {
        fileName: 'test.parquet',
      })

      expect(result.success).toBe(true)
      expect(result.fileId).toBe('file_123')
      expect(result.tableName).toBe('Entity')
      expect(result.fileName).toBe('test.parquet')
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })

    it('should handle upload URL fetch failure', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Failed to get upload URL' }, { ok: false, status: 500 })
      )

      const buffer = Buffer.from('test data')
      const result = await tableClient.uploadParquetFile('graph_123', 'Entity', buffer)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle S3 upload failure', async () => {
      mockFetch
        // Get upload URL succeeds
        .mockResolvedValueOnce(
          createMockResponse({
            upload_url: 'https://s3.amazonaws.com/bucket/file.parquet',
            file_id: 'file_123',
          })
        )
        // S3 upload fails
        .mockResolvedValueOnce(createMockResponse(null, { ok: false, status: 500 }))

      const buffer = Buffer.from('test data')
      const result = await tableClient.uploadParquetFile('graph_123', 'Entity', buffer)

      expect(result.success).toBe(false)
      expect(result.error).toContain('S3 upload failed')
      expect(result.error).toContain('500')
    })

    it('should fix LocalStack URLs when enabled', async () => {
      mockFetch
        .mockResolvedValueOnce(
          createMockResponse({
            upload_url: 'http://localstack:4566/bucket/file.parquet',
            file_id: 'file_123',
          })
        )
        .mockResolvedValueOnce(createMockResponse(null))
        .mockResolvedValueOnce(createMockResponse({ success: true }))

      const buffer = Buffer.from('test data')
      await tableClient.uploadParquetFile('graph_123', 'Entity', buffer, {
        fixLocalStackUrl: true,
      })

      // Check that the S3 upload (2nd call) used the fixed URL
      const s3Call = mockFetch.mock.calls[1]
      expect(s3Call[0]).toBe('http://localhost:4566/bucket/file.parquet')
    })

    it('should call progress callback', async () => {
      mockFetch
        .mockResolvedValueOnce(
          createMockResponse({
            upload_url: 'https://s3.amazonaws.com/bucket/file.parquet',
            file_id: 'file_123',
          })
        )
        .mockResolvedValueOnce(createMockResponse(null))
        .mockResolvedValueOnce(createMockResponse({ success: true }))

      const progressMessages: string[] = []
      const buffer = Buffer.from('test data')

      await tableClient.uploadParquetFile('graph_123', 'Entity', buffer, {
        onProgress: (msg) => progressMessages.push(msg),
      })

      expect(progressMessages.length).toBeGreaterThan(0)
      expect(progressMessages.some((msg) => msg.includes('Getting upload URL'))).toBe(true)
      expect(progressMessages.some((msg) => msg.includes('Uploading'))).toBe(true)
    })

    it('should handle metadata update failure', async () => {
      mockFetch
        .mockResolvedValueOnce(
          createMockResponse({
            upload_url: 'https://s3.amazonaws.com/bucket/file.parquet',
            file_id: 'file_123',
          })
        )
        .mockResolvedValueOnce(createMockResponse(null))
        .mockResolvedValueOnce(
          createMockResponse({ detail: 'Failed to update' }, { ok: false, status: 500 })
        )

      const buffer = Buffer.from('test data')
      const result = await tableClient.uploadParquetFile('graph_123', 'Entity', buffer)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to update file metadata')
    })
  })

  describe('listStagingTables', () => {
    it('should list staging tables successfully', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          tables: [
            {
              table_name: 'Entity',
              row_count: 1000,
              file_count: 2,
              total_size_bytes: 5000000,
            },
          ],
        })
      )

      const tables = await tableClient.listStagingTables('graph_123')

      expect(tables).toHaveLength(1)
      expect(tables[0].tableName).toBe('Entity')
      expect(tables[0].rowCount).toBe(1000)
      expect(tables[0].fileCount).toBe(2)
      expect(tables[0].totalSizeBytes).toBe(5000000)
    })

    it('should return empty array on error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Failed to list tables' }, { ok: false, status: 500 })
      )

      const tables = await tableClient.listStagingTables('graph_123')

      expect(tables).toEqual([])
    })
  })

  describe('ingestAllTables', () => {
    it('should ingest tables successfully', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          operation_id: 'op_123',
          message: 'Ingestion started',
        })
      )

      const result = await tableClient.ingestAllTables('graph_123', {
        ignoreErrors: true,
        rebuild: false,
      })

      expect(result.success).toBe(true)
      expect(result.operationId).toBe('op_123')
      expect(result.message).toBe('Ingestion started')
    })

    it('should handle ingestion failure', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Ingestion failed' }, { ok: false, status: 500 })
      )

      const result = await tableClient.ingestAllTables('graph_123')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should call progress callback', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          operation_id: 'op_123',
          message: 'Ingestion started',
        })
      )

      const progressMessages: string[] = []

      await tableClient.ingestAllTables('graph_123', {
        onProgress: (msg) => progressMessages.push(msg),
      })

      expect(progressMessages.length).toBeGreaterThan(0)
      expect(progressMessages.some((msg) => msg.includes('Starting'))).toBe(true)
      expect(progressMessages.some((msg) => msg.includes('completed'))).toBe(true)
    })
  })

  describe('uploadAndIngest', () => {
    it('should upload and ingest in one operation', async () => {
      mockFetch
        // Upload URL
        .mockResolvedValueOnce(
          createMockResponse({
            upload_url: 'https://s3.amazonaws.com/bucket/file.parquet',
            file_id: 'file_123',
          })
        )
        // S3 upload
        .mockResolvedValueOnce(createMockResponse(null))
        // Update metadata
        .mockResolvedValueOnce(createMockResponse({ success: true }))
        // Ingest
        .mockResolvedValueOnce(createMockResponse({ operation_id: 'op_123' }))

      const buffer = Buffer.from('test data')
      const result = await tableClient.uploadAndIngest('graph_123', 'Entity', buffer)

      expect(result.upload.success).toBe(true)
      expect(result.ingest?.success).toBe(true)
      expect(result.ingest?.operationId).toBe('op_123')
    })

    it('should not ingest if upload fails', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Upload failed' }, { ok: false, status: 500 })
      )

      const buffer = Buffer.from('test data')
      const result = await tableClient.uploadAndIngest('graph_123', 'Entity', buffer)

      expect(result.upload.success).toBe(false)
      expect(result.ingest).toBeNull()
      // Should only have 1 fetch call (failed upload URL), not the ingest call
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('file conversion helpers', () => {
    it('should handle File objects', async () => {
      mockFetch
        .mockResolvedValueOnce(
          createMockResponse({
            upload_url: 'https://s3.amazonaws.com/bucket/file.parquet',
            file_id: 'file_123',
          })
        )
        .mockResolvedValueOnce(createMockResponse(null))
        .mockResolvedValueOnce(createMockResponse({ success: true }))

      const file = new File(['test data'], 'test.parquet', { type: 'application/x-parquet' })
      const result = await tableClient.uploadParquetFile('graph_123', 'Entity', file)

      expect(result.success).toBe(true)
      expect(result.fileName).toBe('test.parquet')
    })
  })
})
