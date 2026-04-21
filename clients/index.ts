/**
 * RoboSystems SDK Clients
 * High-level clients with SSE support for the RoboSystems API
 */

import { client } from '../sdk/client.gen'
import { AgentClient } from './AgentClient'
import { extractTokenFromSDKClient, getSDKClientConfig } from './config'
import type { TokenProvider } from './graphql/client'
import { InvestorClient } from './InvestorClient'
import { LedgerClient } from './LedgerClient'
import { LibraryClient } from './LibraryClient'
import { OperationClient } from './OperationClient'
import { QueryClient } from './QueryClient'
import { SSEClient } from './SSEClient'

// Re-export the `TokenProvider` type so consumers who want to type
// their own callback (`const provider: TokenProvider = () => …`) can
// pull it from the package root instead of reaching into the
// internal `./graphql/client` module path.
export type { TokenProvider } from './graphql/client'

export interface RoboSystemsClientConfig {
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

export class RoboSystemsClients {
  public readonly query: QueryClient
  public readonly agent: AgentClient
  public readonly operations: OperationClient
  public readonly ledger: LedgerClient
  public readonly investor: InvestorClient
  public readonly library: LibraryClient
  /**
   * @deprecated Use `ledger` instead — reports and publish lists are
   * now part of the LedgerClient.
   */
  public readonly reports: LedgerClient
  private config: ResolvedConfig

  constructor(config: RoboSystemsClientConfig = {}) {
    // Get base URL from SDK client config or use provided/default
    const sdkConfig = client.getConfig()

    // Extract JWT token using centralized logic
    const token = config.token || extractTokenFromSDKClient()

    // `tokenProvider` falls back to the global SDK clients config so
    // apps can wire refresh once via `setSDKClientConfig({ tokenProvider })`
    // and have the lazy default singleton pick it up automatically.
    const tokenProvider = config.tokenProvider || getSDKClientConfig().tokenProvider

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

    // LedgerClient / InvestorClient use GraphQL internally, so they
    // get the tokenProvider — REST-only clients do not.
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

    // Library uses GraphQL and accepts graphId per-call — pass either
    // the `"library"` sentinel (canonical) or any tenant graph_id
    // (tenant library copy + CoA).
    this.library = new LibraryClient({
      baseUrl: this.config.baseUrl,
      credentials: this.config.credentials,
      token: this.config.token,
      tokenProvider: this.config.tokenProvider,
      headers: this.config.headers,
    })

    // Reports consolidated into LedgerClient — alias for backward compat
    this.reports = this.ledger
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
export * from './AgentClient'
export * from './config'
export * from './InvestorClient'
export * from './LedgerClient'
export * from './LibraryClient'
export * from './OperationClient'
export * from './QueryClient'
export * from './SSEClient'

export {
  AgentClient,
  InvestorClient,
  LedgerClient,
  LibraryClient,
  OperationClient,
  QueryClient,
  SSEClient,
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
let _clients: RoboSystemsClients | null = null

function getClients(): RoboSystemsClients {
  if (!_clients) {
    _clients = new RoboSystemsClients()
  }
  return _clients
}

export const clients = {
  get query() {
    return getClients().query
  },
  get agent() {
    return getClients().agent
  },
  get operations() {
    return getClients().operations
  },
  get ledger() {
    return getClients().ledger
  },
  get investor() {
    return getClients().investor
  },
  get library() {
    return getClients().library
  },
  /** @deprecated Use `ledger` instead */
  get reports() {
    return getClients().ledger
  },
  monitorOperation: (operationId: string, onProgress?: (progress: any) => void) =>
    getClients().monitorOperation(operationId, onProgress),
  createSSEClient: () => getClients().createSSEClient(),
  close: () => getClients().close(),
}

// Export convenience functions that use the default instance
export const monitorOperation = (operationId: string, onProgress?: (progress: any) => void) =>
  getClients().monitorOperation(operationId, onProgress)

export const executeQuery = (graphId: string, query: string, parameters?: Record<string, any>) =>
  getClients().query.query(graphId, query, parameters)

export const streamQuery = (
  graphId: string,
  query: string,
  parameters?: Record<string, any>,
  chunkSize?: number
) => getClients().query.streamQuery(graphId, query, parameters, chunkSize)

export const agentQuery = (graphId: string, message: string, context?: Record<string, any>) =>
  getClients().agent.query(graphId, message, context)

export const analyzeFinancials = (graphId: string, message: string) =>
  getClients().agent.analyzeFinancials(graphId, message)
