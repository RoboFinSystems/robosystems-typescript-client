'use client'

/**
 * Graph Management Client
 * Provides high-level graph management operations with automatic operation monitoring.
 * Supports SSE (Server-Sent Events) for real-time updates with polling fallback.
 */

import { createGraph, getGraphs, getOperationStatus } from '../sdk/sdk.gen'
import type { GraphMetadata, InitialEntityData } from '../sdk/types.gen'
import { OperationClient } from './OperationClient'

/**
 * Error thrown when a graph operation fails (as reported by the server)
 * This is distinct from connection/SSE errors
 */
export class GraphOperationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GraphOperationError'
  }
}

// API Response Types
interface GraphCreateResponse {
  graph_id?: string
  operation_id?: string
}

interface OperationStatusResponse {
  status?: 'pending' | 'completed' | 'failed' | string
  result?: {
    graph_id?: string
  }
  error?: string
  message?: string
}

interface GraphApiData {
  graph_id?: string
  id?: string
  graph_name?: string
  name?: string
  description?: string
  schema_extensions?: string[]
  tags?: string[]
  created_at?: string
  status?: string
}

interface GetGraphsResponse {
  graphs?: GraphApiData[]
}

export interface GraphMetadataInput {
  graphName: string
  description?: string
  schemaExtensions?: string[]
  tags?: string[]
}

export interface InitialEntityInput {
  name: string
  uri: string
  category?: string
  sic?: string
  sicDescription?: string
}

export interface GraphInfo {
  graphId: string
  graphName: string
  description?: string
  schemaExtensions?: string[]
  tags?: string[]
  createdAt?: string
  status?: string
}

export interface CreateGraphOptions {
  createEntity?: boolean
  timeout?: number
  pollInterval?: number
  onProgress?: (message: string) => void
  useSSE?: boolean
}

