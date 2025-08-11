'use client'

/**
 * Configuration for SDK extensions
 * Provides centralized configuration for CORS, credentials, and other settings
 */

export interface SDKExtensionsConfig {
  baseUrl?: string
  credentials?: 'include' | 'same-origin' | 'omit'
  headers?: Record<string, string>
  timeout?: number
  maxRetries?: number
  retryDelay?: number
}

// Default configuration
const defaultConfig: SDKExtensionsConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  credentials: 'include',
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
