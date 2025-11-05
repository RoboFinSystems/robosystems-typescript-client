'use client'

/**
 * Enhanced Query Client with SSE support
 * Provides intelligent query execution with automatic strategy selection
 */

import { executeCypherQuery } from '../sdk/sdk.gen'
import type { ExecuteCypherQueryData } from '../sdk/types.gen'
import { EventType, SSEClient } from './SSEClient'

export interface QueryRequest {
  query: string
  parameters?: Record<string, any>
  timeout?: number
}

export interface QueryOptions {
  mode?: 'auto' | 'sync' | 'async' | 'stream'
  chunkSize?: number
  testMode?: boolean
  maxWait?: number
  onQueueUpdate?: (position: number, estimatedWait: number) => void
  onProgress?: (message: string) => void
}

export interface QueryResult {
  data: any[]
  columns: string[]
  row_count: number
  execution_time_ms: number
  graph_id?: string
  timestamp?: string
}

export interface QueuedQueryResponse {
  status: 'queued'
  operation_id: string
  queue_position: number
  estimated_wait_seconds: number
  message: string
}

export class QueryClient {
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

  async executeQuery(
    graphId: string,
    request: QueryRequest,
    options: QueryOptions = {}
  ): Promise<QueryResult | AsyncIterableIterator<any>> {
    const data: ExecuteCypherQueryData = {
      url: '/v1/graphs/{graph_id}/query' as const,
      path: { graph_id: graphId },
      body: {
        query: request.query,
        parameters: request.parameters,
      },
      query: {
        mode: options.mode,
        test_mode: options.testMode,
      },
    }

    // Execute the query
    const response = await executeCypherQuery(data)

    // Check if this is an NDJSON streaming response
    // The SDK returns the response object which includes the raw Response
    if (response.response) {
      const contentType = response.response.headers.get('content-type') || ''
      const streamFormat = response.response.headers.get('x-stream-format')

      if (contentType.includes('application/x-ndjson') || streamFormat === 'ndjson') {
        return this.parseNDJSONResponse(response.response, graphId)
      }
    }

    const responseData = response.data as any

    // Check if this is an immediate response
    if (responseData?.data !== undefined && responseData?.columns) {
      return {
        data: responseData.data,
        columns: responseData.columns,
        row_count: responseData.row_count || responseData.data.length,
        execution_time_ms: responseData.execution_time_ms || 0,
        graph_id: graphId,
        timestamp: responseData.timestamp || new Date().toISOString(),
      }
    }

    // Check if this is a queued response
    if (responseData?.status === 'queued' && responseData?.operation_id) {
      const queuedResponse = responseData as QueuedQueryResponse

      // Notify about queue status
      options.onQueueUpdate?.(queuedResponse.queue_position, queuedResponse.estimated_wait_seconds)

      // If user doesn't want to wait, throw with queue info
      if (options.maxWait === 0) {
        throw new QueuedQueryError(queuedResponse)
      }

      // Use SSE to monitor the operation
      if (options.mode === 'stream') {
        return this.streamQueryResults(queuedResponse.operation_id, options)
      } else {
        return this.waitForQueryCompletion(queuedResponse.operation_id, options)
      }
    }

    // Unexpected response format
    throw new Error('Unexpected response format from query endpoint')
  }

  private async parseNDJSONResponse(response: Response, graphId: string): Promise<QueryResult> {
    const allData: any[] = []
    let columns: string[] | null = null
    let totalRows = 0
    let executionTimeMs = 0

    // Parse NDJSON line by line
    const text = await response.text()
    const lines = text.trim().split('\n')

    for (const line of lines) {
      if (!line.trim()) continue

      try {
        const chunk = JSON.parse(line)

        // Extract columns from first chunk
        if (columns === null && chunk.columns) {
          columns = chunk.columns
        }

        // Aggregate data rows (NDJSON uses "rows", regular JSON uses "data")
        if (chunk.rows) {
          allData.push(...chunk.rows)
          totalRows += chunk.rows.length
        } else if (chunk.data) {
          allData.push(...chunk.data)
          totalRows += chunk.data.length
        }

        // Track execution time (use max from all chunks)
        if (chunk.execution_time_ms) {
          executionTimeMs = Math.max(executionTimeMs, chunk.execution_time_ms)
        }
      } catch (error) {
        throw new Error(`Failed to parse NDJSON line: ${error}`)
      }
    }

    // Return aggregated result
    return {
      data: allData,
      columns: columns || [],
      row_count: totalRows,
      execution_time_ms: executionTimeMs,
      graph_id: graphId,
      timestamp: new Date().toISOString(),
    }
  }

