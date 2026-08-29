# RoboSystems TypeScript SDK Clients

**High-level clients with SSE support** for the RoboSystems TypeScript Client

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

The high-level clients wrap the generated OpenAPI SDK with production-ready enhancements:

- **Server-Sent Events (SSE)** with automatic reconnection and event replay
- **Smart query execution** with automatic queueing and progress monitoring
- **Operation monitoring** for long-running tasks with real-time updates
- **Domain clients** for RoboLedger, RoboInvestor, and the element library
- **AI Operator** access for natural language analysis
- **React hooks** for seamless UI integration
- **Full TypeScript support** with comprehensive type definitions

## Quick Start

### Installation

The clients are included with the main SDK:

```bash
npm install @robosystems/client
# or
yarn add @robosystems/client
# or
pnpm add @robosystems/client
```

### Basic SSE Usage

```typescript
import { SSEClient, EventType } from '@robosystems/client/clients'

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
  console.log('Progress:', data)
})

sseClient.on(EventType.DATA_CHUNK, (data) => {
  console.log('Received chunk:', data)
})

sseClient.on(EventType.OPERATION_COMPLETED, (data) => {
  console.log('Operation completed:', data)
})

// Clean up when done
sseClient.close()
```

### Query Execution

```typescript
import { QueryClient } from '@robosystems/client/clients'

const queryClient = new QueryClient({
  baseUrl: 'https://api.robosystems.ai',
  token: 'your-jwt-token', // or `credentials: 'include'` for cookie auth
})

// Simple query — auto mode handles sync, queued, and streamed execution
const result = await queryClient.query(
  'your-graph-id',
  'MATCH (c:Company) RETURN c.name, c.revenue ORDER BY c.revenue DESC LIMIT 10'
)
console.log(`${result.row_count} rows in ${result.execution_time_ms}ms`)

// Full control — queue callbacks and execution mode
const executed = await queryClient.executeQuery(
  'your-graph-id',
  { query: 'MATCH (c:Company) RETURN c.name' },
  {
    mode: 'auto',
    onQueueUpdate: (position, estimatedWait) => {
      console.log(`Queue position: ${position}, ETA: ${estimatedWait}s`)
    },
    onProgress: (message) => console.log(message),
  }
)
```

### Streaming Large Results

```typescript
// Stream rows without holding the full result set in memory
for await (const row of queryClient.streamQuery(
  'your-graph-id',
  'MATCH (t:Transaction) RETURN t',
  undefined, // parameters
  1000 // chunk size
)) {
  processRow(row)
}
```

## SSE Event Types

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

## Advanced SSE Features

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
  // Fall back to polling or show error to user
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
})
```

## Operation Monitoring

### OperationClient for Long-Running Tasks

```typescript
import { OperationClient } from '@robosystems/client/clients'

const operationClient = new OperationClient({
  baseUrl: 'https://api.robosystems.ai',
  token: 'your-jwt-token',
})

// Monitor any long-running operation
const result = await operationClient.monitorOperation('operation-id', {
  onProgress: (progress) => {
    console.log(`${progress.message} (${progress.progressPercent ?? 0}%)`)
  },
  onQueueUpdate: (position, estimatedWait) => {
    console.log(`Queued at position ${position}, ~${estimatedWait}s`)
  },
  timeout: 300000, // 5 minutes max wait
})

if (result.success) {
  console.log('Completed:', result.result)
} else {
  console.error('Failed:', result.error)
}
```

`OperationClient` also provides `getStatus(operationId)`, `cancelOperation(operationId)`,
`waitForOperation(operationId, timeoutMs)` for fire-and-forget waits,
`monitorMultiple(operationIds)` for concurrent monitoring, and `closeAll()` for cleanup.

## Domain Clients

Three high-level facade clients cover the RoboSystems product domains. Reads go
through GraphQL at `/extensions/{graph_id}/graphql`; writes go through named
command operations — the facades keep a stable method surface over that
transport split.

All three accept the same configuration: `baseUrl`, plus optional
`credentials`, `headers`, a static `token`, or a `tokenProvider` callback that
is consulted on every GraphQL request (use it when the JWT can rotate).

The SSE-backed clients (`OperatorClient`, `OperationClient`, `QueryClient`,
`SSEClient`) take the same `tokenProvider` and consult it on every stream
connect. In the browser this is required, not optional: the stream endpoint
authenticates the JWT it finds in the URL, and the backend revokes the previous
JWT on every session refresh, so a static `token` captured at construction
stops opening streams the moment the session rotates. `OperatorClient` also
follows a queued run over `/v1/operations/{id}/status` when it cannot open the
stream at all, so the result of a run that is already executing is never lost.

### LedgerClient (RoboLedger)

Entity, chart of accounts, transactions, event blocks, taxonomy + mappings,
schedules, period close, reports, and publish lists.

```typescript
import { LedgerClient } from '@robosystems/client/ledger'

