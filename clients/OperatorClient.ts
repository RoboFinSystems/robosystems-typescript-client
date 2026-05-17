'use client'

/**
 * Enhanced AI Operator Client with SSE support
 * Provides intelligent operator execution with automatic strategy selection
 */

import { autoSelectOperator, executeSpecificOperator } from '../sdk/sdk.gen'
import type { AutoSelectOperatorData, ExecuteSpecificOperatorData } from '../sdk/types.gen'
import { EventType, SSEClient } from './SSEClient'

export interface OperatorQueryRequest {
  message: string
  history?: Array<{ role: string; content: string }>
  context?: Record<string, any>
  mode?: 'quick' | 'standard' | 'extended' | 'streaming'
  enableRag?: boolean
  forceExtendedAnalysis?: boolean
}

export interface OperatorOptions {
  mode?: 'auto' | 'sync' | 'async'
  maxWait?: number
  onProgress?: (message: string, percentage?: number) => void
}

export interface OperatorResult {
  content: string
  operator_used: string
  mode_used: 'quick' | 'standard' | 'extended' | 'streaming'
  metadata?: Record<string, any>
  tokens_used?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  confidence_score?: number
  execution_time?: number
  timestamp?: string
}

export interface QueuedOperatorResponse {
  status: 'queued'
  operation_id: string
  message: string
  sse_endpoint?: string
}

export class OperatorClient {
  private sseClient?: SSEClient
  private config: {
    baseUrl: string
    credentials?: 'include' | 'same-origin' | 'omit'
    headers?: Record<string, string>
    token?: string
  }

  constructor(config: {
    baseUrl: string
    credentials?: 'include' | 'same-origin' | 'omit'
    headers?: Record<string, string>
    token?: string
  }) {
    this.config = config
  }

  /**
   * Execute operator query with automatic operator selection
   */
  async executeQuery(
    graphId: string,
    request: OperatorQueryRequest,
    options: OperatorOptions = {}
  ): Promise<OperatorResult> {
    const data: AutoSelectOperatorData = {
      url: '/v1/graphs/{graph_id}/operator' as const,
      path: { graph_id: graphId },
      body: {
        message: request.message,
        history: request.history,
        context: request.context,
        mode: request.mode,
        enable_rag: request.enableRag,
        force_extended_analysis: request.forceExtendedAnalysis,
      },
    }

    const response = await autoSelectOperator(data)
    const responseData = response.data as any

    // Check if this is an immediate response (sync execution)
    if (responseData?.content !== undefined && responseData?.operator_used) {
      return {
        content: responseData.content,
        operator_used: responseData.operator_used,
        mode_used: responseData.mode_used,
        metadata: responseData.metadata,
        tokens_used: responseData.tokens_used,
        confidence_score: responseData.confidence_score,
        execution_time: responseData.execution_time,
        timestamp: new Date().toISOString(),
      }
    }

    // Check if this is a queued response (async background task execution)
    if (responseData?.operation_id) {
      const queuedResponse = responseData as QueuedOperatorResponse

      // If user doesn't want to wait, throw with queue info
      if (options.maxWait === 0) {
        throw new QueuedOperatorError(queuedResponse)
      }

      // Use SSE to monitor the operation
      return this.waitForOperatorCompletion(queuedResponse.operation_id, options)
    }

    // Unexpected response format
    throw new Error('Unexpected response format from operator endpoint')
  }

  /**
   * Execute specific operator type
   */
  async executeOperator(
    graphId: string,
    operatorType: string,
    request: OperatorQueryRequest,
    options: OperatorOptions = {}
  ): Promise<OperatorResult> {
    const data: ExecuteSpecificOperatorData = {
      url: '/v1/graphs/{graph_id}/operator/{operator_type}' as const,
      path: { graph_id: graphId, operator_type: operatorType },
      body: {
        message: request.message,
        history: request.history,
        context: request.context,
        mode: request.mode,
        enable_rag: request.enableRag,
        force_extended_analysis: request.forceExtendedAnalysis,
      },
    }

    const response = await executeSpecificOperator(data)
    const responseData = response.data as any

    // Check if this is an immediate response (sync execution)
    if (responseData?.content !== undefined && responseData?.operator_used) {
      return {
        content: responseData.content,
        operator_used: responseData.operator_used,
        mode_used: responseData.mode_used,
        metadata: responseData.metadata,
        tokens_used: responseData.tokens_used,
        confidence_score: responseData.confidence_score,
        execution_time: responseData.execution_time,
        timestamp: new Date().toISOString(),
      }
    }

    // Check if this is a queued response (async background task execution)
    if (responseData?.operation_id) {
      const queuedResponse = responseData as QueuedOperatorResponse

      // If user doesn't want to wait, throw with queue info
      if (options.maxWait === 0) {
        throw new QueuedOperatorError(queuedResponse)
      }

      // Use SSE to monitor the operation
      return this.waitForOperatorCompletion(queuedResponse.operation_id, options)
    }

    // Unexpected response format
    throw new Error('Unexpected response format from operator endpoint')
  }

