import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LedgerClient } from './LedgerClient'

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

    it('tokenProvider that throws falls through unauthenticated', async () => {
      // Same rationale as the null-return case — a throwing provider
      // would otherwise crash the request before it even leaves the
      // client, which is worse than a 401.
      const brokenClient = new LedgerClient({
        baseUrl: 'http://localhost:8000',
        tokenProvider: () => {
          throw new Error('storage unavailable')
        },
      })
      mockFetch.mockResolvedValueOnce(gqlResponse({ entity: null }))
      await expect(brokenClient.getEntity('graph_1')).resolves.toBeNull()
      const init = mockFetch.mock.calls[0][1] as RequestInit
      const headers = new Headers(init.headers)
      expect(headers.get('Authorization')).toBeNull()
      expect(headers.get('X-API-Key')).toBeNull()
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
                structureType: 'coa_mapping',
                taxonomyId: 'tax_usgaap',
                isActive: true,
              },
            ],
          },
        })
      )
      const mappings = await client.listMappings('graph_1')
      expect(mappings).toHaveLength(1)
      expect(mappings[0].structureType).toBe('coa_mapping')
    })

    it('returns an empty array when mappings is null', async () => {
      mockFetch.mockResolvedValueOnce(gqlResponse({ mappings: null }))
      expect(await client.listMappings('graph_1')).toEqual([])
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

  describe('getFiscalCalendar', () => {
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

  describe('closePeriod', () => {
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
  })

  describe('createSchedule', () => {
    it('serializes options into snake_case body and converts the result', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('create-schedule', {
          structure_id: 'str_1',
          name: 'Depreciation — Laptops',
          taxonomy_id: 'tax_depreciation',
          total_periods: 36,
          total_facts: 36,
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
      expect(result.totalPeriods).toBe(36)
      expect(result.taxonomyId).toBe('tax_depreciation')

      const req = mockFetch.mock.calls[0][0] as Request
      const body = JSON.parse(await req.text())
      expect(body.element_ids).toEqual(['elem_1'])
      expect(body.monthly_amount).toBe(100000)
      expect(body.entry_template.debit_element_id).toBe('elem_depr_exp')
    })
  })

  describe('createClosingEntry', () => {
    it('maps snake_case envelope result to a ClosingEntry', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('create-closing-entry', {
          outcome: 'created',
          entry_id: 'entry_1',
          status: 'draft',
          posting_date: '2026-03-31',
          memo: 'Depreciation',
          debit_element_id: 'elem_depr_exp',
          credit_element_id: 'elem_accum_depr',
          amount: 100000,
          reason: null,
        })
      )
      const entry = await client.createClosingEntry(
        'graph_1',
        'str_1',
        '2026-03-31',
        '2026-03-01',
        '2026-03-31'
      )
      expect(entry.outcome).toBe('created')
      expect(entry.entryId).toBe('entry_1')
      expect(entry.amount).toBe(100000)
    })

    it('surfaces a skipped outcome with null fields', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('create-closing-entry', {
          outcome: 'skipped',
          entry_id: null,
          status: null,
          posting_date: null,
          memo: null,
          debit_element_id: null,
          credit_element_id: null,
          amount: null,
          reason: 'no-in-scope-fact',
        })
      )
      const entry = await client.createClosingEntry(
        'graph_1',
        'str_1',
        '2026-03-31',
        '2026-03-01',
        '2026-03-31'
      )
      expect(entry.outcome).toBe('skipped')
      expect(entry.entryId).toBeNull()
      expect(entry.reason).toBe('no-in-scope-fact')
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

  describe('truncateSchedule', () => {
    it('returns a truncate result', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('truncate-schedule', {
          structure_id: 'str_1',
          new_end_date: '2026-06-30',
          facts_deleted: 6,
          reason: 'asset disposed',
        })
      )
      const result = await client.truncateSchedule('graph_1', 'str_1', {
        newEndDate: '2026-06-30',
        reason: 'asset disposed',
      })
      expect(result.factsDeleted).toBe(6)
      expect(result.newEndDate).toBe('2026-06-30')
    })
  })

  // ── Taxonomy writes ─────────────────────────────────────────────────

  describe('updateTaxonomy', () => {
    it('returns the updated taxonomy result', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('update-taxonomy', { taxonomy_id: 'tax_1', name: 'Updated' })
      )
      const result = await client.updateTaxonomy('graph_1', {
        taxonomy_id: 'tax_1',
        name: 'Updated',
      })
      expect(result).toMatchObject({ taxonomy_id: 'tax_1', name: 'Updated' })
    })

    it('POSTs to the update-taxonomy operation URL', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('update-taxonomy', {}))
      await client.updateTaxonomy('graph_42', { taxonomy_id: 'tax_1', name: 'X' })
      const req = mockFetch.mock.calls[0][0] as Request
      expect(req.url).toBe(
        'http://localhost:8000/extensions/roboledger/graph_42/operations/update-taxonomy'
      )
    })

    it('throws on 4xx', async () => {
      mockFetch.mockResolvedValueOnce(restErrorResponse('Taxonomy not found', 404))
      await expect(client.updateTaxonomy('graph_1', { taxonomy_id: 'tax_1' })).rejects.toThrow(
        /Update taxonomy failed/
      )
    })
  })

  describe('deleteTaxonomy', () => {
    it('returns the deletion result', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('delete-taxonomy', { deleted: true }))
      const result = await client.deleteTaxonomy('graph_1', 'tax_1')
      expect(result).toMatchObject({ deleted: true })
    })

    it('sends taxonomy_id in the request body', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('delete-taxonomy', {}))
      await client.deleteTaxonomy('graph_1', 'tax_abc')
      const req = mockFetch.mock.calls[0][0] as Request
      const body = JSON.parse(await req.text())
      expect(body.taxonomy_id).toBe('tax_abc')
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

  // ── Element writes ──────────────────────────────────────────────────

  describe('createElement', () => {
    it('returns the created element result', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('create-element', { element_id: 'elem_1', name: 'Cash' })
      )
      const result = await client.createElement('graph_1', {
        taxonomy_id: 'tax_1',
        name: 'Cash',
        classification: 'asset',
      })
      expect(result).toMatchObject({ element_id: 'elem_1', name: 'Cash' })
    })

    it('POSTs to the create-element operation URL', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('create-element', {}))
      await client.createElement('graph_42', {
        taxonomy_id: 'tax_1',
        name: 'Cash',
        classification: 'asset',
      })
      const req = mockFetch.mock.calls[0][0] as Request
      expect(req.url).toBe(
        'http://localhost:8000/extensions/roboledger/graph_42/operations/create-element'
      )
    })

    it('throws on 4xx', async () => {
      mockFetch.mockResolvedValueOnce(restErrorResponse('Taxonomy not found', 404))
      await expect(
        client.createElement('graph_1', {
          taxonomy_id: 'tax_1',
          name: 'X',
          classification: 'asset',
        })
      ).rejects.toThrow(/Create element failed/)
    })
  })

  describe('updateElement', () => {
    it('returns the updated element result', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('update-element', { element_id: 'elem_1', name: 'Updated Cash' })
      )
      const result = await client.updateElement('graph_1', {
        element_id: 'elem_1',
        name: 'Updated Cash',
      })
      expect(result).toMatchObject({ name: 'Updated Cash' })
    })

    it('sends the body to update-element', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('update-element', {}))
      await client.updateElement('graph_1', { element_id: 'elem_1', name: 'X' })
      const req = mockFetch.mock.calls[0][0] as Request
      const body = JSON.parse(await req.text())
      expect(body.element_id).toBe('elem_1')
    })
  })

  describe('deleteElement', () => {
    it('returns the deletion result', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('delete-element', { deleted: true }))
      const result = await client.deleteElement('graph_1', 'elem_1')
      expect(result).toMatchObject({ deleted: true })
    })

    it('sends element_id in the request body', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('delete-element', {}))
      await client.deleteElement('graph_1', 'elem_abc')
      const req = mockFetch.mock.calls[0][0] as Request
      const body = JSON.parse(await req.text())
      expect(body.element_id).toBe('elem_abc')
    })
  })

  // ── Structure writes ────────────────────────────────────────────────

  describe('createMappingStructure', () => {
    it('sends structure_type coa_mapping and default name', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('create-structure', { id: 'str_1', structureType: 'coa_mapping' })
      )
      await client.createMappingStructure('graph_1')
      const req = mockFetch.mock.calls[0][0] as Request
      const body = JSON.parse(await req.text())
      expect(body.structure_type).toBe('coa_mapping')
      expect(body.name).toBe('CoA to Reporting')
      expect(body.taxonomy_id).toBe('tax_usgaap_reporting')
    })

    it('accepts custom name and taxonomyId', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('create-structure', { id: 'str_2' }))
      await client.createMappingStructure('graph_1', {
        name: 'My Mapping',
        taxonomyId: 'tax_custom',
      })
      const req = mockFetch.mock.calls[0][0] as Request
      const body = JSON.parse(await req.text())
      expect(body.name).toBe('My Mapping')
      expect(body.taxonomy_id).toBe('tax_custom')
    })
  })

  describe('updateStructure', () => {
    it('returns the updated structure result', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('update-structure', { structure_id: 'str_1', name: 'Updated' })
      )
      const result = await client.updateStructure('graph_1', {
        structure_id: 'str_1',
        name: 'Updated',
      })
      expect(result).toMatchObject({ name: 'Updated' })
    })

    it('POSTs to the update-structure URL', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('update-structure', {}))
      await client.updateStructure('graph_42', { structure_id: 'str_1' })
      const req = mockFetch.mock.calls[0][0] as Request
      expect(req.url).toBe(
        'http://localhost:8000/extensions/roboledger/graph_42/operations/update-structure'
      )
    })
  })

  describe('deleteStructure', () => {
    it('returns the deletion result', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('delete-structure', { deleted: true }))
      const result = await client.deleteStructure('graph_1', 'str_1')
      expect(result).toMatchObject({ deleted: true })
    })

    it('sends structure_id in the request body', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('delete-structure', {}))
      await client.deleteStructure('graph_1', 'str_abc')
      const req = mockFetch.mock.calls[0][0] as Request
      const body = JSON.parse(await req.text())
      expect(body.structure_id).toBe('str_abc')
    })
  })

  // ── Association writes ──────────────────────────────────────────────

  describe('createAssociations', () => {
    it('sends structure_id and associations in the body', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('create-associations', { created: 2 }))
      await client.createAssociations('graph_1', 'str_1', [
        { from_element_id: 'elem_a', to_element_id: 'elem_b' },
        { from_element_id: 'elem_c', to_element_id: 'elem_d' },
      ])
      const req = mockFetch.mock.calls[0][0] as Request
      const body = JSON.parse(await req.text())
      expect(body.structure_id).toBe('str_1')
      expect(body.associations).toHaveLength(2)
      expect(body.associations[0].from_element_id).toBe('elem_a')
    })

    it('returns the result from the envelope', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('create-associations', { created: 3 }))
      const result = await client.createAssociations('graph_1', 'str_1', [
        { from_element_id: 'a', to_element_id: 'b' },
      ])
      expect(result).toMatchObject({ created: 3 })
    })
  })

  describe('updateAssociation', () => {
    it('returns the updated association result', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('update-association', { association_id: 'assoc_1', weight: 0.5 })
      )
      const result = await client.updateAssociation('graph_1', {
        association_id: 'assoc_1',
        weight: 0.5,
      })
      expect(result).toMatchObject({ weight: 0.5 })
    })
  })

  describe('deleteAssociation', () => {
    it('returns deleted: true from the envelope', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('delete-association', { deleted: true }))
      const result = await client.deleteAssociation('graph_1', 'assoc_1')
      expect(result.deleted).toBe(true)
    })

    it('falls back to deleted: true when result is null', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('delete-association', null))
      const result = await client.deleteAssociation('graph_1', 'assoc_1')
      expect(result.deleted).toBe(true)
    })

    it('sends association_id in the request body', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('delete-association', null))
      await client.deleteAssociation('graph_1', 'assoc_xyz')
      const req = mockFetch.mock.calls[0][0] as Request
      const body = JSON.parse(await req.text())
      expect(body.association_id).toBe('assoc_xyz')
    })
  })

  // ── Schedule writes ─────────────────────────────────────────────────

  describe('updateSchedule', () => {
    it('returns the updated schedule result', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('update-schedule', { structure_id: 'str_1', name: 'Updated' })
      )
      const result = await client.updateSchedule('graph_1', {
        structure_id: 'str_1',
        name: 'Updated',
      })
      expect(result).toMatchObject({ name: 'Updated' })
    })

    it('POSTs to the update-schedule URL', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('update-schedule', {}))
      await client.updateSchedule('graph_42', { structure_id: 'str_1' })
      const req = mockFetch.mock.calls[0][0] as Request
      expect(req.url).toBe(
        'http://localhost:8000/extensions/roboledger/graph_42/operations/update-schedule'
      )
    })
  })

  describe('deleteSchedule', () => {
    it('returns deleted: true from the envelope', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('delete-schedule', { deleted: true }))
      const result = await client.deleteSchedule('graph_1', 'str_1')
      expect(result.deleted).toBe(true)
    })

    it('falls back to deleted: true when result is null', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('delete-schedule', null))
      const result = await client.deleteSchedule('graph_1', 'str_1')
      expect(result.deleted).toBe(true)
    })

    it('sends structure_id in the request body', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('delete-schedule', null))
      await client.deleteSchedule('graph_1', 'str_abc')
      const req = mockFetch.mock.calls[0][0] as Request
      const body = JSON.parse(await req.text())
      expect(body.structure_id).toBe('str_abc')
    })
  })

  // ── Journal entry writes ────────────────────────────────────────────

  describe('createJournalEntry', () => {
    const lineItems = [
      { elementId: 'elem_cash', debitAmount: 1000, creditAmount: 0 },
      { elementId: 'elem_revenue', debitAmount: 0, creditAmount: 1000 },
    ]

    it('returns the created entry result', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('create-journal-entry', { entry_id: 'je_1', status: 'draft' })
      )
      const result = await client.createJournalEntry('graph_1', {
        postingDate: '2026-03-31',
        memo: 'Revenue recognition',
        lineItems,
      })
      expect(result).toMatchObject({ entry_id: 'je_1', status: 'draft' })
    })

    it('serializes options into snake_case body', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('create-journal-entry', {}))
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
      expect(body.posting_date).toBe('2026-03-31')
      expect(body.memo).toBe('Test')
      expect(body.type).toBe('standard')
      expect(body.status).toBe('posted')
      expect(body.transaction_id).toBe('txn_1')
      expect(body.line_items).toHaveLength(2)
      expect(body.line_items[0].element_id).toBe('elem_cash')
      expect(body.line_items[0].debit_amount).toBe(1000)
    })

    it('POSTs to the create-journal-entry URL', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('create-journal-entry', {}))
      await client.createJournalEntry('graph_42', {
        postingDate: '2026-03-31',
        memo: 'Test',
        lineItems,
      })
      const req = mockFetch.mock.calls[0][0] as Request
      expect(req.url).toBe(
        'http://localhost:8000/extensions/roboledger/graph_42/operations/create-journal-entry'
      )
    })

    it('throws on 4xx', async () => {
      mockFetch.mockResolvedValueOnce(restErrorResponse('Line items do not balance', 422))
      await expect(
        client.createJournalEntry('graph_1', { postingDate: '2026-03-31', memo: 'X', lineItems })
      ).rejects.toThrow(/Create journal entry failed/)
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
    it('returns the reversal result', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('reverse-journal-entry', {
          original_entry_id: 'je_1',
          reversal_entry_id: 'je_2',
        })
      )
      const result = await client.reverseJournalEntry('graph_1', 'je_1', {
        postingDate: '2026-04-01',
        memo: 'Reversal of March entry',
      })
      expect(result).toMatchObject({ original_entry_id: 'je_1', reversal_entry_id: 'je_2' })
    })

    it('sends entry_id and optional fields in the body', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('reverse-journal-entry', {}))
      await client.reverseJournalEntry('graph_1', 'je_abc', {
        postingDate: '2026-04-01',
        memo: 'Reversal',
      })
      const req = mockFetch.mock.calls[0][0] as Request
      const body = JSON.parse(await req.text())
      expect(body.entry_id).toBe('je_abc')
      expect(body.posting_date).toBe('2026-04-01')
      expect(body.memo).toBe('Reversal')
    })

    it('sends null for omitted optional fields', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('reverse-journal-entry', {}))
      await client.reverseJournalEntry('graph_1', 'je_1')
      const req = mockFetch.mock.calls[0][0] as Request
      const body = JSON.parse(await req.text())
      expect(body.posting_date).toBeNull()
      expect(body.memo).toBeNull()
    })

    it('POSTs to the reverse-journal-entry URL', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('reverse-journal-entry', {}))
      await client.reverseJournalEntry('graph_42', 'je_1')
      const req = mockFetch.mock.calls[0][0] as Request
      expect(req.url).toBe(
        'http://localhost:8000/extensions/roboledger/graph_42/operations/reverse-journal-entry'
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
})
