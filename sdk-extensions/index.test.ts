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
      const extensions = new RoboSystemsExtensions()

      expect(extensions).toBeDefined()
      expect(extensions.query).toBeDefined()
      expect(extensions.operations).toBeDefined()
      expect(extensions.tables).toBeDefined()
      // Verify clients have expected methods
      expect(typeof extensions.query.executeQuery).toBe('function')
      expect(typeof extensions.operations.monitorOperation).toBe('function')
      expect(typeof extensions.tables.uploadParquetFile).toBe('function')
    })

    it('should create instance with custom baseUrl', () => {
      const extensions = new RoboSystemsExtensions({
        baseUrl: 'https://custom-api.com',
      })

      expect(extensions.query).toBeDefined()
      expect(extensions.operations).toBeDefined()
      expect(extensions.tables).toBeDefined()
    })

    it('should create instance with JWT token', () => {
      const extensions = new RoboSystemsExtensions({
        token: 'eyJhbGc.eyJzdWI.SflKxw',
      })

      expect(extensions.query).toBeDefined()
      expect(typeof extensions.query.query).toBe('function')
    })

    it('should create instance with credentials option', () => {
      const extensions = new RoboSystemsExtensions({
        credentials: 'omit',
      })

      expect(extensions.query).toBeDefined()
      expect(extensions.operations).toBeDefined()
    })

    it('should create instance with custom headers', () => {
      const extensions = new RoboSystemsExtensions({
        headers: {
          'X-Custom-Header': 'test-value',
        },
      })

      expect(extensions.query).toBeDefined()
      expect(extensions.tables).toBeDefined()
    })

    it('should create instance with retry config', () => {
      const extensions = new RoboSystemsExtensions({
        maxRetries: 10,
        retryDelay: 5000,
      })

      expect(extensions.operations).toBeDefined()
      expect(typeof extensions.operations.monitorOperation).toBe('function')
    })

    it('should merge config with SDK client config', () => {
      const extensions = new RoboSystemsExtensions({
        token: 'custom-token',
      })

      // Should have created clients successfully
      expect(extensions.query).toBeDefined()
      expect(extensions.operations).toBeDefined()
      expect(extensions.tables).toBeDefined()
    })
  })

  describe('createSSEClient', () => {
    it('should create a new SSEClient instance', () => {
      const extensions = new RoboSystemsExtensions()
      const sseClient = extensions.createSSEClient()

      expect(sseClient).toBeDefined()
      expect(typeof sseClient.connect).toBe('function')
      expect(typeof sseClient.close).toBe('function')
    })

    it('should create SSEClient with config', () => {
      const extensions = new RoboSystemsExtensions({
        baseUrl: 'https://custom-api.com',
        token: 'test-token',
      })
      const sseClient = extensions.createSSEClient()

      expect(sseClient).toBeDefined()
      expect(typeof sseClient.connect).toBe('function')
    })
  })

  describe('monitorOperation', () => {
    it('should call operations.monitorOperation', async () => {
      const extensions = new RoboSystemsExtensions()

      // Mock the operations client method
      const monitorSpy = vi.spyOn(extensions.operations, 'monitorOperation').mockResolvedValue({
        success: true,
        result: { data: 'test' },
      })

      const result = await extensions.monitorOperation('op_123')

      expect(monitorSpy).toHaveBeenCalledWith('op_123', { onProgress: undefined })
      expect(result).toEqual({
        success: true,
        result: { data: 'test' },
      })
    })

    it('should call operations.monitorOperation with progress callback', async () => {
      const extensions = new RoboSystemsExtensions()

      const monitorSpy = vi.spyOn(extensions.operations, 'monitorOperation').mockResolvedValue({
        success: true,
      })

      const progressCallback = vi.fn()
      await extensions.monitorOperation('op_123', progressCallback)

      expect(monitorSpy).toHaveBeenCalledWith('op_123', { onProgress: progressCallback })
    })
  })

  describe('close', () => {
    it('should close all clients', () => {
      const extensions = new RoboSystemsExtensions()

      const queryCloseSpy = vi.spyOn(extensions.query, 'close')
      const operationsCloseSpy = vi.spyOn(extensions.operations, 'closeAll')

      extensions.close()

      expect(queryCloseSpy).toHaveBeenCalled()
      expect(operationsCloseSpy).toHaveBeenCalled()
    })

    it('should not throw when called multiple times', () => {
      const extensions = new RoboSystemsExtensions()

      expect(() => {
        extensions.close()
        extensions.close()
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

      const extensions = new RoboSystemsExtensions(fullConfig)

      expect(extensions.query).toBeDefined()
      expect(extensions.operations).toBeDefined()
      expect(extensions.tables).toBeDefined()
      expect(typeof extensions.query.executeQuery).toBe('function')
      expect(typeof extensions.operations.monitorOperation).toBe('function')
      expect(typeof extensions.tables.uploadParquetFile).toBe('function')
    })

    it('should use SDK client baseUrl when no baseUrl provided', () => {
      const extensions = new RoboSystemsExtensions({})

      // Should use the mocked SDK client baseUrl
      expect(extensions.query).toBeDefined()
      expect(extensions.operations).toBeDefined()
      expect(extensions.tables).toBeDefined()
    })
  })
})