  private async *streamQueryResults(
    operationId: string,
    options: QueryOptions
  ): AsyncIterableIterator<any> {
    const buffer: any[] = []
    let completed = false
    let error: Error | null = null

    // Set up SSE connection
    this.sseClient = new SSEClient(this.config)
    await this.sseClient.connect(operationId)

    // Listen for data chunks
    this.sseClient.on(EventType.DATA_CHUNK, (data) => {
      if (Array.isArray(data.rows)) {
        buffer.push(...data.rows)
      } else if (data.data) {
        buffer.push(...data.data)
      }
    })

    // Listen for queue updates
    this.sseClient.on(EventType.QUEUE_UPDATE, (data) => {
      options.onQueueUpdate?.(data.position, data.estimated_wait_seconds)
    })

    // Listen for progress
    this.sseClient.on(EventType.OPERATION_PROGRESS, (data) => {
      options.onProgress?.(data.message)
    })

    // Listen for completion
    this.sseClient.on(EventType.OPERATION_COMPLETED, (data) => {
      if (data.result?.data) {
        buffer.push(...data.result.data)
      }
      completed = true
    })

    // Listen for errors
    this.sseClient.on(EventType.OPERATION_ERROR, (err) => {
      error = new Error(err.message || err.error)
      completed = true
    })

    // Yield buffered results
    while (!completed || buffer.length > 0) {
      if (error) throw error

      if (buffer.length > 0) {
        const chunk = buffer.splice(0, options.chunkSize || 100)
        for (const item of chunk) {
          yield item
        }
      } else if (!completed) {
        // Wait for more data
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    this.sseClient.close()
    this.sseClient = undefined
  }

  private async waitForQueryCompletion(
    operationId: string,
    options: QueryOptions
  ): Promise<QueryResult> {
    return new Promise((resolve, reject) => {
      const sseClient = new SSEClient(this.config)

      sseClient
        .connect(operationId)
        .then(() => {
          let result: QueryResult | null = null

          // Listen for queue updates
          sseClient.on(EventType.QUEUE_UPDATE, (data) => {
            options.onQueueUpdate?.(data.position, data.estimated_wait_seconds)
          })

          // Listen for progress
          sseClient.on(EventType.OPERATION_PROGRESS, (data) => {
            options.onProgress?.(data.message)
          })

          sseClient.on(EventType.OPERATION_COMPLETED, (data) => {
            const queryResult = data.result || data
            result = {
              data: queryResult.data || [],
              columns: queryResult.columns || [],
              row_count: queryResult.row_count || 0,
              execution_time_ms: queryResult.execution_time_ms || 0,
              graph_id: queryResult.graph_id,
              timestamp: queryResult.timestamp || new Date().toISOString(),
            }
            sseClient.close()
            resolve(result)
          })

          sseClient.on(EventType.OPERATION_ERROR, (error) => {
            sseClient.close()
            reject(new Error(error.message || error.error))
          })

          sseClient.on(EventType.OPERATION_CANCELLED, () => {
            sseClient.close()
            reject(new Error('Query cancelled'))
          })
        })
        .catch(reject)
    })
  }

  // Convenience method for simple queries
  async query(
    graphId: string,
    cypher: string,
    parameters?: Record<string, any>
  ): Promise<QueryResult> {
    return this.executeQuery(
      graphId,
      { query: cypher, parameters },
      { mode: 'auto' }
    ) as Promise<QueryResult>
  }

  // Streaming query for large results
  async *streamQuery(
    graphId: string,
    cypher: string,
    parameters?: Record<string, any>,
    chunkSize: number = 1000
  ): AsyncIterableIterator<any> {
    const result = await this.executeQuery(
      graphId,
      { query: cypher, parameters },
      { mode: 'stream', chunkSize }
    )

    if (Symbol.asyncIterator in (result as any)) {
      yield* result as AsyncIterableIterator<any>
    } else {
      // If not streaming, yield all results at once
      yield* (result as QueryResult).data
    }
  }

  // Cancel any active SSE connections
  close(): void {
    if (this.sseClient) {
      this.sseClient.close()
      this.sseClient = undefined
    }
  }
}

/**
 * Error thrown when query is queued and maxWait is 0
 */
export class QueuedQueryError extends Error {
  constructor(public queueInfo: QueuedQueryResponse) {
    super('Query was queued')
    this.name = 'QueuedQueryError'
  }
}
