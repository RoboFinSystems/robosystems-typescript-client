'use client'

/**
 * Table Ingest Client for RoboSystems API
 *
 * Simplifies uploading Parquet files to staging tables and ingesting them into graphs.
 * Supports File (browser), Blob (browser), Buffer (Node.js), and ReadableStream.
 */

import { getUploadUrl, ingestTables, listTables, updateFileStatus } from '../sdk/sdk.gen'
import type {
  BulkIngestRequest,
  FileStatusUpdate,
  FileUploadRequest,
  FileUploadResponse,
  TableListResponse,
} from '../sdk/types.gen'

export interface UploadOptions {
  onProgress?: (message: string) => void
  fixLocalStackUrl?: boolean // Auto-fix LocalStack URLs for localhost
  fileName?: string // Override file name (useful for buffer/blob uploads)
}

export interface IngestOptions {
  ignoreErrors?: boolean
  rebuild?: boolean
  onProgress?: (message: string) => void
}

export interface UploadResult {
  fileId: string
  fileSize: number
  rowCount: number
  tableName: string
  fileName: string
  success: boolean
  error?: string
}

export interface TableInfo {
  tableName: string
  rowCount: number
  fileCount: number
  totalSizeBytes: number
}

export interface IngestResult {
  success: boolean
  operationId?: string
  message?: string
  error?: string
}

// Union type for all supported file inputs
export type FileInput = File | Blob | Buffer | ReadableStream<Uint8Array>

export class TableIngestClient {
  private config: {
    baseUrl: string
    credentials?: 'include' | 'same-origin' | 'omit'
    headers?: Record<string, string>
    token?: string
  }

  constructor(config: {
    baseUrl: string
    credentials?: 'include' | 'same-origin' | 'omit'
    headers?: Record<string, string>
    token?: string
  }) {
    this.config = config
  }

