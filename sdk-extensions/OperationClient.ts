'use client'

/**
 * General Operations Client for monitoring async operations
 * Handles graph creation, backups, imports, and other long-running tasks
 */

import {
  cancelOperation as cancelOperationSDK,
  getOperationStatus,
} from '../sdk/sdk.gen'
import { EventType, SSEClient } from './SSEClient'

export interface OperationProgress {
  message: string
  progressPercent?: number
  details?: Record<string, any>
}

export interface OperationResult<T = any> {
  success: boolean
  result?: T
  error?: string
  metadata?: Record<string, any>
}

export interface OperationMonitorOptions {
  onProgress?: (progress: OperationProgress) => void
  onQueueUpdate?: (position: number, estimatedWait: number) => void
  timeout?: number
}

export class OperationClient {
  private sseClients: Map<string, SSEClient> = new Map()
  private cleanupTimeouts: Map<string, ReturnType<typeof setTimeout>> =
    new Map()
  private config: {
    baseUrl: string
    credentials?: 'include' | 'same-origin' | 'omit'
    headers?: Record<string, string>
    maxRetries?: number
    retryDelay?: number
  }
  private cleanupIntervalMs = 300000 // 5 minutes
  private cleanupInterval?: ReturnType<typeof setInterval>

  constructor(config: {
    baseUrl: string
    credentials?: 'include' | 'same-origin' | 'omit'
    headers?: Record<string, string>
    maxRetries?: number
    retryDelay?: number
  }) {
    this.config = config

    // Start periodic cleanup check every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.performPeriodicCleanup()
    }, this.cleanupIntervalMs)
  }

  async monitorOperation<T = any>(
    operationId: string,
    options: OperationMonitorOptions = {}
  ): Promise<OperationResult<T>> {
    return new Promise((resolve, reject) => {
      const sseClient = new SSEClient(this.config)
      this.sseClients.set(operationId, sseClient)

      const timeoutHandle = options.timeout
        ? setTimeout(() => {
            this.cleanupClient(operationId)
            reject(new Error(`Operation timeout after ${options.timeout}ms`))
          }, options.timeout)
        : undefined

      sseClient
        .connect(operationId)
        .then(() => {
          let result: OperationResult<T> = { success: false }

          // Track queue updates
          if (options.onQueueUpdate) {
            sseClient.on(EventType.QUEUE_UPDATE, (data) => {
              options.onQueueUpdate!(
                data.position || data.queue_position,
                data.estimated_wait_seconds || 0
              )
            })
          }

          // Track progress
          if (options.onProgress) {
            sseClient.on(EventType.OPERATION_PROGRESS, (data) => {
              options.onProgress!({
                message: data.message || data.status || 'Processing...',
                progressPercent: data.progress_percent || data.progress,
                details: data,
              })
            })
          }

          // Handle completion
          sseClient.on(EventType.OPERATION_COMPLETED, (data) => {
            if (timeoutHandle) clearTimeout(timeoutHandle)
            result = {
              success: true,
              result: data.result || data,
              metadata: data.metadata,
            }
            // Schedule cleanup after a short delay to ensure all data is received
            this.scheduleCleanup(operationId, 5000)
            resolve(result)
          })

          // Handle errors
          sseClient.on(EventType.OPERATION_ERROR, (error) => {
            if (timeoutHandle) clearTimeout(timeoutHandle)
            result = {
              success: false,
              error: error.message || error.error || 'Operation failed',
              metadata: error.metadata,
            }
            // Schedule cleanup after a short delay
            this.scheduleCleanup(operationId, 5000)
            resolve(result) // Resolve with error result, not reject
          })

          // Handle cancellation
          sseClient.on(EventType.OPERATION_CANCELLED, (data) => {
            if (timeoutHandle) clearTimeout(timeoutHandle)
            result = {
              success: false,
              error: 'Operation cancelled',
              metadata: data,
            }
            // Schedule cleanup after a short delay
            this.scheduleCleanup(operationId, 5000)
            resolve(result)
          })
        })
        .catch((error) => {
          if (timeoutHandle) clearTimeout(timeoutHandle)
          this.cleanupClient(operationId)
          reject(error)
        })
    })
  }

  /**
   * Monitor multiple operations concurrently
   */
  async monitorMultiple<T = any>(
    operationIds: string[],
    options: OperationMonitorOptions = {}
  ): Promise<Map<string, OperationResult<T>>> {
    const results = await Promise.all(
      operationIds.map(async (id) => {
        const result = await this.monitorOperation<T>(id, options)
        return [id, result] as [string, OperationResult<T>]
      })
    )
    return new Map(results)
  }

  /**
   * Get the current status of an operation (point-in-time check)
   */
  async getStatus(operationId: string): Promise<any> {
    const response = await getOperationStatus({
      path: { operation_id: operationId },
    })
    return response.data
  }

  /**
   * Cancel a pending or running operation
   */
  async cancelOperation(operationId: string): Promise<void> {
    // First close any active SSE connection
    this.cleanupClient(operationId)

    // Then cancel the operation
    await cancelOperationSDK({
      path: { operation_id: operationId },
    })
  }

  /**
   * Wait for an operation with a simple promise interface
   */
  async waitForOperation<T = any>(
    operationId: string,
    timeoutMs?: number
  ): Promise<T> {
    const result = await this.monitorOperation<T>(operationId, {
      timeout: timeoutMs,
    })

    if (!result.success) {
      throw new Error(result.error || 'Operation failed')
    }

    return result.result as T
  }

  /**
   * Monitor operation with async iterator for progress updates
   */
  async *monitorWithProgress<T = any>(
    operationId: string
  ): AsyncIterableIterator<OperationProgress | OperationResult<T>> {
    const progressQueue: (OperationProgress | OperationResult<T>)[] = []
    let completed = false
    let finalResult: OperationResult<T> | null = null

    // Start monitoring in background
    const monitorPromise = this.monitorOperation<T>(operationId, {
      onProgress: (progress) => {
        progressQueue.push(progress)
      },
      onQueueUpdate: (position, estimatedWait) => {
        progressQueue.push({
          message: `Queue position: ${position}`,
          progressPercent: 0,
          details: { position, estimatedWait },
        })
      },
    })

    // Handle completion
    monitorPromise
      .then((result) => {
        finalResult = result
        completed = true
      })
      .catch((error) => {
        finalResult = {
          success: false,
          error: error.message,
        }
        completed = true
      })

    // Yield progress updates as they come
    while (!completed || progressQueue.length > 0) {
      if (progressQueue.length > 0) {
        yield progressQueue.shift()!
      } else if (!completed) {
        // Wait for more progress
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    // Yield final result
    if (finalResult) {
      yield finalResult
    }
  }

  private cleanupClient(operationId: string): void {
    const client = this.sseClients.get(operationId)
    if (client) {
      client.close()
      this.sseClients.delete(operationId)
    }

    // Clear any cleanup timeout for this operation
    const timeout = this.cleanupTimeouts.get(operationId)
    if (timeout) {
      clearTimeout(timeout)
      this.cleanupTimeouts.delete(operationId)
    }
  }

  /**
   * Schedule automatic cleanup of SSE client after a delay
   */
  private scheduleCleanup(operationId: string, delayMs: number = 60000): void {
    // Clear any existing timeout
    const existingTimeout = this.cleanupTimeouts.get(operationId)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    // Schedule new cleanup
    const timeout = setTimeout(() => {
      this.cleanupClient(operationId)
      this.cleanupTimeouts.delete(operationId)
    }, delayMs)

    this.cleanupTimeouts.set(operationId, timeout)
  }

  /**
   * Perform periodic cleanup of stale SSE connections
   */
  private performPeriodicCleanup(): void {
    const now = Date.now()
    const staleThreshold = 600000 // 10 minutes

    // Check each SSE client for staleness
    this.sseClients.forEach((client, operationId) => {
      if (!client.isConnected()) {
        // Clean up disconnected clients immediately
        this.cleanupClient(operationId)
      }
    })
  }

  /**
   * Close all active SSE connections and clean up resources
   */
  closeAll(): void {
    // Clear periodic cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = undefined
    }

    // Clear all cleanup timeouts
    this.cleanupTimeouts.forEach((timeout) => {
      clearTimeout(timeout)
    })
    this.cleanupTimeouts.clear()

    // Close all SSE clients
    this.sseClients.forEach((client, operationId) => {
      this.cleanupClient(operationId)
    })
  }
}
