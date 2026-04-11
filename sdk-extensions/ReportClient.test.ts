import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Report } from './ReportClient'
import { ReportClient } from './ReportClient'

// Helper to create proper mock Response objects
function createMockResponse(data: any, options: { ok?: boolean; status?: number } = {}) {
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

// Reusable mock report response (snake_case API format)
const mockReportResponse = {
  id: 'rpt_1',
  name: 'Q1 2025 Report',
  taxonomy_id: 'tax_usgaap_reporting',
  generation_status: 'completed',
  period_type: 'quarterly',
  period_start: '2025-01-01',
  period_end: '2025-03-31',
  comparative: true,
  mapping_id: 'map_1',
  ai_generated: false,
  created_at: '2025-04-01T00:00:00Z',
  last_generated: '2025-04-01T01:00:00Z',
  structures: [
    { id: 'str_1', name: 'Income Statement', structure_type: 'income_statement' },
    { id: 'str_2', name: 'Balance Sheet', structure_type: 'balance_sheet' },
  ],
  entity_name: 'ACME Corp',
  source_graph_id: null,
  source_report_id: null,
  shared_at: null,
}

describe('ReportClient', () => {
  let client: ReportClient
  let mockFetch: any

  beforeEach(() => {
    client = new ReportClient({
      baseUrl: 'http://localhost:8000',
      token: 'test-token',
      headers: { 'X-API-Key': 'test-key' },
    })

    mockFetch = vi.fn()
    global.fetch = mockFetch
    globalThis.fetch = mockFetch
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── create ────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create report and return transformed result', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockReportResponse))

      const result = await client.create('graph_1', {
        name: 'Q1 2025 Report',
        mappingId: 'map_1',
        periodStart: '2025-01-01',
        periodEnd: '2025-03-31',
      })

      expect(result.id).toBe('rpt_1')
      expect(result.name).toBe('Q1 2025 Report')
      expect(result.taxonomyId).toBe('tax_usgaap_reporting')
      expect(result.generationStatus).toBe('completed')
      expect(result.periodType).toBe('quarterly')
      expect(result.periodStart).toBe('2025-01-01')
      expect(result.periodEnd).toBe('2025-03-31')
      expect(result.comparative).toBe(true)
      expect(result.mappingId).toBe('map_1')
      expect(result.aiGenerated).toBe(false)
      expect(result.structures).toHaveLength(2)
      expect(result.structures[0]).toEqual({
        id: 'str_1',
        name: 'Income Statement',
        structureType: 'income_statement',
      })
      expect(result.entityName).toBe('ACME Corp')
      expect(result.sourceGraphId).toBeNull()
    })

    it('should create with custom options', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockReportResponse))

      const result = await client.create('graph_1', {
        name: 'Annual',
        mappingId: 'map_1',
        periodStart: '2025-01-01',
        periodEnd: '2025-12-31',
        taxonomyId: 'custom_tax',
        periodType: 'annual',
        comparative: false,
      })

      expect(result.id).toBe('rpt_1')
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should create with explicit periods', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockReportResponse))

      const result = await client.create('graph_1', {
        name: 'Multi-period',
        mappingId: 'map_1',
        periodStart: '2024-01-01',
        periodEnd: '2025-03-31',
        periods: [
          { start: '2024-01-01', end: '2024-12-31', label: 'FY2024' },
          { start: '2025-01-01', end: '2025-03-31', label: 'Q1 2025' },
        ],
      })

      expect(result.id).toBe('rpt_1')
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should throw on error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Error' }, { ok: false, status: 500 })
      )

      await expect(
        client.create('graph_1', {
          name: 'Test',
          mappingId: 'map_1',
          periodStart: '2025-01-01',
          periodEnd: '2025-03-31',
        })
      ).rejects.toThrow('Create report failed')
    })
  })

  // ── list ──────────────────────────────────────────────────────────────

  describe('list', () => {
    it('should return transformed report list', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          reports: [mockReportResponse],
        })
      )

      const result = await client.list('graph_1')

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('rpt_1')
      expect(result[0].structures).toHaveLength(2)
    })

    it('should return empty array when no reports', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ reports: [] }))

      const result = await client.list('graph_1')

      expect(result).toEqual([])
    })

    it('should handle shared reports in list', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          reports: [
            {
              ...mockReportResponse,
              id: 'rpt_shared',
              source_graph_id: 'other_graph',
              source_report_id: 'rpt_orig',
              shared_at: '2025-04-05T00:00:00Z',
              entity_name: 'Other Corp',
            },
          ],
        })
      )

      const result = await client.list('graph_1')

      expect(result[0].sourceGraphId).toBe('other_graph')
      expect(result[0].sourceReportId).toBe('rpt_orig')
      expect(result[0].sharedAt).toBe('2025-04-05T00:00:00Z')
      expect(result[0].entityName).toBe('Other Corp')
    })

    it('should throw on error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Error' }, { ok: false, status: 500 })
      )

      await expect(client.list('graph_1')).rejects.toThrow('List reports failed')
    })
  })

  // ── get ───────────────────────────────────────────────────────────────

  describe('get', () => {
    it('should return single transformed report', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockReportResponse))

      const result = await client.get('graph_1', 'rpt_1')

      expect(result.id).toBe('rpt_1')
      expect(result.name).toBe('Q1 2025 Report')
    })

    it('should handle missing optional fields', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          id: 'rpt_2',
          name: 'Minimal Report',
          taxonomy_id: 'tax_usgaap',
          generation_status: 'pending',
          period_type: 'quarterly',
          comparative: false,
          created_at: '2025-04-01T00:00:00Z',
        })
      )

      const result = await client.get('graph_1', 'rpt_2')

      expect(result.periodStart).toBeNull()
      expect(result.periodEnd).toBeNull()
      expect(result.mappingId).toBeNull()
      expect(result.aiGenerated).toBe(false)
      expect(result.lastGenerated).toBeNull()
      expect(result.structures).toEqual([])
      expect(result.entityName).toBeNull()
      expect(result.sourceGraphId).toBeNull()
    })

    it('should throw on error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Not found' }, { ok: false, status: 404 })
      )

      await expect(client.get('graph_1', 'rpt_bad')).rejects.toThrow('Get report failed')
    })
  })

  // ── statement ─────────────────────────────────────────────────────────

  describe('statement', () => {
    it('should return transformed statement data', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          report_id: 'rpt_1',
          structure_id: 'str_1',
          structure_name: 'Income Statement',
          structure_type: 'income_statement',
          periods: [
            { start: '2025-01-01', end: '2025-03-31', label: 'Q1 2025' },
            { start: '2024-01-01', end: '2024-03-31', label: 'Q1 2024' },
          ],
          rows: [
            {
              element_id: 'elem_rev',
              element_qname: 'us-gaap:Revenue',
              element_name: 'Revenue',
              classification: 'revenue',
              values: [500000, 420000],
              is_subtotal: false,
              depth: 0,
            },
            {
              element_id: 'elem_total',
              element_qname: 'us-gaap:NetIncome',
              element_name: 'Net Income',
              classification: 'income',
              values: [75000, 60000],
              is_subtotal: true,
              depth: 0,
            },
          ],
          validation: {
            passed: true,
            checks: ['Assets = Liabilities + Equity'],
            failures: [],
            warnings: ['Some items unmapped'],
          },
          unmapped_count: 3,
        })
      )

      const result = await client.statement('graph_1', 'rpt_1', 'income_statement')

      expect(result.reportId).toBe('rpt_1')
      expect(result.structureId).toBe('str_1')
      expect(result.structureName).toBe('Income Statement')
      expect(result.structureType).toBe('income_statement')

      expect(result.periods).toHaveLength(2)
      expect(result.periods[0]).toEqual({
        start: '2025-01-01',
        end: '2025-03-31',
        label: 'Q1 2025',
      })

      expect(result.rows).toHaveLength(2)
      expect(result.rows[0]).toEqual({
        elementId: 'elem_rev',
        elementQname: 'us-gaap:Revenue',
        elementName: 'Revenue',
        classification: 'revenue',
        values: [500000, 420000],
        isSubtotal: false,
        depth: 0,
      })
      expect(result.rows[1].isSubtotal).toBe(true)

      expect(result.validation).not.toBeNull()
      expect(result.validation!.passed).toBe(true)
      expect(result.validation!.checks).toEqual(['Assets = Liabilities + Equity'])
      expect(result.validation!.warnings).toEqual(['Some items unmapped'])

      expect(result.unmappedCount).toBe(3)
    })

    it('should handle null validation', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          report_id: 'rpt_1',
          structure_id: 'str_1',
          structure_name: 'Balance Sheet',
          structure_type: 'balance_sheet',
          periods: [],
          rows: [],
          validation: null,
          unmapped_count: 0,
        })
      )

      const result = await client.statement('graph_1', 'rpt_1', 'balance_sheet')

      expect(result.validation).toBeNull()
    })

    it('should default missing row fields', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          report_id: 'rpt_1',
          structure_id: 'str_1',
          structure_name: 'IS',
          structure_type: 'income_statement',
          periods: [],
          rows: [
            {
              element_id: 'elem_1',
              element_qname: 'gaap:X',
              element_name: 'X',
              classification: 'revenue',
            },
          ],
        })
      )

      const result = await client.statement('graph_1', 'rpt_1', 'income_statement')

      expect(result.rows[0].values).toEqual([])
      expect(result.rows[0].isSubtotal).toBe(false)
      expect(result.rows[0].depth).toBe(0)
    })

    it('should throw on error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Error' }, { ok: false, status: 500 })
      )

      await expect(client.statement('graph_1', 'rpt_1', 'income_statement')).rejects.toThrow(
        'Get statement failed'
      )
    })
  })

  // ── regenerate ────────────────────────────────────────────────────────

  describe('regenerate', () => {
    it('should regenerate report with new dates', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          ...mockReportResponse,
          period_start: '2025-04-01',
          period_end: '2025-06-30',
          last_generated: '2025-07-01T00:00:00Z',
        })
      )

      const result = await client.regenerate('graph_1', 'rpt_1', '2025-04-01', '2025-06-30')

      expect(result.periodStart).toBe('2025-04-01')
      expect(result.periodEnd).toBe('2025-06-30')
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should throw on error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Error' }, { ok: false, status: 500 })
      )

      await expect(
        client.regenerate('graph_1', 'rpt_1', '2025-04-01', '2025-06-30')
      ).rejects.toThrow('Regenerate report failed')
    })
  })

  // ── delete ────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('should delete report', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ success: true }))

      await expect(client.delete('graph_1', 'rpt_1')).resolves.toBeUndefined()
    })

    it('should throw on error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Error' }, { ok: false, status: 500 })
      )

      await expect(client.delete('graph_1', 'rpt_1')).rejects.toThrow('Delete report failed')
    })
  })

  // ── share ─────────────────────────────────────────────────────────────

  describe('share', () => {
    it('should share report and return results', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          report_id: 'rpt_1',
          results: [
            {
              target_graph_id: 'graph_2',
              status: 'shared',
              error: null,
              fact_count: 150,
            },
            {
              target_graph_id: 'graph_3',
              status: 'error',
              error: 'Graph not found',
              fact_count: 0,
            },
          ],
        })
      )

      const result = await client.share('graph_1', 'rpt_1', 'pub_list_1')

      expect(result.reportId).toBe('rpt_1')
      expect(result.results).toHaveLength(2)
      expect(result.results[0]).toEqual({
        targetGraphId: 'graph_2',
        status: 'shared',
        error: null,
        factCount: 150,
      })
      expect(result.results[1]).toEqual({
        targetGraphId: 'graph_3',
        status: 'error',
        error: 'Graph not found',
        factCount: 0,
      })
    })

    it('should throw on error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Error' }, { ok: false, status: 500 })
      )

      await expect(client.share('graph_1', 'rpt_1', 'pub_1')).rejects.toThrow('Share report failed')
    })
  })

  // ── isSharedReport ────────────────────────────────────────────────────

  describe('isSharedReport', () => {
    it('should return true for shared reports', () => {
      const report: Report = {
        id: 'rpt_1',
        name: 'Shared Report',
        taxonomyId: 'tax',
        generationStatus: 'completed',
        periodType: 'quarterly',
        periodStart: '2025-01-01',
        periodEnd: '2025-03-31',
        comparative: true,
        mappingId: 'map_1',
        aiGenerated: false,
        createdAt: '2025-04-01T00:00:00Z',
        lastGenerated: null,
        structures: [],
        entityName: 'Other Corp',
        sourceGraphId: 'other_graph',
        sourceReportId: 'rpt_orig',
        sharedAt: '2025-04-05T00:00:00Z',
      }

      expect(client.isSharedReport(report)).toBe(true)
    })

    it('should return false for native reports', () => {
      const report: Report = {
        id: 'rpt_1',
        name: 'Native Report',
        taxonomyId: 'tax',
        generationStatus: 'completed',
        periodType: 'quarterly',
        periodStart: '2025-01-01',
        periodEnd: '2025-03-31',
        comparative: true,
        mappingId: 'map_1',
        aiGenerated: false,
        createdAt: '2025-04-01T00:00:00Z',
        lastGenerated: null,
        structures: [],
        entityName: 'ACME Corp',
        sourceGraphId: null,
        sourceReportId: null,
        sharedAt: null,
      }

      expect(client.isSharedReport(report)).toBe(false)
    })
  })

  // ── Publish Lists ─────────────────────────────────────────────────────

  describe('listPublishLists', () => {
    it('should return transformed publish list', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          publish_lists: [
            {
              id: 'pl_1',
              name: 'Investors',
              description: 'Investor distribution list',
              member_count: 5,
              created_by: 'user_1',
              created_at: '2025-01-01T00:00:00Z',
              updated_at: '2025-03-01T00:00:00Z',
            },
          ],
        })
      )

      const result = await client.listPublishLists('graph_1')

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        id: 'pl_1',
        name: 'Investors',
        description: 'Investor distribution list',
        memberCount: 5,
        createdBy: 'user_1',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-03-01T00:00:00Z',
      })
    })

    it('should return empty array', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ publish_lists: [] }))

      const result = await client.listPublishLists('graph_1')

      expect(result).toEqual([])
    })

    it('should throw on error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Error' }, { ok: false, status: 500 })
      )

      await expect(client.listPublishLists('graph_1')).rejects.toThrow('List publish lists failed')
    })
  })

  describe('createPublishList', () => {
    it('should create and return publish list', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          id: 'pl_new',
          name: 'Board Members',
          description: 'Board distribution',
          member_count: 0,
          created_by: 'user_1',
          created_at: '2025-04-10T00:00:00Z',
          updated_at: '2025-04-10T00:00:00Z',
        })
      )

      const result = await client.createPublishList(
        'graph_1',
        'Board Members',
        'Board distribution'
      )

      expect(result.id).toBe('pl_new')
      expect(result.name).toBe('Board Members')
      expect(result.description).toBe('Board distribution')
    })

    it('should handle null description', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          id: 'pl_2',
          name: 'Minimal',
          member_count: 0,
          created_by: 'user_1',
          created_at: '2025-04-10T00:00:00Z',
          updated_at: '2025-04-10T00:00:00Z',
        })
      )

      const result = await client.createPublishList('graph_1', 'Minimal')

      expect(result.description).toBeNull()
    })

    it('should throw on error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Error' }, { ok: false, status: 500 })
      )

      await expect(client.createPublishList('graph_1', 'Test')).rejects.toThrow(
        'Create publish list failed'
      )
    })
  })

  describe('getPublishList', () => {
    it('should return publish list with members', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          id: 'pl_1',
          name: 'Investors',
          description: 'List',
          member_count: 2,
          created_by: 'user_1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-03-01T00:00:00Z',
          members: [
            {
              id: 'mem_1',
              target_graph_id: 'graph_2',
              target_graph_name: 'Investor A',
              target_org_name: 'Org A',
              added_by: 'user_1',
              added_at: '2025-02-01T00:00:00Z',
            },
            {
              id: 'mem_2',
              target_graph_id: 'graph_3',
              target_graph_name: null,
              target_org_name: null,
              added_by: 'user_1',
              added_at: '2025-02-15T00:00:00Z',
            },
          ],
        })
      )

      const result = await client.getPublishList('graph_1', 'pl_1')

      expect(result.id).toBe('pl_1')
      expect(result.members).toHaveLength(2)
      expect(result.members[0]).toEqual({
        id: 'mem_1',
        targetGraphId: 'graph_2',
        targetGraphName: 'Investor A',
        targetOrgName: 'Org A',
        addedBy: 'user_1',
        addedAt: '2025-02-01T00:00:00Z',
      })
      expect(result.members[1].targetGraphName).toBeNull()
      expect(result.members[1].targetOrgName).toBeNull()
    })

    it('should throw on error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Error' }, { ok: false, status: 500 })
      )

      await expect(client.getPublishList('graph_1', 'pl_1')).rejects.toThrow(
        'Get publish list failed'
      )
    })
  })

  describe('updatePublishList', () => {
    it('should update and return publish list', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          id: 'pl_1',
          name: 'Updated Name',
          description: 'Updated description',
          member_count: 3,
          created_by: 'user_1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-04-10T00:00:00Z',
        })
      )

      const result = await client.updatePublishList('graph_1', 'pl_1', {
        name: 'Updated Name',
        description: 'Updated description',
      })

      expect(result.name).toBe('Updated Name')
      expect(result.description).toBe('Updated description')
    })

    it('should throw on error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Error' }, { ok: false, status: 500 })
      )

      await expect(client.updatePublishList('graph_1', 'pl_1', { name: 'X' })).rejects.toThrow(
        'Update publish list failed'
      )
    })
  })

  describe('deletePublishList', () => {
    it('should delete publish list', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ success: true }))

      await expect(client.deletePublishList('graph_1', 'pl_1')).resolves.toBeUndefined()
    })

    it('should throw on error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Error' }, { ok: false, status: 500 })
      )

      await expect(client.deletePublishList('graph_1', 'pl_1')).rejects.toThrow(
        'Delete publish list failed'
      )
    })
  })

  describe('addMembers', () => {
    it('should add members and return them', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse([
          {
            id: 'mem_new_1',
            target_graph_id: 'graph_4',
            target_graph_name: 'New Investor',
            target_org_name: 'New Org',
            added_by: 'user_1',
            added_at: '2025-04-10T00:00:00Z',
          },
        ])
      )

      const result = await client.addMembers('graph_1', 'pl_1', ['graph_4'])

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        id: 'mem_new_1',
        targetGraphId: 'graph_4',
        targetGraphName: 'New Investor',
        targetOrgName: 'New Org',
        addedBy: 'user_1',
        addedAt: '2025-04-10T00:00:00Z',
      })
    })

    it('should throw on error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Error' }, { ok: false, status: 500 })
      )

      await expect(client.addMembers('graph_1', 'pl_1', ['graph_4'])).rejects.toThrow(
        'Add members failed'
      )
    })
  })

  describe('removeMember', () => {
    it('should remove member', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ success: true }))

      await expect(client.removeMember('graph_1', 'pl_1', 'mem_1')).resolves.toBeUndefined()
    })

    it('should throw on error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Error' }, { ok: false, status: 500 })
      )

      await expect(client.removeMember('graph_1', 'pl_1', 'mem_1')).rejects.toThrow(
        'Remove member failed'
      )
    })
  })

  // ── Constructor ───────────────────────────────────────────────────────

  describe('constructor', () => {
    it('should create with minimal config', () => {
      const c = new ReportClient({ baseUrl: 'http://localhost:8000' })
      expect(c).toBeInstanceOf(ReportClient)
    })

    it('should accept all config options', () => {
      const c = new ReportClient({
        baseUrl: 'http://localhost:8000',
        credentials: 'include',
        headers: { Authorization: 'Bearer token' },
        token: 'jwt-token',
      })
      expect(c).toBeInstanceOf(ReportClient)
    })
  })
})
