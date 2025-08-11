'use client'

/**
 * React hooks for SDK extensions
 * Provides easy-to-use hooks for Next.js/React applications
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { client } from '../sdk/client.gen'
import { getSDKExtensionsConfig } from './config'
import type { OperationProgress, OperationResult } from './OperationClient'
import { OperationClient } from './OperationClient'
import type { QueryOptions, QueryResult } from './QueryClient'
import { QueryClient } from './QueryClient'

/**
 * Hook for executing Cypher queries with loading states and error handling
 *
 * @example
 * ```tsx
 * const { execute, loading, error, data } = useQuery('graph_123')
 *
 * const handleSearch = async () => {
 *   const result = await execute('MATCH (n:Company) RETURN n LIMIT 10')
 *   console.log(result.data)
 * }
 * ```
 */
export function useQuery(graphId: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<QueryResult | null>(null)
  const [queuePosition, setQueuePosition] = useState<number | null>(null)
  const clientRef = useRef<QueryClient>()

  // Initialize client
  useEffect(() => {
    const sdkConfig = getSDKExtensionsConfig()
    const clientConfig = client.getConfig()
    clientRef.current = new QueryClient({
      baseUrl:
        sdkConfig.baseUrl || clientConfig.baseUrl || 'http://localhost:8000',
      credentials: sdkConfig.credentials,
      headers: sdkConfig.headers,
    })

    return () => {
      clientRef.current?.close()
    }
  }, [])

  const execute = useCallback(
    async (
      query: string,
      parameters?: Record<string, any>,
      options?: QueryOptions
    ): Promise<QueryResult | null> => {
      if (!clientRef.current) return null

      setLoading(true)
      setError(null)
      setData(null)
      setQueuePosition(null)

      try {
        const result = (await clientRef.current.executeQuery(
          graphId,
          { query, parameters },
          {
            ...options,
            onQueueUpdate: (position) => {
              setQueuePosition(position)
            },
            onProgress: () => {
              setQueuePosition(null) // Clear queue position when executing
            },
          }
        )) as QueryResult

        setData(result)
        return result
      } catch (err) {
        const error = err as Error
        setError(error)
        return null
      } finally {
        setLoading(false)
        setQueuePosition(null)
      }
    },
    [graphId]
  )

  // Simple query method that returns just the data
  const query = useCallback(
    async (cypher: string, parameters?: Record<string, any>) => {
      const result = await execute(cypher, parameters)
      return result?.data || []
    },
    [execute]
  )

  return {
    execute,
    query,
    loading,
    error,
    data,
    queuePosition,
  }
}

/**
 * Hook for streaming large query results
 *
 * @example
 * ```tsx
 * const { stream, isStreaming, error, cancel } = useStreamingQuery('graph_123')
 *
 * const handleStream = async () => {
 *   const iterator = stream('MATCH (n) RETURN n')
 *   for await (const batch of iterator) {
 *     console.log('Received batch:', batch)
 *   }
 * }
 * ```
 */
export function useStreamingQuery(graphId: string) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [rowsReceived, setRowsReceived] = useState(0)
  const clientRef = useRef<QueryClient>()

  useEffect(() => {
    const sdkConfig = getSDKExtensionsConfig()
    const clientConfig = client.getConfig()
    clientRef.current = new QueryClient({
      baseUrl:
        sdkConfig.baseUrl || clientConfig.baseUrl || 'http://localhost:8000',
      credentials: sdkConfig.credentials,
      headers: sdkConfig.headers,
    })

    return () => {
      clientRef.current?.close()
    }
  }, [])

  const stream = useCallback(
    async function* (
      query: string,
      parameters?: Record<string, any>,
      chunkSize: number = 100
    ): AsyncIterableIterator<any[]> {
      if (!clientRef.current) return

      setIsStreaming(true)
      setError(null)
      setRowsReceived(0)

      try {
        const iterator = clientRef.current.streamQuery(
          graphId,
          query,
          parameters,
          chunkSize
        )

        let buffer: any[] = []
        let count = 0

        for await (const row of iterator) {
          buffer.push(row)
          count++

          if (buffer.length >= chunkSize) {
            setRowsReceived(count)
            yield buffer
            buffer = []
          }
        }

        // Yield any remaining items
        if (buffer.length > 0) {
          setRowsReceived(count)
          yield buffer
        }
      } catch (err) {
        setError(err as Error)
        throw err
      } finally {
        setIsStreaming(false)
      }
    },
    [graphId]
  )

  const cancel = useCallback(() => {
    clientRef.current?.close()
    setIsStreaming(false)
  }, [])

  return {
    stream,
    isStreaming,
    error,
    rowsReceived,
    cancel,
  }
}

/**
 * Hook for monitoring long-running operations
 *
 * @example
 * ```tsx
 * const { monitor, status, progress, error, result } = useOperation<BackupResult>()
 *
 * const handleBackup = async () => {
 *   const { operation_id } = await createBackup({ ... })
 *   const result = await monitor(operation_id)
 *   console.log('Backup completed:', result)
 * }
 * ```
 */
