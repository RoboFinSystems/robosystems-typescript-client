'use client'

/**
 * Enhanced Agent Client with SSE support
 * Provides intelligent agent execution with automatic strategy selection
 */

import { autoSelectAgent, executeSpecificAgent } from '../sdk/sdk.gen'
import type { AutoSelectAgentData, ExecuteSpecificAgentData } from '../sdk/types.gen'
import { EventType, SSEClient } from './SSEClient'

export interface AgentQueryRequest {
  message: string
  history?: Array<{ role: string; content: string }>
  context?: Record<string, any>
  mode?: 'quick' | 'standard' | 'extended' | 'streaming'
  enableRag?: boolean
  forceExtendedAnalysis?: boolean
}

export interface AgentOptions {
  mode?: 'auto' | 'sync' | 'async'
  maxWait?: number
  onProgress?: (message: string, percentage?: number) => void
}

export interface AgentResult {
  content: string
  agent_used: string
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

export interface QueuedAgentResponse {
  status: 'queued'
  operation_id: string
  message: string
  sse_endpoint?: string
}

export class AgentClient {
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
   * Execute agent query with automatic agent selection
   */
  async executeQuery(
    graphId: string,
    request: AgentQueryRequest,
    options: AgentOptions = {}
  ): Promise<AgentResult> {
    const data: AutoSelectAgentData = {
      url: '/v1/graphs/{graph_id}/agent' as const,
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

    const response = await autoSelectAgent(data)
    const responseData = response.data as any

    // Check if this is an immediate response (sync execution)
    if (responseData?.content !== undefined && responseData?.agent_used) {
      return {
        content: responseData.content,
        agent_used: responseData.agent_used,
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
      const queuedResponse = responseData as QueuedAgentResponse

      // If user doesn't want to wait, throw with queue info
      if (options.maxWait === 0) {
        throw new QueuedAgentError(queuedResponse)
      }

      // Use SSE to monitor the operation
      return this.waitForAgentCompletion(queuedResponse.operation_id, options)
    }

    // Unexpected response format
    throw new Error('Unexpected response format from agent endpoint')
  }

  /**
   * Execute specific agent type
   */
  async executeAgent(
    graphId: string,
    agentType: string,
    request: AgentQueryRequest,
    options: AgentOptions = {}
  ): Promise<AgentResult> {
    const data: ExecuteSpecificAgentData = {
      url: '/v1/graphs/{graph_id}/agent/{agent_type}' as const,
      path: { graph_id: graphId, agent_type: agentType },
      body: {
        message: request.message,
        history: request.history,
        context: request.context,
        mode: request.mode,
        enable_rag: request.enableRag,
        force_extended_analysis: request.forceExtendedAnalysis,
      },
    }

    const response = await executeSpecificAgent(data)
    const responseData = response.data as any

    // Check if this is an immediate response (sync execution)
    if (responseData?.content !== undefined && responseData?.agent_used) {
      return {
        content: responseData.content,
        agent_used: responseData.agent_used,
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
      const queuedResponse = responseData as QueuedAgentResponse

      // If user doesn't want to wait, throw with queue info
      if (options.maxWait === 0) {
        throw new QueuedAgentError(queuedResponse)
      }

      // Use SSE to monitor the operation
      return this.waitForAgentCompletion(queuedResponse.operation_id, options)
    }

    // Unexpected response format
    throw new Error('Unexpected response format from agent endpoint')
  }

  private async waitForAgentCompletion(
    operationId: string,
    options: AgentOptions
  ): Promise<AgentResult> {
    return new Promise((resolve, reject) => {
      const sseClient = new SSEClient(this.config)

      sseClient
        .connect(operationId)
        .then(() => {
          let result: AgentResult | null = null

          // Listen for progress events
          sseClient.on(EventType.OPERATION_PROGRESS, (data) => {
            options.onProgress?.(data.message, data.progress_percentage)
          })

          // Listen for agent-specific events
          sseClient.on('agent_started' as EventType, (data) => {
            options.onProgress?.(`Agent ${data.agent_type} started`, 0)
          })

          sseClient.on('agent_initialized' as EventType, (data) => {
            options.onProgress?.(`${data.agent_name} initialized`, 10)
          })

          sseClient.on('progress' as EventType, (data) => {
            options.onProgress?.(data.message, data.percentage)
          })

          sseClient.on('agent_completed' as EventType, (data) => {
            result = {
              content: data.content,
              agent_used: data.agent_used,
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
              const agentResult = data.result || data
              result = {
                content: agentResult.content || '',
                agent_used: agentResult.agent_used || 'unknown',
                mode_used: agentResult.mode_used || 'standard',
                metadata: agentResult.metadata,
                tokens_used: agentResult.tokens_used,
                confidence_score: agentResult.confidence_score,
                execution_time: agentResult.execution_time,
                timestamp: agentResult.timestamp || new Date().toISOString(),
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
  ): Promise<AgentResult> {
    return this.executeQuery(graphId, { message, context }, { mode: 'auto' })
  }

  /**
   * Execute financial agent for financial analysis
   */
  async analyzeFinancials(
    graphId: string,
    message: string,
    options: AgentOptions = {}
  ): Promise<AgentResult> {
    return this.executeAgent(graphId, 'financial', { message }, options)
  }

  /**
   * Execute research agent for deep research
   */
  async research(
    graphId: string,
    message: string,
    options: AgentOptions = {}
  ): Promise<AgentResult> {
    return this.executeAgent(graphId, 'research', { message }, options)
  }

  /**
   * Execute RAG agent for fast retrieval
   */
  async rag(graphId: string, message: string, options: AgentOptions = {}): Promise<AgentResult> {
    return this.executeAgent(graphId, 'rag', { message }, options)
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
export class QueuedAgentError extends Error {
  constructor(public queueInfo: QueuedAgentResponse) {
    super('Agent execution was queued')
    this.name = 'QueuedAgentError'
  }
}
