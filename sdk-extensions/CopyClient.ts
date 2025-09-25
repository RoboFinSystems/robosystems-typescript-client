'use client'

/**
 * Enhanced Copy Client with SSE support
 * Provides intelligent data copy operations with progress monitoring
 */

import { copyDataToGraph } from '../sdk/sdk.gen'
import type {
  CopyDataToGraphData,
  CopyResponse,
  DataFrameCopyRequest,
  S3CopyRequest,
  UrlCopyRequest,
} from '../sdk/types.gen'
import { EventType, SSEClient } from './SSEClient'

export type CopySourceType = 's3' | 'url' | 'dataframe'

export interface CopyOptions {
  onProgress?: (message: string, progressPercent?: number) => void
  onQueueUpdate?: (position: number, estimatedWait: number) => void
  onWarning?: (warning: string) => void
  timeout?: number
  testMode?: boolean
}

export interface CopyResult {
  status: 'completed' | 'failed' | 'partial' | 'accepted'
  rowsImported?: number
  rowsSkipped?: number
  bytesProcessed?: number
  executionTimeMs?: number
  warnings?: string[]
  error?: string
  operationId?: string
  sseUrl?: string
  message?: string
}

export interface CopyStatistics {
  totalRows: number
  importedRows: number
  skippedRows: number
  bytesProcessed: number
  duration: number
  throughput: number // rows per second
}

export class CopyClient {
  private sseClient?: SSEClient
  private config: {
    baseUrl: string
    credentials?: 'include' | 'same-origin' | 'omit'
    headers?: Record<string, string>
    token?: string // JWT token for authentication
  }

  constructor(config: {
    baseUrl: string
    credentials?: 'include' | 'same-origin' | 'omit'
    headers?: Record<string, string>
    token?: string // JWT token for authentication
  }) {
    this.config = config
  }

  /**
   * Copy data from S3 to graph database
   */
  async copyFromS3(
    graphId: string,
    request: S3CopyRequest,
    options: CopyOptions = {}
  ): Promise<CopyResult> {
    return this.executeCopy(graphId, request, 's3', options)
  }

  /**
   * Copy data from URL to graph database (when available)
   */
  async copyFromUrl(
    graphId: string,
    request: UrlCopyRequest,
    options: CopyOptions = {}
  ): Promise<CopyResult> {
    return this.executeCopy(graphId, request, 'url', options)
  }

  /**
   * Copy data from DataFrame to graph database (when available)
   */
  async copyFromDataFrame(
    graphId: string,
    request: DataFrameCopyRequest,
    options: CopyOptions = {}
  ): Promise<CopyResult> {
    return this.executeCopy(graphId, request, 'dataframe', options)
  }

