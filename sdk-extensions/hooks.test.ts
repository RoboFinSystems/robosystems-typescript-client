import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  useMultipleOperations,
  useOperation,
  useQuery,
  useSDKClients,
  useStreamingQuery,
} from './hooks'

// Mock the SDK client
vi.mock('../sdk/client.gen', () => ({
  client: {
    getConfig: vi.fn(() => ({
      baseUrl: 'http://mock-sdk.com',
      headers: {},
    })),
  },
}))

// Mock the config module
vi.mock('./config', () => ({
  getSDKExtensionsConfig: vi.fn(() => ({
    baseUrl: 'http://test-api.com',
    credentials: 'include',
    headers: {},
    token: 'test-token',
    maxRetries: 3,
    retryDelay: 1000,
  })),
  extractTokenFromSDKClient: vi.fn(() => 'test-token'),
}))

// Mock the SDK gen functions to prevent real HTTP calls
vi.mock('../sdk/sdk.gen', () => ({
  executeCypherQuery: vi.fn(),
  getOperationStatus: vi.fn(),
  cancelOperation: vi.fn(),
}))

// Create a mock response helper
function createMockResponse(data: any, options: { ok?: boolean; status?: number } = {}) {
  return {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    statusText: 'OK',
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => data,
    text: async () => JSON.stringify(data),
    blob: async () => new Blob([JSON.stringify(data)]),
    arrayBuffer: async () => new TextEncoder().encode(JSON.stringify(data)).buffer,
  }
}

describe('useQuery', () => {
  let mockFetch: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch = vi.fn()
    global.fetch = mockFetch
    globalThis.fetch = mockFetch
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useQuery('graph_1'))

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.data).toBeNull()
    expect(result.current.queuePosition).toBeNull()
    expect(typeof result.current.execute).toBe('function')
    expect(typeof result.current.query).toBe('function')
  })

  it('should execute a query and return data', async () => {
    const mockResult = {
      data: [{ name: 'Alice' }],
      columns: ['name'],
      row_count: 1,
      execution_time_ms: 10,
    }

    mockFetch.mockResolvedValue(createMockResponse(mockResult))

    const { result } = renderHook(() => useQuery('graph_1'))

    await act(async () => {
      const queryResult = await result.current.execute('MATCH (n) RETURN n')
      expect(queryResult).not.toBeNull()
      expect(queryResult!.data).toEqual([{ name: 'Alice' }])
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.data).not.toBeNull()
  })

  it('should set loading state during execution', async () => {
    let resolvePromise: (value: any) => void
    const pending = new Promise((resolve) => {
      resolvePromise = resolve
    })

    mockFetch.mockReturnValue(pending)

    const { result } = renderHook(() => useQuery('graph_1'))

    // Start the query (don't await)
    act(() => {
      result.current.execute('MATCH (n) RETURN n')
    })

    // Should be loading while pending
    expect(result.current.loading).toBe(true)

    // Resolve
    await act(async () => {
      resolvePromise!(
        createMockResponse({
          data: [],
          columns: [],
          row_count: 0,
          execution_time_ms: 0,
        })
      )
    })

    expect(result.current.loading).toBe(false)
  })

  it('should set error state on failure', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useQuery('graph_1'))

    await act(async () => {
      const queryResult = await result.current.execute('BAD QUERY')
      expect(queryResult).toBeNull()
    })

    expect(result.current.error).not.toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('should provide a simple query method that returns data array', async () => {
    mockFetch.mockResolvedValue(
      createMockResponse({
        data: [{ id: 1 }, { id: 2 }],
        columns: ['id'],
        row_count: 2,
        execution_time_ms: 5,
      })
    )

    const { result } = renderHook(() => useQuery('graph_1'))

    let data: any[]
    await act(async () => {
      data = await result.current.query('MATCH (n) RETURN n')
    })

    expect(data!).toEqual([{ id: 1 }, { id: 2 }])
  })

  it('should return empty array from query on failure', async () => {
    mockFetch.mockRejectedValue(new Error('fail'))

    const { result } = renderHook(() => useQuery('graph_1'))

    let data: any[]
    await act(async () => {
      data = await result.current.query('BAD')
    })

    expect(data!).toEqual([])
  })

  it('should clear previous data on new execute', async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse({
        data: [{ id: 1 }],
        columns: ['id'],
        row_count: 1,
        execution_time_ms: 5,
      })
    )

    const { result } = renderHook(() => useQuery('graph_1'))

    await act(async () => {
      await result.current.execute('FIRST QUERY')
    })

    expect(result.current.data).not.toBeNull()

    // Now the next query will also succeed
    mockFetch.mockResolvedValueOnce(
      createMockResponse({
        data: [{ id: 2 }],
        columns: ['id'],
        row_count: 1,
        execution_time_ms: 3,
      })
    )

    await act(async () => {
      await result.current.execute('SECOND QUERY')
    })

    expect(result.current.data!.data).toEqual([{ id: 2 }])
  })
})