  /**
   * Upload a Parquet file to a staging table
   *
   * This method handles the complete 3-step upload process:
   * 1. Get presigned upload URL
   * 2. Upload file to S3
   * 3. Mark file as 'uploaded' (backend validates, calculates size/row count)
   *
   * Supports File (browser), Blob (browser), Buffer (Node.js), and ReadableStream.
   */
  async uploadParquetFile(
    graphId: string,
    tableName: string,
    fileOrBuffer: FileInput,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const fileName = this.getFileName(fileOrBuffer, options.fileName)

    try {
      // Step 1: Get presigned upload URL
      options.onProgress?.(`Getting upload URL for ${fileName} -> table '${tableName}'...`)

      const uploadRequest: FileUploadRequest = {
        file_name: fileName,
        content_type: 'application/x-parquet',
      }

      const uploadUrlResponse = await getUploadUrl({
        path: { graph_id: graphId, table_name: tableName },
        body: uploadRequest,
        query: this.config.token ? { token: this.config.token } : undefined,
      })

      if (uploadUrlResponse.error || !uploadUrlResponse.data) {
        return {
          fileId: '',
          fileSize: 0,
          rowCount: 0,
          tableName,
          fileName,
          success: false,
          error: `Failed to get upload URL: ${uploadUrlResponse.error}`,
        }
      }

      const uploadData = uploadUrlResponse.data as FileUploadResponse
      let uploadUrl = uploadData.upload_url
      const fileId = uploadData.file_id

      // Fix LocalStack URL if needed
      if (options.fixLocalStackUrl && uploadUrl.includes('localstack:4566')) {
        uploadUrl = uploadUrl.replace('localstack:4566', 'localhost:4566')
      }

      // Step 2: Upload file to S3
      options.onProgress?.(`Uploading ${fileName} to S3...`)

      const fileContent = await this.getFileContent(fileOrBuffer)
      const fileSize = fileContent.byteLength

      const s3Response = await fetch(uploadUrl, {
        method: 'PUT',
        body: fileContent,
        headers: {
          'Content-Type': 'application/x-parquet',
        },
      })

      if (!s3Response.ok) {
        return {
          fileId,
          fileSize,
          rowCount: 0,
          tableName,
          fileName,
          success: false,
          error: `S3 upload failed: ${s3Response.status} ${s3Response.statusText}`,
        }
      }

      // Step 3: Mark file as uploaded (backend validates and calculates size/row count)
      options.onProgress?.(`Marking ${fileName} as uploaded...`)

      const statusUpdate: FileStatusUpdate = {
        status: 'uploaded',
      }

      const updateResponse = await updateFileStatus({
        path: { graph_id: graphId, file_id: fileId },
        body: statusUpdate,
        query: this.config.token ? { token: this.config.token } : undefined,
      })

      if (updateResponse.error || !updateResponse.data) {
        return {
          fileId,
          fileSize,
          rowCount: 0,
          tableName,
          fileName,
          success: false,
          error: 'Failed to complete file upload',
        }
      }

      // Extract size and row count from response (calculated by backend)
      const responseData = updateResponse.data as any
      const actualFileSize = responseData.file_size_bytes || 0
      const actualRowCount = responseData.row_count || 0

      options.onProgress?.(
        `✅ Uploaded ${fileName} (${actualFileSize.toLocaleString()} bytes, ${actualRowCount.toLocaleString()} rows)`
      )

      return {
        fileId,
        fileSize: actualFileSize,
        rowCount: actualRowCount,
        tableName,
        fileName,
        success: true,
      }
    } catch (error) {
      return {
        fileId: '',
        fileSize: 0,
        rowCount: 0,
        tableName,
        fileName,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * List all staging tables in a graph
   */
  async listStagingTables(graphId: string): Promise<TableInfo[]> {
    try {
      const response = await listTables({
        path: { graph_id: graphId },
        query: this.config.token ? { token: this.config.token } : undefined,
      })

      if (response.error || !response.data) {
        console.error('Failed to list tables:', response.error)
        return []
      }

      const tableData = response.data as TableListResponse

      return (
        tableData.tables?.map((table) => ({
          tableName: table.table_name,
          rowCount: table.row_count,
          fileCount: table.file_count || 0,
          totalSizeBytes: table.total_size_bytes || 0,
        })) || []
      )
    } catch (error) {
      console.error('Failed to list tables:', error)
      return []
    }
  }

  /**
   * Ingest all staging tables into the graph
   */
  async ingestAllTables(graphId: string, options: IngestOptions = {}): Promise<IngestResult> {
    try {
      options.onProgress?.('Starting table ingestion...')

      const ingestRequest: BulkIngestRequest = {
        ignore_errors: options.ignoreErrors ?? true,
        rebuild: options.rebuild ?? false,
      }

      const response = await ingestTables({
        path: { graph_id: graphId },
        body: ingestRequest,
        query: this.config.token ? { token: this.config.token } : undefined,
      })

      if (response.error || !response.data) {
        return {
          success: false,
          error: `Failed to ingest tables: ${response.error}`,
        }
      }

      const result = response.data as any

      options.onProgress?.('✅ Table ingestion completed')

      return {
        success: true,
        operationId: result.operation_id,
        message: result.message || 'Ingestion started',
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Convenience method to upload a file and immediately ingest it
   */
  async uploadAndIngest(
    graphId: string,
    tableName: string,
    fileOrBuffer: FileInput,
    uploadOptions: UploadOptions = {},
    ingestOptions: IngestOptions = {}
  ): Promise<{ upload: UploadResult; ingest: IngestResult | null }> {
    // Upload the file
    const uploadResult = await this.uploadParquetFile(
      graphId,
      tableName,
      fileOrBuffer,
      uploadOptions
    )

    if (!uploadResult.success) {
      return {
        upload: uploadResult,
        ingest: null,
      }
    }

    // Ingest the table
    const ingestResult = await this.ingestAllTables(graphId, ingestOptions)

    return {
      upload: uploadResult,
      ingest: ingestResult,
    }
  }

  /**
   * Get file name from input or use provided override
   */
  private getFileName(fileOrBuffer: FileInput, override?: string): string {
    if (override) return override

    // File object (browser)
    if ('name' in fileOrBuffer && typeof fileOrBuffer.name === 'string') {
      return fileOrBuffer.name
    }

    // Default name for buffers/blobs/streams
    return 'data.parquet'
  }

  /**
   * Convert various file inputs to ArrayBuffer for upload
   */
  private async getFileContent(fileOrBuffer: FileInput): Promise<ArrayBuffer> {
    // File or Blob (browser)
    if (fileOrBuffer instanceof Blob || fileOrBuffer instanceof File) {
      return fileOrBuffer.arrayBuffer()
    }

    // Buffer (Node.js)
    if (Buffer.isBuffer(fileOrBuffer)) {
      return fileOrBuffer.buffer.slice(
        fileOrBuffer.byteOffset,
        fileOrBuffer.byteOffset + fileOrBuffer.byteLength
      )
    }

    // ReadableStream
    if ('getReader' in fileOrBuffer) {
      const reader = fileOrBuffer.getReader()
      const chunks: Uint8Array[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (value) chunks.push(value)
      }

      // Concatenate chunks
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
      const result = new Uint8Array(totalLength)
      let offset = 0
      for (const chunk of chunks) {
        result.set(chunk, offset)
        offset += chunk.length
      }
      return result.buffer
    }

    throw new Error('Unsupported file input type')
  }
}
