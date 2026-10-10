import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GraphQLError, LedgerClient } from './LedgerClient'

// ── Mock helpers ──────────────────────────────────────────────────────
//
// After the PR #617 migration, LedgerClient speaks two wire protocols:
//
//   1. Reads → GraphQL at POST /extensions/{graphId}/graphql
//      Response body: { data: { fieldName: ... } }
//   2. Writes → REST operations at POST /extensions/roboledger/{graphId}/operations/{name}
//      Response body: { operation, operationId, status, result, at }
//
// Both ride on the same underlying fetch mock — we just return different
// body shapes depending on what the method is expected to call.

function createMockResponse(data: unknown, options: { ok?: boolean; status?: number } = {}) {
  return {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    statusText: options.status === 200 ? 'OK' : 'Error',
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => data,
    text: async () => JSON.stringify(data),
    blob: async () => new Blob([JSON.stringify(data)]),
    arrayBuffer: async () => new TextEncoder().encode(JSON.stringify(data)).buffer,
  }
}

function gqlResponse<T>(data: T) {
  return createMockResponse({ data })
}

function gqlErrorResponse(message: string) {
  return createMockResponse({
    data: null,
    errors: [{ message }],
  })
}

function envelopeResponse<T>(
  operation: string,
  result: T,
  status: 'completed' | 'pending' | 'failed' = 'completed'
) {
  return createMockResponse({
    operation,
    operationId: `op_${operation.toUpperCase()}_01`,
    status,
    result,
    at: '2026-04-14T12:00:00Z',
  })
}

function restErrorResponse(detail: string, status = 400) {
  return createMockResponse({ detail }, { ok: false, status })
}

// ── Tests ──────────────────────────────────────────────────────────────

