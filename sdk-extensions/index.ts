/**
 * RoboSystems SDK Extensions
 * Enhanced clients with SSE support for the RoboSystems API
 */

import { client } from '../sdk/client.gen'
import { extractTokenFromSDKClient } from './config'
import { OperationClient } from './OperationClient'
import { QueryClient } from './QueryClient'
import { AgentClient } from './AgentClient'
import { SSEClient } from './SSEClient'
import { TableIngestClient } from './TableIngestClient'
import { GraphClient } from './GraphClient'

export interface RoboSystemsExtensionConfig {
  baseUrl?: string
  credentials?: 'include' | 'same-origin' | 'omit'
  token?: string // JWT token for authentication
  headers?: Record<string, string>
  maxRetries?: number
  retryDelay?: number
}

// Properly typed configuration interface
interface ResolvedConfig {
  baseUrl: string
  credentials: 'include' | 'same-origin' | 'omit'
  token?: string
  headers?: Record<string, string>
  maxRetries: number
  retryDelay: number
}

export class RoboSystemsExtensions {
  public readonly query: QueryClient
  public readonly agent: AgentClient
  public readonly operations: OperationClient
  public readonly tables: TableIngestClient
  public readonly graphs: GraphClient
  private config: ResolvedConfig

  constructor(config: RoboSystemsExtensionConfig = {}) {
    // Get base URL from SDK client config or use provided/default
    const sdkConfig = client.getConfig()

    // Extract JWT token using centralized logic
    const token = config.token || extractTokenFromSDKClient()

    this.config = {
      baseUrl: config.baseUrl || sdkConfig.baseUrl || 'http://localhost:8000',
      credentials: config.credentials || 'include',
      token,
      headers: config.headers,
      maxRetries: config.maxRetries || 5,
      retryDelay: config.retryDelay || 1000,
    }

    this.query = new QueryClient({
      baseUrl: this.config.baseUrl,
      credentials: this.config.credentials,
      token: this.config.token,
      headers: this.config.headers,
    })

    this.agent = new AgentClient({
      baseUrl: this.config.baseUrl,
      credentials: this.config.credentials,
      token: this.config.token,
      headers: this.config.headers,
    })

    this.operations = new OperationClient({
      baseUrl: this.config.baseUrl,
      credentials: this.config.credentials,
      token: this.config.token,
      maxRetries: this.config.maxRetries,
      retryDelay: this.config.retryDelay,
    })

    this.tables = new TableIngestClient({
      baseUrl: this.config.baseUrl,
      credentials: this.config.credentials,
      token: this.config.token,
      headers: this.config.headers,
    })

    this.graphs = new GraphClient({
      baseUrl: this.config.baseUrl,
      credentials: this.config.credentials,
      token: this.config.token,
      headers: this.config.headers,
    })
  }

  /**
   * Convenience method to monitor any operation
   */
  async monitorOperation(operationId: string, onProgress?: (progress: any) => void): Promise<any> {
    return this.operations.monitorOperation(operationId, { onProgress })
  }

  /**
   * Create custom SSE client for advanced use cases
   */
  createSSEClient(): SSEClient {
    return new SSEClient({
      baseUrl: this.config.baseUrl,
      credentials: this.config.credentials,
      token: this.config.token,
      headers: this.config.headers,
      maxRetries: this.config.maxRetries,
      retryDelay: this.config.retryDelay,
    })
  }

  /**
   * Clean up all active connections
   */
  close(): void {
    this.query.close()
    this.agent.close()
    this.operations.closeAll()
    this.graphs.close()
  }
}

// Export all types and classes
export * from './OperationClient'
export * from './QueryClient'
export * from './AgentClient'
export * from './SSEClient'
export * from './TableIngestClient'
export * from './GraphClient'
export * from './config'
export { OperationClient, QueryClient, AgentClient, SSEClient, TableIngestClient, GraphClient }

// Export React hooks
export {
  useMultipleOperations,
  useOperation,
  useQuery,
  useSDKClients,
  useStreamingQuery,
  useTableUpload,
} from './hooks'

// Lazy initialization of default instance
let _extensions: RoboSystemsExtensions | null = null

function getExtensions(): RoboSystemsExtensions {
  if (!_extensions) {
    _extensions = new RoboSystemsExtensions()
  }
  return _extensions
}

export const extensions = {
  get query() {
    return getExtensions().query
  },
  get agent() {
    return getExtensions().agent
  },
  get operations() {
    return getExtensions().operations
  },
  get graphs() {
    return getExtensions().graphs
  },
  monitorOperation: (operationId: string, onProgress?: (progress: any) => void) =>
    getExtensions().monitorOperation(operationId, onProgress),
  createSSEClient: () => getExtensions().createSSEClient(),
  close: () => getExtensions().close(),
}

// Export convenience functions that use the default instance
export const monitorOperation = (operationId: string, onProgress?: (progress: any) => void) =>
  getExtensions().monitorOperation(operationId, onProgress)

export const executeQuery = (graphId: string, query: string, parameters?: Record<string, any>) =>
  getExtensions().query.query(graphId, query, parameters)

export const streamQuery = (
  graphId: string,
  query: string,
  parameters?: Record<string, any>,
  chunkSize?: number
) => getExtensions().query.streamQuery(graphId, query, parameters, chunkSize)

export const agentQuery = (graphId: string, message: string, context?: Record<string, any>) =>
  getExtensions().agent.query(graphId, message, context)

export const analyzeFinancials = (graphId: string, message: string) =>
  getExtensions().agent.analyzeFinancials(graphId, message)
