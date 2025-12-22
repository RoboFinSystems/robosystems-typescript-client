'use client'

/**
 * Materialization Client for RoboSystems API
 *
 * Manages graph materialization from DuckDB staging tables.
 * Submits materialization jobs to Dagster and monitors progress via SSE.
 */

import { getMaterializationStatus, materializeGraph } from '../sdk/sdk.gen'
import type { MaterializeRequest } from '../sdk/types.gen'
import { OperationClient, type OperationResult } from './OperationClient'

export interface MaterializationOptions {
  ignoreErrors?: boolean
  rebuild?: boolean
  force?: boolean
  timeout?: number // Default 10 minutes
  onProgress?: (message: string) => void
}

export interface MaterializationResult {
  status: string
  wasStale: boolean
  staleReason?: string
  tablesMaterialized: string[]
  totalRows: number
  executionTimeMs: number
  message: string
  success: boolean
  error?: string
}

export interface MaterializationStatus {
  graphId: string
  isStale: boolean
  staleReason?: string
  staleSince?: string
  lastMaterializedAt?: string
  materializationCount: number
  hoursSinceMaterialization?: number
  message: string
}

export class MaterializationClient {
  private config: {
    baseUrl: string
    credentials?: 'include' | 'same-origin' | 'omit'
    headers?: Record<string, string>
    token?: string
  }
  private operationClient: OperationClient

  constructor(config: {
    baseUrl: string
    credentials?: 'include' | 'same-origin' | 'omit'
    headers?: Record<string, string>
    token?: string
  }) {
    this.config = config
    this.operationClient = new OperationClient(config)
  }

  /**
   * Materialize graph from DuckDB staging tables
   *
   * Submits a materialization job to Dagster and monitors progress via SSE.
   * The operation runs asynchronously on the server but this method waits
   * for completion and returns the final result.
   */
  async materialize(
    graphId: string,
    options: MaterializationOptions = {}
  ): Promise<MaterializationResult> {
    try {
      options.onProgress?.('Submitting materialization job...')

      const request: MaterializeRequest = {
        ignore_errors: options.ignoreErrors ?? true,
        rebuild: options.rebuild ?? false,
        force: options.force ?? false,
      }

      const response = await materializeGraph({
        path: { graph_id: graphId },
        body: request,
      })

      if (response.error || !response.data) {
        return {
          status: 'failed',
          wasStale: false,
          tablesMaterialized: [],
          totalRows: 0,
          executionTimeMs: 0,
          message: `Failed to materialize graph: ${response.error}`,
          success: false,
          error: `Failed to materialize graph: ${response.error}`,
        }
      }

      const queuedResponse = response.data as { operation_id: string; message: string }
      const operationId = queuedResponse.operation_id

      options.onProgress?.(`Materialization queued (operation: ${operationId})`)

      // Monitor the operation via SSE until completion
      const opResult = await this.operationClient.monitorOperation(operationId, {
        timeout: (options.timeout ?? 600) * 1000, // Convert to milliseconds, 10 minute default
        onProgress: (progress) => {
          if (options.onProgress) {
            let msg = progress.message
            if (progress.progressPercent !== undefined) {
              msg += ` (${progress.progressPercent.toFixed(0)}%)`
            }
            options.onProgress(msg)
          }
        },
      })

      // Convert operation result to materialization result
      return this.convertOperationResult(opResult, options)
    } catch (error) {
      return {
        status: 'failed',
        wasStale: false,
        tablesMaterialized: [],
        totalRows: 0,
        executionTimeMs: 0,
        message: error instanceof Error ? error.message : String(error),
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Convert SSE operation result to MaterializationResult
   */
  private convertOperationResult(
    opResult: OperationResult,
    options: MaterializationOptions
  ): MaterializationResult {
    if (opResult.success) {
      // Extract details from SSE completion event result
      const sseResult = opResult.result || {}

      const tables = sseResult.tables_materialized || []
      const rows = sseResult.total_rows || 0
      const timeMs = sseResult.execution_time_ms || 0

      options.onProgress?.(
        `✅ Materialization complete: ${tables.length} tables, ` +
          `${rows.toLocaleString()} rows in ${timeMs.toFixed(2)}ms`
      )

      return {
        status: 'success',
        wasStale: sseResult.was_stale || false,
        staleReason: sseResult.stale_reason,
        tablesMaterialized: tables,
        totalRows: rows,
        executionTimeMs: timeMs,
        message: sseResult.message || 'Graph materialized successfully',
        success: true,
      }
    } else {
      // Operation failed or was cancelled
      return {
        status: 'failed',
        wasStale: false,
        tablesMaterialized: [],
        totalRows: 0,
        executionTimeMs: 0,
        message: opResult.error || 'Operation failed',
        success: false,
        error: opResult.error,
      }
    }
  }

  /**
   * Get current materialization status for the graph
   *
   * Shows whether the graph is stale (DuckDB has changes not yet in graph database),
   * when it was last materialized, and how long since last materialization.
   */
  async status(graphId: string): Promise<MaterializationStatus | null> {
    try {
      const response = await getMaterializationStatus({
        path: { graph_id: graphId },
      })

      if (response.error || !response.data) {
        console.error('Failed to get materialization status:', response.error)
        return null
      }

      const status = response.data as any

      return {
        graphId: status.graph_id,
        isStale: status.is_stale,
        staleReason: status.stale_reason,
        staleSince: status.stale_since,
        lastMaterializedAt: status.last_materialized_at,
        materializationCount: status.materialization_count || 0,
        hoursSinceMaterialization: status.hours_since_materialization,
        message: status.message,
      }
    } catch (error) {
      console.error('Failed to get materialization status:', error)
      return null
    }
  }

  /**
   * Close any active SSE connections
   */
  close(): void {
    this.operationClient.closeAll()
  }
}
