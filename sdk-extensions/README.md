# RoboSystems Typescript Client Extensions

🚀 **Enhanced SSE and Real-time Features** for the RoboSystems Typescript Client

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

The RoboSystems Typescript Client Extensions provide production-ready enhancements for real-time operations:

- **Server-Sent Events (SSE)** with automatic reconnection and event replay
- **Smart Query Execution** with automatic queueing and progress monitoring
- **Operation Monitoring** for long-running tasks with real-time updates
- **Connection Management** with rate limiting and circuit breaker patterns
- **React Hooks** for seamless UI integration
- **Full TypeScript Support** with comprehensive type definitions

## 🚀 Quick Start

### Installation

The extensions are included with the main SDK:

```bash
npm install @robosystems/client
# or
yarn add @robosystems/client
# or
pnpm add @robosystems/client
```

### Basic SSE Usage

```typescript
import { SSEClient, EventType } from '@robosystems/client/extensions'

// Initialize SSE client
const sseClient = new SSEClient({
  baseUrl: 'https://api.robosystems.ai',
  credentials: 'include', // For cookie auth
  maxRetries: 5,
  retryDelay: 1000,
})

// Connect to operation stream
await sseClient.connect('operation-id-123')

// Listen for events
sseClient.on(EventType.OPERATION_PROGRESS, (data) => {
  console.log(`Progress: ${data.message} (${data.percentage}%)`)
})

sseClient.on(EventType.DATA_CHUNK, (data) => {
  console.log(`Received ${data.rows.length} rows`)
  processRows(data.rows)
})

sseClient.on(EventType.OPERATION_COMPLETED, (data) => {
  console.log('Operation completed:', data.result)
})

// Clean up when done
sseClient.close()
```

### Query Execution with Progress Monitoring

```typescript
import { QueryClient } from '@robosystems/client/extensions'

const queryClient = new QueryClient({
  baseUrl: 'https://api.robosystems.ai',
  apiKey: 'your-api-key',
})

// Execute query with automatic SSE monitoring
const result = await queryClient.executeWithProgress(
  'your-graph-id',
  'MATCH (c:Company) RETURN c.name, c.revenue ORDER BY c.revenue DESC',
  {
    onProgress: (progress) => {
      console.log(`${progress.current}/${progress.total} rows processed`)
    },
    onQueueUpdate: (position, estimatedWait) => {
      console.log(`Queue position: ${position}, ETA: ${estimatedWait}s`)
    },
  }
)

console.log(`Query completed with ${result.rowCount} results`)
```

## 📊 SSE Event Types

The SDK supports all RoboSystems SSE event types:

```typescript
enum EventType {
  // Operation lifecycle
  OPERATION_STARTED = 'operation_started',
  OPERATION_PROGRESS = 'operation_progress',
  OPERATION_COMPLETED = 'operation_completed',
  OPERATION_ERROR = 'operation_error',
  OPERATION_CANCELLED = 'operation_cancelled',

  // Data streaming
  DATA_CHUNK = 'data_chunk',
  METADATA = 'metadata',

  // Queue management
  QUEUE_UPDATE = 'queue_update',

  // Connection health
  HEARTBEAT = 'heartbeat',
}
```

## 🔄 Advanced SSE Features

### Automatic Reconnection

The SSE client automatically reconnects on connection loss with exponential backoff:

```typescript
const sseClient = new SSEClient({
  baseUrl: 'https://api.robosystems.ai',
  maxRetries: 5, // Maximum reconnection attempts
  retryDelay: 1000, // Initial retry delay (ms)
  heartbeatInterval: 30000, // Heartbeat check interval
})

// Monitor reconnection attempts
sseClient.on('reconnecting', ({ attempt, delay, lastEventId }) => {
  console.log(`Reconnecting (attempt ${attempt}) in ${delay}ms...`)
  console.log(`Resuming from event ${lastEventId}`)
})

sseClient.on('max_retries_exceeded', (error) => {
  console.error('Failed to reconnect after maximum attempts')
  // Fallback to polling or show error to user
})
```

### Event Replay

SSE automatically resumes from the last received event after reconnection:

```typescript
// Connect with specific starting sequence
await sseClient.connect('operation-id', fromSequence)

// The client tracks lastEventId automatically
sseClient.on('event', (event) => {
  console.log(`Event ${event.id}: ${event.event}`)
  // Events are guaranteed to be in sequence
})
```