  private async waitForOperatorCompletion(
    operationId: string,
    options: OperatorOptions
  ): Promise<OperatorResult> {
    return new Promise((resolve, reject) => {
      const sseClient = new SSEClient(this.config)

      sseClient
        .connect(operationId)
        .then(() => {
          let result: OperatorResult | null = null

          // Listen for progress events
          sseClient.on(EventType.OPERATION_PROGRESS, (data) => {
            options.onProgress?.(data.message, data.progress_percentage)
          })

          // Listen for agent-specific events
          sseClient.on('operator_started' as EventType, (data) => {
            options.onProgress?.(`Operator ${data.operator_type} started`, 0)
          })

          sseClient.on('operator_initialized' as EventType, (data) => {
            options.onProgress?.(`${data.agent_name} initialized`, 10)
          })

          sseClient.on('progress' as EventType, (data) => {
            options.onProgress?.(data.message, data.percentage)
          })

          sseClient.on('operator_completed' as EventType, (data) => {
            result = {
              content: data.content,
              operator_used: data.operator_used,
              mode_used: data.mode_used,
              metadata: data.metadata,
              tokens_used: data.tokens_used,
              confidence_score: data.confidence_score,
              execution_time: data.execution_time,
              timestamp: data.timestamp || new Date().toISOString(),
            }
            sseClient.close()
            resolve(result)
          })

          // Fallback to generic completion event
          sseClient.on(EventType.OPERATION_COMPLETED, (data) => {
            if (!result) {
              const operatorResult = data.result || data
              result = {
                content: operatorResult.content || '',
                operator_used: operatorResult.operator_used || 'unknown',
                mode_used: operatorResult.mode_used || 'standard',
                metadata: operatorResult.metadata,
                tokens_used: operatorResult.tokens_used,
                confidence_score: operatorResult.confidence_score,
                execution_time: operatorResult.execution_time,
                timestamp: operatorResult.timestamp || new Date().toISOString(),
              }
              sseClient.close()
              resolve(result)
            }
          })

          sseClient.on(EventType.OPERATION_ERROR, (error) => {
            sseClient.close()
            reject(new Error(error.message || error.error))
          })

          sseClient.on(EventType.OPERATION_CANCELLED, () => {
            sseClient.close()
            reject(new Error('Agent execution cancelled'))
          })

          // Handle generic error event
          sseClient.on('error' as EventType, (error) => {
            sseClient.close()
            reject(new Error(error.error || error.message || 'Agent execution failed'))
          })
        })
        .catch(reject)
    })
  }

  /**
   * Convenience method for simple agent queries with auto-selection
   */
  async query(
    graphId: string,
    message: string,
    context?: Record<string, any>
  ): Promise<OperatorResult> {
    return this.executeQuery(graphId, { message, context }, { mode: 'auto' })
  }

  /**
   * Execute financial agent for financial analysis
   */
  async analyzeFinancials(
    graphId: string,
    message: string,
    options: OperatorOptions = {}
  ): Promise<OperatorResult> {
    return this.executeOperator(graphId, 'financial', { message }, options)
  }

  /**
   * Execute research agent for deep research
   */
  async research(
    graphId: string,
    message: string,
    options: OperatorOptions = {}
  ): Promise<OperatorResult> {
    return this.executeOperator(graphId, 'research', { message }, options)
  }

  /**
   * Execute RAG agent for fast retrieval
   */
  async rag(
    graphId: string,
    message: string,
    options: OperatorOptions = {}
  ): Promise<OperatorResult> {
    return this.executeOperator(graphId, 'rag', { message }, options)
  }

  /**
   * Cancel any active SSE connections
   */
  close(): void {
    if (this.sseClient) {
      this.sseClient.close()
      this.sseClient = undefined
    }
  }
}

/**
 * Error thrown when agent execution is queued and maxWait is 0
 */
export class QueuedOperatorError extends Error {
  constructor(public queueInfo: QueuedOperatorResponse) {
    super('Operator execution was queued')
    this.name = 'QueuedOperatorError'
  }
}
