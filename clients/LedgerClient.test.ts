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
      expect(body.block_type).toBe('schedule')
      expect(body.payload.element_ids).toEqual(['elem_1'])
      expect(body.payload.monthly_amount).toBe(100000)
      expect(body.payload.entry_template.debit_element_id).toBe('elem_depr_exp')
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
      expect(body.source).toBe('native')
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
})