### Rate Limiting & Connection Management

The SDK respects server-side rate limits:

- **Maximum 5 concurrent SSE connections per user**
- **10 new connections per minute rate limit**
- **Automatic circuit breaker for Redis failures**

```typescript
// Handle rate limiting gracefully
try {
  await sseClient.connect('operation-id')
} catch (error) {
  if (error.status === 429) {
    console.log('Rate limit exceeded - falling back to polling')
    // Use polling fallback
    const result = await pollOperation('operation-id')
  } else if (error.status === 503) {
    console.log('SSE temporarily unavailable - circuit breaker open')
    // SSE system is degraded, use alternative method
  }
}
```

## 🎯 Operation Monitoring

### OperationClient for Long-Running Tasks

```typescript
import { OperationClient, OperationStatus } from '@robosystems/client/extensions'

const operationClient = new OperationClient({
  baseUrl: 'https://api.robosystems.ai',
  apiKey: 'your-api-key',
})

// Monitor any long-running operation
const result = await operationClient.monitor('operation-id', {
  onProgress: (progress) => {
    console.log(`Step ${progress.currentStep}/${progress.totalSteps}`)
    console.log(`${progress.message} (${progress.percentage}%)`)
    updateProgressBar(progress.percentage)
  },
  onStatusChange: (status) => {
    switch (status) {
      case OperationStatus.QUEUED:
        showMessage('Operation queued...')
        break
      case OperationStatus.RUNNING:
        showMessage('Processing...')
        break
      case OperationStatus.COMPLETED:
        showMessage('Success!')
        break
      case OperationStatus.FAILED:
        showMessage('Operation failed')
        break
    }
  },
  maxWaitTime: 300000, // 5 minutes max wait
})

if (result.status === OperationStatus.COMPLETED) {
  processResults(result.data)
}
```

### Progress Tracking Patterns

```typescript
// Create a reusable progress tracker
class ProgressTracker {
  private startTime = Date.now()
  private lastUpdate = Date.now()

  onProgress = (progress: OperationProgress) => {
    const elapsed = Date.now() - this.startTime
    const rate = progress.rowsProcessed / (elapsed / 1000)
    const eta = (progress.totalRows - progress.rowsProcessed) / rate

    console.log(`Processing: ${progress.rowsProcessed}/${progress.totalRows} rows`)
    console.log(`Rate: ${rate.toFixed(0)} rows/sec`)
    console.log(`ETA: ${this.formatDuration(eta * 1000)}`)

    // Update UI
    this.updateUI(progress)
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  private updateUI(progress: OperationProgress) {
    // Update your UI components
    document.querySelector('#progress-bar')?.setAttribute('value', progress.percentage.toString())
    document.querySelector('#progress-text')?.textContent =
      `${progress.message} (${progress.percentage}%)`
  }
}

// Use the tracker
const tracker = new ProgressTracker()
await operationClient.monitor('operation-id', {
  onProgress: tracker.onProgress,
})
```

## ⚛️ React Integration

### useSSE Hook

```typescript
import { useSSE } from '@robosystems/client/extensions/hooks'

function OperationMonitor({ operationId }: { operationId: string }) {
  const {
    data,
    progress,
    status,
    error,
    isConnected
  } = useSSE(operationId, {
    onProgress: (p) => console.log('Progress:', p),
    onDataChunk: (chunk) => console.log('Chunk:', chunk),
  })

  if (error) return <div>Error: {error.message}</div>
  if (!isConnected) return <div>Connecting...</div>

  return (
    <div>
      <h3>Operation Status: {status}</h3>
      {progress && (
        <div>
          <progress value={progress.percentage} max="100" />
          <p>{progress.message}</p>
        </div>
      )}
      {data && (
        <div>
          <h4>Results:</h4>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
```

### useQueryWithSSE Hook

```typescript
import { useQueryWithSSE } from '@robosystems/client/extensions/hooks'

function QueryRunner() {
  const {
    execute,
    loading,
    data,
    error,
    progress,
    queuePosition
  } = useQueryWithSSE('your-graph-id')

  const runQuery = async () => {
    const result = await execute(
      'MATCH (c:Company) RETURN c.name, c.revenue LIMIT 100'
    )
    console.log('Query completed:', result)
  }

  return (
    <div>
      <button onClick={runQuery} disabled={loading}>
        Run Query
      </button>

      {loading && (
        <div>
          {queuePosition > 0 && <p>Queue position: {queuePosition}</p>}
          {progress && <p>Progress: {progress.percentage}%</p>}
        </div>
      )}

      {error && <div className="error">{error.message}</div>}

      {data && (
        <table>
          <tbody>
            {data.rows.map((row, i) => (
              <tr key={i}>
                <td>{row['c.name']}</td>
                <td>${row['c.revenue'].toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
```