  /**
   * Execute copy operation with automatic SSE monitoring for long-running operations
   */
  private async executeCopy(
    graphId: string,
    request: S3CopyRequest | UrlCopyRequest | DataFrameCopyRequest,
    _sourceType: CopySourceType,
    options: CopyOptions = {}
  ): Promise<CopyResult> {
    const startTime = Date.now()

    const data: CopyDataToGraphData = {
      url: '/v1/graphs/{graph_id}/copy' as const,
      path: { graph_id: graphId },
      body: request,
      query: {
        token: this.config.token, // Pass JWT token for SSE authentication
      },
    }

    try {
      // Execute the copy request
      const response = await copyDataToGraph(data)
      const responseData = response.data as CopyResponse

      // Check if this is an accepted (async) operation
      if (responseData.status === 'accepted' && responseData.operation_id) {
        // This is a long-running operation with SSE monitoring
        options.onProgress?.(`Copy operation started. Monitoring progress...`)

        // If SSE URL is provided, use it for monitoring
        if (responseData.sse_url) {
          return this.monitorCopyOperation(responseData.operation_id, options, startTime)
        }

        // Otherwise return the accepted response
        return {
          status: 'accepted',
          operationId: responseData.operation_id,
          sseUrl: responseData.sse_url,
          message: responseData.message,
        }
      }

      // This is a synchronous response - operation completed immediately
      return this.buildCopyResult(responseData, Date.now() - startTime)
    } catch (error) {
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        executionTimeMs: Date.now() - startTime,
      }
    }
  }

  /**
   * Monitor a copy operation using SSE
   */
  private async monitorCopyOperation(
    operationId: string,
    options: CopyOptions,
    startTime: number
  ): Promise<CopyResult> {
    return new Promise((resolve, reject) => {
      const sseClient = new SSEClient(this.config)
      const timeoutMs = options.timeout || 3600000 // Default 1 hour for copy operations

      const timeoutHandle = setTimeout(() => {
        sseClient.close()
        reject(new Error(`Copy operation timeout after ${timeoutMs}ms`))
      }, timeoutMs)

      sseClient
        .connect(operationId)
        .then(() => {
          let result: CopyResult = { status: 'failed' }
          const warnings: string[] = []

          // Listen for queue updates
          sseClient.on(EventType.QUEUE_UPDATE, (data) => {
            options.onQueueUpdate?.(
              data.position || data.queue_position,
              data.estimated_wait_seconds || 0
            )
          })

          // Listen for progress updates
          sseClient.on(EventType.OPERATION_PROGRESS, (data) => {
            const message = data.message || data.status || 'Processing...'
            const progressPercent = data.progress_percent || data.progress

            options.onProgress?.(message, progressPercent)

            // Check for warnings in progress updates
            if (data.warnings) {
              warnings.push(...data.warnings)
              data.warnings.forEach((warning: string) => {
                options.onWarning?.(warning)
              })
            }
          })

          // Listen for completion
          sseClient.on(EventType.OPERATION_COMPLETED, (data) => {
            clearTimeout(timeoutHandle)

            const completionData = data.result || data
            result = {
              status: completionData.status || 'completed',
              rowsImported: completionData.rows_imported,
              rowsSkipped: completionData.rows_skipped,
              bytesProcessed: completionData.bytes_processed,
              executionTimeMs: Date.now() - startTime,
              warnings: warnings.length > 0 ? warnings : completionData.warnings,
              message: completionData.message,
            }

            sseClient.close()
            resolve(result)
          })

          // Listen for errors
          sseClient.on(EventType.OPERATION_ERROR, (error) => {
            clearTimeout(timeoutHandle)

            result = {
              status: 'failed',
              error: error.message || error.error || 'Copy operation failed',
              executionTimeMs: Date.now() - startTime,
              warnings: warnings.length > 0 ? warnings : undefined,
            }

            sseClient.close()
            resolve(result) // Resolve with error result, not reject
          })

          // Listen for cancellation
          sseClient.on(EventType.OPERATION_CANCELLED, () => {
            clearTimeout(timeoutHandle)

            result = {
              status: 'failed',
              error: 'Copy operation cancelled',
              executionTimeMs: Date.now() - startTime,
              warnings: warnings.length > 0 ? warnings : undefined,
            }

            sseClient.close()
            resolve(result)
          })
        })
        .catch((error) => {
          clearTimeout(timeoutHandle)
          reject(error)
        })
    })
  }

  /**
   * Build copy result from response data
   */
  private buildCopyResult(responseData: CopyResponse, executionTimeMs: number): CopyResult {
    return {
      status: responseData.status,
      rowsImported: responseData.rows_imported || undefined,
      rowsSkipped: responseData.rows_skipped || undefined,
      bytesProcessed: responseData.bytes_processed || undefined,
      executionTimeMs: responseData.execution_time_ms || executionTimeMs,
      warnings: responseData.warnings || undefined,
      message: responseData.message,
      error: responseData.error_details ? String(responseData.error_details) : undefined,
    }
  }

  /**
   * Calculate copy statistics from result
   */
  calculateStatistics(result: CopyResult): CopyStatistics | null {
    if (result.status === 'failed' || !result.rowsImported) {
      return null
    }

    const totalRows = (result.rowsImported || 0) + (result.rowsSkipped || 0)
    const duration = (result.executionTimeMs || 0) / 1000 // Convert to seconds
    const throughput = duration > 0 ? (result.rowsImported || 0) / duration : 0

    return {
      totalRows,
      importedRows: result.rowsImported || 0,
      skippedRows: result.rowsSkipped || 0,
      bytesProcessed: result.bytesProcessed || 0,
      duration,
      throughput,
    }
  }

  /**
   * Convenience method for simple S3 copy with default options
   */
  async copyS3(
    graphId: string,
    tableName: string,
    s3Uri: string,
    accessKeyId: string,
    secretAccessKey: string,
    options?: {
      region?: string
      fileFormat?: 'csv' | 'parquet' | 'json' | 'delta' | 'iceberg'
      ignoreErrors?: boolean
    }
  ): Promise<CopyResult> {
    const request: S3CopyRequest = {
      table_name: tableName,
      source_type: 's3',
      s3_path: s3Uri,
      s3_access_key_id: accessKeyId,
      s3_secret_access_key: secretAccessKey,
      s3_region: options?.region || 'us-east-1',
      file_format: options?.fileFormat,
      ignore_errors: options?.ignoreErrors || false,
    }

    return this.copyFromS3(graphId, request)
  }

  /**
   * Monitor multiple copy operations concurrently
   */
  async monitorMultipleCopies(
    operationIds: string[],
    options: CopyOptions = {}
  ): Promise<Map<string, CopyResult>> {
    const results = await Promise.all(
      operationIds.map(async (id) => {
        const result = await this.monitorCopyOperation(id, options, Date.now())
        return [id, result] as [string, CopyResult]
      })
    )
    return new Map(results)
  }

  /**
   * Batch copy multiple tables from S3
   */
  async batchCopyFromS3(
    graphId: string,
    copies: Array<{
      request: S3CopyRequest
      options?: CopyOptions
    }>
  ): Promise<CopyResult[]> {
    return Promise.all(
      copies.map(({ request, options }) => this.copyFromS3(graphId, request, options || {}))
    )
  }

  /**
   * Copy with retry logic for transient failures
   */
  async copyWithRetry(
    graphId: string,
    request: S3CopyRequest | UrlCopyRequest | DataFrameCopyRequest,
    sourceType: CopySourceType,
    maxRetries: number = 3,
    options: CopyOptions = {}
  ): Promise<CopyResult> {
    let lastError: Error | undefined
    let attempt = 0

    while (attempt < maxRetries) {
      attempt++

      try {
        const result = await this.executeCopy(graphId, request, sourceType, options)

        // If successful or partially successful, return
        if (result.status === 'completed' || result.status === 'partial') {
          return result
        }

        // If failed, check if it's retryable
        if (result.status === 'failed') {
          const isRetryable = this.isRetryableError(result.error)
          if (!isRetryable || attempt === maxRetries) {
            return result
          }

          // Wait before retry with exponential backoff
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 30000)
          options.onProgress?.(
            `Retrying copy operation (attempt ${attempt}/${maxRetries}) in ${waitTime}ms...`
          )
          await new Promise((resolve) => setTimeout(resolve, waitTime))
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        if (attempt === maxRetries) {
          throw lastError
        }

        // Wait before retry
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 30000)
        options.onProgress?.(
          `Retrying after error (attempt ${attempt}/${maxRetries}) in ${waitTime}ms...`
        )
        await new Promise((resolve) => setTimeout(resolve, waitTime))
      }
    }

    throw lastError || new Error('Copy operation failed after all retries')
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error?: string): boolean {
    if (!error) return false

    const retryablePatterns = [
      'timeout',
      'network',
      'connection',
      'temporary',
      'unavailable',
      'rate limit',
      'throttl',
    ]

    const lowerError = error.toLowerCase()
    return retryablePatterns.some((pattern) => lowerError.includes(pattern))
  }

  /**
   * Cancel any active SSE connections
   */
  close(): void {
    if (this.sseClient) {
      this.sseClient.close()
      this.sseClient = undefined
    }
  }
}