export class GraphClient {
  private operationClient: OperationClient
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
    this.operationClient = new OperationClient(config)
  }

  /**
   * Create a graph and wait for completion
   *
   * Uses SSE (Server-Sent Events) for real-time progress updates with
   * automatic fallback to polling if SSE connection fails.
   *
   * @param metadata - Graph metadata (name, description, etc.)
   * @param initialEntity - Optional initial entity to create
   * @param options - Additional options including:
   *   - createEntity: Whether to create the entity node and upload initial data.
   *                   Only applies when initialEntity is provided. Set to false to
   *                   create graph without populating entity data (useful for file-based ingestion).
   *                   Defaults to true.
   *   - timeout: Maximum time to wait in milliseconds (default: 60000)
   *   - pollInterval: Time between status checks in milliseconds (default: 2000, for polling fallback)
   *   - onProgress: Callback for progress updates
   *   - useSSE: Whether to try SSE first (default: true). Falls back to polling on failure.
   * @returns The graph ID when creation completes
   */
  async createGraphAndWait(
    metadata: GraphMetadataInput,
    initialEntity?: InitialEntityInput,
    options: CreateGraphOptions = {}
  ): Promise<string> {
    const {
      createEntity = true,
      timeout = 60000,
      pollInterval = 2000,
      onProgress,
      useSSE = true,
    } = options

    if (!this.config.token) {
      throw new Error('No API key provided. Set token in config.')
    }

    // Build initial entity if provided
    let initialEntityData: InitialEntityData | undefined
    if (initialEntity) {
      initialEntityData = {
        name: initialEntity.name,
        uri: initialEntity.uri,
        category: initialEntity.category,
        sic: initialEntity.sic,
        sic_description: initialEntity.sicDescription,
      }
    }

    // Build API metadata
    const apiMetadata: GraphMetadata = {
      graph_name: metadata.graphName,
      description: metadata.description,
      schema_extensions: metadata.schemaExtensions || [],
      tags: metadata.tags || [],
    }

    if (onProgress) {
      onProgress(`Creating graph: ${metadata.graphName}`)
    }

    // Create graph request - SDK expects options format, not data format
    const response = await createGraph({
      body: {
        metadata: apiMetadata,
        initial_entity: initialEntityData || null,
        create_entity: createEntity,
      },
    })

    // Check if we got immediate graph_id
    const responseData = response.data as GraphCreateResponse
    if (responseData?.graph_id) {
      if (onProgress) {
        onProgress(`Graph created: ${responseData.graph_id}`)
      }
      return responseData.graph_id
    }

    // Otherwise, we have an operation_id to monitor
    if (!responseData?.operation_id) {
      throw new Error('No graph_id or operation_id in response')
    }

    const operationId = responseData.operation_id

    if (onProgress) {
      onProgress(`Graph creation queued (operation: ${operationId})`)
    }

    // Try SSE first, fall back to polling
    if (useSSE) {
      try {
        return await this.waitWithSSE(operationId, timeout, onProgress)
      } catch (error) {
        // Only fall back to polling for SSE connection failures
        // If it's a GraphOperationError, the operation actually failed - don't retry with polling
        if (error instanceof GraphOperationError) {
          throw error
        }
        // SSE connection failed, fall back to polling
        if (onProgress) {
          onProgress('SSE unavailable, using polling...')
        }
      }
    }

    // Fallback to polling
    return await this.waitWithPolling(operationId, timeout, pollInterval, onProgress)
  }

  /**
   * Wait for operation completion using SSE stream
   */
  private async waitWithSSE(
    operationId: string,
    timeout: number,
    onProgress?: (message: string) => void
  ): Promise<string> {
    const result = await this.operationClient.monitorOperation<{ graph_id?: string }>(operationId, {
      timeout,
      onProgress: (progress) => {
        if (onProgress) {
          if (progress.progressPercent !== undefined) {
            onProgress(`${progress.message} (${Math.round(progress.progressPercent)}%)`)
          } else {
            onProgress(progress.message)
          }
        }
      },
    })

    if (!result.success) {
      throw new GraphOperationError(result.error || 'Graph creation failed')
    }

    const graphId = result.result?.graph_id
    if (!graphId) {
      throw new GraphOperationError('Operation completed but no graph_id in result')
    }

    if (onProgress) {
      onProgress(`Graph created: ${graphId}`)
    }

    return graphId
  }

  /**
   * Wait for operation completion using polling
   */
  private async waitWithPolling(
    operationId: string,
    timeout: number,
    pollInterval: number,
    onProgress?: (message: string) => void
  ): Promise<string> {
    const maxAttempts = Math.floor(timeout / pollInterval)

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval))

      const statusResponse = await getOperationStatus({
        path: { operation_id: operationId },
      })

      const statusData = statusResponse.data as OperationStatusResponse
      const status = statusData?.status

      if (onProgress) {
        onProgress(`Status: ${status} (attempt ${attempt + 1}/${maxAttempts})`)
      }

      if (status === 'completed') {
        const result = statusData?.result
        const graphId = result?.graph_id

        if (graphId) {
          if (onProgress) {
            onProgress(`Graph created: ${graphId}`)
          }
          return graphId
        } else {
          throw new GraphOperationError('Operation completed but no graph_id in result')
        }
      } else if (status === 'failed') {
        const error = statusData?.error || statusData?.message || 'Unknown error'
        throw new GraphOperationError(`Graph creation failed: ${error}`)
      }
    }

    throw new GraphOperationError(`Graph creation timed out after ${timeout}ms`)
  }

  /**
   * Get information about a graph
   */
  async getGraphInfo(graphId: string): Promise<GraphInfo> {
    if (!this.config.token) {
      throw new Error('No API key provided. Set token in config.')
    }

    // Use getGraphs to list all graphs and find the one we want
    // Note: This is a workaround since there's no dedicated getGraph endpoint yet
    const response = await getGraphs()
    const graphs = (response.data as GetGraphsResponse)?.graphs || []

    const graph = graphs.find((g) => g.graph_id === graphId || g.id === graphId)

    if (!graph) {
      throw new Error(`Graph not found: ${graphId}`)
    }

    return {
      graphId: graph.graph_id || graph.id,
      graphName: graph.graph_name || graph.name,
      description: graph.description,
      schemaExtensions: graph.schema_extensions,
      tags: graph.tags,
      createdAt: graph.created_at,
      status: graph.status,
    }
  }

  /**
   * List all graphs
   */
  async listGraphs(): Promise<GraphInfo[]> {
    if (!this.config.token) {
      throw new Error('No API key provided. Set token in config.')
    }

    const response = await getGraphs()
    const graphs = (response.data as GetGraphsResponse)?.graphs || []

    return graphs.map((graph) => ({
      graphId: graph.graph_id || graph.id,
      graphName: graph.graph_name || graph.name,
      description: graph.description,
      schemaExtensions: graph.schema_extensions,
      tags: graph.tags,
      createdAt: graph.created_at,
      status: graph.status,
    }))
  }

  /**
   * Delete a graph
   * Note: This will be implemented when the deleteGraph endpoint is available in the SDK
   */
  async deleteGraph(_graphId: string): Promise<void> {
    throw new Error('deleteGraph is not yet implemented - waiting for SDK endpoint to be generated')
    // TODO: Implement when deleteGraph endpoint is available
    // const response = await deleteGraph({ path: { graph_id: _graphId } })
    // if (response.status !== 200 && response.status !== 204) {
    //   throw new Error(`Failed to delete graph: ${response.status}`)
    // }
  }

  /**
   * Clean up resources
   */
  close(): void {
    this.operationClient.closeAll()
  }
}
