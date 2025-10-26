import { beforeEach, describe, expect, it } from 'vitest'
import {
  configureWithJWT,
  extractJWTFromHeader,
  getEnvironmentConfig,
  getSDKExtensionsConfig,
  isValidJWT,
  resetSDKExtensionsConfig,
  setSDKExtensionsConfig,
} from './config'

describe('config', () => {
  beforeEach(() => {
    resetSDKExtensionsConfig()
  })

  describe('setSDKExtensionsConfig / getSDKExtensionsConfig', () => {
    it('should set and get configuration', () => {
      setSDKExtensionsConfig({
        baseUrl: 'https://api.example.com',
        token: 'test-token',
      })

      const config = getSDKExtensionsConfig()
      expect(config.baseUrl).toBe('https://api.example.com')
      expect(config.token).toBe('test-token')
    })

    it('should merge configuration with defaults', () => {
      setSDKExtensionsConfig({ token: 'new-token' })

      const config = getSDKExtensionsConfig()
      expect(config.token).toBe('new-token')
      expect(config.credentials).toBe('include') // Default value
    })

    it('should allow partial updates', () => {
      setSDKExtensionsConfig({ baseUrl: 'https://first.com' })
      setSDKExtensionsConfig({ token: 'token-123' })

      const config = getSDKExtensionsConfig()
      expect(config.baseUrl).toBe('https://first.com')
      expect(config.token).toBe('token-123')
    })
  })

  describe('resetSDKExtensionsConfig', () => {
    it('should reset configuration to defaults', () => {
      setSDKExtensionsConfig({
        baseUrl: 'https://custom.com',
        token: 'custom-token',
      })

      resetSDKExtensionsConfig()

      const config = getSDKExtensionsConfig()
      expect(config.baseUrl).toBe('http://localhost:8000')
      expect(config.token).toBeUndefined()
      expect(config.credentials).toBe('include')
    })
  })

  describe('extractJWTFromHeader', () => {
    it('should extract JWT from Bearer token', () => {
      const token = extractJWTFromHeader('Bearer abc.def.ghi')
      expect(token).toBe('abc.def.ghi')
    })

    it('should extract JWT from array of headers', () => {
      const token = extractJWTFromHeader(['Bearer abc.def.ghi'])
      expect(token).toBe('abc.def.ghi')
    })

    it('should return undefined for non-Bearer tokens', () => {
      const token = extractJWTFromHeader('Basic abc123')
      expect(token).toBeUndefined()
    })

    it('should return undefined for undefined header', () => {
      const token = extractJWTFromHeader(undefined)
      expect(token).toBeUndefined()
    })

    it('should return undefined for empty string', () => {
      const token = extractJWTFromHeader('')
      expect(token).toBeUndefined()
    })

    it('should handle Bearer without space', () => {
      const token = extractJWTFromHeader('Bearerabc.def.ghi')
      expect(token).toBeUndefined()
    })
  })

  describe('isValidJWT', () => {
    it('should validate a proper JWT format', () => {
      const valid = isValidJWT('eyJhbGc.eyJzdWI.SflKxw')
      expect(valid).toBe(true)
    })

    it('should reject tokens with fewer than 3 parts', () => {
      const valid = isValidJWT('abc.def')
      expect(valid).toBe(false)
    })

    it('should reject tokens with more than 3 parts', () => {
      const valid = isValidJWT('a.b.c.d')
      expect(valid).toBe(false)
    })

    it('should reject tokens with empty parts', () => {
      const valid = isValidJWT('a..c')
      expect(valid).toBe(false)
    })

    it('should reject undefined', () => {
      const valid = isValidJWT(undefined)
      expect(valid).toBe(false)
    })

    it('should reject empty string', () => {
      const valid = isValidJWT('')
      expect(valid).toBe(false)
    })

    it('should reject non-string values', () => {
      const valid = isValidJWT(123 as any)
      expect(valid).toBe(false)
    })

    it('should accept JWT with long parts', () => {
      const longJWT =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      const valid = isValidJWT(longJWT)
      expect(valid).toBe(true)
    })
  })

  describe('configureWithJWT', () => {
    it('should configure SDK with JWT token', () => {
      configureWithJWT('abc.def.ghi')

      const config = getSDKExtensionsConfig()
      expect(config.token).toBe('abc.def.ghi')
      expect(config.credentials).toBe('omit') // Default when using JWT
    })

    it('should allow overriding credentials', () => {
      configureWithJWT('abc.def.ghi', { credentials: 'include' })

      const config = getSDKExtensionsConfig()
      expect(config.credentials).toBe('include')
    })

    it('should merge additional config options', () => {
      configureWithJWT('abc.def.ghi', {
        baseUrl: 'https://custom.com',
        timeout: 60000,
      })

      const config = getSDKExtensionsConfig()
      expect(config.token).toBe('abc.def.ghi')
      expect(config.baseUrl).toBe('https://custom.com')
      expect(config.timeout).toBe(60000)
    })
  })

  describe('getEnvironmentConfig', () => {
    it('should return development config by default', () => {
      const config = getEnvironmentConfig()
      expect(config.baseUrl).toBe('http://localhost:8000')
      expect(config.credentials).toBe('include')
      expect(config.timeout).toBe(30000)
      expect(config.maxRetries).toBe(3)
    })

    it('should return production config', () => {
      const config = getEnvironmentConfig('production')
      expect(config.baseUrl).toBe('https://api.robosystems.ai')
      expect(config.timeout).toBe(60000)
      expect(config.maxRetries).toBe(5)
      expect(config.retryDelay).toBe(2000)
    })

    it('should return staging config', () => {
      const config = getEnvironmentConfig('staging')
      expect(config.baseUrl).toBe('https://staging-api.robosystems.ai')
      expect(config.timeout).toBe(45000)
      expect(config.maxRetries).toBe(3)
      expect(config.retryDelay).toBe(1500)
    })

    it('should return development config explicitly', () => {
      const config = getEnvironmentConfig('development')
      expect(config.baseUrl).toBe('http://localhost:8000')
      expect(config.timeout).toBe(30000)
    })
  })
})
