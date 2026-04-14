/**
 * RoboSystems SDK Extensions
 * Enhanced clients with SSE support for the RoboSystems API
 */

import { client } from '../sdk/client.gen'
import { extractTokenFromSDKClient, getSDKExtensionsConfig } from './config'
import type { TokenProvider } from './graphql/client'
import { OperationClient } from './OperationClient'
import { QueryClient } from './QueryClient'
import { AgentClient } from './AgentClient'
import { SSEClient } from './SSEClient'
import { InvestorClient } from './InvestorClient'
import { LedgerClient } from './LedgerClient'
import { ReportClient } from './ReportClient'

// Re-export the `TokenProvider` type so consumers who want to type
// their own callback (`const provider: TokenProvider = () => …`) can
// pull it from the package root instead of reaching into the
// internal `./graphql/client` module path.
export type { TokenProvider } from './graphql/client'

export interface RoboSystemsExtensionConfig {
  baseUrl?: string
  credentials?: 'include' | 'same-origin' | 'omit'
  /**
   * Static credential captured at construction time. Fine for
   * long-lived API keys; use `tokenProvider` instead when the JWT
   * can rotate (browser login flows).
   */
  token?: string
  /**
   * Dynamic credential callback invoked on every GraphQL request.
   * When set, JWT refreshes are picked up automatically — no need
   * to rebuild or clear cached clients after a refresh.
   */
  tokenProvider?: TokenProvider
  headers?: Record<string, string>
  maxRetries?: number
  retryDelay?: number
}

// Properly typed configuration interface
interface ResolvedConfig {
  baseUrl: string
  credentials: 'include' | 'same-origin' | 'omit'
  token?: string
  tokenProvider?: TokenProvider
  headers?: Record<string, string>
  maxRetries: number
  retryDelay: number
}

export class RoboSystemsExtensions {
  public readonly query: QueryClient
  public readonly agent: AgentClient
  public readonly operations: OperationClient
  public readonly ledger: LedgerClient
  public readonly investor: InvestorClient
  public readonly reports: ReportClient
  private config: ResolvedConfig

  constructor(config: RoboSystemsExtensionConfig = {}) {
    // Get base URL from SDK client config or use provided/default
    const sdkConfig = client.getConfig()

    // Extract JWT token using centralized logic
    const token = config.token || extractTokenFromSDKClient()

    // `tokenProvider` falls back to the global SDK extensions config so
    // apps can wire refresh once via `setSDKExtensionsConfig({ tokenProvider })`
    // and have the lazy default singleton pick it up automatically.
    const tokenProvider = config.tokenProvider || getSDKExtensionsConfig().tokenProvider

    this.config = {
      baseUrl: config.baseUrl || sdkConfig.baseUrl || 'http://localhost:8000',
      credentials: config.credentials || 'include',
      token,
      tokenProvider,
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

    // LedgerClient / InvestorClient / ReportClient all use GraphQL
    // internally, so they get the tokenProvider — REST-only clients
    // (QueryClient / AgentClient / OperationClient / SSEClient) do
    // not, because their refresh story lives in the main SDK client
    // wrapper, not here.
    this.ledger = new LedgerClient({
      baseUrl: this.config.baseUrl,
      credentials: this.config.credentials,
      token: this.config.token,
      tokenProvider: this.config.tokenProvider,
      headers: this.config.headers,
    })

    this.investor = new InvestorClient({
      baseUrl: this.config.baseUrl,
      credentials: this.config.credentials,
      token: this.config.token,
      tokenProvider: this.config.tokenProvider,
      headers: this.config.headers,
    })

    this.reports = new ReportClient({
      baseUrl: this.config.baseUrl,
      credentials: this.config.credentials,
      token: this.config.token,
      tokenProvider: this.config.tokenProvider,
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
  }
}

// Export all types and classes
export * from './OperationClient'
export * from './QueryClient'
export * from './AgentClient'
export * from './SSEClient'
export * from './LedgerClient'
export * from './InvestorClient'
export * from './ReportClient'
export * from './config'

export {
  OperationClient,
  QueryClient,
  AgentClient,
  SSEClient,
  LedgerClient,
  InvestorClient,
  ReportClient,
}

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
  get agent() {
    return getExtensions().agent
  },
  get operations() {
    return getExtensions().operations
  },
  get ledger() {
    return getExtensions().ledger
  },
  get investor() {
    return getExtensions().investor
  },
  get reports() {
    return getExtensions().reports
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