## 🛡️ Error Handling & Resilience

### Circuit Breaker Pattern

The SSE system includes automatic circuit breaker protection:

```typescript
// The circuit breaker automatically opens after 3 Redis failures
// It will close again after a cooldown period

sseClient.on('circuit_breaker_open', () => {
  console.log('SSE circuit breaker opened - falling back to polling')
  // Automatically degrades to polling
})

sseClient.on('circuit_breaker_closed', () => {
  console.log('SSE circuit breaker closed - resuming streaming')
  // Automatically resumes SSE when healthy
})
```

### Graceful Degradation

```typescript
import { QueryClient, FallbackStrategy } from '@robosystems/client/extensions'

const queryClient = new QueryClient({
  baseUrl: 'https://api.robosystems.ai',
  fallbackStrategy: FallbackStrategy.AUTO, // Automatically choose best strategy
})

// Automatically uses best available method:
// 1. SSE streaming (preferred)
// 2. NDJSON streaming (if SSE unavailable)
// 3. Polling (if streaming unavailable)
// 4. Direct response (for small queries)

const result = await queryClient.execute('graph-id', 'MATCH (n) RETURN n', {
  preferStreaming: true, // Hint to prefer streaming
  onFallback: (from, to) => {
    console.log(`Falling back from ${from} to ${to}`)
  },
})
```

### Connection Pool Management

```typescript
// SDK automatically manages SSE connection pooling
const config = {
  maxConnections: 5,        // Per-user limit enforced by server
  connectionTimeout: 10000, // 10 second timeout
  poolStrategy: 'FIFO',     // First-in-first-out recycling
}

// Connections are automatically recycled when limits are reached
const operations = [
  'operation-1',
  'operation-2',
  'operation-3',
  'operation-4',
  'operation-5',
  'operation-6', // Will recycle oldest connection
]

// Monitor connection pool status
sseClient.on('connection_recycled', ({ old, new }) => {
  console.log(`Recycled connection from ${old} to ${new}`)
})
```

## 🔧 Configuration

### Environment Variables

```bash
# API Configuration
NEXT_PUBLIC_ROBOSYSTEMS_API_URL=https://api.robosystems.ai
ROBOSYSTEMS_API_KEY=your-api-key

# SSE Configuration
NEXT_PUBLIC_SSE_MAX_RETRIES=5
NEXT_PUBLIC_SSE_RETRY_DELAY=1000
NEXT_PUBLIC_SSE_HEARTBEAT_INTERVAL=30000

# Feature Flags
NEXT_PUBLIC_ENABLE_SSE=true
NEXT_PUBLIC_PREFER_STREAMING=true
```

### Custom Configuration

```typescript
import { createSSEClient } from '@robosystems/client/extensions'

const sseClient = createSSEClient({
  // API Configuration
  baseUrl: process.env.NEXT_PUBLIC_ROBOSYSTEMS_API_URL,

  // Authentication
  credentials: 'include', // For cookies
  headers: {
    'X-API-Key': process.env.ROBOSYSTEMS_API_KEY,
  },

  // Connection Settings
  maxRetries: 5,
  retryDelay: 1000,
  heartbeatInterval: 30000,

  // Advanced Options
  eventSourceOptions: {
    withCredentials: true,
  },
})
```

## 📊 Performance Optimization

### Stream Processing for Large Datasets

```typescript
import { StreamProcessor } from '@robosystems/client/extensions'

const processor = new StreamProcessor({
  batchSize: 1000,
  concurrency: 3,
})

// Process large query results efficiently
await processor.processStream('your-graph-id', 'MATCH (t:Transaction) RETURN t', {
  onBatch: async (batch) => {
    // Process batch of 1000 rows
    await saveToDB(batch)
    console.log(`Processed ${batch.length} transactions`)
  },
  onProgress: (processed, total) => {
    const percentage = (processed / total) * 100
    console.log(`Progress: ${percentage.toFixed(2)}%`)
  },
})
```

### Caching with SSE Updates

