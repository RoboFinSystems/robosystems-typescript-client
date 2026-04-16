import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ReportClient } from './ReportClient'

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

describe('ReportClient', () => {
  let client: ReportClient
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    client = new ReportClient({
      baseUrl: 'http://localhost:8000',
      token: 'test-token',
    })
    mockFetch = vi.fn()
    global.fetch = mockFetch as unknown as typeof fetch
    globalThis.fetch = mockFetch as unknown as typeof fetch
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── Reads ───────────────────────────────────────────────────────────

  describe('list', () => {
    it('returns the reports array', async () => {
      mockFetch.mockResolvedValueOnce(
        gqlResponse({
          reports: {
            reports: [
              {
                id: 'rep_1',
                name: 'Q1 2026',
                taxonomyId: 'tax_usgaap',
                generationStatus: 'completed',
                periodType: 'quarterly',
                periodStart: '2026-01-01',
                periodEnd: '2026-03-31',
                comparative: true,
                mappingId: 'map_1',
                aiGenerated: false,
                createdAt: '2026-04-01T00:00:00Z',
                lastGenerated: '2026-04-01T00:00:00Z',
                entityName: 'ACME',
                sourceGraphId: null,
                sourceReportId: null,
                sharedAt: null,
                periods: [],
                structures: [],
              },
            ],
          },
        })
      )
      const reports = await client.list('graph_1')
      expect(reports).toHaveLength(1)
      expect(reports[0].name).toBe('Q1 2026')
    })

    it('returns an empty array when reports is null', async () => {
      mockFetch.mockResolvedValueOnce(gqlResponse({ reports: null }))
      expect(await client.list('graph_1')).toEqual([])
    })
  })

  describe('get', () => {
    it('returns the report detail', async () => {
      mockFetch.mockResolvedValueOnce(
        gqlResponse({
          report: {
            id: 'rep_1',
            name: 'Q1 2026',
            taxonomyId: 'tax_usgaap',
            generationStatus: 'completed',
            periodType: 'quarterly',
            periodStart: '2026-01-01',
            periodEnd: '2026-03-31',
            comparative: true,
            mappingId: 'map_1',
            aiGenerated: false,
            createdAt: '2026-04-01T00:00:00Z',
            lastGenerated: '2026-04-01T00:00:00Z',
            entityName: 'ACME',
            sourceGraphId: null,
            sourceReportId: null,
            sharedAt: null,
            periods: [{ start: '2026-01-01', end: '2026-03-31', label: 'Q1 2026' }],
            structures: [
              { id: 'str_1', name: 'Income Statement', structureType: 'income_statement' },
            ],
          },
        })
      )
      const report = await client.get('graph_1', 'rep_1')
      expect(report?.id).toBe('rep_1')
      expect(report?.structures).toHaveLength(1)
    })

    it('returns null when the report is missing', async () => {
      mockFetch.mockResolvedValueOnce(gqlResponse({ report: null }))
      expect(await client.get('graph_1', 'rep_x')).toBeNull()
    })
  })

  describe('statement', () => {
    it('returns the rendered statement', async () => {
      mockFetch.mockResolvedValueOnce(
        gqlResponse({
          statement: {
            reportId: 'rep_1',
            structureId: 'str_1',
            structureName: 'Income Statement',
            structureType: 'income_statement',
            unmappedCount: 0,
            periods: [{ start: '2026-01-01', end: '2026-03-31', label: 'Q1 2026' }],
            rows: [
              {
                elementId: 'elem_revenue',
                elementQname: 'us-gaap:Revenues',
                elementName: 'Revenues',
                classification: 'revenue',
                values: [1000000],
                isSubtotal: false,
                depth: 0,
              },
            ],
            validation: {
              passed: true,
              checks: [],
              failures: [],
              warnings: [],
            },
          },
        })
      )
      const stmt = await client.statement('graph_1', 'rep_1', 'income_statement')
      expect(stmt?.rows).toHaveLength(1)
      expect(stmt?.rows[0].values[0]).toBe(1000000)
      expect(stmt?.validation?.passed).toBe(true)
    })
  })

  // ── Writes ──────────────────────────────────────────────────────────

  describe('create', () => {
    it('returns an async ack with operationId', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('create-report', null, 'pending'))
      const ack = await client.create('graph_1', {
        name: 'Q2 2026',
        mappingId: 'map_1',
        periodStart: '2026-04-01',
        periodEnd: '2026-06-30',
      })
      expect(ack.status).toBe('pending')
      expect(ack.operationId).toMatch(/^op_/)
    })

    it('forwards the request body to the operations URL', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('create-report', null, 'pending'))
      await client.create('graph_42', {
        name: 'Q2 2026',
        mappingId: 'map_1',
        periodStart: '2026-04-01',
        periodEnd: '2026-06-30',
      })
      const req = mockFetch.mock.calls[0][0] as Request
      expect(req.url).toBe(
        'http://localhost:8000/extensions/roboledger/graph_42/operations/create-report'
      )
      const body = JSON.parse(await req.text())
      expect(body.mapping_id).toBe('map_1')
      expect(body.period_start).toBe('2026-04-01')
      expect(body.taxonomy_id).toBe('tax_usgaap_reporting')
    })
  })

  describe('regenerate', () => {
    it('returns an async ack', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('regenerate-report', null, 'pending'))
      const ack = await client.regenerate('graph_1', 'rep_1', '2026-04-01', '2026-06-30')
      expect(ack.operationId).toMatch(/^op_/)
      expect(ack.status).toBe('pending')
    })
  })

  describe('delete', () => {
    it('resolves on success', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('delete-report', { deleted: true }))
      await expect(client.delete('graph_1', 'rep_1')).resolves.toBeUndefined()
    })
  })

  describe('share', () => {
    it('returns an async ack', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('share-report', null, 'pending'))
      const ack = await client.share('graph_1', 'rep_1', 'pl_1')
      expect(ack.status).toBe('pending')
    })
  })

  // ── Publish lists ──────────────────────────────────────────────────

  describe('listPublishLists', () => {
    it('returns the inner array', async () => {
      mockFetch.mockResolvedValueOnce(
        gqlResponse({
          publishLists: {
            publishLists: [
              {
                id: 'pl_1',
                name: 'Investors',
                description: null,
                memberCount: 2,
                createdBy: 'user_1',
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
              },
            ],
            pagination: { total: 1, limit: 100, offset: 0, hasMore: false },
          },
        })
      )
      const lists = await client.listPublishLists('graph_1')
      expect(lists).toHaveLength(1)
      expect(lists[0].name).toBe('Investors')
    })
  })

  describe('getPublishList', () => {
    it('returns the detail with members', async () => {
      mockFetch.mockResolvedValueOnce(
        gqlResponse({
          publishList: {
            id: 'pl_1',
            name: 'Investors',
            description: 'VC distribution list',
            memberCount: 1,
            createdBy: 'user_1',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
            members: [
              {
                id: 'mem_1',
                targetGraphId: 'graph_investor',
                targetGraphName: 'Acme Ventures',
                targetOrgName: null,
                addedBy: 'user_1',
                addedAt: '2026-01-01T00:00:00Z',
              },
            ],
          },
        })
      )
      const detail = await client.getPublishList('graph_1', 'pl_1')
      expect(detail?.members).toHaveLength(1)
      expect(detail?.members[0].targetGraphId).toBe('graph_investor')
    })
  })

  describe('createPublishList', () => {
    it('POSTs to create-publish-list with list body', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('create-publish-list', {
          id: 'pl_new',
          name: 'New List',
          description: null,
          member_count: 0,
          created_by: 'user_1',
          created_at: '2026-04-14T00:00:00Z',
          updated_at: '2026-04-14T00:00:00Z',
        })
      )
      const result = await client.createPublishList('graph_1', 'New List')
      expect((result as { id: string }).id).toBe('pl_new')
      const req = mockFetch.mock.calls[0][0] as Request
      expect(req.url).toContain('/operations/create-publish-list')
    })
  })

  describe('addMembers', () => {
    it('sends target graph ids in the body', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('add-publish-list-members', { added: 2 }))
      await client.addMembers('graph_1', 'pl_1', ['graph_a', 'graph_b'])
      const req = mockFetch.mock.calls[0][0] as Request
      const body = JSON.parse(await req.text())
      expect(body.list_id).toBe('pl_1')
      expect(body.target_graph_ids).toEqual(['graph_a', 'graph_b'])
    })
  })

  describe('removeMember', () => {
    it('returns a deleted ack', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('remove-publish-list-member', { deleted: true })
      )
      const result = await client.removeMember('graph_1', 'pl_1', 'mem_1')
      expect(result.deleted).toBe(true)
    })
  })

  describe('isSharedReport', () => {
    it('returns true when sourceGraphId is set', () => {
      const report = { sourceGraphId: 'graph_src' } as Parameters<ReportClient['isSharedReport']>[0]
      expect(client.isSharedReport(report)).toBe(true)
    })

    it('returns false for native reports', () => {
      const report = { sourceGraphId: null } as Parameters<ReportClient['isSharedReport']>[0]
      expect(client.isSharedReport(report)).toBe(false)
    })
  })
})