describe('LedgerClient', () => {
  let client: LedgerClient
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    client = new LedgerClient({
      baseUrl: 'http://localhost:8000',
      // `rfs…` prefix exercises the X-API-Key header path (long-lived
      // API key). Tests that need to cover the JWT → Authorization
      // Bearer branch build their own client inline.
      token: 'rfs_test_api_key',
    })
    mockFetch = vi.fn()
    global.fetch = mockFetch as unknown as typeof fetch
    globalThis.fetch = mockFetch as unknown as typeof fetch
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── Reads (GraphQL) ─────────────────────────────────────────────────

  describe('getEntity', () => {
    it('reads the group parent when no entity is named', async () => {
      mockFetch.mockResolvedValueOnce(gqlResponse({ entity: null }))
      await client.getEntity('graph_1')
      // graphql-request uses positional fetch(url, init) rather than fetch(Request).
      const init = mockFetch.mock.calls[0][1] as RequestInit
      const body = JSON.parse(init.body as string)
      expect(body.variables.entityId).toBeNull()
    })

    it('forwards entityId as a GraphQL variable', async () => {
      mockFetch.mockResolvedValueOnce(gqlResponse({ entity: null }))
      await client.getEntity('graph_1', { entityId: 'ent_2' })
      // graphql-request uses positional fetch(url, init) rather than fetch(Request).
      const init = mockFetch.mock.calls[0][1] as RequestInit
      const body = JSON.parse(init.body as string)
      expect(body.variables.entityId).toBe('ent_2')
    })

    it('returns the entity from the GraphQL response', async () => {
      mockFetch.mockResolvedValueOnce(
        gqlResponse({
          entity: {
            id: 'ent_1',
            name: 'ACME Corp',
            legalName: 'ACME Corporation Inc.',
            entityType: 'corporation',
            status: 'active',
          },
        })
      )
      const entity = await client.getEntity('graph_1')
      expect(entity?.id).toBe('ent_1')
      expect(entity?.name).toBe('ACME Corp')
    })

    it('returns null when the ledger has no entity', async () => {
      mockFetch.mockResolvedValueOnce(gqlResponse({ entity: null }))
      expect(await client.getEntity('graph_1')).toBeNull()
    })

    it('throws a friendly error on GraphQL errors', async () => {
      mockFetch.mockResolvedValueOnce(gqlErrorResponse('Access denied'))
      await expect(client.getEntity('graph_1')).rejects.toThrow(/Get entity failed/)
    })

    it('sends the request to the per-graph URL', async () => {
      mockFetch.mockResolvedValueOnce(gqlResponse({ entity: null }))
      await client.getEntity('graph_42')
      const calledUrl = mockFetch.mock.calls[0][0]
      expect(String(calledUrl)).toBe('http://localhost:8000/extensions/graph_42/graphql')
    })

    it('sends an `rfs…` API key in the X-API-Key header', async () => {
      mockFetch.mockResolvedValueOnce(gqlResponse({ entity: null }))
      await client.getEntity('graph_1')
      const init = mockFetch.mock.calls[0][1] as RequestInit
      const headers = new Headers(init.headers)
      expect(headers.get('X-API-Key')).toBe('rfs_test_api_key')
      // Authorization should NOT also be set — the two formats are
      // distinct credentials at the backend, not interchangeable.
      expect(headers.get('Authorization')).toBeNull()
    })

    it('sends a JWT (non-rfs token) as Authorization: Bearer', async () => {
      // `eyJ…` is the canonical JWT prefix (base64url of `{"`). The
      // header-picker doesn't actually parse the token — anything
      // that isn't an `rfs…` API key is treated as a bearer credential.
      const jwtClient = new LedgerClient({
        baseUrl: 'http://localhost:8000',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.sig',
      })
      mockFetch.mockResolvedValueOnce(gqlResponse({ entity: null }))
      await jwtClient.getEntity('graph_1')
      const init = mockFetch.mock.calls[0][1] as RequestInit
      const headers = new Headers(init.headers)
      expect(headers.get('Authorization')).toBe(
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.sig'
      )
      expect(headers.get('X-API-Key')).toBeNull()
    })

    it('consults tokenProvider on every request so JWT refreshes are picked up', async () => {
      // This is the refresh-safe code path: instead of capturing a
      // static token at client construction, we supply a callback
      // that reads the latest credential on demand. When the JWT
      // rotates between requests, the new token flows through
      // without any client rebuild or cache-clear dance.
      const tokens = ['eyJoldtoken.payload.sig', 'eyJnewtoken.payload.sig']
      let callCount = 0
      const refreshingClient = new LedgerClient({
        baseUrl: 'http://localhost:8000',
        tokenProvider: () => tokens[callCount++] ?? tokens[tokens.length - 1],
      })
      mockFetch.mockResolvedValueOnce(gqlResponse({ entity: null }))
      mockFetch.mockResolvedValueOnce(gqlResponse({ entity: null }))

      await refreshingClient.getEntity('graph_1')
      await refreshingClient.getEntity('graph_1')

      const firstHeaders = new Headers((mockFetch.mock.calls[0][1] as RequestInit).headers)
      const secondHeaders = new Headers((mockFetch.mock.calls[1][1] as RequestInit).headers)
      expect(firstHeaders.get('Authorization')).toBe('Bearer eyJoldtoken.payload.sig')
      expect(secondHeaders.get('Authorization')).toBe('Bearer eyJnewtoken.payload.sig')
      expect(callCount).toBe(2)
    })

    it('tokenProvider can return an rfs API key and still lands in X-API-Key', async () => {
      // The provider path handles both credential formats with the
      // same discriminator as the static-token path.
      const keyClient = new LedgerClient({
        baseUrl: 'http://localhost:8000',
        tokenProvider: () => 'rfs_from_provider',
      })
      mockFetch.mockResolvedValueOnce(gqlResponse({ entity: null }))
      await keyClient.getEntity('graph_1')
      const init = mockFetch.mock.calls[0][1] as RequestInit
      const headers = new Headers(init.headers)
      expect(headers.get('X-API-Key')).toBe('rfs_from_provider')
      expect(headers.get('Authorization')).toBeNull()
    })

    it('tokenProvider returning null sends an unauthenticated request', async () => {
      // A null return means "no credential available right now". We
      // let the request go through so the backend returns a clean
      // 401 rather than throwing at the middleware layer — that's
      // easier to diagnose and lets the UI show a proper auth prompt.
      const anonClient = new LedgerClient({
        baseUrl: 'http://localhost:8000',
        tokenProvider: () => null,
      })
      mockFetch.mockResolvedValueOnce(gqlResponse({ entity: null }))
      await anonClient.getEntity('graph_1')
      const init = mockFetch.mock.calls[0][1] as RequestInit
      const headers = new Headers(init.headers)
      expect(headers.get('X-API-Key')).toBeNull()
      expect(headers.get('Authorization')).toBeNull()
    })

    it('tokenProvider that throws fails the request fast', async () => {
      // A throwing provider means the caller *intended* to authenticate
      // but couldn't produce a credential. Sending the request
      // unauthenticated would surface as a confusing 401 far from the
      // real failure — instead the SDK fails fast with an error naming
      // the tokenProvider and how to fix it (matching the Python
      // client, which raises when its credential is missing). A
      // provider that deliberately has no credential returns `null`
      // (see the null-return test above) and still goes through.
      const brokenClient = new LedgerClient({
        baseUrl: 'http://localhost:8000',
        tokenProvider: () => {
          throw new Error('storage unavailable')
        },
      })
      mockFetch.mockResolvedValueOnce(gqlResponse({ entity: null }))
      await expect(brokenClient.getEntity('graph_1')).rejects.toThrow(
        /tokenProvider threw while resolving the request credential \(storage unavailable\)/
      )
      // The provider's own failure is preserved as `cause`. The message
      // interpolates its text, but only the cause carries the original
      // stack — without it a caller debugging a failing provider sees
      // the SDK's frame and nothing about where their token lookup died.
      const causeErr = await brokenClient.getEntity('graph_1').catch((e: unknown) => e)
      expect((causeErr as Error).cause).toBeInstanceOf(Error)
      expect(((causeErr as Error).cause as Error).message).toBe('storage unavailable')
      // The request never left the client.
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('awaits an async tokenProvider before injecting the header', async () => {
      // The `TokenProvider` type explicitly permits a Promise-returning
      // callback — this is the production shape for browser flows
      // where `getValidToken()` hits a refresh endpoint before
      // returning. The middleware `await`s the provider, so sync and
      // async callbacks behave identically at the call site; this
      // test guards against a refactor that accidentally drops the
      // `await` and ships a `[object Promise]` as the bearer value.
      const asyncClient = new LedgerClient({
        baseUrl: 'http://localhost:8000',
        tokenProvider: async () => {
          // Simulate a microtask boundary — a real refresh would
          // `await fetch(...)` here.
          await Promise.resolve()
          return 'eyJasync.payload.sig'
        },
      })
      mockFetch.mockResolvedValueOnce(gqlResponse({ entity: null }))
      await asyncClient.getEntity('graph_1')
      const init = mockFetch.mock.calls[0][1] as RequestInit
      const headers = new Headers(init.headers)
      expect(headers.get('Authorization')).toBe('Bearer eyJasync.payload.sig')
      expect(headers.get('X-API-Key')).toBeNull()
    })

    it('tokenProvider wins when both token and tokenProvider are set', async () => {
      // The factory's contract is documented as "tokenProvider wins
      // over token when both are set" — in the implementation this
      // is the early-return on `config.tokenProvider` in
      // `createGraphQLClient`. A regression here (e.g. reordering
      // the branches, dropping the early return) would silently
      // prefer a stale static token over the refresh-aware path,
      // which is exactly the bug the provider was built to prevent.
      // Belt-and-suspenders: assert the precedence explicitly.
      const bothClient = new LedgerClient({
        baseUrl: 'http://localhost:8000',
        token: 'rfs_static_key_should_be_ignored',
        tokenProvider: () => 'eyJfromProvider.payload.sig',
      })
      mockFetch.mockResolvedValueOnce(gqlResponse({ entity: null }))
      await bothClient.getEntity('graph_1')
      const init = mockFetch.mock.calls[0][1] as RequestInit
      const headers = new Headers(init.headers)
      expect(headers.get('Authorization')).toBe('Bearer eyJfromProvider.payload.sig')
      // The static `rfs_static_key_should_be_ignored` must NOT leak
      // through as an X-API-Key header.
      expect(headers.get('X-API-Key')).toBeNull()
    })
  })

  describe('listEntities', () => {
    it("carries a subsidiary's parent and ownership", async () => {
      mockFetch.mockResolvedValueOnce(
        gqlResponse({
          entities: [
            {
              id: 'ent_1',
              name: 'Parent',
              isParent: true,
              parentEntityId: null,
              ownershipPct: null,
            },
            {
              id: 'ent_2',
              name: 'Sub',
              isParent: false,
              parentEntityId: 'ent_1',
              ownershipPct: 100,
            },
          ],
        })
      )
      const entities = await client.listEntities('graph_1')
      expect(entities[1].parentEntityId).toBe('ent_1')
      expect(entities[1].ownershipPct).toBe(100)
    })

    it('returns the entities array', async () => {
      mockFetch.mockResolvedValueOnce(
        gqlResponse({
          entities: [
            {
              id: 'ent_1',
              name: 'ACME',
              legalName: null,
              ticker: null,
              cik: null,
              industry: null,
              entityType: null,
              status: 'active',
              isParent: true,
              parentEntityId: null,
              source: 'qb',
              sourceGraphId: null,
              connectionId: null,
              createdAt: null,
              updatedAt: null,
            },
          ],
        })
      )
      const entities = await client.listEntities('graph_1')
      expect(entities).toHaveLength(1)
      expect(entities[0].id).toBe('ent_1')
    })
  })

  describe('listBankAccounts', () => {
    it("returns the group's accounts with their entity and source", async () => {
      mockFetch.mockResolvedValueOnce(
        gqlResponse({
          bankAccounts: {
            total: 2,
            accounts: [
              {
                id: 'elem_chk',
                code: '1010',
                name: 'Chase Checking ••1234',
                kind: 'bank',
                balanceType: 'debit',
                isActive: true,
                entityId: 'ent_1',
                entityName: 'Cascade',
                source: 'plaid',
                connectionId: 'conn_plaid',
                institution: 'Chase',
                feedAccountId: 'acc_1',
                feedAccountName: 'Chase Checking ••1234',
                feedAccountKind: 'checking',
                connectionStatus: 'active',
                lastSyncAt: '2026-10-07T12:00:00+00:00',
                lastSyncStatus: 'success',
              },
              {
                id: 'elem_card',
                code: '2100',
                name: 'Amex',
                kind: 'credit',
                balanceType: 'credit',
                isActive: true,
                entityId: 'ent_2',
                entityName: 'Cadence',
                source: 'quickbooks',
                connectionId: 'conn_qb',
                institution: null,
                feedAccountId: null,
                feedAccountName: null,
                feedAccountKind: null,
                connectionStatus: null,
                lastSyncAt: null,
                lastSyncStatus: null,
              },
            ],
          },
        })
      )
      const list = await client.listBankAccounts('graph_1', { entityId: 'ent_1' })
      // graphql-request uses positional fetch(url, init) rather than fetch(Request).
      const init = mockFetch.mock.calls[0][1] as RequestInit
      const body = JSON.parse(init.body as string)
      expect(body.variables).toEqual({ entityId: 'ent_1' })
      expect(list?.total).toBe(2)
      expect(list?.accounts[0].feedAccountId).toBe('acc_1')
      expect(list?.accounts[1].kind).toBe('credit')
      expect(list?.accounts[1].entityName).toBe('Cadence')
    })
  })

  describe('linkBankAccount', () => {
    it('POSTs to the link-bank-account operation and returns the result', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('link-bank-account', {
          connection_id: 'conn_plaid',
          provider: 'plaid',
          account_id: 'acc_1',
          element_id: 'elem_sub',
          previous_element_id: 'elem_chk',
          entity_id: 'ent_2',
          account_created: true,
          events_repointed: 3,
          events_unclassified: 1,
          pairs_across_entities: 0,
          changed: true,
        })
      )
      const result = await client.linkBankAccount('graph_42', {
        connection_id: 'conn_plaid',
        account_id: 'acc_1',
        entity_id: 'ent_2',
      })
      const req = mockFetch.mock.calls[0][0] as Request
      expect(req.url).toBe(
        'http://localhost:8000/extensions/roboledger/graph_42/operations/link-bank-account'
      )
      expect(req.method).toBe('POST')
      expect(JSON.parse(await req.text())).toEqual({
        connection_id: 'conn_plaid',
        account_id: 'acc_1',
        entity_id: 'ent_2',
      })
      expect(result.element_id).toBe('elem_sub')
      expect(result.account_created).toBe(true)
      expect(result.events_repointed).toBe(3)
    })

    it('throws a friendly error on 4xx', async () => {
      mockFetch.mockResolvedValueOnce(
        restErrorResponse('Account elem_x is already fed by mercury account Ops', 409)
      )
      await expect(
        client.linkBankAccount('graph_1', {
          connection_id: 'conn_plaid',
          account_id: 'acc_1',
          element_id: 'elem_x',
        })
      ).rejects.toThrow(/already fed/)
    })
  })

  describe('getSummary', () => {
    it('returns summary counts', async () => {
      mockFetch.mockResolvedValueOnce(
        gqlResponse({
          summary: {
            graphId: 'graph_1',
            accountCount: 42,
            transactionCount: 1337,
            entryCount: 1337,
            lineItemCount: 2674,
            earliestTransactionDate: '2020-01-01',
            latestTransactionDate: '2026-03-31',
            connectionCount: 1,
            lastSyncAt: '2026-04-14T00:00:00Z',
          },
        })
      )
      const summary = await client.getSummary('graph_1')
      expect(summary?.accountCount).toBe(42)
      expect(summary?.transactionCount).toBe(1337)
    })
  })

  describe('listAccounts', () => {
    it('forwards entityId as a GraphQL variable', async () => {
      mockFetch.mockResolvedValueOnce(gqlResponse({ accounts: null }))
      await client.listAccounts('graph_1', { entityId: 'ent_2' })
      // graphql-request uses positional fetch(url, init) rather than fetch(Request).
      const init = mockFetch.mock.calls[0][1] as RequestInit
      const body = JSON.parse(init.body as string)
      expect(body.variables.entityId).toBe('ent_2')
      expect(body.variables.limit).toBe(100)
    })

    it('returns a paginated account list', async () => {
      mockFetch.mockResolvedValueOnce(
        gqlResponse({
          accounts: {
            accounts: [
              {
                id: 'acc_1',
                code: '1000',
                name: 'Cash',
                description: null,
                classification: 'asset',
                subClassification: null,
                balanceType: 'debit',
                parentId: null,
                depth: 0,
                currency: 'USD',
                isActive: true,
                isPlaceholder: false,
                accountType: null,
                externalId: null,
                externalSource: null,
              },
            ],
            pagination: { total: 1, limit: 100, offset: 0, hasMore: false },
          },
        })
      )
      const list = await client.listAccounts('graph_1')
      expect(list?.accounts).toHaveLength(1)
      expect(list?.accounts[0].code).toBe('1000')
      expect(list?.pagination.total).toBe(1)
    })
  })

  describe('listJournalEntries', () => {
    it('returns an entry with no parent transaction', async () => {
      // The shape the read exists for: schedule-derived closing entries
      // carry no transactionId, so they appear in no transaction listing.
      mockFetch.mockResolvedValueOnce(
        gqlResponse({
          journalEntries: {
            entries: [
              {
                id: 'je_1',
                number: null,
                transactionId: null,
                type: 'adjusting',
                status: 'posted',
                postingDate: '2026-07-31',
                memo: 'MacBook depreciation',
                provenance: 'schedule_derived',
                sourceStructureId: 'struct_1',
                sourceStructureName: 'MacBook Pro Depreciation',
                triggeredByEventId: null,
                reversalOf: null,
                postedAt: '2026-08-01T12:00:00',
                totalDebit: 42.41,
                totalCredit: 42.41,
                balanced: true,
                lineItems: [
                  {
                    id: 'li_1',
                    accountId: 'el_1',
                    accountName: 'Depreciation Expense',
                    accountCode: '6100',
                    debitAmount: 42.41,
                    creditAmount: 0,
                    description: null,
                    lineOrder: 1,
                  },
                ],
              },
            ],
            pagination: { total: 1, limit: 100, offset: 0, hasMore: false },
          },
        })
      )
      const list = await client.listJournalEntries('graph_1', {
        startDate: '2026-07-01',
        endDate: '2026-07-31',
        status: 'posted',
      })
      expect(list?.entries).toHaveLength(1)
      // null means standalone, not missing data
      expect(list?.entries[0].transactionId).toBeNull()
      expect(list?.entries[0].sourceStructureName).toBe('MacBook Pro Depreciation')
      expect(list?.entries[0].balanced).toBe(true)
      expect(list?.pagination.total).toBe(1)
    })

    it('sends every filter as a variable', async () => {
      mockFetch.mockResolvedValueOnce(
        gqlResponse({
          journalEntries: {
            entries: [],
            pagination: { total: 0, limit: 25, offset: 50, hasMore: false },
          },
        })
      )
      await client.listJournalEntries('graph_1', {
        startDate: '2026-07-01',
        endDate: '2026-07-31',
        status: 'posted',
        type: 'closing',
        provenance: 'schedule_derived',
        transactionId: 'txn_1',
        limit: 25,
        offset: 50,
      })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string)
      expect(body.variables).toMatchObject({
        startDate: '2026-07-01',
        endDate: '2026-07-31',
        status: 'posted',
        type: 'closing',
        provenance: 'schedule_derived',
        transactionId: 'txn_1',
        limit: 25,
        offset: 50,
      })
    })
  })

  describe('getTrialBalance', () => {
    it('returns totals and rows', async () => {
      mockFetch.mockResolvedValueOnce(
        gqlResponse({
          trialBalance: {
            totalDebits: 1000,
            totalCredits: 1000,
            rows: [],
          },
        })
      )
      const tb = await client.getTrialBalance('graph_1')
      expect(tb?.totalDebits).toBe(1000)
      expect(tb?.totalCredits).toBe(1000)
    })

    it('forwards optional date range', async () => {
      mockFetch.mockResolvedValueOnce(
        gqlResponse({
          trialBalance: { totalDebits: 0, totalCredits: 0, rows: [] },
        })
      )
      await client.getTrialBalance('graph_1', {
        startDate: '2026-01-01',
        endDate: '2026-03-31',
      })
      const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
      expect(body.variables.startDate).toBe('2026-01-01')
      expect(body.variables.endDate).toBe('2026-03-31')
    })
  })

  describe('listMappings', () => {
    it('returns the inner structures array', async () => {
      mockFetch.mockResolvedValueOnce(
        gqlResponse({
          mappings: {
            structures: [
              {
                id: 'map_1',
                name: 'CoA → GAAP',
                description: null,
                blockType: 'coa_mapping',
                taxonomyId: 'tax_map_gaap',
                isActive: true,
                framework: 'rs-gaap',
              },
            ],
          },
        })
      )
      const mappings = await client.listMappings('graph_1')
      expect(mappings).toHaveLength(1)
      expect(mappings[0].blockType).toBe('coa_mapping')
      expect(mappings[0].framework).toBe('rs-gaap')
    })

    it('returns an empty array when mappings is null', async () => {
      mockFetch.mockResolvedValueOnce(gqlResponse({ mappings: null }))
      expect(await client.listMappings('graph_1')).toEqual([])
    })

    it('names whose chart each mapping maps, and keeps one entity on request', async () => {
      mockFetch.mockResolvedValueOnce(
        gqlResponse({
          mappings: {
            structures: [
              {
                id: 'map_sub',
                name: 'CoA → GAAP',
                description: null,
                blockType: 'coa_mapping',
                taxonomyId: 'tax_map_sub',
                isActive: true,
                framework: 'rs-gaap',
                entityId: 'ent_sub',
              },
            ],
          },
        })
      )
      const mappings = await client.listMappings('graph_1', { entityId: 'ent_sub' })
      expect(mappings[0].entityId).toBe('ent_sub')
      const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
      expect(body.variables.entityId).toBe('ent_sub')
    })

    it('sends a null entity to list every entity mapping', async () => {
      mockFetch.mockResolvedValueOnce(gqlResponse({ mappings: { structures: [] } }))
      await client.listMappings('graph_1')
      const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
      expect(body.variables.entityId).toBeNull()
    })
  })

  describe('getMappingCandidates', () => {
    it('narrows by the named entity', async () => {
      mockFetch.mockResolvedValueOnce(gqlResponse({ mappingCandidates: [] }))
      await client.getMappingCandidates('graph_1', 'asset', { entityId: 'ent_sub' })
      const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
      expect(body.variables).toEqual({ classification: 'asset', entityId: 'ent_sub' })
    })
  })

  describe('information blocks', () => {
    const variablesOf = (call: number) =>
      JSON.parse((mockFetch.mock.calls[call][1] as RequestInit).body as string).variables

    it('getInformationBlock sends the entity, windowed or not', async () => {
      mockFetch.mockResolvedValue(gqlResponse({ informationBlock: null }))
      await client.getInformationBlock('graph_1', 'struct_bs', { entityId: 'ent_sub' })
      await client.getInformationBlock('graph_1', 'struct_bs', {
        entityId: 'ent_sub',
        series: true,
        seriesHistory: 12,
      })
      await client.getInformationBlock('graph_1', 'struct_bs')
      expect(variablesOf(0).entityId).toBe('ent_sub')
      expect(variablesOf(1).entityId).toBe('ent_sub')
      expect(variablesOf(1).seriesHistory).toBe(12)
      expect(variablesOf(2).entityId).toBeNull()
    })

    it('listInformationBlocks sends the entity', async () => {
      mockFetch.mockResolvedValueOnce(gqlResponse({ informationBlocks: [] }))
      await client.listInformationBlocks('graph_1', { blockType: 'forecast', entityId: 'ent_sub' })
      expect(variablesOf(0)).toMatchObject({ blockType: 'forecast', entityId: 'ent_sub' })
    })
  })

  describe('getMappingCoverage', () => {
    it('returns the coverage payload', async () => {
      mockFetch.mockResolvedValueOnce(
        gqlResponse({
          mappingCoverage: {
            mappingId: 'map_1',
            totalCoaElements: 10,
            mappedCount: 7,
            unmappedCount: 3,
            coveragePercent: 70,
            highConfidence: 5,
            mediumConfidence: 2,
            lowConfidence: 0,
          },
        })
      )
      const cov = await client.getMappingCoverage('graph_1', 'map_1')
      expect(cov?.coveragePercent).toBe(70)
      expect(cov?.unmappedCount).toBe(3)
    })
  })

  describe('listReports', () => {
    it('sends no lifecycle by default, so the server returns current reports', async () => {
      mockFetch.mockResolvedValueOnce(
        gqlResponse({ reports: { reports: [{ id: 'rpt_1', filingStatus: 'filed' }] } })
      )
      const reports = await client.listReports('graph_1')
      const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
      expect(body.variables?.lifecycle).toBeUndefined()
      expect(body.variables?.entityId).toBeNull()
      expect(body.query).toContain('reports(lifecycle: $lifecycle, entityId: $entityId)')
      expect(body.query).toContain('filingStatus')
      expect(reports).toEqual([{ id: 'rpt_1', filingStatus: 'filed' }])
    })

    it('forwards lifecycle as a GraphQL variable', async () => {
      mockFetch.mockResolvedValueOnce(gqlResponse({ reports: { reports: [] } }))
      await client.listReports('graph_1', { lifecycle: 'ARCHIVED' })
      const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
      expect(body.variables).toMatchObject({ lifecycle: 'ARCHIVED' })
    })
  })

  describe('listEventBlocks', () => {
    it('returns the eventBlocks array', async () => {
      mockFetch.mockResolvedValueOnce(
        gqlResponse({
          eventBlocks: [
            {
              id: 'evt_1',
              eventType: 'invoice_issued',
              eventCategory: 'sales',
              eventClass: 'Receivable',
              status: 'captured',
              occurredAt: '2026-04-15T00:00:00Z',
              effectiveAt: null,
              source: 'quickbooks',
              externalId: 'qb_inv_1',
              externalUrl: null,
              amount: 50000,
              currency: 'USD',
              description: 'Invoice #1001',
              metadata: { entries: [] },
              dimensionIds: [],
              agentId: 'agt_1',
              resourceType: null,
              resourceElementId: null,
              replacedByEventId: null,
              replacesEventId: null,
              obligatedByEventId: null,
              dischargesEventId: null,
              createdAt: '2026-04-15T01:00:00Z',
              createdBy: 'sync',
            },
          ],
        })
      )
      const events = await client.listEventBlocks('graph_1', { status: 'captured' })
      expect(events).toHaveLength(1)
      expect(events[0].eventType).toBe('invoice_issued')
      expect(events[0].agentId).toBe('agt_1')
    })

    it('forwards filter args as GraphQL variables', async () => {
      mockFetch.mockResolvedValueOnce(gqlResponse({ eventBlocks: [] }))
      await client.listEventBlocks('graph_1', {
        eventType: 'bill_received',
        eventCategory: 'purchase',
        status: 'captured',
        agentId: 'agt_2',
        source: 'quickbooks',
        limit: 25,
        offset: 50,
      })
      const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
      expect(body.variables).toMatchObject({
        eventType: 'bill_received',
        eventCategory: 'purchase',
        status: 'captured',
        agentId: 'agt_2',
        source: 'quickbooks',
        limit: 25,
        offset: 50,
      })
    })

    it('defaults isActive-equivalent filters to nulls and pagination to 50/0', async () => {
      mockFetch.mockResolvedValueOnce(gqlResponse({ eventBlocks: [] }))
      await client.listEventBlocks('graph_1')
      const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
      expect(body.variables).toMatchObject({
        eventType: null,
        status: null,
        isReconcilingItem: null,
        limit: 50,
        offset: 0,
      })
    })

    it('narrows to reconciling items when asked', async () => {
      mockFetch.mockResolvedValueOnce(gqlResponse({ eventBlocks: [] }))
      await client.listEventBlocks('graph_1', { isReconcilingItem: true })
      const init = mockFetch.mock.calls[0][1] as RequestInit
      const body = JSON.parse(init.body as string)
      expect(body.variables.isReconcilingItem).toBe(true)
      expect(body.query).toContain('isReconcilingItem: $isReconcilingItem')
    })
  })

  describe('getEventBlock', () => {
    it('returns the event block detail', async () => {
      mockFetch.mockResolvedValueOnce(
        gqlResponse({
          eventBlock: {
            id: 'evt_1',
            eventType: 'invoice_issued',
            eventCategory: 'sales',
            eventClass: 'Receivable',
            status: 'captured',
            occurredAt: '2026-04-15T00:00:00Z',
            effectiveAt: null,
            source: 'quickbooks',
            externalId: 'qb_inv_1',
            externalUrl: null,
            amount: 50000,
            currency: 'USD',
            description: 'Invoice #1001',
            metadata: {
              entries: [
                {
                  memo: 'Sale to Acme',
                  posting_date: '2026-04-15',
                  line_items: [
                    { element_external_id: '11000', debit_amount: 500, credit_amount: 0 },
                    { element_external_id: '40000', debit_amount: 0, credit_amount: 500 },
                  ],
                },
              ],
            },
            dimensionIds: [],
            agentId: 'agt_1',
            resourceType: null,
            resourceElementId: null,
            replacedByEventId: null,
            replacesEventId: null,
            obligatedByEventId: null,
            dischargesEventId: null,
            documentId: 'doc_inv_1001',
            createdAt: '2026-04-15T01:00:00Z',
            createdBy: 'sync',
          },
        })
      )
      const evt = await client.getEventBlock('graph_1', 'evt_1')
      expect(evt?.id).toBe('evt_1')
      expect(evt?.documentId).toBe('doc_inv_1001')
      const meta = evt?.metadata as { entries: Array<{ line_items: unknown[] }> }
      expect(meta.entries).toHaveLength(1)
      expect(meta.entries[0].line_items).toHaveLength(2)
    })

    it('returns null when event block is missing', async () => {
      mockFetch.mockResolvedValueOnce(gqlResponse({ eventBlock: null }))
      expect(await client.getEventBlock('graph_1', 'evt_missing')).toBeNull()
    })
  })

  describe('listAgents', () => {
    it('returns the agents array', async () => {
      mockFetch.mockResolvedValueOnce(
        gqlResponse({
          agents: [
            {
              id: 'agt_1',
              agentType: 'customer',
              name: 'Acme Corp',
              legalName: 'Acme Corporation Inc.',
              taxId: '12-3456789',
              registrationNumber: null,
              duns: null,
              lei: null,
              email: 'billing@acme.test',
              phone: '+1 555 0100',
              address: { Line1: '1 Main St' },
              source: 'quickbooks',
              externalId: 'qb_cust_1',
              isActive: true,
              is1099Recipient: false,
              createdAt: '2026-04-01T00:00:00Z',
              updatedAt: '2026-04-01T00:00:00Z',
              createdBy: 'sync',
            },
          ],
        })
      )
      const agents = await client.listAgents('graph_1', { agentType: 'customer' })
      expect(agents).toHaveLength(1)
      expect(agents[0].name).toBe('Acme Corp')
    })

    it('defaults isActive to true and forwards explicit overrides', async () => {
      mockFetch.mockResolvedValueOnce(gqlResponse({ agents: [] }))
      await client.listAgents('graph_1')
      let body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
      expect(body.variables.isActive).toBe(true)

      mockFetch.mockResolvedValueOnce(gqlResponse({ agents: [] }))
      await client.listAgents('graph_1', { isActive: null })
      body = JSON.parse((mockFetch.mock.calls[1][1] as RequestInit).body as string)
      expect(body.variables.isActive).toBeNull()
    })
  })

  describe('getAgent', () => {
    it('returns the agent detail', async () => {
      mockFetch.mockResolvedValueOnce(
        gqlResponse({
          agent: {
            id: 'agt_1',
            agentType: 'vendor',
            name: 'Office Supplies Co',
            legalName: null,
            taxId: null,
            registrationNumber: null,
            duns: null,
            lei: null,
            email: null,
            phone: null,
            address: null,
            source: 'quickbooks',
            externalId: 'qb_vend_1',
            isActive: true,
            is1099Recipient: false,
            createdAt: '2026-04-01T00:00:00Z',
            updatedAt: '2026-04-01T00:00:00Z',
            createdBy: 'sync',
          },
        })
      )
      const agt = await client.getAgent('graph_1', 'agt_1')
      expect(agt?.agentType).toBe('vendor')
      expect(agt?.name).toBe('Office Supplies Co')
    })

    it('returns null when agent is missing', async () => {
      mockFetch.mockResolvedValueOnce(gqlResponse({ agent: null }))
      expect(await client.getAgent('graph_1', 'agt_missing')).toBeNull()
    })
  })

  describe('getPeriodCloseStatus', () => {
    it('forwards the period window and entityId as GraphQL variables', async () => {
      mockFetch.mockResolvedValueOnce(gqlResponse({ periodCloseStatus: null }))
      await client.getPeriodCloseStatus('graph_1', '2026-03-01', '2026-03-31', {
        entityId: 'ent_2',
      })
      // graphql-request uses positional fetch(url, init) rather than fetch(Request).
      const init = mockFetch.mock.calls[0][1] as RequestInit
      const body = JSON.parse(init.body as string)
      expect(body.variables).toEqual({
        periodStart: '2026-03-01',
        periodEnd: '2026-03-31',
        entityId: 'ent_2',
      })
    })
  })

  describe('getFiscalCalendar', () => {
    it('forwards entityId as a GraphQL variable', async () => {
      mockFetch.mockResolvedValueOnce(gqlResponse({ fiscalCalendar: null }))
      await client.getFiscalCalendar('graph_1', { entityId: 'ent_2' })
      // graphql-request uses positional fetch(url, init) rather than fetch(Request).
      const init = mockFetch.mock.calls[0][1] as RequestInit
      const body = JSON.parse(init.body as string)
      expect(body.variables.entityId).toBe('ent_2')
    })

    it('returns the calendar state', async () => {
      mockFetch.mockResolvedValueOnce(
        gqlResponse({
          fiscalCalendar: {
            graphId: 'graph_1',
            fiscalYearStartMonth: 1,
            closedThrough: '2026-02',
            closeTarget: '2026-03',
            gapPeriods: 0,
            catchUpSequence: [],
            closeableNow: true,
            blockers: [],
            lastCloseAt: null,
            initializedAt: '2026-01-01T00:00:00Z',
            lastSyncAt: null,
            periods: [],
          },
        })
      )
      const cal = await client.getFiscalCalendar('graph_1')
      expect(cal?.closedThrough).toBe('2026-02')
      expect(cal?.closeableNow).toBe(true)
    })
  })

  // ── Writes (Operation envelope) ─────────────────────────────────────

  describe('updateEntity', () => {
    it('unwraps the envelope and returns the updated entity', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('update-entity', {
          id: 'ent_1',
          name: 'New Name',
          legalName: 'ACME Corporation Inc.',
          status: 'active',
        })
      )
      const entity = await client.updateEntity('graph_1', { name: 'New Name' })
      expect(entity.name).toBe('New Name')
    })

    it('POSTs to the roboledger operations URL', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('update-entity', { id: 'ent_1' }))
      await client.updateEntity('graph_42', { name: 'X' })
      // The generated SDK passes a Request object to fetch.
      const req = mockFetch.mock.calls[0][0] as Request
      expect(req.url).toBe(
        'http://localhost:8000/extensions/roboledger/graph_42/operations/update-entity'
      )
      expect(req.method).toBe('POST')
      expect(JSON.parse(await req.text())).toEqual({ name: 'X' })
    })

    it('throws a friendly error on 4xx', async () => {
      mockFetch.mockResolvedValueOnce(restErrorResponse('No fields provided', 400))
      await expect(client.updateEntity('graph_1', {})).rejects.toThrow(/Update entity failed/)
    })
  })

  describe('createEntity', () => {
    it('POSTs to the create-entity operation and maps the entity to camelCase', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('create-entity', {
          id: 'ent_2',
          name: 'Driftline Café LLC',
          entity_type: 'llc',
          ticker: 'DCL',
          is_parent: false,
          parent_entity_id: 'ent_1',
          ownership_pct: 100,
          reporting_style_id: 'style_llc',
          status: 'active',
        })
      )
      const entity = await client.createEntity('graph_42', {
        name: 'Driftline Café LLC',
        entity_type: 'llc',
        ownership_pct: 100,
      })
      const req = mockFetch.mock.calls[0][0] as Request
      expect(req.url).toBe(
        'http://localhost:8000/extensions/roboledger/graph_42/operations/create-entity'
      )
      expect(req.method).toBe('POST')
      expect(JSON.parse(await req.text())).toEqual({
        name: 'Driftline Café LLC',
        entity_type: 'llc',
        ownership_pct: 100,
      })
      expect(entity.id).toBe('ent_2')
      expect(entity.isParent).toBe(false)
      expect(entity.parentEntityId).toBe('ent_1')
      expect(entity.ownershipPct).toBe(100)
      expect(entity.reportingStyleId).toBe('style_llc')
      expect(entity.ticker).toBe('DCL')
    })

    it('throws a friendly error on 4xx', async () => {
      mockFetch.mockResolvedValueOnce(restErrorResponse('Ticker already in use', 409))
      await expect(client.createEntity('graph_1', { name: 'Sub' })).rejects.toThrow(
        /Create entity failed/
      )
    })
  })

  describe('initializeLedger', () => {
    it('converts snake_case envelope result into camelCase', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('initialize', {
          periods_created: 12,
          warnings: [],
          fiscal_calendar: {
            graph_id: 'graph_1',
            fiscal_year_start_month: 1,
            closed_through: null,
            close_target: null,
            gap_periods: 0,
            catch_up_sequence: [],
            closeable_now: false,
            blockers: [],
            last_close_at: null,
            initialized_at: '2026-04-14T00:00:00Z',
            last_sync_at: null,
            periods: [
              {
                name: '2026-01',
                start_date: '2026-01-01',
                end_date: '2026-01-31',
                status: 'open',
                closed_at: null,
              },
            ],
          },
        })
      )
      const result = await client.initializeLedger('graph_1')
      expect(result.periodsCreated).toBe(12)
      expect(result.fiscalCalendar.fiscalYearStartMonth).toBe(1)
      expect(result.fiscalCalendar.periods[0].startDate).toBe('2026-01-01')
      expect(result.fiscalCalendar.periods[0].closedAt).toBeNull()
    })
  })

  // ── Chart of Accounts ──────────────────────────────────────────────

  describe('listChartTemplates', () => {
    it('returns the shipped templates', async () => {
      mockFetch.mockResolvedValueOnce(
        gqlResponse({
          chartTemplates: [
            {
              key: 'saas',
              displayName: 'SaaS / subscription software',
              description: 'Recurring revenue …',
              accountCount: 20,
            },
            {
              key: 'product',
              displayName: 'Product business (inventory and COGS)',
              description: 'Goods sold …',
              accountCount: 27,
            },
          ],
        })
      )
      const templates = await client.listChartTemplates('graph_1')
      expect(templates.map((t) => t.key)).toEqual(['saas', 'product'])
      expect(templates[1].accountCount).toBe(27)
    })
  })

  describe('initializeChartOfAccounts', () => {
    it('posts the template and converts the envelope result into camelCase', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('initialize-chart-of-accounts', {
          taxonomy_id: 'tax_new',
          name: 'Chart of Accounts',
          template: 'saas',
          entity_type: 'llc',
          elements_created: 20,
          mappings_created: 20,
          frameworks: ['rs-gaap'],
          unresolved: [],
        })
      )
      const result = await client.initializeChartOfAccounts('graph_1', 'saas', {
        entityType: 'llc',
      })
      expect(result.taxonomyId).toBe('tax_new')
      expect(result.entityType).toBe('llc')
      expect(result.frameworks).toEqual(['rs-gaap'])
      expect(result.unresolved).toEqual([])

      // The REST operation path hands fetch a Request; the GraphQL path a URL.
      const [called, init] = mockFetch.mock.calls[0]
      const request = called instanceof Request ? called : new Request(String(called), init)
      expect(request.url).toContain(
        '/extensions/roboledger/graph_1/operations/initialize-chart-of-accounts'
      )
      expect(await request.clone().json()).toEqual({
        template: 'saas',
        entity_id: null,
        entity_type: 'llc',
        name: null,
      })
    })

    it('surfaces a 409 when the graph already has a chart', async () => {
      mockFetch.mockResolvedValueOnce(
        restErrorResponse('This graph already has a chart of accounts', 409)
      )
      await expect(client.initializeChartOfAccounts('graph_1', 'services')).rejects.toThrow()
    })
  })

  describe('setCloseTarget', () => {
    it('sends entity_id when an entity is named', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('set-close-target', { periods: [] }))
      await client.setCloseTarget('graph_1', '2026-03', null, { entityId: 'ent_2' })
      const req = mockFetch.mock.calls[0][0] as Request
      const body = JSON.parse(await req.text())
      expect(body).toEqual({ period: '2026-03', note: null, entity_id: 'ent_2' })
    })
  })

  describe('changeCalendarStart', () => {
    it('moves the first open month and reports what changed', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('change-calendar-start', {
          fiscal_calendar: { periods: [] },
          periods_created: 7,
          periods_removed: 0,
        })
      )
      const result = await client.changeCalendarStart('graph_1', '2026-02', {
        entityId: 'ent_2',
        note: 'history from February',
      })
      expect(result.periodsCreated).toBe(7)
      expect(result.periodsRemoved).toBe(0)
      const req = mockFetch.mock.calls[0][0] as Request
      expect(req.url).toContain('/operations/change-calendar-start')
      expect(JSON.parse(await req.text())).toEqual({
        first_open_period: '2026-02',
        entity_id: 'ent_2',
        note: 'history from February',
      })
    })
  })

  describe('reopenPeriod', () => {
    it('sends entity_id when an entity is named', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('reopen-period', { periods: [] }))
      await client.reopenPeriod('graph_1', '2026-03', 'late invoice', null, { entityId: 'ent_2' })
      const req = mockFetch.mock.calls[0][0] as Request
      const body = JSON.parse(await req.text())
      expect(body).toEqual({
        period: '2026-03',
        reason: 'late invoice',
        note: null,
        entity_id: 'ent_2',
      })
    })
  })

  describe('closePeriod', () => {
    it('closes the group parent when no entity is named', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('close-period', { period: '2026-03', fiscal_calendar: { periods: [] } })
      )
      await client.closePeriod('graph_1', '2026-03')
      const req = mockFetch.mock.calls[0][0] as Request
      const body = JSON.parse(await req.text())
      expect(body.entity_id).toBeNull()
    })

    it('sends entity_id when an entity is named', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('close-period', { period: '2026-03', fiscal_calendar: { periods: [] } })
      )
      await client.closePeriod('graph_1', '2026-03', { entityId: 'ent_2', allowStaleSync: true })
      const req = mockFetch.mock.calls[0][0] as Request
      const body = JSON.parse(await req.text())
      expect(body.entity_id).toBe('ent_2')
      expect(body.allow_stale_sync).toBe(true)
      expect(body.period).toBe('2026-03')
    })

    it('returns a close result with the refreshed calendar', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('close-period', {
          period: '2026-03',
          entries_posted: 5,
          target_auto_advanced: true,
          fiscal_calendar: {
            graph_id: 'graph_1',
            fiscal_year_start_month: 1,
            closed_through: '2026-03',
            close_target: '2026-04',
            gap_periods: 0,
            catch_up_sequence: [],
            closeable_now: true,
            blockers: [],
            last_close_at: '2026-04-14T12:00:00Z',
            initialized_at: '2026-01-01T00:00:00Z',
            last_sync_at: null,
            periods: [],
          },
        })
      )
      const result = await client.closePeriod('graph_1', '2026-03')
      expect(result.entriesPosted).toBe(5)
      expect(result.targetAutoAdvanced).toBe(true)
      expect(result.fiscalCalendar.closedThrough).toBe('2026-03')
    })

    it('propagates allowStaleSync in the request body', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('close-period', {
          period: '2026-03',
          entries_posted: 0,
          target_auto_advanced: false,
          fiscal_calendar: {
            graph_id: 'graph_1',
            fiscal_year_start_month: 1,
            closed_through: null,
            close_target: null,
            gap_periods: 0,
            catch_up_sequence: [],
            closeable_now: false,
            blockers: [],
            last_close_at: null,
            initialized_at: null,
            last_sync_at: null,
            periods: [],
          },
        })
      )
      await client.closePeriod('graph_1', '2026-03', { allowStaleSync: true })
      const req = mockFetch.mock.calls[0][0] as Request
      const body = JSON.parse(await req.text())
      expect(body.allow_stale_sync).toBe(true)
      expect(body.period).toBe('2026-03')
    })

    it('sends the reconciling-item and unposted-event overrides', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('close-period', { period: '2026-03', fiscal_calendar: { periods: [] } })
      )
      await client.closePeriod('graph_1', '2026-03', {
        allowReconcilingItems: true,
        allowUnpostedSourceEvents: true,
      })
      const req = mockFetch.mock.calls[0][0] as Request
      const body = JSON.parse(await req.text())
      expect(body.allow_reconciling_items).toBe(true)
      expect(body.allow_unposted_source_events).toBe(true)
      // Unset overrides stay off the wire, so the server's defaults apply.
      expect(body.allow_stale_sync).toBeUndefined()
    })

    it('carries the reconciling-item and unposted-event detail on the calendar', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('close-period', {
          period: '2026-03',
          fiscal_calendar: {
            blockers: ['reconciling_items', 'unposted_source_events'],
            reconciling_item_count: 2,
            reconciling_item_sample: ['INV-1041', 'evt_9'],
            unposted_source_event_count: 1,
            unposted_source_event_sample: ['evt_3'],
            periods: [],
          },
        })
      )
      const { fiscalCalendar } = await client.closePeriod('graph_1', '2026-03')
      expect(fiscalCalendar.reconcilingItemCount).toBe(2)
      expect(fiscalCalendar.reconcilingItemSample).toEqual(['INV-1041', 'evt_9'])
      expect(fiscalCalendar.unpostedSourceEventCount).toBe(1)
      expect(fiscalCalendar.unpostedSourceEventSample).toEqual(['evt_3'])
    })

    it('defaults that detail to nothing when the calendar omits it', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('close-period', { period: '2026-03', fiscal_calendar: { periods: [] } })
      )
      const { fiscalCalendar } = await client.closePeriod('graph_1', '2026-03')
      expect(fiscalCalendar.reconcilingItemCount).toBe(0)
      expect(fiscalCalendar.reconcilingItemSample).toEqual([])
      expect(fiscalCalendar.unpostedSourceEventCount).toBe(0)
      expect(fiscalCalendar.unpostedSourceEventSample).toEqual([])
    })
  })

  describe('reconciling items', () => {
    it('previews one by event id and returns the plan', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('preview-reconciling-item', {
          event_id: 'evt_1',
          default_disposition: 'catch_up',
          closed_periods: ['2026-07'],
          delta: [{ element_id: 'el_1', net_change: 1250 }],
        })
      )
      const plan = await client.previewReconcilingItem('graph_42', 'evt_1')
      const req = mockFetch.mock.calls[0][0] as Request
      expect(req.url).toBe(
        'http://localhost:8000/extensions/roboledger/graph_42/operations/preview-reconciling-item'
      )
      expect(JSON.parse(await req.text())).toEqual({ event_id: 'evt_1' })
      expect(plan.default_disposition).toBe('catch_up')
      expect(plan.closed_periods).toEqual(['2026-07'])
    })

    it('resolves one with the chosen treatment', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('resolve-reconciling-item', {
          event_id: 'evt_1',
          disposition: 'acknowledge',
        })
      )
      const result = await client.resolveReconcilingItem('graph_42', {
        event_id: 'evt_1',
        disposition: 'acknowledge',
        note: 'Booked by hand in JE-1042',
      })
      const req = mockFetch.mock.calls[0][0] as Request
      expect(req.url).toBe(
        'http://localhost:8000/extensions/roboledger/graph_42/operations/resolve-reconciling-item'
      )
      expect(JSON.parse(await req.text())).toEqual({
        event_id: 'evt_1',
        disposition: 'acknowledge',
        note: 'Booked by hand in JE-1042',
      })
      expect(result.disposition).toBe('acknowledge')
    })

    it('sends the stamp of the preview it was decided on', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('resolve-reconciling-item', { event_id: 'evt_1' })
      )
      await client.resolveReconcilingItem('graph_42', {
        event_id: 'evt_1',
        expected_drift_detected_at: '2026-08-21T04:00:00+00:00',
      })
      const req = mockFetch.mock.calls[0][0] as Request
      expect(JSON.parse(await req.text())).toEqual({
        event_id: 'evt_1',
        expected_drift_detected_at: '2026-08-21T04:00:00+00:00',
      })
    })

    it('surfaces a refused resolution', async () => {
      mockFetch.mockResolvedValueOnce(
        restErrorResponse('Restate is blocked: period 2026-07 is closed', 409)
      )
      await expect(
        client.resolveReconcilingItem('graph_42', { event_id: 'evt_1', disposition: 'restate' })
      ).rejects.toThrow(/Restate is blocked/)
    })
  })

  describe('promoteObligations', () => {
    it('sweeps with the server defaults when given nothing', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('promote-obligations', {
          classified_count: 2,
          dispatched_count: 2,
          stranded_count: 1,
          error_count: 0,
        })
      )
      const result = await client.promoteObligations('graph_42')
      const req = mockFetch.mock.calls[0][0] as Request
      expect(req.url).toBe(
        'http://localhost:8000/extensions/roboledger/graph_42/operations/promote-obligations'
      )
      expect(JSON.parse(await req.text())).toEqual({})
      expect(result.dispatched_count).toBe(2)
      expect(result.stranded_count).toBe(1)
    })
  })

  describe('reconciliations', () => {
    const fiscalCalendar = {
      graph_id: 'graph_1',
      fiscal_year_start_month: 1,
      closed_through: null,
      close_target: null,
      gap_periods: 0,
      catch_up_sequence: [],
      closeable_now: false,
      blockers: ['unreconciled_accounts'],
      unreconciled_account_count: 1,
      unreconciled_account_sample: ['Prepaid Insurance (schedules): unreconciled'],
      last_close_at: null,
      initialized_at: null,
      last_sync_at: null,
      periods: [],
    }

    const summary = {
      structure_id: 'struct_1',
      name: 'Equipment Loan (statement)',
      scope: 'account',
      method: 'statement',
      element_id: 'elem_loan',
      required_for_close: false,
      materiality: 0,
      period: '2026-08',
      as_of: '2026-08-31',
      status: 'reconciled',
      unreconciled_difference: 0,
      ledger_balance: -4800,
      independent_balance: -4800,
      balance_as_of: '2026-08-31',
      components: [
        {
          name: 'Statement ending 2026-08-31',
          amount: -4800,
          event_id: 'evt_1',
          document_id: 'doc_1',
        },
      ],
      review_required: false,
      separate_reviewer: false,
      differences: [],
    }

    it('lists every reconciliation for a period', async () => {
      mockFetch.mockResolvedValueOnce(
        gqlResponse({
          reconciliations: {
            period: '2026-08',
            asOf: '2026-08-31',
            notes: [],
            reconciliations: [{ structureId: 'struct_1', status: 'not_started' }],
          },
        })
      )
      const list = await client.listReconciliations('graph_1', '2026-08')
      expect(list?.reconciliations[0].status).toBe('not_started')
      const [calledUrl, init] = mockFetch.mock.calls[0]
      expect(String(calledUrl)).toBe('http://localhost:8000/extensions/graph_1/graphql')
      expect(JSON.parse(init.body as string).variables).toEqual({
        period: '2026-08',
        entityId: null,
      })
    })

    it('refreshes and returns the same shape a read does', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('refresh-reconciliations', {
          period: '2026-08',
          as_of: '2026-08-31',
          notes: ['Source ledger (QuickBooks) was not compared.'],
          reconciliations: [summary],
        })
      )
      const list = await client.refreshReconciliations('graph_1', '2026-08')
      expect(list.notes).toHaveLength(1)
      const rec = list.reconciliations[0]
      expect(rec.structureId).toBe('struct_1')
      expect(rec.balanceAsOf).toBe('2026-08-31')
      expect(rec.components[0]).toEqual({
        name: 'Statement ending 2026-08-31',
        amount: -4800,
        structureId: null,
        eventId: 'evt_1',
        documentId: 'doc_1',
        note: null,
      })
      expect(rec.reviewedBy).toBeNull()
    })

    it('previews one method without recording', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('preview-reconciliations', {
          period: '2026-08',
          as_of: '2026-08-31',
          fiscal_year_start: '2026-01-01',
          method: 'schedule_register',
          source: 'schedules',
          accounts_compared: 1,
          accounts_tied: 0,
          accounts_different: 1,
          total_difference: 600,
          rows: [
            {
              element_id: 'elem_prepaid',
              account_name: 'Prepaid Insurance',
              ledger_balance: 1000,
              independent_balance: 400,
              difference: 600,
              status: 'different',
              components: [{ name: 'Insurance policy', amount: 400, structure_id: 'struct_s' }],
            },
          ],
          notes: [],
        })
      )
      const preview = await client.previewReconciliations('graph_1', '2026-08', {
        method: 'schedule_register',
        includeTied: true,
      })
      expect(preview.totalDifference).toBe(600)
      expect(preview.rows[0].components[0].structureId).toBe('struct_s')
      const req = mockFetch.mock.calls[0][0] as Request
      expect(JSON.parse(await req.text())).toEqual({
        period: '2026-08',
        method: 'schedule_register',
        include_tied: true,
        entity_id: null,
      })
    })

    it('records a statement balance', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('record-statement-balance', summary))
      const rec = await client.recordStatementBalance('graph_1', {
        elementId: 'elem_loan',
        asOf: '2026-08-31',
        balance: 4800,
        documentId: 'doc_1',
      })
      expect(rec.status).toBe('reconciled')
      expect(rec.independentBalance).toBe(-4800)
      const req = mockFetch.mock.calls[0][0] as Request
      expect(req.url).toContain('/operations/record-statement-balance')
      expect(JSON.parse(await req.text())).toEqual({
        element_id: 'elem_loan',
        entity_id: null,
        as_of: '2026-08-31',
        balance: 4800,
        document_id: 'doc_1',
        note: null,
      })
    })

    it("records a subsidiary's statement against its own entity", async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('record-statement-balance', summary))
      await client.recordStatementBalance('graph_1', {
        elementId: 'elem_cash',
        entityId: 'ent_2',
        asOf: '2026-08-31',
        balance: 1200,
      })
      const req = mockFetch.mock.calls[0][0] as Request
      expect(JSON.parse(await req.text())).toMatchObject({ entity_id: 'ent_2' })
    })

    it('refreshes and previews one entity when it is named', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('refresh-reconciliations', {
          period: '2026-08',
          as_of: '2026-08-31',
          notes: [],
          reconciliations: [],
        })
      )
      await client.refreshReconciliations('graph_1', '2026-08', { entityId: 'ent_2' })
      const refresh = mockFetch.mock.calls[0][0] as Request
      expect(JSON.parse(await refresh.text())).toEqual({ period: '2026-08', entity_id: 'ent_2' })

      mockFetch.mockResolvedValueOnce(
        envelopeResponse('preview-reconciliations', {
          period: '2026-08',
          as_of: '2026-08-31',
          method: 'statement',
          total_difference: 0,
          rows: [],
          notes: [],
        })
      )
      await client.previewReconciliations('graph_1', '2026-08', {
        method: 'statement',
        entityId: 'ent_2',
      })
      const preview = mockFetch.mock.calls[1][0] as Request
      expect(JSON.parse(await preview.text())).toMatchObject({ entity_id: 'ent_2' })
    })

    it('changes only the policy fields given', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('set-reconciliation-policy', {
          structure_id: 'struct_1',
          required_for_close: true,
          materiality: 5,
          review_required: false,
          separate_reviewer: false,
        })
      )
      const policy = await client.setReconciliationPolicy('graph_1', 'struct_1', {
        requiredForClose: true,
      })
      expect(policy.requiredForClose).toBe(true)
      const req = mockFetch.mock.calls[0][0] as Request
      expect(JSON.parse(await req.text())).toEqual({
        structure_id: 'struct_1',
        required_for_close: true,
      })
    })

    it('signs off a period', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('sign-off-reconciliation', {
          ...summary,
          status: 'reviewed',
          reviewed_by: 'usr_1',
          self_reviewed: true,
        })
      )
      const rec = await client.signOffReconciliation('graph_1', 'struct_1', '2026-08')
      expect(rec.status).toBe('reviewed')
      expect(rec.selfReviewed).toBe(true)
    })

    it('carries the unreconciled accounts on the calendar and the override on close', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('close-period', {
          period: '2026-08',
          entries_posted: 0,
          target_auto_advanced: false,
          fiscal_calendar: fiscalCalendar,
        })
      )
      const result = await client.closePeriod('graph_1', '2026-08', {
        allowUnreconciledAccounts: true,
      })
      expect(result.fiscalCalendar.unreconciledAccountCount).toBe(1)
      expect(result.fiscalCalendar.unreconciledAccountSample).toEqual([
        'Prepaid Insurance (schedules): unreconciled',
      ])
      const req = mockFetch.mock.calls[0][0] as Request
      expect(JSON.parse(await req.text()).allow_unreconciled_accounts).toBe(true)
    })
  })

  describe('createSchedule', () => {
    it('books the schedule to a named entity', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('create-schedule', { id: 'str_1', block_type: 'schedule', name: 'Rent' })
      )
      await client.createSchedule('graph_1', {
        name: 'Rent',
        elementIds: ['elem_1'],
        periodStart: '2026-01-01',
        periodEnd: '2026-12-31',
        monthlyAmount: 1000,
        entryTemplate: { debitElementId: 'elem_rent', creditElementId: 'elem_prepaid' },
        entityId: 'ent_sub',
      })
      const req = mockFetch.mock.calls[0][0] as Request
      const body = JSON.parse(await req.text())
      expect(body.payload.entity_id).toBe('ent_sub')
    })

    it('serializes options into snake_case body and converts the result', async () => {
      // `create-information-block` returns an InformationBlockEnvelope. The
      // previous mock invented a ScheduleCreatedResponse-shaped body that the
      // server never sends, which is why the facade reading `structure_id`
      // looked correct here while returning `structureId: undefined` in
      // production.
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('create-schedule', {
          id: 'str_1',
          block_type: 'schedule',
          name: 'Depreciation — Laptops',
          display_name: 'Depreciation — Laptops',
          category: 'schedule',
          taxonomy_id: 'tax_depreciation',
          facts: new Array(36).fill({ id: 'fact' }),
        })
      )
      const result = await client.createSchedule('graph_1', {
        name: 'Depreciation — Laptops',
        elementIds: ['elem_1'],
        periodStart: '2026-01-01',
        periodEnd: '2028-12-31',
        monthlyAmount: 100000,
        entryTemplate: {
          debitElementId: 'elem_depr_exp',
          creditElementId: 'elem_accum_depr',
        },
      })
      // The block's own id IS the structure id — this is the assertion that
      // would have caught the bug.
      expect(result.structureId).toBe('str_1')
      expect(result.taxonomyId).toBe('tax_depreciation')
      expect(result.totalFacts).toBe(36)

      const req = mockFetch.mock.calls[0][0] as Request
      const body = JSON.parse(await req.text())
      expect(body.block_type).toBe('schedule')
      expect(body.payload.element_ids).toEqual(['elem_1'])
      expect(body.payload.monthly_amount).toBe(100000)
      expect(body.payload.entry_template.debit_element_id).toBe('elem_depr_exp')
    })

    it('carries the day the cost was booked', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('create-schedule', { id: 'str_2', name: 'Insurance policy' })
      )
      await client.createSchedule('graph_1', {
        name: 'Insurance policy',
        elementIds: ['elem_1'],
        periodStart: '2026-02-01',
        periodEnd: '2027-01-31',
        monthlyAmount: 10000,
        entryTemplate: { debitElementId: 'elem_insurance', creditElementId: 'elem_prepaid' },
        scheduleMetadata: { originalAmount: 120000, bookedOn: '2026-01-15' },
      })

      const req = mockFetch.mock.calls[0][0] as Request
      const body = JSON.parse(await req.text())
      expect(body.payload.schedule_metadata.booked_on).toBe('2026-01-15')
      expect(body.payload.schedule_metadata.original_amount).toBe(120000)
    })
  })

  describe('createClosingEntry', () => {
    it('routes through create-event-block with schedule_entry_due metadata', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('create-event-block', {
          id: 'evt_1',
          event_type: 'schedule_entry_due',
          status: 'classified',
        })
      )
      const result = await client.createClosingEntry(
        'graph_1',
        'str_1',
        '2026-03-31',
        '2026-03-01',
        '2026-03-31',
        'Depreciation'
      )
      expect(result).toMatchObject({ id: 'evt_1', event_type: 'schedule_entry_due' })
      const req = mockFetch.mock.calls[0][0] as Request
      const body = JSON.parse(await req.text())
      expect(body.event_type).toBe('schedule_entry_due')
      expect(body.event_category).toBe('recognition')
      expect(body.apply_handlers).toBe(true)
      expect(body.metadata.schedule_id).toBe('str_1')
      expect(body.metadata.period_start).toBe('2026-03-01')
      expect(body.metadata.period_end).toBe('2026-03-31')
      expect(body.metadata.posting_date).toBe('2026-03-31')
      expect(body.metadata.memo).toBe('Depreciation')
    })

    it('POSTs to the create-event-block URL', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('create-event-block', {}))
      await client.createClosingEntry('graph_42', 'str_1', '2026-03-31', '2026-03-01', '2026-03-31')
      const req = mockFetch.mock.calls[0][0] as Request
      expect(req.url).toBe(
        'http://localhost:8000/extensions/roboledger/graph_42/operations/create-event-block'
      )
    })
  })

  describe('autoMapElements', () => {
    it('returns the operation id + status', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('auto-map-elements', null, 'pending'))
      const ack = await client.autoMapElements('graph_1', { mapping_id: 'map_1' })
      expect(ack.status).toBe('pending')
      expect(ack.operationId).toMatch(/^op_/)
    })
  })

  // ── Report writes (synchronous operations) ──────────────────────────
  //
  // The backend materializes reports inline (`execute_operation` runs
  // the handler synchronously and returns a completed envelope), so
  // every report write resolves with the bare typed result — there is
  // no operationId/SSE handshake on this surface.

  describe('createReport', () => {
    it('returns the published report header from the envelope result', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('create-report', {
          id: 'rpt_1',
          name: 'Q1 Report',
          filing_status: 'draft',
        })
      )
      const report = await client.createReport('graph_1', {
        name: 'Q1 Report',
        mappingId: 'map_1',
        periodStart: '2026-01-01',
        periodEnd: '2026-03-31',
      })
      expect(report).toMatchObject({ id: 'rpt_1', name: 'Q1 Report' })
    })

    it('POSTs snake_case body to the create-report operation URL', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('create-report', { id: 'rpt_1' }))
      await client.createReport('graph_42', {
        name: 'FY25',
        mappingId: 'map_1',
        periodStart: '2025-01-01',
        periodEnd: '2025-12-31',
      })
      const req = mockFetch.mock.calls[0][0] as Request
      expect(req.url).toBe(
        'http://localhost:8000/extensions/roboledger/graph_42/operations/create-report'
      )
      const body = JSON.parse(await req.text())
      expect(body.mapping_id).toBe('map_1')
      expect(body.period_start).toBe('2025-01-01')
      expect(body.period_end).toBe('2025-12-31')
      expect(body).not.toHaveProperty('entity_id')
    })

    it('passes the entity the report is for', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('create-report', { id: 'rpt_1' }))
      await client.createReport('graph_42', {
        name: 'FY25',
        mappingId: 'map_sub',
        periodStart: '2025-01-01',
        periodEnd: '2025-12-31',
        entityId: 'ent_sub',
      })
      const req = mockFetch.mock.calls[0][0] as Request
      const body = JSON.parse(await req.text())
      expect(body.entity_id).toBe('ent_sub')
    })

    it('throws when the envelope carries no result', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('create-report', null))
      await expect(
        client.createReport('graph_1', {
          name: 'Empty',
          mappingId: 'map_1',
          periodStart: '2026-01-01',
          periodEnd: '2026-03-31',
        })
      ).rejects.toThrow(/Create report: operation envelope had no result/)
    })
  })

  describe('regenerateReport', () => {
    it('returns the regenerated report header', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('regenerate-report', { id: 'rpt_1', generation_status: 'completed' })
      )
      const report = await client.regenerateReport('graph_1', 'rpt_1')
      expect(report).toMatchObject({ id: 'rpt_1', generation_status: 'completed' })
    })
  })

  describe('shareReport', () => {
    it('returns the per-recipient share results', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('share-report', {
          report_id: 'rpt_1',
          results: [{ target_graph_id: 'graph_2', status: 'shared' }],
        })
      )
      const result = await client.shareReport('graph_1', 'rpt_1', 'pl_1')
      expect(result.results).toHaveLength(1)
      expect(result.results[0]).toMatchObject({ target_graph_id: 'graph_2' })
    })
  })

  /** Read the JSON body of the first fetch call.
   *
   * REST operations go through the generated client, which calls
   * `fetch(Request)`; the GraphQL path calls `fetch(url, init)`. Handle both
   * so this doesn't silently pass against the wrong shape.
   */
  async function requestBody(index = 0): Promise<Record<string, unknown>> {
    const [first, init] = mockFetch.mock.calls[index]
    if (init && typeof (init as RequestInit).body === 'string') {
      return JSON.parse((init as RequestInit).body as string)
    }
    return await (first as Request).clone().json()
  }

  // Cross-graph share controls. Sharing is authorized capability-style —
  // whoever holds a graph's id can copy a published report into it — so the
  // recipient's exit (block, purge) and the sender's (revoke) are what make
  // the model sound.

  describe('revokeReportShare', () => {
    it('reports the withdrawn copy', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('revoke-report-share', {
          report_id: 'rpt_1',
          target_graph_id: 'graph_2',
          revoked_at: '2026-08-09T12:00:00Z',
          copy_deleted: true,
        })
      )
      const result = await client.revokeReportShare('graph_1', 'rpt_1', 'graph_2')
      expect(result).toMatchObject({ target_graph_id: 'graph_2', copy_deleted: true })
    })

    it('is not an error when the recipient already deleted the copy', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('revoke-report-share', {
          report_id: 'rpt_1',
          target_graph_id: 'graph_2',
          revoked_at: '2026-08-09T12:00:00Z',
          copy_deleted: false,
        })
      )
      const result = await client.revokeReportShare('graph_1', 'rpt_1', 'graph_2')
      expect(result.copy_deleted).toBe(false)
    })
  })

  describe('blockSourceGraph', () => {
    it('blocks a sender and reports nothing purged by default', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('block-source-graph', {
          block: { id: 'blk_1', source_graph_id: 'graph_2' },
          already_blocked: false,
          purged_report_count: 0,
        })
      )
      const result = await client.blockSourceGraph('graph_1', 'graph_2')
      expect(result).toMatchObject({ already_blocked: false, purged_report_count: 0 })
      const body = await requestBody()
      expect(body).toMatchObject({ source_graph_id: 'graph_2', purge: false })
      // An omitted reason must not be sent as an explicit null.
      expect(body).not.toHaveProperty('reason')
    })

    it('forwards purge and reason', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('block-source-graph', {
          block: { id: 'blk_1', source_graph_id: 'graph_2' },
          already_blocked: true,
          purged_report_count: 3,
        })
      )
      const result = await client.blockSourceGraph('graph_1', 'graph_2', {
        reason: 'No longer a shareholder.',
        purge: true,
      })
      expect(result.purged_report_count).toBe(3)
      const body = await requestBody()
      expect(body).toMatchObject({ purge: true, reason: 'No longer a shareholder.' })
    })
  })

  describe('unblockSourceGraph', () => {
    it('returns the lifted block', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('unblock-source-graph', {
          id: 'blk_1',
          source_graph_id: 'graph_2',
        })
      )
      const result = await client.unblockSourceGraph('graph_1', 'graph_2')
      expect(result).toMatchObject({ source_graph_id: 'graph_2' })
    })
  })

  describe('listBlockedSourceGraphs', () => {
    it('unwraps the paginated list', async () => {
      mockFetch.mockResolvedValueOnce(
        gqlResponse({
          blockedSourceGraphs: {
            blockedSourceGraphs: [
              {
                id: 'blk_1',
                sourceGraphId: 'graph_2',
                sourceGraphName: 'Acme Inc',
                blockedBy: 'usr_1',
                blockedAt: '2026-08-09T12:00:00Z',
                reason: null,
              },
            ],
            pagination: { total: 1, limit: 100, offset: 0, hasMore: false },
          },
        })
      )
      const blocked = await client.listBlockedSourceGraphs('graph_1')
      expect(blocked).toHaveLength(1)
      expect(blocked[0]).toMatchObject({ sourceGraphId: 'graph_2' })
    })

    it('returns an empty list when nothing is blocked', async () => {
      mockFetch.mockResolvedValueOnce(gqlResponse({ blockedSourceGraphs: null }))
      expect(await client.listBlockedSourceGraphs('graph_1')).toEqual([])
    })
  })

  describe('fileReport', () => {
    it('returns the filed report header', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('file-report', { id: 'rpt_1', filing_status: 'filed' })
      )
      const report = await client.fileReport('graph_1', 'rpt_1')
      expect(report).toMatchObject({ id: 'rpt_1', filing_status: 'filed' })
    })
  })

  describe('transitionFilingStatus', () => {
    it('returns the transitioned report header', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('transition-filing-status', { id: 'rpt_1', filing_status: 'under_review' })
      )
      const report = await client.transitionFilingStatus('graph_1', 'rpt_1', 'under_review')
      expect(report).toMatchObject({ filing_status: 'under_review' })
    })
  })

  describe('linkEntityTaxonomy', () => {
    it('returns the link result', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('link-entity-taxonomy', { taxonomy_id: 'tax_1', is_primary: true })
      )
      const result = await client.linkEntityTaxonomy('graph_1', {
        taxonomy_id: 'tax_1',
        basis: 'chart_of_accounts',
        is_primary: true,
      })
      expect(result).toMatchObject({ is_primary: true })
    })

    it('POSTs to the link-entity-taxonomy operation URL', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('link-entity-taxonomy', {}))
      await client.linkEntityTaxonomy('graph_42', { taxonomy_id: 'tax_1' })
      const req = mockFetch.mock.calls[0][0] as Request
      expect(req.url).toBe(
        'http://localhost:8000/extensions/roboledger/graph_42/operations/link-entity-taxonomy'
      )
    })
  })

  // ── Schedule writes ─────────────────────────────────────────────────

  describe('updateSchedule', () => {
    it('returns the updated schedule result', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('update-information-block', { structure_id: 'str_1', name: 'Updated' })
      )
      const result = await client.updateSchedule('graph_1', 'str_1', { name: 'Updated' })
      expect(result).toMatchObject({ name: 'Updated' })
    })

    it('POSTs to the update-information-block URL', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('update-information-block', {}))
      await client.updateSchedule('graph_42', 'str_1', {})
      const req = mockFetch.mock.calls[0][0] as Request
      expect(req.url).toBe(
        'http://localhost:8000/extensions/roboledger/graph_42/operations/update-information-block'
      )
    })

    it('wraps payload with block_type schedule', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('update-information-block', {}))
      await client.updateSchedule('graph_1', 'str_1', { name: 'Renamed' })
      const req = mockFetch.mock.calls[0][0] as Request
      const body = JSON.parse(await req.text())
      expect(body.block_type).toBe('schedule')
      expect(body.payload.structure_id).toBe('str_1')
    })
  })

  describe('deleteSchedule', () => {
    it('returns deleted: true from the envelope', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('delete-information-block', { deleted: true })
      )
      const result = await client.deleteSchedule('graph_1', 'str_1')
      expect(result.deleted).toBe(true)
    })

    it('falls back to deleted: true when result is null', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('delete-information-block', null))
      const result = await client.deleteSchedule('graph_1', 'str_1')
      expect(result.deleted).toBe(true)
    })

    it('wraps structure_id in block_type schedule payload', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('delete-information-block', null))
      await client.deleteSchedule('graph_1', 'str_abc')
      const req = mockFetch.mock.calls[0][0] as Request
      const body = JSON.parse(await req.text())
      expect(body.block_type).toBe('schedule')
      expect(body.payload.structure_id).toBe('str_abc')
    })
  })

  describe('rebuildSchedule', () => {
    it('converts the regenerated schedule result to camelCase', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('rebuild-schedule', {
          structure_id: 'str_1',
          name: 'Depreciation — Laptops',
          taxonomy_id: 'tax_depreciation',
          total_periods: 36,
          total_facts: 36,
          rule_summary: { pass: 36 },
        })
      )
      const result = await client.rebuildSchedule('graph_1', 'str_1')
      expect(result.structureId).toBe('str_1')
      expect(result.totalPeriods).toBe(36)
      expect(result.ruleSummary).toEqual({ pass: 36 })
    })

    it('POSTs structure_id to the rebuild-schedule URL', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('rebuild-schedule', {}))
      await client.rebuildSchedule('graph_42', 'str_abc')
      const req = mockFetch.mock.calls[0][0] as Request
      expect(req.url).toBe(
        'http://localhost:8000/extensions/roboledger/graph_42/operations/rebuild-schedule'
      )
      const body = JSON.parse(await req.text())
      expect(body.structure_id).toBe('str_abc')
    })

    it('forwards an Idempotency-Key header when provided', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('rebuild-schedule', {}))
      await client.rebuildSchedule('graph_1', 'str_1', { idempotencyKey: 'idem_123' })
      const req = mockFetch.mock.calls[0][0] as Request
      expect(req.headers.get('Idempotency-Key')).toBe('idem_123')
    })
  })

  describe('computeMetrics', () => {
    it('returns the computed and skipped metrics from the envelope result', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('compute-metrics', {
          structure_id: 'str_metrics',
          entity_id: 'ent_1',
          period_end: '2025-12-31',
          fact_set_id: 'fs_1',
          computed: [{ element_qname: 'rs-metric:CurrentRatio', value: 3.27, unit: 'pure' }],
          skipped: [
            {
              element_qname: 'rs-metric:InterestCoverage',
              reason: 'missing operand facts',
              missing: ['rs-gaap:InterestExpense'],
            },
          ],
        })
      )
      const result = await client.computeMetrics('graph_1', {
        structure_id: 'str_metrics',
        period_end: '2025-12-31',
      })
      expect(result.fact_set_id).toBe('fs_1')
      expect(result.computed).toHaveLength(1)
      expect(result.skipped?.[0].reason).toBe('missing operand facts')
    })

    it('POSTs the request body to the compute-metrics URL', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('compute-metrics', {
          structure_id: 'str_1',
          entity_id: 'ent_1',
          period_end: '2025-12-31',
        })
      )
      await client.computeMetrics('graph_42', {
        structure_id: 'str_1',
        period_end: '2025-12-31',
        entity_id: 'ent_1',
      })
      const req = mockFetch.mock.calls[0][0] as Request
      expect(req.url).toBe(
        'http://localhost:8000/extensions/roboledger/graph_42/operations/compute-metrics'
      )
      const body = JSON.parse(await req.text())
      expect(body.structure_id).toBe('str_1')
      expect(body.period_end).toBe('2025-12-31')
      expect(body.entity_id).toBe('ent_1')
    })

    it('forwards an Idempotency-Key header when provided', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('compute-metrics', {
          structure_id: 'str_1',
          entity_id: 'ent_1',
          period_end: '2025-12-31',
        })
      )
      await client.computeMetrics(
        'graph_1',
        { structure_id: 'str_1', period_end: '2025-12-31' },
        { idempotencyKey: 'idem_456' }
      )
      const req = mockFetch.mock.calls[0][0] as Request
      expect(req.headers.get('Idempotency-Key')).toBe('idem_456')
    })
  })

  // ── Journal entry writes ────────────────────────────────────────────

  describe('createJournalEntry', () => {
    const lineItems = [
      { elementId: 'elem_cash', debitAmount: 1000, creditAmount: 0 },
      { elementId: 'elem_revenue', debitAmount: 0, creditAmount: 1000 },
    ]

    it('returns the event-block envelope result', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('create-event-block', {
          id: 'evt_1',
          event_type: 'journal_entry_recorded',
          status: 'classified',
        })
      )
      const result = await client.createJournalEntry('graph_1', {
        postingDate: '2026-03-31',
        memo: 'Revenue recognition',
        lineItems,
      })
      expect(result).toMatchObject({ id: 'evt_1', event_type: 'journal_entry_recorded' })
    })

    it('wraps options in journal_entry_recorded metadata', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('create-event-block', {}))
      await client.createJournalEntry('graph_1', {
        postingDate: '2026-03-31',
        memo: 'Test',
        lineItems,
        type: 'standard',
        status: 'posted',
        transactionId: 'txn_1',
      })
      const req = mockFetch.mock.calls[0][0] as Request
      const body = JSON.parse(await req.text())
      expect(body.event_type).toBe('journal_entry_recorded')
      expect(body.event_category).toBe('adjustment')
      expect(body.source).toBe('manual')
      expect(body.occurred_at).toBe('2026-03-31T00:00:00Z')
      expect(body.apply_handlers).toBe(true)
      expect(body.metadata.posting_date).toBe('2026-03-31')
      expect(body.metadata.memo).toBe('Test')
      expect(body.metadata.type).toBe('standard')
      expect(body.metadata.status).toBe('posted')
      expect(body.metadata.transaction_id).toBe('txn_1')
      expect(body.metadata.line_items).toHaveLength(2)
      expect(body.metadata.line_items[0].element_id).toBe('elem_cash')
      expect(body.metadata.line_items[0].debit_amount).toBe(1000)
    })

    it('POSTs to the create-event-block URL', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('create-event-block', {}))
      await client.createJournalEntry('graph_42', {
        postingDate: '2026-03-31',
        memo: 'Test',
        lineItems,
      })
      const req = mockFetch.mock.calls[0][0] as Request
      expect(req.url).toBe(
        'http://localhost:8000/extensions/roboledger/graph_42/operations/create-event-block'
      )
    })

    it('throws on 4xx', async () => {
      mockFetch.mockResolvedValueOnce(restErrorResponse('Line items do not balance', 422))
      await expect(
        client.createJournalEntry('graph_1', { postingDate: '2026-03-31', memo: 'X', lineItems })
      ).rejects.toThrow(/Create journal entry failed/)
    })

    it('sends Idempotency-Key header when provided', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('create-event-block', {}))
      await client.createJournalEntry('graph_1', {
        postingDate: '2026-03-31',
        memo: 'Test',
        lineItems,
        idempotencyKey: 'idem-123',
      })
      const req = mockFetch.mock.calls[0][0] as Request
      expect(req.headers.get('idempotency-key')).toBe('idem-123')
    })
  })

  describe('updateJournalEntry', () => {
    it('returns the updated entry result', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('update-journal-entry', { entry_id: 'je_1', memo: 'Updated' })
      )
      const result = await client.updateJournalEntry('graph_1', {
        entry_id: 'je_1',
        memo: 'Updated',
      })
      expect(result).toMatchObject({ memo: 'Updated' })
    })

    it('POSTs to the update-journal-entry URL', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('update-journal-entry', {}))
      await client.updateJournalEntry('graph_42', { entry_id: 'je_1' })
      const req = mockFetch.mock.calls[0][0] as Request
      expect(req.url).toBe(
        'http://localhost:8000/extensions/roboledger/graph_42/operations/update-journal-entry'
      )
    })
  })

  describe('deleteJournalEntry', () => {
    it('returns deleted: true from the envelope', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('delete-journal-entry', { deleted: true }))
      const result = await client.deleteJournalEntry('graph_1', 'je_1')
      expect(result.deleted).toBe(true)
    })

    it('falls back to deleted: true when result is null', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('delete-journal-entry', null))
      const result = await client.deleteJournalEntry('graph_1', 'je_1')
      expect(result.deleted).toBe(true)
    })

    it('sends entry_id in the request body', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('delete-journal-entry', null))
      await client.deleteJournalEntry('graph_1', 'je_xyz')
      const req = mockFetch.mock.calls[0][0] as Request
      const body = JSON.parse(await req.text())
      expect(body.entry_id).toBe('je_xyz')
    })
  })

  describe('reverseJournalEntry', () => {
    it('returns the event-block envelope result', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('create-event-block', {
          id: 'evt_1',
          event_type: 'journal_entry_reversed',
          status: 'fulfilled',
        })
      )
      const result = await client.reverseJournalEntry('graph_1', 'je_1', {
        postingDate: '2026-04-01',
        memo: 'Reversal of March entry',
      })
      expect(result).toMatchObject({ id: 'evt_1', event_type: 'journal_entry_reversed' })
    })

    it('wraps entry_id and optional fields in journal_entry_reversed metadata', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('create-event-block', {}))
      await client.reverseJournalEntry('graph_1', 'je_abc', {
        postingDate: '2026-04-01',
        memo: 'Reversal',
        reason: 'duplicate',
      })
      const req = mockFetch.mock.calls[0][0] as Request
      const body = JSON.parse(await req.text())
      expect(body.event_type).toBe('journal_entry_reversed')
      expect(body.event_category).toBe('adjustment')
      expect(body.apply_handlers).toBe(true)
      expect(body.occurred_at).toBe('2026-04-01T00:00:00Z')
      expect(body.metadata.entry_id).toBe('je_abc')
      expect(body.metadata.posting_date).toBe('2026-04-01')
      expect(body.metadata.memo).toBe('Reversal')
      expect(body.metadata.reason).toBe('duplicate')
    })

    it('sends null for omitted optional fields', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('create-event-block', {}))
      await client.reverseJournalEntry('graph_1', 'je_1')
      const req = mockFetch.mock.calls[0][0] as Request
      const body = JSON.parse(await req.text())
      expect(body.metadata.entry_id).toBe('je_1')
      expect(body.metadata.posting_date).toBeNull()
      expect(body.metadata.memo).toBeNull()
      expect(body.metadata.reason).toBeNull()
    })

    it('POSTs to the create-event-block URL', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('create-event-block', {}))
      await client.reverseJournalEntry('graph_42', 'je_1')
      const req = mockFetch.mock.calls[0][0] as Request
      expect(req.url).toBe(
        'http://localhost:8000/extensions/roboledger/graph_42/operations/create-event-block'
      )
    })
  })

  // ── Fact grid ───────────────────────────────────────────────────────

  describe('buildFactGrid', () => {
    it('returns the fact grid result', async () => {
      const grid = { columns: ['period', 'value'], rows: [] }
      mockFetch.mockResolvedValueOnce(envelopeResponse('build-fact-grid', grid))
      const result = await client.buildFactGrid('graph_1', {
        elements: ['us-gaap:Assets'],
        periods: ['2026-03-31'],
      })
      expect(result).toMatchObject(grid)
    })

    it('sends the request body to build-fact-grid', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('build-fact-grid', {}))
      await client.buildFactGrid('graph_42', {
        canonical_concepts: ['revenue'],
        entities: ['ACME'],
        fiscal_year: 2026,
      })
      const req = mockFetch.mock.calls[0][0] as Request
      expect(req.url).toBe(
        'http://localhost:8000/extensions/roboledger/graph_42/operations/build-fact-grid'
      )
      const body = JSON.parse(await req.text())
      expect(body.canonical_concepts).toEqual(['revenue'])
      expect(body.fiscal_year).toBe(2026)
    })

    it('throws on 4xx', async () => {
      mockFetch.mockResolvedValueOnce(restErrorResponse('Graph not materialized', 400))
      await expect(client.buildFactGrid('graph_1', {})).rejects.toThrow(/Build fact grid failed/)
    })
  })

  // ── Event blocks (preview + status transitions) ────────────────────────

  describe('previewEventBlock', () => {
    const previewBody = {
      event_type: 'journal_entry_recorded' as const,
      event_category: 'adjustment' as const,
      source: 'native',
      occurred_at: '2026-03-31T00:00:00Z',
      apply_handlers: true,
      metadata: {
        posting_date: '2026-03-31',
        memo: 'preview test',
        line_items: [
          { element_id: 'elem_a', debit_amount: 100, credit_amount: 0 },
          { element_id: 'elem_b', debit_amount: 0, credit_amount: 100 },
        ],
        type: 'standard',
        status: 'draft',
      },
    }

    it('returns the preview envelope result', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('preview-event-block', {
          would_succeed: true,
          planned_transactions: [],
          validation_errors: [],
        })
      )
      const result = await client.previewEventBlock('graph_1', previewBody)
      expect(result).toMatchObject({ would_succeed: true })
    })

    it('forwards the body unchanged to the operation', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('preview-event-block', {}))
      await client.previewEventBlock('graph_1', previewBody)
      const req = mockFetch.mock.calls[0][0] as Request
      const body = JSON.parse(await req.text())
      expect(body.event_type).toBe('journal_entry_recorded')
      expect(body.metadata.memo).toBe('preview test')
    })

    it('POSTs to the preview-event-block URL', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('preview-event-block', {}))
      await client.previewEventBlock('graph_42', previewBody)
      const req = mockFetch.mock.calls[0][0] as Request
      expect(req.url).toBe(
        'http://localhost:8000/extensions/roboledger/graph_42/operations/preview-event-block'
      )
    })

    it('surfaces validation errors via would_succeed=false', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('preview-event-block', {
          would_succeed: false,
          validation_errors: ['Line items unbalanced'],
        })
      )
      const result = await client.previewEventBlock('graph_1', previewBody)
      expect(result.would_succeed).toBe(false)
      expect((result.validation_errors as string[])[0]).toBe('Line items unbalanced')
    })
  })

  describe('updateEventBlock', () => {
    it('returns the updated envelope result', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('update-event-block', {
          id: 'evt_1',
          status: 'committed',
        })
      )
      const result = await client.updateEventBlock('graph_1', {
        event_id: 'evt_1',
        transition_to: 'committed',
      })
      expect(result).toMatchObject({ id: 'evt_1', status: 'committed' })
    })

    it('sends event_id and transition_to in the body', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('update-event-block', {}))
      await client.updateEventBlock('graph_1', {
        event_id: 'evt_abc',
        transition_to: 'voided',
      })
      const req = mockFetch.mock.calls[0][0] as Request
      const body = JSON.parse(await req.text())
      expect(body.event_id).toBe('evt_abc')
      expect(body.transition_to).toBe('voided')
    })

    it('supports superseded transitions with a successor id', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('update-event-block', {}))
      await client.updateEventBlock('graph_1', {
        event_id: 'evt_1',
        transition_to: 'superseded',
        superseded_by_id: 'evt_2',
      })
      const body = JSON.parse(await (mockFetch.mock.calls[0][0] as Request).text())
      expect(body.superseded_by_id).toBe('evt_2')
    })

    it('supports field corrections via metadata_patch', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('update-event-block', {}))
      await client.updateEventBlock('graph_1', {
        event_id: 'evt_1',
        description: 'Updated description',
        metadata_patch: { reason: 'duplicate' },
      })
      const body = JSON.parse(await (mockFetch.mock.calls[0][0] as Request).text())
      expect(body.description).toBe('Updated description')
      expect(body.metadata_patch).toEqual({ reason: 'duplicate' })
    })

    it('POSTs to the update-event-block URL', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('update-event-block', {}))
      await client.updateEventBlock('graph_42', { event_id: 'evt_1' })
      const req = mockFetch.mock.calls[0][0] as Request
      expect(req.url).toBe(
        'http://localhost:8000/extensions/roboledger/graph_42/operations/update-event-block'
      )
    })
  })

  // ── Agents ───────────────────────────────────────────────────────────

  describe('createAgent', () => {
    it('returns the created agent', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('create-agent', { id: 'agt_1', agent_type: 'customer' })
      )
      const result = await client.createAgent('graph_1', {
        agent_type: 'customer',
        name: 'ACME Corp',
      })
      expect(result).toMatchObject({ id: 'agt_1' })
    })

    it('serializes optional fields into the body', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('create-agent', {}))
      await client.createAgent('graph_1', {
        agent_type: 'vendor',
        name: 'Office Supplier',
        legal_name: 'Office Supplier Inc.',
        tax_id: '12-3456789',
        email: 'ap@supplier.com',
        is_1099_recipient: true,
        source: 'quickbooks',
        external_id: 'qb_vendor_42',
      })
      const body = JSON.parse(await (mockFetch.mock.calls[0][0] as Request).text())
      expect(body.agent_type).toBe('vendor')
      expect(body.tax_id).toBe('12-3456789')
      expect(body.is_1099_recipient).toBe(true)
      expect(body.external_id).toBe('qb_vendor_42')
    })

    it('forwards Idempotency-Key header when supplied', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('create-agent', {}))
      await client.createAgent('graph_1', { agent_type: 'customer', name: 'X' }, 'idem-agent-1')
      const req = mockFetch.mock.calls[0][0] as Request
      expect(req.headers.get('idempotency-key')).toBe('idem-agent-1')
    })

    it('POSTs to the create-agent URL', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('create-agent', {}))
      await client.createAgent('graph_42', { agent_type: 'customer', name: 'X' })
      const req = mockFetch.mock.calls[0][0] as Request
      expect(req.url).toBe(
        'http://localhost:8000/extensions/roboledger/graph_42/operations/create-agent'
      )
    })
  })

  describe('updateAgent', () => {
    it('returns the updated agent', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('update-agent', { id: 'agt_1', name: 'New Name' })
      )
      const result = await client.updateAgent('graph_1', {
        agent_id: 'agt_1',
        name: 'New Name',
      })
      expect(result).toMatchObject({ name: 'New Name' })
    })

    it('serializes metadata_patch as an additive merge', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('update-agent', {}))
      await client.updateAgent('graph_1', {
        agent_id: 'agt_1',
        metadata_patch: { region: 'us-west' },
      })
      const body = JSON.parse(await (mockFetch.mock.calls[0][0] as Request).text())
      expect(body.metadata_patch).toEqual({ region: 'us-west' })
    })

    it('POSTs to the update-agent URL', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('update-agent', {}))
      await client.updateAgent('graph_42', { agent_id: 'agt_1' })
      const req = mockFetch.mock.calls[0][0] as Request
      expect(req.url).toBe(
        'http://localhost:8000/extensions/roboledger/graph_42/operations/update-agent'
      )
    })
  })

  // ── Event handlers ────────────────────────────────────────────────────

  describe('createEventHandler', () => {
    const handlerBody = {
      name: 'Stripe charge → revenue',
      event_type: 'invoice_paid',
      event_category: 'sales',
      match_source: 'stripe',
      transaction_template: {
        transactions: [
          {
            entry_template: {
              debit: { element_id: 'elem_cash', amount: '{{ event.amount }}' },
              credit: { element_id: 'elem_revenue', amount: '{{ event.amount }}' },
            },
          },
        ],
      },
      priority: 100,
    }

    it('returns the created handler', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('create-event-handler', { id: 'eh_1', name: handlerBody.name })
      )
      const result = await client.createEventHandler('graph_1', handlerBody)
      expect(result).toMatchObject({ id: 'eh_1' })
    })

    it('forwards transaction_template untouched', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('create-event-handler', {}))
      await client.createEventHandler('graph_1', handlerBody)
      const body = JSON.parse(await (mockFetch.mock.calls[0][0] as Request).text())
      expect(body.transaction_template.transactions).toHaveLength(1)
      expect(body.match_source).toBe('stripe')
      expect(body.priority).toBe(100)
    })

    it('POSTs to the create-event-handler URL', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('create-event-handler', {}))
      await client.createEventHandler('graph_42', handlerBody)
      const req = mockFetch.mock.calls[0][0] as Request
      expect(req.url).toBe(
        'http://localhost:8000/extensions/roboledger/graph_42/operations/create-event-handler'
      )
    })
  })

  describe('updateEventHandler', () => {
    it('returns the updated handler', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('update-event-handler', { id: 'eh_1', is_active: false })
      )
      const result = await client.updateEventHandler('graph_1', {
        event_handler_id: 'eh_1',
        is_active: false,
      })
      expect(result).toMatchObject({ is_active: false })
    })

    it('supports approve flag for AI-suggested handlers', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('update-event-handler', {}))
      await client.updateEventHandler('graph_1', {
        event_handler_id: 'eh_1',
        approve: true,
      })
      const body = JSON.parse(await (mockFetch.mock.calls[0][0] as Request).text())
      expect(body.approve).toBe(true)
    })

    it('POSTs to the update-event-handler URL', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('update-event-handler', {}))
      await client.updateEventHandler('graph_42', { event_handler_id: 'eh_1' })
      const req = mockFetch.mock.calls[0][0] as Request
      expect(req.url).toBe(
        'http://localhost:8000/extensions/roboledger/graph_42/operations/update-event-handler'
      )
    })
  })

  // ── Financial statements ─────────────────────────────────────────────

  describe('liveFinancialStatement', () => {
    it('returns the statement payload', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('live-financial-statement', {
          statement_type: 'income_statement',
          rows: [{ element: 'us-gaap:Revenues', value: 1000000 }],
        })
      )
      const result = await client.liveFinancialStatement('graph_1', {
        statement_type: 'income_statement',
        period_start: '2026-01-01',
        period_end: '2026-03-31',
      })
      expect(result).toMatchObject({ statement_type: 'income_statement' })
    })

    it('serializes window fields into the body', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('live-financial-statement', {}))
      await client.liveFinancialStatement('graph_1', {
        statement_type: 'balance_sheet',
        fiscal_year: 2026,
        limit: 50,
      })
      const body = JSON.parse(await (mockFetch.mock.calls[0][0] as Request).text())
      expect(body.statement_type).toBe('balance_sheet')
      expect(body.fiscal_year).toBe(2026)
      expect(body.limit).toBe(50)
    })

    it('POSTs to the live-financial-statement URL', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('live-financial-statement', {}))
      await client.liveFinancialStatement('graph_42', {
        statement_type: 'income_statement',
      })
      const req = mockFetch.mock.calls[0][0] as Request
      expect(req.url).toBe(
        'http://localhost:8000/extensions/roboledger/graph_42/operations/live-financial-statement'
      )
    })
  })

  describe('financialStatementAnalysis', () => {
    it('returns the analysis payload', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('financial-statement-analysis', {
          statement_type: 'income_statement',
          analysis: { gross_margin: 0.42 },
        })
      )
      const result = await client.financialStatementAnalysis('graph_1', {
        statement_type: 'income_statement',
        report_id: 'rep_1',
      })
      expect((result.analysis as Record<string, number>).gross_margin).toBe(0.42)
    })

    it('forwards ticker for shared-repo graphs', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('financial-statement-analysis', {}))
      await client.financialStatementAnalysis('sec', {
        statement_type: 'balance_sheet',
        ticker: 'NVDA',
        fiscal_year: 2025,
      })
      const body = JSON.parse(await (mockFetch.mock.calls[0][0] as Request).text())
      expect(body.ticker).toBe('NVDA')
      expect(body.fiscal_year).toBe(2025)
    })

    it('POSTs to the financial-statement-analysis URL', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('financial-statement-analysis', {}))
      await client.financialStatementAnalysis('graph_42', {
        statement_type: 'cash_flow_statement',
      })
      const req = mockFetch.mock.calls[0][0] as Request
      expect(req.url).toBe(
        'http://localhost:8000/extensions/roboledger/graph_42/operations/financial-statement-analysis'
      )
    })
  })

  describe('constructor', () => {
    it('creates with minimal config', () => {
      const c = new LedgerClient({ baseUrl: 'http://localhost:8000' })
      expect(c).toBeInstanceOf(LedgerClient)
    })

    it('accepts all config options', () => {
      const c = new LedgerClient({
        baseUrl: 'http://localhost:8000',
        token: 't',
        credentials: 'include',
        headers: { 'X-Test': 'y' },
      })
      expect(c).toBeInstanceOf(LedgerClient)
    })
  })

  // ── Structured GraphQL errors ───────────────────────────────────────

  describe('GraphQLError', () => {
    it('throws a GraphQLError carrying the raw errors and status code', async () => {
      mockFetch.mockResolvedValueOnce(gqlErrorResponse('Access denied'))
      let caught: unknown
      try {
        await client.getEntity('graph_1')
      } catch (err) {
        caught = err
      }
      expect(caught).toBeInstanceOf(GraphQLError)
      const gqlErr = caught as GraphQLError
      // Message format is unchanged from the pre-structured era so
      // string-matching consumers keep working.
      expect(gqlErr.message).toMatch(/^Get entity failed: /)
      expect(gqlErr.errors).toHaveLength(1)
      expect((gqlErr.errors[0] as { message: string }).message).toBe('Access denied')
      expect(gqlErr.statusCode).toBe(200)
    })

    it('is still an Error for consumers catching generically', async () => {
      mockFetch.mockResolvedValueOnce(gqlErrorResponse('Boom'))
      await expect(client.getEntity('graph_1')).rejects.toBeInstanceOf(Error)
    })
  })

  // ── GraphQL request timeout ─────────────────────────────────────────

  describe('GraphQL timeout', () => {
    it('attaches an AbortSignal to every GraphQL request', async () => {
      mockFetch.mockResolvedValueOnce(gqlResponse({ entity: null }))
      await client.getEntity('graph_1')
      const init = mockFetch.mock.calls[0][1] as RequestInit
      expect(init.signal).toBeInstanceOf(AbortSignal)
      expect(init.signal?.aborted).toBe(false)
    })

    it('honors a configured timeout by aborting the signal after it elapses', async () => {
      // Real timers: happy-dom's AbortSignal.timeout schedules on the
      // native clock, which vitest's fake timers don't intercept. A
      // 5ms timeout keeps the wait negligible.
      const quickClient = new LedgerClient({
        baseUrl: 'http://localhost:8000',
        token: 'rfs_test_api_key',
        timeout: 5,
      })
      mockFetch.mockResolvedValueOnce(gqlResponse({ entity: null }))
      await quickClient.getEntity('graph_1')
      const init = mockFetch.mock.calls[0][1] as RequestInit
      const signal = init.signal as AbortSignal
      expect(signal.aborted).toBe(false)
      await new Promise((resolve) => setTimeout(resolve, 25))
      expect(signal.aborted).toBe(true)
    })
  })
})