const ledger = new LedgerClient({
  baseUrl: 'https://api.robosystems.ai',
  token: 'your-jwt-token',
})

const transactions = await ledger.listTransactions('your-graph-id', {
  startDate: '2026-01-01',
  endDate: '2026-03-31',
  limit: 50,
})

const trialBalance = await ledger.getTrialBalance('your-graph-id', {
  startDate: '2026-01-01',
  endDate: '2026-03-31',
})
```

### InvestorClient (RoboInvestor)

Portfolios, securities, positions, and holdings.

```typescript
import { InvestorClient } from '@robosystems/client/investor'

const investor = new InvestorClient({
  baseUrl: 'https://api.robosystems.ai',
  token: 'your-jwt-token',
})

const portfolios = await investor.listPortfolios('your-graph-id', { limit: 25 })
const holdings = await investor.getHoldings('your-graph-id', 'portfolio-id')
```

### LibraryClient (element library)

Taxonomies, elements, structures, and search. Pass the `"library"` sentinel as
the graph id for the canonical library, or a tenant graph id to also include
that tenant's own chart of accounts and custom taxonomies.

```typescript
import { LibraryClient } from '@robosystems/client/library'

const library = new LibraryClient({
  baseUrl: 'https://api.robosystems.ai',
  token: 'your-jwt-token',
})

const taxonomies = await library.listLibraryTaxonomies('library', {
  includeElementCount: true,
})

const matches = await library.searchLibraryElements('library', 'revenue', {
  limit: 20,
})
```

## AI Operator

```typescript
import { OperatorClient } from '@robosystems/client/clients'

const operator = new OperatorClient({
  baseUrl: 'https://api.robosystems.ai',
  token: 'your-jwt-token',
})

// Auto-selected operator for a natural language question
const answer = await operator.query('your-graph-id', 'How did gross margin trend this year?')
console.log(answer.content)

// A named operator (`analyst`, `mapping`) with progress callbacks
const analysis = await operator.executeOperator('your-graph-id', 'analyst', {
  message: 'Summarize Q1 performance',
})
```

## React Integration

All hooks are exported from `@robosystems/client/clients` and pick up the
global configuration set via `setSDKClientConfig`.

### useQuery Hook

```typescript
import { useQuery } from '@robosystems/client/clients'

function QueryRunner() {
  const { execute, loading, error, data, queuePosition } = useQuery('your-graph-id')

  const runQuery = async () => {
    const result = await execute('MATCH (c:Company) RETURN c.name LIMIT 100')
    console.log('Query completed:', result)
  }

  return (
    <div>
      <button onClick={runQuery} disabled={loading}>
        Run Query
      </button>

      {loading && queuePosition !== null && <p>Queue position: {queuePosition}</p>}
      {error && <div className="error">{error.message}</div>}
      {data && <pre>{JSON.stringify(data.data, null, 2)}</pre>}
    </div>
  )
}
```

### useStreamingQuery Hook

```typescript
import { useStreamingQuery } from '@robosystems/client/clients'

function StreamRunner() {
  const { stream, isStreaming, error, rowsReceived, cancel } = useStreamingQuery('your-graph-id')

  const handleStream = async () => {
    for await (const batch of stream('MATCH (t:Transaction) RETURN t', undefined, 100)) {
      console.log(`Received batch of ${batch.length} rows`)
    }
  }

  return (
    <div>
      <button onClick={handleStream} disabled={isStreaming}>
        Stream Results
      </button>
      {isStreaming && <p>{rowsReceived} rows received…</p>}
      {error && <p>{error.message}</p>}
    </div>
  )
}
```

### useOperation Hook

```typescript
import { useOperation } from '@robosystems/client/clients'

