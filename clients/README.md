# RoboSystems TypeScript SDK Clients

The hand-written layer of `@robosystems/client`: facade classes and React hooks over the SDK generated from the OpenAPI spec. The source files in this directory are the reference for every method and option, and the [API reference](https://robosystems.ai/docs/api) for the endpoints behind them. This page covers what they do and where their behavior is easy to get wrong.

## Entry points

| `@robosystems/client` import | Exports                                                                                                                                                    |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/ledger`                    | `LedgerClient`, `GraphQLError`, ledger types                                                                                                               |
| `/investor`                  | `InvestorClient`, `GraphQLError`, investor types                                                                                                           |
| `/library`                   | `LibraryClient`, `LIBRARY_GRAPH_ID`, `GraphQLError`, library types                                                                                         |
| `/query`                     | `QueryClient`, `QueuedQueryError`, query types                                                                                                             |
| `/operations`                | `OperationClient`, operation types                                                                                                                         |
| `/clients`                   | All of the above, plus `RoboSystemsClients`, `clients`, `OperatorClient`, `SSEClient`, `EventType`, the hooks, the config functions, `createRetryingFetch` |
| `.` (the package root)       | Everything in `/clients`, plus the generated SDK, types and client                                                                                         |
| `/client`                    | `client`, the shared instance the generated functions run on                                                                                               |
| `/types`                     | Types generated from the OpenAPI spec                                                                                                                      |
| `/sdk`                       | Generated operation functions                                                                                                                              |

The facades, their subpaths, the hooks, the error classes (`GraphQLError`, the queued-work errors) and the auth config including `tokenProvider` are the stable tier. `/sdk` is the generated tier: it is exported for convenience and not promised, tracks the API, and can change in a minor release. The types in `/types` come from the same spec and change with the API.

`react` is an optional peer dependency, but the package root and `/clients` load the hooks, so importing either without React installed fails with `Cannot find module 'react'`. Without React, use `/ledger`, `/investor`, `/library`, `/query` or `/operations`. `RoboSystemsClients`, `OperatorClient` and `SSEClient` have no React-free subpath.

TypeScript resolves the subpaths with `moduleResolution` set to `bundler` or `nodenext`.

## What the clients call

| Surface                     | Route                                                                               | Client                                   |
| --------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------- |
| Typed reads                 | `POST /extensions/{graph_id}/graphql` (no `graphId` argument; the URL is the scope) | Ledger, investor and library reads       |
| Command writes              | `POST /extensions/{roboledger\|roboinvestor}/{graph_id}/operations/{op}`            | Ledger and investor writes               |
| Cypher                      | `POST /v1/graphs/{graph_id}/query/cypher`                                           | `QueryClient`                            |
| Operation status and events | `GET /v1/operations/{id}/status`, `GET /v1/operations/{id}/stream`                  | `OperationClient`, `SSEClient`           |
| AI operators                | `POST /v1/graphs/{graph_id}/operator[/{type}]`                                      | `OperatorClient`                         |
| Graph lifecycle writes      | `POST /v1/graphs/{graph_id}/operations/{op}`                                        | No facade; generated functions in `/sdk` |
| Health                      | `GET /v1/status`                                                                    | No facade; `getServiceStatus` in `/sdk`  |

## Credentials

- `token`: a static value captured at construction. A value starting with `rfs` is an API key, sent as `X-API-Key`. Anything else is a JWT, sent as `Authorization: Bearer`.
- `tokenProvider`: a callback, sync or async, called on every GraphQL request, facade REST call and stream connect. It wins over `token`. Use it when a JWT can rotate. Returning `null` sends the request with no credential; throwing fails the call.
- `headers`: static headers. A resolved credential replaces any `X-API-Key` or `Authorization` in them.
- `credentials`: passed to `fetch`, and set as `withCredentials` on `EventSource` when `'include'`. It is not an auth method. The API authenticates these calls from the two headers above and the stream's `token` parameter, not from cookies.

## Base URL

| Consumer                              | Where the base URL comes from                                                                                       |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| A facade class you construct          | Its required `baseUrl`                                                                                              |
| `new RoboSystemsClients()`, `clients` | `baseUrl` in the config, then `client.setConfig({ baseUrl })` on the generated client, then `http://localhost:8000` |
| Hooks                                 | `setSDKClientConfig({ baseUrl })`, then `NEXT_PUBLIC_API_URL` read at import, then `http://localhost:8000`          |

`RoboSystemsClients` and `clients` ignore `NEXT_PUBLIC_API_URL` and the `baseUrl` given to `setSDKClientConfig`.

## RoboSystemsClients

One configuration and one instance of each client: `query`, `operator`, `operations`, `ledger`, `investor`, `library`, plus `monitorOperation()`, `createSSEClient()` and `close()`.

```typescript
import { RoboSystemsClients } from '@robosystems/client/clients'

const robo = new RoboSystemsClients({ baseUrl: 'https://api.robosystems.ai', token: apiKey })
const trialBalance = await robo.ledger.getTrialBalance(graphId)
robo.close()
```

`OperationClient` starts a cleanup timer in its constructor, so a Node process that built one, directly or through `RoboSystemsClients`, does not exit until `closeAll()` or `close()` runs.

`clients` is a default instance built on first access with no config, and `executeQuery`, `streamQuery`, `monitorOperation` and `operatorQuery` are shortcuts onto it. Set its sources first. From `setSDKClientConfig` it reads only `token` and `tokenProvider`.

```typescript
import { client } from '@robosystems/client/client'
import { clients, setSDKClientConfig } from '@robosystems/client/clients'

client.setConfig({ baseUrl: 'https://api.robosystems.ai' })
setSDKClientConfig({ tokenProvider: () => getJwt() })
const portfolios = await clients.investor.listPortfolios(graphId)
```

`configureWithJWT(token, config?)` calls `setSDKClientConfig` with that token and, by default, `credentials: 'omit'`. `timeout` on that config is not read by anything.

## Domain facades

Reads return camelCase GraphQL shapes, with `null` for a missing record where the type allows it. Most writes unwrap the operation envelope and return its `result`. Some create methods take an idempotency key, sent as `Idempotency-Key`; others have no parameter for one. The `timeout` option (default 60 seconds) applies to GraphQL reads only.

**LedgerClient:** entities, accounts, transactions and journal entries, event blocks and handlers, agents, aged balances, dimensions, trial balance and account register, taxonomies and mappings, information blocks, schedules, fiscal calendar and period close, reconciliations, consolidation, reports, statements, sharing and publish lists. Many methods take an `entityId` and default to the group parent.

```typescript
import { LedgerClient } from '@robosystems/client/ledger'

const ledger = new LedgerClient({ baseUrl: 'https://api.robosystems.ai', token: apiKey })
const tb = await ledger.getTrialBalance(graphId, { startDate: '2026-01-01', endDate: '2026-03-31' })
const drafts = await ledger.listPeriodDrafts(graphId, '2026-03')
const closed = await ledger.closePeriod(graphId, '2026-03', { note: 'March close' })
```

**InvestorClient:** portfolios and their positions through the Portfolio Block methods, securities, and holdings.

**LibraryClient:** read-only taxonomies, elements, arcs, structures and search. Pass `LIBRARY_GRAPH_ID` for the canonical library, or a tenant graph id to include that tenant's chart of accounts and custom taxonomies.

```typescript
import { InvestorClient } from '@robosystems/client/investor'
import { LIBRARY_GRAPH_ID, LibraryClient } from '@robosystems/client/library'

const investor = new InvestorClient({ baseUrl: 'https://api.robosystems.ai', token: apiKey })
const holdings = await investor.getHoldings(graphId, portfolioId)

const library = new LibraryClient({ baseUrl: 'https://api.robosystems.ai', token: apiKey })
const matches = await library.searchLibraryElements(LIBRARY_GRAPH_ID, 'revenue', { limit: 20 })
```

## QueryClient

Runs Cypher. `query()` uses `auto` mode, in which the API answers with a result or, under load, a queue handle. The client follows a queued query over the operation stream, which needs a JWT and a global `EventSource` (see below). `maxWait: 0` on `executeQuery` throws `QueuedQueryError` instead; no other value of `maxWait` is read. `executeQuery` declares a return type that includes an async iterator, but no code path returns one, so cast to `QueryResult`.

`streamQuery` asks for `mode=stream`, so the API sends NDJSON in chunks of `chunkSize` rows. The client does not process those chunks as they arrive. It collects every row into one array and then yields the rows one at a time, so the first row arrives only after the whole response is in memory. To limit client memory, page with `SKIP` and `LIMIT`.

```typescript
import { QueryClient } from '@robosystems/client/query'

const query = new QueryClient({ baseUrl: 'https://api.robosystems.ai', token: apiKey })
const cypher = 'MATCH (e:Entity {ticker: $ticker}) RETURN e.name, e.cik'

const result = await query.query('sec', cypher, { ticker: 'NVDA' })
console.log(result.columns, result.data, result.row_count)

for await (const row of query.streamQuery('sec', 'MATCH (e:Entity) RETURN e.name')) {
  console.log(row)
}
```

## Long-running operations

```typescript
import { OperationClient } from '@robosystems/client/operations'

const ops = new OperationClient({ baseUrl: 'https://api.robosystems.ai', tokenProvider: getJwt })
const outcome = await ops.monitorOperation(operationId, {
  onProgress: (progress) => console.log(progress.message, progress.progressPercent),
  timeout: 300_000,
})
if (!outcome.success) console.error(outcome.error)
ops.closeAll()
```

`monitorOperation` resolves with `success: false` when the operation fails or is cancelled, or the stream ends first. It rejects when the stream cannot open or `timeout` elapses. `waitForOperation(id, timeoutMs?)` throws instead. Also available: `monitorMultiple(ids)`, the async iterator `monitorWithProgress(id)`, `getStatus(id)` and `cancelOperation(id)`. The last two do not report HTTP errors: `getStatus` resolves to `undefined` and `cancelOperation` resolves normally.

**Stream authentication.** `EventSource` cannot send headers, so the credential goes in the URL as `?token=`, and the API reads that parameter as a JWT. An API key cannot open a stream through this SDK: it is sent as `token` and refused with a 401. With an API key, poll `getStatus` instead of calling `monitorOperation`, and use `maxWait: 0` on queries. A token in a URL can appear in proxy logs, so prefer short-lived JWTs.

**Node.js.** `SSEClient` calls `new EventSource()` on the global, and the package ships no polyfill. Where the global is missing, `connect()` rejects with `EventSource is not defined`. Tested on Node 24, it exists only when Node is started with `--experimental-eventsource`. Otherwise, assign an implementation to `globalThis.EventSource` before connecting.

### SSEClient

The API names every event, so listen by name. `on('event')` fires only for unnamed messages, which this API does not send.

```typescript
import { EventType, SSEClient } from '@robosystems/client/clients'

const sse = new SSEClient({ baseUrl: 'https://api.robosystems.ai', tokenProvider: () => getJwt() })
sse.on(EventType.OPERATION_PROGRESS, (data) => console.log(data.message))
sse.on(EventType.OPERATION_COMPLETED, (data) => console.log(data.result))
sse.on(EventType.OPERATION_ERROR, (data) => console.error(data.error))
sse.on('error', (data) => console.error(data.error))
await sse.connect(operationId)
```

- `on()` delivers the `EventType` values. The operation stream sends the `operation_started`, `operation_progress`, `operation_completed`, `operation_error` and `operation_cancelled` members; its event list does not define the others (`data_chunk`, `metadata`, `heartbeat`, `queue_update`).
- `connected`, `closed`, `reconnecting`, `max_retries_exceeded`, `error` and `parse_error` come from the client. `error` carries a server-sent stream error, which ends the stream.
- The API also sends `keepalive`, `stream_end`, `operation_awaiting_input` and `operation_resumed`. The client does not subscribe to them, so listeners for those names never fire.
- A completed, failed or cancelled event closes the client. `close()` removes all listeners, so use a new `SSEClient` for the next stream. `connect()` rejects if the stream does not open within 10 seconds.
- A dropped connection reconnects with exponential backoff, up to `maxRetries` (default 5) from `retryDelay` (default 1000 ms), at the original `fromSequence`. The API sends no SSE event ids, so the client has no last-event position. At the default of 0, a running operation sends only live events, so progress during the gap is lost, and a finished one replays its history. Payloads carry `sequence_number`, which you can pass as the second argument to `connect()` on a new client.
- `headers` and `heartbeatInterval` are accepted and never read.

## OperatorClient

Runs AI operators. `query()` lets the API pick the operator; `executeOperator()` names one, such as `analyst` or `mapping`. A queued run is followed over the stream, then by polling `/v1/operations/{id}/status` if the stream cannot open or drops, so a run started with an API key still returns its result.

```typescript
import { OperatorClient } from '@robosystems/client/clients'

const operator = new OperatorClient({ baseUrl: 'https://api.robosystems.ai', token: apiKey })
const answer = await operator.query(graphId, 'How did gross margin trend this year?')
console.log(answer.content)

const request = { message: 'Summarize Q1 performance', threadId: crypto.randomUUID() }
const summary = await operator.executeOperator(graphId, 'analyst', request, {
  onProgress: (message, percentage) => console.log(message, percentage),
})
```

## React hooks

Hooks build their clients on mount from `setSDKClientConfig`, so set it first. They read `baseUrl`, `credentials`, `token`, `tokenProvider`, and `headers` (except `useOperation` and `useMultipleOperations`).

| Hook                         | Returns                                                                   |
| ---------------------------- | ------------------------------------------------------------------------- |
| `useQuery(graphId)`          | `execute`, `query`, `loading`, `error`, `data`, `queuePosition`           |
| `useStreamingQuery(graphId)` | `stream`, `isStreaming`, `error`, `rowsReceived`, `cancel`                |
| `useOperation(operationId?)` | `monitor`, `cancel`, `status`, `progress`, `error`, `result`              |
| `useMultipleOperations()`    | `monitorAll`, `results`, `errors`, `loading`, `allCompleted`, `hasErrors` |
| `useSDKClients()`            | `query` and `operations` clients, `null` until mounted                    |

```tsx
import { useQuery } from '@robosystems/client/clients'

function Entities({ graphId }: { graphId: string }) {
  const { execute, loading, error, data } = useQuery(graphId)
  const run = () => execute('MATCH (e:Entity) RETURN e.name LIMIT 10')
  if (error) return <p>{error.message}</p>
  return (
    <button disabled={loading} onClick={run}>
      {data?.row_count ?? 'Run'}
    </button>
  )
}
```

`execute` returns `null` on failure and sets `error`; it replaces any `onQueueUpdate` or `onProgress` you pass. `useStreamingQuery` is built on `streamQuery`, so batches start only after the whole response has arrived, and its `cancel` closes a stream connection without aborting an HTTP response in flight. Passing an id to `useOperation` starts monitoring on mount; with no id, call `monitor(id, timeout?)`.

## Errors

| Thrown by                                 | Class                  | Fields                                                |
| ----------------------------------------- | ---------------------- | ----------------------------------------------------- |
| Facade reads                              | `GraphQLError`         | `errors`, `statusCode`                                |
| Facade writes                             | `Error`                | `"<label> failed: <json>"` in `message`               |
| `QueryClient` with `maxWait: 0`           | `QueuedQueryError`     | `queueInfo.operation_id`, `queueInfo.queue_position`  |
| `OperatorClient` with `maxWait: 0`        | `QueuedOperatorError`  | `queueInfo.operation_id`                              |
| `OperatorClient`, refused request         | `OperatorRequestError` | `status`, `detail`                                    |
| `OperatorClient`, failed or cancelled run | `OperatorRunError`     | `status`, `writes` (what the run had already changed) |

A network failure or read timeout surfaces as the underlying `fetch` error, not as `GraphQLError`. An API rejection on `QueryClient` surfaces as a plain `Error` without the API's detail.

## Rate limits

GraphQL reads replay `429` responses, up to `maxRetries` (default 5) with backoff from `retryDelay`; `0` turns this off. No other status is retried. REST calls run on the shared generated client, whose retrying `fetch` is installed by the `RoboSystemsClients` constructor. If you construct only facade classes, their REST calls are not retried unless you install it with `client.setConfig({ fetch: createRetryingFetch() })`.

## Graph lifecycle writes

There is no facade for these. Use the generated functions, which run on the shared `client` and return `{ data, error }`, and follow the result with `OperationClient`. Pass an `Idempotency-Key` in `headers` to make a retry safe.

```typescript
import { client } from '@robosystems/client/client'
import { materialize } from '@robosystems/client/sdk'

client.setConfig({ baseUrl: 'https://api.robosystems.ai', headers: { 'X-API-Key': apiKey } })
const { data, error } = await materialize({ path: { graph_id: graphId }, body: {} })
```
