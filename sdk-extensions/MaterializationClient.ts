'use client'

/**
 * Materialization Client for RoboSystems API
 *
 * Manages graph materialization from DuckDB staging tables.
 * Treats the graph database as a materialized view of the mutable DuckDB data lake.
 */

import { getMaterializationStatus, materializeGraph } from '../sdk.gen'
import type { MaterializeRequest } from '../types.gen'

export interface MaterializationOptions {
  ignoreErrors?: boolean
  rebuild?: boolean
  force?: boolean
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

  constructor(config: {
    baseUrl: string
    credentials?: 'include' | 'same-origin' | 'omit'
    headers?: Record<string, string>
    token?: string
  }) {
    this.config = config
  }

  /**
   * Materialize graph from DuckDB staging tables
   *
   * Rebuilds the complete graph database from the current state of DuckDB
   * staging tables. Automatically discovers all tables, materializes them in
   * the correct order (nodes before relationships), and clears the staleness flag.
   */
  async materialize(
    graphId: string,
    options: MaterializationOptions = {}
  ): Promise<MaterializationResult> {
    try {
      options.onProgress?.('Starting graph materialization...')

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

      const result = response.data as any

      options.onProgress?.(
        `✅ Materialization complete: ${result.tables_materialized?.length || 0} tables, ` +
          `${result.total_rows?.toLocaleString() || 0} rows in ${result.execution_time_ms?.toFixed(2) || 0}ms`
      )

      return {
        status: result.status,
        wasStale: result.was_stale,
        staleReason: result.stale_reason,
        tablesMaterialized: result.tables_materialized || [],
        totalRows: result.total_rows || 0,
        executionTimeMs: result.execution_time_ms || 0,
        message: result.message || 'Materialization complete',
        success: true,
      }
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
}
