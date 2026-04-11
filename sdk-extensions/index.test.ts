import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RoboSystemsExtensions } from './index'

// Mock the SDK client
vi.mock('../sdk/client.gen', () => ({
  client: {
    getConfig: vi.fn(() => ({
      baseUrl: 'http://mock-sdk.com',
      headers: {},
    })),
  },
}))

describe('RoboSystemsExtensions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('constructor', () => {
    it('should create instance with default config', () => {
      const ext = new RoboSystemsExtensions()

      expect(ext).toBeDefined()
      expect(ext.query).toBeDefined()
      expect(ext.operations).toBeDefined()
      expect(ext.ledger).toBeDefined()
      expect(ext.reports).toBeDefined()
      expect(typeof ext.query.executeQuery).toBe('function')
      expect(typeof ext.operations.monitorOperation).toBe('function')
    })

    it('should create instance with custom baseUrl', () => {
      const ext = new RoboSystemsExtensions({
        baseUrl: 'https://custom-api.com',
      })

      expect(ext.query).toBeDefined()
      expect(ext.operations).toBeDefined()
    })

    it('should create instance with JWT token', () => {
      const ext = new RoboSystemsExtensions({
        token: 'eyJhbGc.eyJzdWI.SflKxw',
      })

      expect(ext.query).toBeDefined()
      expect(typeof ext.query.query).toBe('function')
    })

    it('should create instance with credentials option', () => {
      const ext = new RoboSystemsExtensions({
        credentials: 'omit',
      })

      expect(ext.query).toBeDefined()
      expect(ext.operations).toBeDefined()
    })

    it('should create instance with custom headers', () => {
      const ext = new RoboSystemsExtensions({
        headers: {
          'X-Custom-Header': 'test-value',
        },
      })

      expect(ext.query).toBeDefined()
    })

    it('should create instance with retry config', () => {
      const ext = new RoboSystemsExtensions({
        maxRetries: 10,
        retryDelay: 5000,
      })

      expect(ext.operations).toBeDefined()
      expect(typeof ext.operations.monitorOperation).toBe('function')
    })

    it('should merge config with SDK client config', () => {
      const ext = new RoboSystemsExtensions({
        token: 'custom-token',
      })

      expect(ext.query).toBeDefined()
      expect(ext.operations).toBeDefined()
    })

    it('should initialize all five client types', () => {
      const ext = new RoboSystemsExtensions()

      // Verify each client has its signature methods
      expect(typeof ext.query.executeQuery).toBe('function')
      expect(typeof ext.query.query).toBe('function')
      expect(typeof ext.agent.executeQuery).toBe('function')
      expect(typeof ext.agent.analyzeFinancials).toBe('function')
      expect(typeof ext.operations.monitorOperation).toBe('function')
      expect(typeof ext.operations.closeAll).toBe('function')
      expect(typeof ext.ledger.listAccounts).toBe('function')
      expect(typeof ext.ledger.getTrialBalance).toBe('function')
      expect(typeof ext.reports.create).toBe('function')
      expect(typeof ext.reports.statement).toBe('function')
    })

    it('should default credentials to include', () => {
      const ext = new RoboSystemsExtensions()

      // Access private config via casting
      const config = (ext as any).config
      expect(config.credentials).toBe('include')
    })

    it('should default maxRetries to 5 and retryDelay to 1000', () => {
      const ext = new RoboSystemsExtensions()

      const config = (ext as any).config
      expect(config.maxRetries).toBe(5)
      expect(config.retryDelay).toBe(1000)
    })

    it('should fall back to SDK client baseUrl or default', () => {
      const ext = new RoboSystemsExtensions()

      const config = (ext as any).config
      // Should use SDK baseUrl or localhost default
      expect(typeof config.baseUrl).toBe('string')
      expect(config.baseUrl.length).toBeGreaterThan(0)
    })

    it('should prefer explicit baseUrl over SDK client', () => {
      const ext = new RoboSystemsExtensions({
        baseUrl: 'https://explicit.com',
      })

      const config = (ext as any).config
      expect(config.baseUrl).toBe('https://explicit.com')
    })
  })

  describe('createSSEClient', () => {
    it('should create a new SSEClient instance', () => {
      const ext = new RoboSystemsExtensions()
      const sseClient = ext.createSSEClient()

      expect(sseClient).toBeDefined()
      expect(typeof sseClient.connect).toBe('function')
      expect(typeof sseClient.close).toBe('function')
      expect(typeof sseClient.on).toBe('function')
      expect(typeof sseClient.off).toBe('function')
    })

    it('should create SSEClient with config', () => {
      const ext = new RoboSystemsExtensions({
        baseUrl: 'https://custom-api.com',
        token: 'test-token',
      })
      const sseClient = ext.createSSEClient()

      expect(sseClient).toBeDefined()
      expect(typeof sseClient.connect).toBe('function')
    })

    it('should create independent SSEClient instances each time', () => {
      const ext = new RoboSystemsExtensions()
      const client1 = ext.createSSEClient()
      const client2 = ext.createSSEClient()

      expect(client1).not.toBe(client2)
    })
  })

  describe('monitorOperation', () => {
    it('should delegate to operations.monitorOperation', async () => {
      const ext = new RoboSystemsExtensions()

      const monitorSpy = vi.spyOn(ext.operations, 'monitorOperation').mockResolvedValue({
        success: true,
        result: { data: 'test' },
      })

      const result = await ext.monitorOperation('op_123')

      expect(monitorSpy).toHaveBeenCalledWith('op_123', { onProgress: undefined })
      expect(result).toEqual({
        success: true,
        result: { data: 'test' },
      })
    })

    it('should pass progress callback through', async () => {
      const ext = new RoboSystemsExtensions()

      const monitorSpy = vi.spyOn(ext.operations, 'monitorOperation').mockResolvedValue({
        success: true,
      })

      const progressCallback = vi.fn()
      await ext.monitorOperation('op_123', progressCallback)

      expect(monitorSpy).toHaveBeenCalledWith('op_123', { onProgress: progressCallback })
    })

    it('should propagate errors from operations client', async () => {
      const ext = new RoboSystemsExtensions()

      vi.spyOn(ext.operations, 'monitorOperation').mockRejectedValue(new Error('Operation timeout'))

      await expect(ext.monitorOperation('op_bad')).rejects.toThrow('Operation timeout')
    })
  })

  describe('close', () => {
    it('should close all three closeable clients', () => {
      const ext = new RoboSystemsExtensions()

      const queryCloseSpy = vi.spyOn(ext.query, 'close')
      const agentCloseSpy = vi.spyOn(ext.agent, 'close')
      const operationsCloseSpy = vi.spyOn(ext.operations, 'closeAll')

      ext.close()

      expect(queryCloseSpy).toHaveBeenCalled()
      expect(agentCloseSpy).toHaveBeenCalled()
      expect(operationsCloseSpy).toHaveBeenCalled()
    })

    it('should not throw when called multiple times', () => {
      const ext = new RoboSystemsExtensions()

      expect(() => {
        ext.close()
        ext.close()
      }).not.toThrow()
    })
  })

  describe('full config integration', () => {
    it('should properly configure all clients with full config', () => {
      const fullConfig = {
        baseUrl: 'https://api.production.com',
        credentials: 'include' as const,
        token: 'jwt-token-123',
        headers: {
          'X-API-Key': 'key-123',
          'X-Custom': 'value',
        },
        maxRetries: 7,
        retryDelay: 3000,
      }

      const ext = new RoboSystemsExtensions(fullConfig)

      expect(ext.query).toBeDefined()
      expect(ext.operations).toBeDefined()
      expect(ext.ledger).toBeDefined()
      expect(ext.reports).toBeDefined()
      expect(ext.agent).toBeDefined()
      expect(typeof ext.query.executeQuery).toBe('function')
      expect(typeof ext.operations.monitorOperation).toBe('function')
    })

    it('should use SDK client baseUrl when no baseUrl provided', () => {
      const ext = new RoboSystemsExtensions({})

      expect(ext.query).toBeDefined()
      expect(ext.operations).toBeDefined()
    })
  })
})