```typescript
import { CachedQueryClient } from '@robosystems/client/extensions'

const cachedClient = new CachedQueryClient({
  ttl: 300000, // 5 minute cache
  maxSize: 100, // Cache up to 100 queries
})

// First call hits the API
const result1 = await cachedClient.execute('graph-id', 'MATCH (n) RETURN COUNT(n)')

// Second call returns from cache
const result2 = await cachedClient.execute('graph-id', 'MATCH (n) RETURN COUNT(n)')

// SSE updates automatically invalidate relevant cache entries
cachedClient.on('cache_invalidated', (query) => {
  console.log('Cache invalidated for:', query)
})
```

## 🧪 Testing

### Mock SSE for Testing

```typescript
import { MockSSEClient } from '@robosystems/client/extensions/testing'

describe('SSE Integration', () => {
  it('should handle progress events', async () => {
    const mockClient = new MockSSEClient()

    // Set up mock events
    mockClient.simulateEvents([
      { event: EventType.OPERATION_STARTED, data: { message: 'Starting' } },
      { event: EventType.OPERATION_PROGRESS, data: { percentage: 50 } },
      { event: EventType.OPERATION_COMPLETED, data: { result: 'Success' } },
    ])

    // Test your component
    const { getByText } = render(
      <OperationMonitor
        operationId="test-123"
        sseClient={mockClient}
      />
    )

    await waitFor(() => {
      expect(getByText('Starting')).toBeInTheDocument()
      expect(getByText('50%')).toBeInTheDocument()
      expect(getByText('Success')).toBeInTheDocument()
    })
  })
})
```

## 📚 API Reference

### Core Classes

- **`SSEClient`** - Server-Sent Events client with auto-reconnection
- **`QueryClient`** - Enhanced query execution with SSE support
- **`OperationClient`** - Long-running operation monitoring
- **`StreamProcessor`** - Efficient stream processing for large datasets

### Event Types

- **`EventType`** - Enum of all supported SSE event types
- **`SSEEvent`** - Typed SSE event structure
- **`OperationProgress`** - Progress update structure
- **`OperationStatus`** - Operation status enum

### React Hooks

- **`useSSE`** - Hook for SSE connection management
- **`useQueryWithSSE`** - Hook for queries with progress
- **`useOperation`** - Hook for operation monitoring

### Utilities

- **`createSSEClient`** - Factory for configured SSE clients
- **`formatDuration`** - Human-readable duration formatting
- **`parseSSEEvent`** - SSE event parsing utility

## 🐛 Troubleshooting

### Common Issues

**Rate Limit Errors (429)**

```typescript
// Handle rate limiting gracefully
if (error.status === 429) {
  const retryAfter = error.headers['retry-after'] || 60
  console.log(`Rate limited. Retry after ${retryAfter} seconds`)

  // Use exponential backoff
  await sleep(retryAfter * 1000)
  await retry()
}
```

**Connection Drops**

```typescript
// SSE automatically reconnects, but you can handle it manually
sseClient.on('disconnected', () => {
  showNotification('Connection lost. Reconnecting...')
})

sseClient.on('connected', () => {
  showNotification('Connection restored')
})
```

**Circuit Breaker Open (503)**

```typescript
// SSE system temporarily disabled
if (error.status === 503) {
  console.log('SSE system unavailable - using fallback')
  // Automatically falls back to polling
}
```

### Debug Mode

```typescript
// Enable debug logging
const sseClient = new SSEClient({
  baseUrl: 'https://api.robosystems.ai',
  debug: true, // Enables detailed logging
})

// Monitor all events
sseClient.on('*', (event, data) => {
  console.log(`[SSE Debug] ${event}:`, data)
})
```

## 📄 License

MIT License - see [LICENSE](../../LICENSE) file for details.

## 🤝 Contributing

See the [Contributing Guide](../../CONTRIBUTING.md) for development setup and guidelines.

## 📞 Support

- **Documentation**: [docs.robosystems.ai](https://docs.robosystems.ai)
- **API Reference**: [api.robosystems.ai/docs](https://api.robosystems.ai/docs)
- **Discord**: [Join our community](https://discord.gg/robosystems)
- **Issues**: [GitHub Issues](https://github.com/robosystems/sdk/issues)

---

**RoboSystems Typescript Client Extensions** - Production-ready SSE streaming and real-time monitoring for financial knowledge graphs.

_Built with ❤️ by the RoboSystems team_