export function useOperation<T = any>(operationId?: string) {
  const [status, setStatus] = useState<
    'idle' | 'running' | 'completed' | 'error'
  >('idle')
  const [progress, setProgress] = useState<OperationProgress | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [result, setResult] = useState<OperationResult<T> | null>(null)
  const clientRef = useRef<OperationClient>()

  useEffect(() => {
    const sdkConfig = getSDKExtensionsConfig()
    const clientConfig = client.getConfig()
    clientRef.current = new OperationClient({
      baseUrl:
        sdkConfig.baseUrl || clientConfig.baseUrl || 'http://localhost:8000',
      credentials: sdkConfig.credentials,
      maxRetries: sdkConfig.maxRetries,
      retryDelay: sdkConfig.retryDelay,
    })

    return () => {
      clientRef.current?.closeAll()
    }
  }, [])

  const monitor = useCallback(
    async (
      id: string,
      timeout?: number
    ): Promise<OperationResult<T> | null> => {
      if (!clientRef.current) return null

      setStatus('running')
      setError(null)
      setResult(null)
      setProgress(null)

      try {
        const opResult = await clientRef.current.monitorOperation<T>(id, {
          onProgress: (p) => {
            setProgress(p)
          },
          onQueueUpdate: (position, estimatedWait) => {
            setProgress({
              message: `Queue position: ${position}`,
              progressPercent: 0,
              details: { position, estimatedWait },
            })
          },
          timeout,
        })

        setResult(opResult)
        setStatus(opResult.success ? 'completed' : 'error')

        if (!opResult.success && opResult.error) {
          setError(new Error(opResult.error))
        }

        return opResult
      } catch (err) {
        const error = err as Error
        setError(error)
        setStatus('error')
        return null
      }
    },
    []
  )

  const cancel = useCallback(async (id: string) => {
    if (!clientRef.current) return

    try {
      await clientRef.current.cancelOperation(id)
      setStatus('idle')
    } catch (err) {
      setError(err as Error)
    }
  }, [])

  // Auto-monitor if operationId is provided
  useEffect(() => {
    if (operationId && status === 'idle') {
      monitor(operationId)
    }
  }, [operationId, monitor, status])

  return {
    monitor,
    cancel,
    status,
    progress,
    error,
    result,
  }
}

/**
 * Hook for monitoring multiple operations concurrently
 *
 * @example
 * ```tsx
 * const { monitorAll, results, allCompleted, hasErrors } = useMultipleOperations()
 *
 * const handleMultiple = async () => {
 *   const operations = await Promise.all([
 *     createBackup(...),
 *     createExport(...),
 *   ])
 *
 *   const results = await monitorAll(operations.map(op => op.operation_id))
 * }
 * ```
 */
export function useMultipleOperations<T = any>() {
  const [results, setResults] = useState<Map<string, OperationResult<T>>>(
    new Map()
  )
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Map<string, Error>>(new Map())
  const clientRef = useRef<OperationClient>()

  useEffect(() => {
    const sdkConfig = getSDKExtensionsConfig()
    const clientConfig = client.getConfig()
    clientRef.current = new OperationClient({
      baseUrl:
        sdkConfig.baseUrl || clientConfig.baseUrl || 'http://localhost:8000',
      credentials: sdkConfig.credentials,
      maxRetries: sdkConfig.maxRetries,
      retryDelay: sdkConfig.retryDelay,
    })

    return () => {
      clientRef.current?.closeAll()
    }
  }, [])

  const monitorAll = useCallback(
    async (
      operationIds: string[]
    ): Promise<Map<string, OperationResult<T>>> => {
      if (!clientRef.current) return new Map()

      setLoading(true)
      setResults(new Map())
      setErrors(new Map())

      try {
        const allResults =
          await clientRef.current.monitorMultiple<T>(operationIds)
        setResults(allResults)

        // Extract any errors
        const newErrors = new Map<string, Error>()
        allResults.forEach((result, id) => {
          if (!result.success && result.error) {
            newErrors.set(id, new Error(result.error))
          }
        })
        setErrors(newErrors)

        return allResults
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const allCompleted =
    results.size > 0 &&
    Array.from(results.values()).every((r) => r.success || r.error)

  const hasErrors = errors.size > 0

  return {
    monitorAll,
    results,
    errors,
    loading,
    allCompleted,
    hasErrors,
  }
}

/**
 * Hook that provides access to all SDK extension clients
 * Useful when you need direct access to the underlying clients
 *
 * @example
 * ```tsx
 * const clients = useSDKClients()
 *
 * // Direct access to clients
 * const result = await clients.query.query('graph_123', 'MATCH (n) RETURN n')
 * ```
 */
export function useSDKClients() {
  const [clients, setClients] = useState<{
    query: QueryClient | null
    operations: OperationClient | null
  }>({
    query: null,
    operations: null,
  })

  useEffect(() => {
    const sdkConfig = getSDKExtensionsConfig()
    const clientConfig = client.getConfig()
    const baseConfig = {
      baseUrl:
        sdkConfig.baseUrl || clientConfig.baseUrl || 'http://localhost:8000',
      credentials: sdkConfig.credentials,
      headers: sdkConfig.headers,
    }

    const queryClient = new QueryClient(baseConfig)
    const operationsClient = new OperationClient(baseConfig)

    setClients({
      query: queryClient,
      operations: operationsClient,
    })

    return () => {
      queryClient.close()
      operationsClient.closeAll()
    }
  }, [])

  return clients
}