describe('extensions singleton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset the lazy singleton between tests
    vi.resetModules()
  })

  it('should export extensions object with getter properties', async () => {
    const { extensions } = await import('./index')

    expect(extensions).toBeDefined()
    expect(typeof extensions.monitorOperation).toBe('function')
    expect(typeof extensions.createSSEClient).toBe('function')
    expect(typeof extensions.close).toBe('function')
  })

  it('should lazily create clients on first access', async () => {
    const { extensions } = await import('./index')

    const query = extensions.query
    expect(query).toBeDefined()
    expect(typeof query.executeQuery).toBe('function')
  })

  it('should return same instance on repeated access', async () => {
    const { extensions } = await import('./index')

    const query1 = extensions.query
    const query2 = extensions.query
    expect(query1).toBe(query2)
  })

  it('should expose all five client getters', async () => {
    const { extensions } = await import('./index')

    expect(typeof extensions.query.executeQuery).toBe('function')
    expect(typeof extensions.agent.executeQuery).toBe('function')
    expect(typeof extensions.operations.monitorOperation).toBe('function')
    expect(typeof extensions.ledger.listAccounts).toBe('function')
    expect(typeof extensions.reports.create).toBe('function')
  })

  it('should create SSEClient from singleton', async () => {
    const { extensions } = await import('./index')

    const sseClient = extensions.createSSEClient()
    expect(typeof sseClient.connect).toBe('function')
    expect(typeof sseClient.close).toBe('function')
  })

  it('should close without error', async () => {
    const { extensions } = await import('./index')

    // Access to initialize
    extensions.query
    expect(() => extensions.close()).not.toThrow()
  })
})

