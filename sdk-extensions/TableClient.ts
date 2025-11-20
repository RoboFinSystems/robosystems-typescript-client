'use client'

/**
 * Table Client for RoboSystems API
 *
 * Manages DuckDB staging table operations.
 * Tables provide SQL-queryable staging layer before graph materialization.
 */

import { listTables, queryTables } from '../sdk.gen'
import type { TableListResponse, TableQueryRequest } from '../types.gen'

export interface TableInfo {
  tableName: string
  rowCount: number
  fileCount: number
  totalSizeBytes: number
  s3Location?: string | null
}

export interface TableQueryResult {
  columns: string[]
  rows: any[][]
  rowCount: number
  executionTimeMs: number
  success: boolean
  error?: string
}

export class TableClient {
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
   * List all DuckDB staging tables in a graph
   */
  async list(graphId: string): Promise<TableInfo[]> {
    try {
      const response = await listTables({
        path: { graph_id: graphId },
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
          s3Location: table.s3_location,
        })) || []
      )
    } catch (error) {
      console.error('Failed to list tables:', error)
      return []
    }
  }

  /**
   * Execute SQL query against DuckDB staging tables
   *
   * Example:
   *   const result = await client.tables.query(
   *     graphId,
   *     "SELECT * FROM Entity WHERE entity_type = 'CORPORATION'"
   *   )
   */
  async query(graphId: string, sqlQuery: string, limit?: number): Promise<TableQueryResult> {
    try {
      const finalQuery =
        limit !== undefined ? `${sqlQuery.replace(/;?\s*$/, '')} LIMIT ${limit}` : sqlQuery

      const request: TableQueryRequest = {
        sql: finalQuery,
      }

      const response = await queryTables({
        path: { graph_id: graphId },
        body: request,
      })

      if (response.error || !response.data) {
        return {
          columns: [],
          rows: [],
          rowCount: 0,
          executionTimeMs: 0,
          success: false,
          error: `Query failed: ${response.error}`,
        }
      }

      const result = response.data as any

      return {
        columns: result.columns || [],
        rows: result.rows || [],
        rowCount: result.rows?.length || 0,
        executionTimeMs: result.execution_time_ms || 0,
        success: true,
      }
    } catch (error) {
      return {
        columns: [],
        rows: [],
        rowCount: 0,
        executionTimeMs: 0,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }
}