// ── REST write transport ───────────────────────────────────────────────

describe('LedgerClient REST writes use the facade config', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockFetch = vi.fn()
    global.fetch = mockFetch as unknown as typeof fetch
    globalThis.fetch = mockFetch as unknown as typeof fetch
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const entityResult = { id: 'ent_1', name: 'ACME', status: 'active' }

  it("sends the write to the facade's baseUrl, not the generated client's default", async () => {
    const c = new LedgerClient({ baseUrl: 'https://api.example.com/', token: 'rfs_key' })
    mockFetch.mockResolvedValueOnce(envelopeResponse('update-entity', entityResult))
    await c.updateEntity('graph_1', { name: 'ACME' })
    const req = mockFetch.mock.calls[0][0] as Request
    expect(req.url).toBe(
      'https://api.example.com/extensions/roboledger/graph_1/operations/update-entity'
    )
  })

  it('authenticates an `rfs…` API key with X-API-Key, like the reads', async () => {
    const c = new LedgerClient({ baseUrl: 'http://localhost:8000', token: 'rfs_key' })
    mockFetch.mockResolvedValueOnce(envelopeResponse('update-entity', entityResult))
    await c.updateEntity('graph_1', { name: 'ACME' })
    const req = mockFetch.mock.calls[0][0] as Request
    expect(req.headers.get('X-API-Key')).toBe('rfs_key')
    expect(req.headers.get('Authorization')).toBeNull()
  })

  it('asks the tokenProvider on every write and sends a JWT as Bearer', async () => {
    let current = 'jwt-1'
    const c = new LedgerClient({
      baseUrl: 'http://localhost:8000',
      token: 'jwt-captured',
      tokenProvider: async () => current,
    })
    mockFetch
      .mockResolvedValueOnce(envelopeResponse('update-entity', entityResult))
      .mockResolvedValueOnce(envelopeResponse('update-entity', entityResult))
    await c.updateEntity('graph_1', { name: 'A' })
    current = 'jwt-2'
    await c.updateEntity('graph_1', { name: 'B' })
    expect((mockFetch.mock.calls[0][0] as Request).headers.get('Authorization')).toBe(
      'Bearer jwt-1'
    )
    expect((mockFetch.mock.calls[1][0] as Request).headers.get('Authorization')).toBe(
      'Bearer jwt-2'
    )
  })

  it('fails the write, without sending it, when the tokenProvider throws', async () => {
    const c = new LedgerClient({
      baseUrl: 'http://localhost:8000',
      tokenProvider: () => {
        throw new Error('storage unavailable')
      },
    })
    await expect(c.updateEntity('graph_1', { name: 'A' })).rejects.toThrow(/tokenProvider threw/)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('carries the configured headers, and keeps the idempotency key alongside them', async () => {
    const c = new LedgerClient({
      baseUrl: 'http://localhost:8000',
      token: 'rfs_key',
      headers: { 'X-Tenant-Trace': 't-1' },
    })
    mockFetch.mockResolvedValueOnce(envelopeResponse('create-agent', { id: 'agt_1' }))
    await c.createAgent('graph_1', { agent_type: 'customer', name: 'X' }, 'idem-1')
    const req = mockFetch.mock.calls[0][0] as Request
    expect(req.headers.get('X-Tenant-Trace')).toBe('t-1')
    expect(req.headers.get('Idempotency-Key')).toBe('idem-1')
    expect(req.headers.get('X-API-Key')).toBe('rfs_key')
  })
})

describe('LedgerClient.updatePublishList', () => {
  let mockFetch: ReturnType<typeof vi.fn>
  const client = new LedgerClient({ baseUrl: 'http://localhost:8000', token: 'rfs_key' })
  const listResult = { id: 'pl_1', name: 'Board', description: 'Monthly pack', member_count: 2 }

  beforeEach(() => {
    mockFetch = vi.fn()
    global.fetch = mockFetch as unknown as typeof fetch
    globalThis.fetch = mockFetch as unknown as typeof fetch
  })

  it('leaves the description off a name-only update, so the server keeps it', async () => {
    mockFetch.mockResolvedValueOnce(envelopeResponse('update-publish-list', listResult))
    await client.updatePublishList('graph_1', 'pl_1', { name: 'Board' })
    const body = JSON.parse(await (mockFetch.mock.calls[0][0] as Request).text())
    expect(body).toEqual({ list_id: 'pl_1', name: 'Board' })
  })

  it('still clears the description on an explicit null', async () => {
    mockFetch.mockResolvedValueOnce(
      envelopeResponse('update-publish-list', { ...listResult, description: null })
    )
    await client.updatePublishList('graph_1', 'pl_1', { description: null })
    const body = JSON.parse(await (mockFetch.mock.calls[0][0] as Request).text())
    expect(body).toEqual({ list_id: 'pl_1', description: null })
  })
})

describe('LedgerClient.createEventBlock', () => {
  let mockFetch: ReturnType<typeof vi.fn>
  const client = new LedgerClient({ baseUrl: 'http://localhost:8000', token: 'rfs_key' })
  const body = {
    event_type: 'approval_requested',
    event_category: 'approval',
    event_class: 'support',
    occurred_at: '2026-10-01T00:00:00Z',
    metadata: { note: 'Sign off Q3 accruals' },
  } as any

  beforeEach(() => {
    mockFetch = vi.fn()
    global.fetch = mockFetch as unknown as typeof fetch
    globalThis.fetch = mockFetch as unknown as typeof fetch
  })

  it('POSTs the body to create-event-block and returns the event', async () => {
    mockFetch.mockResolvedValueOnce(
      envelopeResponse('create-event-block', { id: 'evt_1', status: 'captured' })
    )
    const result = await client.createEventBlock('graph_9', body)
    const req = mockFetch.mock.calls[0][0] as Request
    expect(req.url).toBe(
      'http://localhost:8000/extensions/roboledger/graph_9/operations/create-event-block'
    )
    expect(JSON.parse(await req.text())).toEqual(body)
    expect(req.headers.get('Idempotency-Key')).toBeNull()
    expect(result).toMatchObject({ id: 'evt_1' })
  })

  it('forwards the Idempotency-Key when supplied', async () => {
    mockFetch.mockResolvedValueOnce(envelopeResponse('create-event-block', { id: 'evt_1' }))
    await client.createEventBlock('graph_9', body, 'idem-evt-1')
    const req = mockFetch.mock.calls[0][0] as Request
    expect(req.headers.get('Idempotency-Key')).toBe('idem-evt-1')
  })

  it('surfaces a refused event (422) with the server detail', async () => {
    mockFetch.mockResolvedValueOnce(restErrorResponse('Unknown event_type', 422))
    await expect(client.createEventBlock('graph_9', body)).rejects.toThrow(
      /Create event block failed: .*Unknown event_type/
    )
  })

  it('throws when the envelope carries no result', async () => {
    mockFetch.mockResolvedValueOnce(envelopeResponse('create-event-block', null))
    await expect(client.createEventBlock('graph_9', body)).rejects.toThrow(
      'Create event block: operation envelope had no result'
    )
  })
})
