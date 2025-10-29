'use client'

/**
 * Graph Management Client
 * Provides high-level graph management operations with automatic operation monitoring
 */

import { createGraph, getGraphs, getOperationStatus } from '../sdk/sdk.gen'
import type { GraphMetadata, InitialEntityData } from '../sdk/types.gen'
import { OperationClient } from './OperationClient'

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
   * @param metadata - Graph metadata (name, description, etc.)
   * @param initialEntity - Optional initial entity to create
   * @param options - Additional options including:
   *   - createEntity: Whether to create the entity node and upload initial data.
   *                   Only applies when initialEntity is provided. Set to false to
   *                   create graph without populating entity data (useful for file-based ingestion).
   *                   Defaults to true.
   *   - timeout: Maximum time to wait in milliseconds (default: 60000)
   *   - pollInterval: Time between status checks in milliseconds (default: 2000)
   *   - onProgress: Callback for progress updates
   * @returns The graph ID when creation completes
   */
  async createGraphAndWait(
    metadata: GraphMetadataInput,
    initialEntity?: InitialEntityInput,
    options: CreateGraphOptions = {}
  ): Promise<string> {
    const { createEntity = true, timeout = 60000, pollInterval = 2000, onProgress } = options

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
    if (responseData?.operation_id) {
      const operationId = responseData.operation_id

      if (onProgress) {
        onProgress(`Graph creation queued (operation: ${operationId})`)
      }

      // Poll operation status
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
            throw new Error('Operation completed but no graph_id in result')
          }
        } else if (status === 'failed') {
          const error = statusData?.error || statusData?.message || 'Unknown error'
          throw new Error(`Graph creation failed: ${error}`)
        }
      }

      throw new Error(`Graph creation timed out after ${timeout}ms`)
    }

    throw new Error('No graph_id or operation_id in response')
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
