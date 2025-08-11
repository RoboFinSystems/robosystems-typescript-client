/**
 * RoboSystems SDK Extensions
 * Enhanced clients with SSE support for the RoboSystems API
 */

import { client } from '../sdk/client.gen'
import { OperationClient } from './OperationClient'
import { QueryClient } from './QueryClient'
import { SSEClient } from './SSEClient'

export interface RoboSystemsExtensionConfig {
  baseUrl?: string
  credentials?: 'include' | 'same-origin' | 'omit'
  maxRetries?: number
  retryDelay?: number
}

export class RoboSystemsExtensions {
  public readonly query: QueryClient
  public readonly operations: OperationClient
  private config: Required<RoboSystemsExtensionConfig>

  constructor(config: RoboSystemsExtensionConfig = {}) {
    // Get base URL from SDK client config or use provided/default
    const sdkConfig = client.getConfig()

    this.config = {
      baseUrl: config.baseUrl || sdkConfig.baseUrl || 'http://localhost:8000',
      credentials: config.credentials || 'include',
      maxRetries: config.maxRetries || 5,
      retryDelay: config.retryDelay || 1000,
    }

    this.query = new QueryClient({
      baseUrl: this.config.baseUrl,
      credentials: this.config.credentials,
    })

    this.operations = new OperationClient({
      baseUrl: this.config.baseUrl,
      credentials: this.config.credentials,
    })
  }

  /**
   * Convenience method to monitor any operation
   */
  async monitorOperation(
    operationId: string,
    onProgress?: (progress: any) => void
  ): Promise<any> {
    return this.operations.monitorOperation(operationId, { onProgress })
  }

  /**
   * Create custom SSE client for advanced use cases
   */
  createSSEClient(): SSEClient {
    return new SSEClient({
      baseUrl: this.config.baseUrl,
      credentials: this.config.credentials,
      maxRetries: this.config.maxRetries,
      retryDelay: this.config.retryDelay,
    })
  }

  /**
   * Clean up all active connections
   */
  close(): void {
    this.query.close()
    this.operations.closeAll()
  }
}

// Export all types and classes
export * from './OperationClient'
export * from './QueryClient'
export * from './SSEClient'
export { OperationClient, QueryClient, SSEClient }

// Export React hooks
export {
  useMultipleOperations,
  useOperation,
  useQuery,
  useSDKClients,
  useStreamingQuery,
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
  get operations() {
    return getExtensions().operations
  },
  monitorOperation: (
    operationId: string,
    onProgress?: (progress: any) => void
  ) => getExtensions().monitorOperation(operationId, onProgress),
  createSSEClient: () => getExtensions().createSSEClient(),
  close: () => getExtensions().close(),
}

// Export convenience functions that use the default instance
export const monitorOperation = (
  operationId: string,
  onProgress?: (progress: any) => void
) => getExtensions().monitorOperation(operationId, onProgress)

export const executeQuery = (
  graphId: string,
  query: string,
  parameters?: Record<string, any>
) => getExtensions().query.query(graphId, query, parameters)

export const streamQuery = (
  graphId: string,
  query: string,
  parameters?: Record<string, any>,
  chunkSize?: number
) => getExtensions().query.streamQuery(graphId, query, parameters, chunkSize)
