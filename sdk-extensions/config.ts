'use client'

/**
 * Configuration for SDK extensions
 * Provides centralized configuration for CORS, credentials, and other settings
 */

export interface SDKExtensionsConfig {
  baseUrl?: string
  credentials?: 'include' | 'same-origin' | 'omit'
  headers?: Record<string, string>
  token?: string // JWT token for authentication
  timeout?: number
  maxRetries?: number
  retryDelay?: number
}

// Default configuration
const defaultConfig: SDKExtensionsConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  credentials: 'include',
  token: undefined, // Will be set from environment or programmatically
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000,
}

// Global configuration singleton
let globalConfig: SDKExtensionsConfig = { ...defaultConfig }

/**
 * Set global configuration for SDK extensions
 * @param config Partial configuration to merge with defaults
 */
export function setSDKExtensionsConfig(config: Partial<SDKExtensionsConfig>) {
  globalConfig = {
    ...globalConfig,
    ...config,
  }
}

/**
 * Get current SDK extensions configuration
 * @returns Current configuration
 */
export function getSDKExtensionsConfig(): SDKExtensionsConfig {
  return { ...globalConfig }
}

/**
 * Reset configuration to defaults
 */
export function resetSDKExtensionsConfig() {
  globalConfig = { ...defaultConfig }
}

/**
 * Extract JWT token from Authorization header
 * @param authHeader Authorization header value
 * @returns JWT token or undefined
 */
export function extractJWTFromHeader(authHeader?: string | string[]): string | undefined {
  if (!authHeader) return undefined

  const headerValue = Array.isArray(authHeader) ? authHeader[0] : authHeader
  if (typeof headerValue === 'string' && headerValue.startsWith('Bearer ')) {
    return headerValue.substring(7)
  }

  return undefined
}

/**
 * Validate JWT token format (basic validation)
 * @param token JWT token to validate
 * @returns true if token appears valid
 */
export function isValidJWT(token: string | undefined): boolean {
  if (!token || typeof token !== 'string') return false

  try {
    const parts = token.split('.')
    // JWT should have exactly 3 parts: header.payload.signature
    return parts.length === 3 && parts.every((part) => part.length > 0)
  } catch {
    return false
  }
}

/**
 * Extract JWT token from SDK client configuration
 * Centralizes the logic for extracting tokens from the client
 * @returns JWT token or undefined
 */
export function extractTokenFromSDKClient(): string | undefined {
  // Import dynamically to avoid circular dependency
  const { client } = require('../sdk/client.gen')

  const sdkConfig = getSDKExtensionsConfig()

  // Priority 1: Use explicitly configured token
  if (sdkConfig.token) {
    return sdkConfig.token
  }

  // Priority 2: Extract from SDK client headers
  const clientConfig = client.getConfig()
  if (clientConfig.headers) {
    if (typeof clientConfig.headers === 'object' && !Array.isArray(clientConfig.headers)) {
      const headers = clientConfig.headers as Record<string, unknown>
      const token = extractJWTFromHeader(headers.Authorization as string | undefined)
      if (isValidJWT(token)) {
        return token
      }
    }
  }

  return undefined
}

/**
 * Configure SDK extensions for JWT authentication
 * @param token JWT token
 * @param config Additional configuration options
 */
export function configureWithJWT(token: string, config?: Partial<SDKExtensionsConfig>) {
  if (!isValidJWT(token)) {
    console.warn('Warning: Provided JWT token does not appear to be valid')
  }

  setSDKExtensionsConfig({
    ...config,
    token,
    // When using JWT, typically don't need cookies
    credentials: config?.credentials || 'omit',
  })
}

/**
 * Get configuration for a specific environment
 * @param env Environment name (production, staging, development)
 * @returns Environment-specific configuration
 */
export function getEnvironmentConfig(
  env: 'production' | 'staging' | 'development' = 'development'
): SDKExtensionsConfig {
  const baseConfigs: Record<string, Partial<SDKExtensionsConfig>> = {
    production: {
      baseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.robosystems.ai',
      credentials: 'include',
      timeout: 60000,
      maxRetries: 5,
      retryDelay: 2000,
    },
    staging: {
      baseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://staging-api.robosystems.ai',
      credentials: 'include',
      timeout: 45000,
      maxRetries: 3,
      retryDelay: 1500,
    },
    development: {
      baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
      credentials: 'include',
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 1000,
    },
  }

  return {
    ...defaultConfig,
    ...baseConfigs[env],
  }
}
