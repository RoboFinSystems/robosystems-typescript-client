'use client'

/**
 * Enhanced AI Operator Client with SSE support
 * Provides intelligent operator execution with automatic strategy selection
 */

import { autoSelectOperator, executeSpecificOperator, getOperationStatus } from '../sdk/sdk.gen'
import type { AutoSelectOperatorData, ExecuteSpecificOperatorData } from '../sdk/types.gen'
import type { TokenProvider } from './graphql/client'
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
  /**
   * Interval between `/v1/operations/{id}/status` polls while the client
   * follows a queued run it could not open an SSE stream for. Defaults to
   * 2000 ms; only the fallback path uses it.
   */
  pollIntervalMs?: number
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
  /**
   * Present when the API reports a failed run inside an otherwise successful
   * response (credit pre-flight, operator timeouts, cancelled runs). `content`
   * then carries the explanation rather than an answer.
   */
  error_details?: Record<string, any>
}

export interface QueuedOperatorResponse {
  status: 'queued'
  operation_id: string
  message: string
  sse_endpoint?: string
}

export interface OperatorClientConfig {
  baseUrl: string
  credentials?: 'include' | 'same-origin' | 'omit'
  headers?: Record<string, string>
  /**
   * Static JWT captured at construction. Prefer `tokenProvider` in the
   * browser — see `SSEConfig` for why a captured token goes stale.
   */
  token?: string
  /**
   * Consulted on every SSE connect so a rotated JWT keeps the progress
   * stream authenticated. Wins over `token` when both are set.
   */
  tokenProvider?: TokenProvider
}

const DEFAULT_POLL_INTERVAL_MS = 2000

// Consecutive `/status` failures tolerated before the polling fallback gives
// up: one transient network error must not lose a run that is still going.
const MAX_CONSECUTIVE_POLL_FAILURES = 3

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

const describeError = (err: unknown): string => (err instanceof Error ? err.message : String(err))

/**
 * Text for the `error` slot of a generated-client envelope: a thrown `Error`
 * (network failure — the client returns those rather than throwing), an API
 * body with `detail`, or whatever else came back.
 */
const describeEnvelopeError = (err: unknown): string => {
  if (err instanceof Error) return err.message
  if (err && typeof err === 'object' && 'detail' in err) return String((err as any).detail)
  if (err === undefined || err === null) return 'empty response'
  return typeof err === 'string' ? err : JSON.stringify(err)
}

/**
 * Shape an operator payload — the sync 200 body, the `operation_completed`
 * event, or the `/status` `result` — into the public result type. All three
 * carry the same fields, so one mapper keeps them consistent.
 */
function toOperatorResult(data: Record<string, any>): OperatorResult {
  const result: OperatorResult = {
    content: data.content ?? '',
    operator_used: data.operator_used || 'unknown',
    mode_used: data.mode_used || 'standard',
    metadata: data.metadata,
    tokens_used: data.tokens_used,
    confidence_score: data.confidence_score,
    execution_time: data.execution_time,
    timestamp: data.timestamp || new Date().toISOString(),
  }
  if (data.error_details) {
    result.error_details = data.error_details
  }
  return result
}

/** Internal: a `/status` verdict that must not be retried. */
class PollAbort extends Error {}

export class OperatorClient {
  private sseClient?: SSEClient
  private config: OperatorClientConfig

  constructor(config: OperatorClientConfig) {
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
    return this.settle(response.data, options)
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
    return this.settle(response.data, options)
  }

  /**
   * Resolve an operator endpoint response: a sync 200 body is the result, a
   * 202 with an `operation_id` is followed to completion.
   */
  private async settle(responseData: any, options: OperatorOptions): Promise<OperatorResult> {
    // Immediate response (sync execution)
    if (responseData?.content !== undefined && responseData?.operator_used) {
      return toOperatorResult(responseData)
    }

    // Queued response (async background task execution)
    if (responseData?.operation_id) {
      const queuedResponse = responseData as QueuedOperatorResponse

      // If user doesn't want to wait, throw with queue info
      if (options.maxWait === 0) {
        throw new QueuedOperatorError(queuedResponse)
      }

      return this.waitForOperatorCompletion(queuedResponse.operation_id, options)
    }

    // Unexpected response format
    throw new Error('Unexpected response format from operator endpoint')
  }