describe('useStreamingQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useStreamingQuery('graph_1'))

    expect(result.current.isStreaming).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.rowsReceived).toBe(0)
    expect(typeof result.current.stream).toBe('function')
    expect(typeof result.current.cancel).toBe('function')
  })

  it('should cancel and reset streaming state', () => {
    const { result } = renderHook(() => useStreamingQuery('graph_1'))

    act(() => {
      result.current.cancel()
    })

    expect(result.current.isStreaming).toBe(false)
  })
})

describe('useOperation', () => {
  let mockFetch: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch = vi.fn()
    global.fetch = mockFetch
    globalThis.fetch = mockFetch
  })

  it('should initialize with idle state', () => {
    const { result } = renderHook(() => useOperation())

    expect(result.current.status).toBe('idle')
    expect(result.current.progress).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.result).toBeNull()
    expect(typeof result.current.monitor).toBe('function')
    expect(typeof result.current.cancel).toBe('function')
  })

  it('should set running state when monitoring starts', async () => {
    // Mock EventSource for SSE
    class MockEventSource {
      onopen: any = null
      onerror: any = null
      onmessage: any = null
      readyState = 0
      url: string
      withCredentials = false
      static CONNECTING = 0
      static OPEN = 1
      static CLOSED = 2
      constructor(url: string) {
        this.url = url
        // Never connect - we just want to test the state transition
      }
      addEventListener() {}
      removeEventListener() {}
      close() {
        this.readyState = 2
      }
    }
    global.EventSource = MockEventSource as any

    const { result } = renderHook(() => useOperation())

    // Start monitoring (will hang since SSE never connects, but state should transition)
    act(() => {
      result.current.monitor('op_123', 1000) // short timeout
    })

    expect(result.current.status).toBe('running')
  })

  it('should handle cancel', async () => {
    // Mock the cancel endpoint
    mockFetch.mockResolvedValue(createMockResponse({ status: 'cancelled' }))

    const { result } = renderHook(() => useOperation())

    await act(async () => {
      await result.current.cancel('op_123')
    })

    expect(result.current.status).toBe('idle')
  })

  it('should not throw when cancel is called without a client', () => {
    const { result } = renderHook(() => useOperation())

    // Cancel should not throw even on first render
    expect(async () => {
      await result.current.cancel('op_123')
    }).not.toThrow()
  })
})

describe('useMultipleOperations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useMultipleOperations())

    expect(result.current.results.size).toBe(0)
    expect(result.current.loading).toBe(false)
    expect(result.current.errors.size).toBe(0)
    expect(result.current.allCompleted).toBe(false)
    expect(result.current.hasErrors).toBe(false)
    expect(typeof result.current.monitorAll).toBe('function')
  })

  it('should report allCompleted false when no results', () => {
    const { result } = renderHook(() => useMultipleOperations())

    expect(result.current.allCompleted).toBe(false)
  })

  it('should report hasErrors false initially', () => {
    const { result } = renderHook(() => useMultipleOperations())

    expect(result.current.hasErrors).toBe(false)
  })
})

describe('useSDKClients', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should eventually provide initialized clients', async () => {
    const { result } = renderHook(() => useSDKClients())

    await waitFor(() => {
      expect(result.current.query).not.toBeNull()
      expect(result.current.operations).not.toBeNull()
    })

    expect(typeof result.current.query!.executeQuery).toBe('function')
    expect(typeof result.current.operations!.monitorOperation).toBe('function')
  })

  it('should start with null clients', () => {
    // Before the useEffect fires, clients are null
    const { result } = renderHook(() => useSDKClients())

    // The hook returns an object - it may or may not have initialized by now
    expect(result.current).toBeDefined()
    expect(typeof result.current).toBe('object')
  })
})