function OperationMonitor({ operationId }: { operationId: string }) {
  const { status, progress, error, result } = useOperation(operationId)

  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <h3>Status: {status}</h3>
      {progress && (
        <div>
          <progress value={progress.progressPercent ?? 0} max="100" />
          <p>{progress.message}</p>
        </div>
      )}
      {result?.success && <pre>{JSON.stringify(result.result, null, 2)}</pre>}
    </div>
  )
}
```

Also available: `useMultipleOperations()` for monitoring several operations
concurrently, and `useSDKClients()` for direct access to configured
`QueryClient` / `OperationClient` instances.

## Configuration

### Environment Variables

```bash
# Default base URL for all clients (falls back to http://localhost:8000)
NEXT_PUBLIC_API_URL=https://api.robosystems.ai
```

### Global Configuration

```typescript
import { setSDKClientConfig } from '@robosystems/client/clients'

setSDKClientConfig({
  baseUrl: 'https://api.robosystems.ai',
  credentials: 'include', // For cookie auth
  // token: 'your-jwt-token',        // static credential, or…
  // tokenProvider: () => getJwt(),  // rotating credential (wins over token;
  //                                 // used for GraphQL requests and SSE connects)
})
```

`configureWithJWT(token)` is a shorthand that sets the token and switches
`credentials` to `'omit'`.

### Aggregate Client

`RoboSystemsClients` bundles all the clients behind one configuration:

```typescript
import { RoboSystemsClients } from '@robosystems/client/clients'

const robo = new RoboSystemsClients({
  baseUrl: 'https://api.robosystems.ai',
  credentials: 'include',
  token: 'your-jwt-token',
  maxRetries: 5,
  retryDelay: 1000,
})

const count = await robo.query.query('your-graph-id', 'MATCH (n) RETURN count(n)')
const trialBalance = await robo.ledger.getTrialBalance('your-graph-id')
robo.close()
```

A lazily-created default instance is also exported as `clients`:

```typescript
import { clients } from '@robosystems/client/clients'

const result = await clients.query.query('your-graph-id', 'MATCH (n) RETURN count(n)')
```

## Error Handling

Queries that land in the queue can be handled without waiting by passing
`maxWait: 0`, which throws a typed `QueuedQueryError`:

```typescript
import { QueuedQueryError } from '@robosystems/client/clients'

try {
  await queryClient.executeQuery('your-graph-id', { query: longQuery }, { maxWait: 0 })
} catch (err) {
  if (err instanceof QueuedQueryError) {
    console.log(
      `Queued as ${err.queueInfo.operation_id} at position ${err.queueInfo.queue_position}`
    )
    // Monitor err.queueInfo.operation_id with OperationClient / SSEClient
  }
}
```

## API Reference

### Core Classes

- **`RoboSystemsClients`** - Aggregate client bundling everything below
- **`SSEClient`** - Server-Sent Events client with auto-reconnection
- **`QueryClient`** - Query execution with queueing and streaming support
- **`OperationClient`** - Long-running operation monitoring
- **`OperatorClient`** - AI operator queries (auto-selected, or a named operator via `executeOperator`)
- **`LedgerClient`** - RoboLedger domain facade
- **`InvestorClient`** - RoboInvestor domain facade
- **`LibraryClient`** - Element library facade

### Types

- **`EventType`** - Enum of all supported SSE event types
- **`SSEEvent`** - Typed SSE event structure
- **`QueryResult`** / **`QueuedQueryResponse`** / **`QueuedQueryError`** - Query results and queueing
- **`OperationProgress`** / **`OperationResult`** - Operation monitoring structures
- **`OperatorResult`** - AI operator responses

### React Hooks

- **`useQuery`** - Cypher queries with loading/error/queue state
- **`useStreamingQuery`** - Streaming large query results in batches
- **`useOperation`** - Monitoring a long-running operation
- **`useMultipleOperations`** - Monitoring several operations concurrently
- **`useSDKClients`** - Direct access to configured clients

### Configuration

- **`setSDKClientConfig`** / **`getSDKClientConfig`** / **`resetSDKClientConfig`** - Global client configuration
- **`configureWithJWT`** - JWT auth shorthand
- **`SDKClientConfig`** - Configuration shape

## License

MIT License - see [LICENSE](../LICENSE) file for details.

## Support

- **API Reference**: [api.robosystems.ai/docs](https://api.robosystems.ai/docs)
- **Issues**: [GitHub Issues](https://github.com/RoboFinSystems/robosystems-typescript-client/issues)

---

**RoboSystems TypeScript SDK Clients** - Typed, streaming-aware access to financial knowledge graphs.