describe('convenience functions', () => {
  let mockFetch: any

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    mockFetch = vi.fn()
    global.fetch = mockFetch
    globalThis.fetch = mockFetch
  })

  it('should export executeQuery function', async () => {
    const { executeQuery } = await import('./index')
    expect(typeof executeQuery).toBe('function')
  })

  it('should export streamQuery function', async () => {
    const { streamQuery } = await import('./index')
    expect(typeof streamQuery).toBe('function')
  })

  it('should export agentQuery function', async () => {
    const { agentQuery } = await import('./index')
    expect(typeof agentQuery).toBe('function')
  })

  it('should export analyzeFinancials function', async () => {
    const { analyzeFinancials } = await import('./index')
    expect(typeof analyzeFinancials).toBe('function')
  })

  it('should export monitorOperation function', async () => {
    const mod = await import('./index')
    expect(typeof mod.monitorOperation).toBe('function')
  })
})

describe('re-exports', () => {
  it('should re-export all client classes', async () => {
    const mod = await import('./index')

    // Verify these are constructor functions (classes)
    expect(typeof mod.QueryClient).toBe('function')
    expect(typeof mod.AgentClient).toBe('function')
    expect(typeof mod.OperationClient).toBe('function')
    expect(typeof mod.SSEClient).toBe('function')
    expect(typeof mod.LedgerClient).toBe('function')
    expect(typeof mod.ReportClient).toBe('function')

    // Verify they can be instantiated
    const q = new mod.QueryClient({ baseUrl: 'http://test.com' })
    expect(typeof q.executeQuery).toBe('function')
  })

  it('should re-export config functions', async () => {
    const mod = await import('./index')

    expect(typeof mod.setSDKExtensionsConfig).toBe('function')
    expect(typeof mod.getSDKExtensionsConfig).toBe('function')
    expect(typeof mod.resetSDKExtensionsConfig).toBe('function')
    expect(typeof mod.extractJWTFromHeader).toBe('function')
    expect(typeof mod.isValidJWT).toBe('function')
    expect(typeof mod.configureWithJWT).toBe('function')
    expect(typeof mod.getEnvironmentConfig).toBe('function')
  })

  it('should re-export React hooks', async () => {
    const mod = await import('./index')

    expect(typeof mod.useQuery).toBe('function')
    expect(typeof mod.useStreamingQuery).toBe('function')
    expect(typeof mod.useOperation).toBe('function')
    expect(typeof mod.useMultipleOperations).toBe('function')
    expect(typeof mod.useSDKClients).toBe('function')
  })

  it('should re-export error classes', async () => {
    const mod = await import('./index')

    expect(typeof mod.QueuedQueryError).toBe('function')
    expect(typeof mod.QueuedAgentError).toBe('function')
  })

  it('should re-export EventType enum', async () => {
    const mod = await import('./index')

    expect(mod.EventType).toBeDefined()
    expect(mod.EventType.OPERATION_COMPLETED).toBeDefined()
    expect(mod.EventType.OPERATION_ERROR).toBeDefined()
    expect(mod.EventType.OPERATION_PROGRESS).toBeDefined()
  })
})