  private async waitForOperatorCompletion(
    operationId: string,
    options: OperatorOptions
  ): Promise<OperatorResult> {
    const sseClient = new SSEClient(this.config)
    this.sseClient = sseClient

    try {
      await sseClient.connect(operationId)
    } catch (streamError) {
      // The run is already queued and finishes whether or not anyone is
      // watching, so a stream that cannot open — a revoked token, a proxy
      // that will not hold the connection, the per-user connection cap —
      // must not lose the result. Follow the operation over `/status`,
      // which rides the regular REST auth path, instead.
      this.sseClient = undefined
      return this.pollForCompletion(operationId, options, streamError)
    }

    return new Promise((resolve, reject) => {
      let result: OperatorResult | null = null

      const finish = () => {
        sseClient.close()
        if (this.sseClient === sseClient) {
          this.sseClient = undefined
        }
      }

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
        result = toOperatorResult(data)
        finish()
        resolve(result)
      })

      // Fallback to generic completion event
      sseClient.on(EventType.OPERATION_COMPLETED, (data) => {
        if (!result) {
          result = toOperatorResult(data.result || data)
          finish()
          resolve(result)
        }
      })

      sseClient.on(EventType.OPERATION_ERROR, (error) => {
        finish()
        reject(new Error(error.message || error.error))
      })

      sseClient.on(EventType.OPERATION_CANCELLED, () => {
        finish()
        reject(new Error('Agent execution cancelled'))
      })

      // Handle generic error event
      sseClient.on('error' as EventType, (error) => {
        finish()
        reject(new Error(error.error || error.message || 'Agent execution failed'))
      })
    })
  }

  /**
   * Follow a queued run over `/v1/operations/{id}/status` until it settles.
   * Used when the SSE stream could not be opened; `streamError` is folded
   * into the failure message if polling cannot reach a verdict either.
   */
  private async pollForCompletion(
    operationId: string,
    options: OperatorOptions,
    streamError: unknown
  ): Promise<OperatorResult> {
    const interval = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS
    const streamDetail = describeError(streamError)
    let consecutiveFailures = 0

    options.onProgress?.('Live progress unavailable — waiting for the result')

    for (;;) {
      let status: any
      try {
        const response = await getOperationStatus({ path: { operation_id: operationId } })
        if (response.error || !response.data) {
          const httpStatus = response.response?.status
          const detail = describeEnvelopeError(response.error)
          // A definitive 4xx (expired, not ours, unauthenticated) ends the
          // wait; anything else is treated as transient and retried below.
          if (
            httpStatus !== undefined &&
            httpStatus >= 400 &&
            httpStatus < 500 &&
            httpStatus !== 429
          ) {
            throw new PollAbort(
              `Operator stream failed (${streamDetail}); status check failed (${httpStatus}: ${detail})`
            )
          }
          throw new Error(detail)
        }
        status = response.data
        consecutiveFailures = 0
      } catch (pollError) {
        if (pollError instanceof PollAbort) {
          throw new Error(pollError.message, { cause: pollError })
        }
        consecutiveFailures += 1
        if (consecutiveFailures >= MAX_CONSECUTIVE_POLL_FAILURES) {
          throw new Error(
            `Operator stream failed (${streamDetail}); status polling failed (${describeError(pollError)})`,
            { cause: pollError }
          )
        }
        await sleep(interval)
        continue
      }

      switch (status.status) {
        case 'completed':
          return toOperatorResult(status.result || {})
        case 'failed':
          throw new Error(status.error || status.message || 'Operator run failed')
        case 'cancelled':
          throw new Error('Agent execution cancelled')
        default:
          if (status.message) {
            options.onProgress?.(status.message)
          }
          await sleep(interval)
      }
    }
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
