import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LedgerClient } from './LedgerClient'

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

describe('LedgerClient', () => {
  let client: LedgerClient
  let mockFetch: any

  beforeEach(() => {
    client = new LedgerClient({
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

  // ── Entity ────────────────────────────────────────────────────────────

  describe('getEntity', () => {
    it('should return entity data', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          id: 'ent_123',
          name: 'ACME Corp',
          legal_name: 'ACME Corporation Inc.',
          entity_type: 'corporation',
          industry: 'Technology',
          status: 'active',
        })
      )

      const entity = await client.getEntity('graph_1')

      expect(entity).not.toBeNull()
      expect(entity!.id).toBe('ent_123')
      expect(entity!.name).toBe('ACME Corp')
      expect(entity!.legalName).toBe('ACME Corporation Inc.')
      expect(entity!.entityType).toBe('corporation')
      expect(entity!.industry).toBe('Technology')
      expect(entity!.status).toBe('active')
    })

    it('should return null for 404', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Not found' }, { ok: false, status: 404 })
      )

      const entity = await client.getEntity('graph_nonexistent')

      expect(entity).toBeNull()
    })

    it('should handle missing optional fields', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          id: 'ent_456',
          name: 'Minimal Corp',
        })
      )

      const entity = await client.getEntity('graph_1')

      expect(entity!.legalName).toBeNull()
      expect(entity!.entityType).toBeNull()
      expect(entity!.industry).toBeNull()
      expect(entity!.status).toBeNull()
    })

    it('should throw on non-404 errors', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Server error' }, { ok: false, status: 500 })
      )

      await expect(client.getEntity('graph_1')).rejects.toThrow('Get entity failed')
    })
  })

  // ── Accounts ──────────────────────────────────────────────────────────

  describe('listAccounts', () => {
    it('should return account list', async () => {
      const mockAccounts = {
        accounts: [
          { account_id: 'acc_1', name: 'Cash', account_number: '1000' },
          { account_id: 'acc_2', name: 'Revenue', account_number: '4000' },
        ],
        total_count: 2,
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(mockAccounts))

      const result = await client.listAccounts('graph_1')

      expect(result).toEqual(mockAccounts)
    })

    it('should throw on error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Forbidden' }, { ok: false, status: 403 })
      )

      await expect(client.listAccounts('graph_1')).rejects.toThrow('List accounts failed')
    })
  })

  describe('getAccountTree', () => {
    it('should return hierarchical account tree', async () => {
      const mockTree = {
        root: {
          account_id: 'root',
          name: 'All Accounts',
          children: [
            { account_id: 'acc_1', name: 'Assets', children: [] },
            { account_id: 'acc_2', name: 'Liabilities', children: [] },
          ],
        },
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(mockTree))

      const result = await client.getAccountTree('graph_1')

      expect(result).toEqual(mockTree)
    })

    it('should throw on error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Error' }, { ok: false, status: 500 })
      )

      await expect(client.getAccountTree('graph_1')).rejects.toThrow('Get account tree failed')
    })
  })

  // ── Transactions ──────────────────────────────────────────────────────

  describe('listTransactions', () => {
    it('should return transactions', async () => {
      const mockTxns = {
        transactions: [
          { transaction_id: 'txn_1', date: '2025-01-15', description: 'Payment received' },
        ],
        total_count: 1,
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(mockTxns))

      const result = await client.listTransactions('graph_1')

      expect(result).toEqual(mockTxns)
    })

    it('should accept date filters and pagination options', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ transactions: [], total_count: 0 }))

      const result = await client.listTransactions('graph_1', {
        startDate: '2025-01-01',
        endDate: '2025-03-31',
        limit: 50,
        offset: 10,
      })

      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(result).toEqual({ transactions: [], total_count: 0 })
    })

    it('should throw on error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Error' }, { ok: false, status: 500 })
      )

      await expect(client.listTransactions('graph_1')).rejects.toThrow('List transactions failed')
    })
  })

  describe('getTransaction', () => {
    it('should return transaction detail', async () => {
      const mockDetail = {
        transaction_id: 'txn_1',
        date: '2025-01-15',
        entries: [{ debit: 1000, credit: 0, account_id: 'acc_1' }],
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(mockDetail))

      const result = await client.getTransaction('graph_1', 'txn_1')

      expect(result).toEqual(mockDetail)
    })

    it('should throw on error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Not found' }, { ok: false, status: 404 })
      )

      await expect(client.getTransaction('graph_1', 'txn_bad')).rejects.toThrow(
        'Get transaction failed'
      )
    })
  })

  // ── Trial Balance ─────────────────────────────────────────────────────

  describe('getTrialBalance', () => {
    it('should return trial balance', async () => {
      const mockTB = {
        rows: [
          { account_id: 'acc_1', debit: 50000, credit: 0 },
          { account_id: 'acc_2', debit: 0, credit: 50000 },
        ],
        total_debit: 50000,
        total_credit: 50000,
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(mockTB))

      const result = await client.getTrialBalance('graph_1')

      expect(result).toEqual(mockTB)
    })

    it('should accept date range options', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ rows: [] }))

      const result = await client.getTrialBalance('graph_1', {
        startDate: '2025-01-01',
        endDate: '2025-03-31',
      })

      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(result).toEqual({ rows: [] })
    })

    it('should throw on error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Error' }, { ok: false, status: 500 })
      )

      await expect(client.getTrialBalance('graph_1')).rejects.toThrow('Get trial balance failed')
    })
  })

  describe('getMappedTrialBalance', () => {
    it('should return mapped trial balance', async () => {
      const mockMapped = {
        rows: [{ concept: 'Revenue', amount: 100000 }],
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(mockMapped))

      const result = await client.getMappedTrialBalance('graph_1', {
        mappingId: 'map_1',
        startDate: '2025-01-01',
        endDate: '2025-03-31',
      })

      expect(result).toEqual(mockMapped)
    })

    it('should throw on error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Error' }, { ok: false, status: 500 })
      )

      await expect(client.getMappedTrialBalance('graph_1')).rejects.toThrow(
        'Get mapped trial balance failed'
      )
    })
  })

  // ── Summary ───────────────────────────────────────────────────────────

  describe('getSummary', () => {
    it('should return ledger summary', async () => {
      const mockSummary = {
        account_count: 150,
        transaction_count: 5000,
        earliest_date: '2024-01-01',
        latest_date: '2025-03-31',
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(mockSummary))

      const result = await client.getSummary('graph_1')

      expect(result).toEqual(mockSummary)
    })

    it('should throw on error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Error' }, { ok: false, status: 500 })
      )

      await expect(client.getSummary('graph_1')).rejects.toThrow('Get summary failed')
    })
  })

  // ── Taxonomy ──────────────────────────────────────────────────────────

  describe('getReportingTaxonomy', () => {
    it('should return taxonomy data', async () => {
      const mockTax = {
        taxonomy_id: 'tax_usgaap',
        name: 'US GAAP Reporting',
        elements: [{ id: 'elem_1', name: 'Revenue' }],
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(mockTax))

      const result = await client.getReportingTaxonomy('graph_1')

      expect(result).toEqual(mockTax)
    })

    it('should throw on error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Error' }, { ok: false, status: 500 })
      )

      await expect(client.getReportingTaxonomy('graph_1')).rejects.toThrow(
        'Get reporting taxonomy failed'
      )
    })
  })

  describe('listStructures', () => {
    it('should return transformed structures', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          structures: [
            { id: 'str_1', name: 'Income Statement', structure_type: 'income_statement' },
            { id: 'str_2', name: 'Balance Sheet', structure_type: 'balance_sheet' },
          ],
        })
      )

      const result = await client.listStructures('graph_1')

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        id: 'str_1',
        name: 'Income Statement',
        structureType: 'income_statement',
      })
      expect(result[1]).toEqual({
        id: 'str_2',
        name: 'Balance Sheet',
        structureType: 'balance_sheet',
      })
    })

    it('should return empty array when no structures', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ structures: [] }))

      const result = await client.listStructures('graph_1')

      expect(result).toEqual([])
    })

    it('should handle missing structures key', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({}))

      const result = await client.listStructures('graph_1')

      expect(result).toEqual([])
    })

    it('should accept taxonomyId filter', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ structures: [] }))

      const result = await client.listStructures('graph_1', 'tax_usgaap')

      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(result).toEqual([])
    })

    it('should throw on error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Error' }, { ok: false, status: 500 })
      )

      await expect(client.listStructures('graph_1')).rejects.toThrow('List structures failed')
    })
  })

  describe('listElements', () => {
    it('should return elements data', async () => {
      const mockElements = {
        elements: [{ id: 'elem_1', qname: 'us-gaap:Revenue', name: 'Revenue' }],
        total_count: 1,
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(mockElements))

      const result = await client.listElements('graph_1', {
        taxonomyId: 'tax_usgaap',
        source: 'gaap',
        classification: 'revenue',
        isAbstract: false,
        limit: 100,
        offset: 0,
      })

      expect(result).toEqual(mockElements)
    })

    it('should throw on error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Error' }, { ok: false, status: 500 })
      )

      await expect(client.listElements('graph_1')).rejects.toThrow('List elements failed')
    })
  })

  // ── Mappings ──────────────────────────────────────────────────────────

  describe('createMappingStructure', () => {
    it('should create and return mapping info', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          id: 'map_1',
          name: 'My Mapping',
          description: 'Custom mapping',
          structure_type: 'coa_mapping',
          taxonomy_id: 'tax_usgaap_reporting',
          is_active: true,
        })
      )

      const result = await client.createMappingStructure('graph_1', {
        name: 'My Mapping',
        description: 'Custom mapping',
      })

      expect(result).toEqual({
        id: 'map_1',
        name: 'My Mapping',
        description: 'Custom mapping',
        structureType: 'coa_mapping',
        taxonomyId: 'tax_usgaap_reporting',
        isActive: true,
      })
    })

    it('should use defaults when no options provided', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          id: 'map_2',
          name: 'CoA to Reporting',
          description: 'Map Chart of Accounts to US GAAP reporting concepts',
          structure_type: 'coa_mapping',
          taxonomy_id: 'tax_usgaap_reporting',
          is_active: true,
        })
      )

      const result = await client.createMappingStructure('graph_1')

      expect(result.name).toBe('CoA to Reporting')
    })

    it('should handle null description', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          id: 'map_3',
          name: 'Mapping',
          structure_type: 'coa_mapping',
          taxonomy_id: 'tax_usgaap_reporting',
        })
      )

      const result = await client.createMappingStructure('graph_1')

      expect(result.description).toBeNull()
      expect(result.isActive).toBe(true)
    })

    it('should throw on error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Error' }, { ok: false, status: 500 })
      )

      await expect(client.createMappingStructure('graph_1')).rejects.toThrow(
        'Create mapping structure failed'
      )
    })
  })

  describe('listMappings', () => {
    it('should return transformed mapping list', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          structures: [
            {
              id: 'map_1',
              name: 'Primary Mapping',
              description: 'Main mapping',
              structure_type: 'coa_mapping',
              taxonomy_id: 'tax_usgaap',
              is_active: true,
            },
          ],
        })
      )

      const result = await client.listMappings('graph_1')

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        id: 'map_1',
        name: 'Primary Mapping',
        description: 'Main mapping',
        structureType: 'coa_mapping',
        taxonomyId: 'tax_usgaap',
        isActive: true,
      })
    })

    it('should return empty array when no mappings', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ structures: [] }))

      const result = await client.listMappings('graph_1')

      expect(result).toEqual([])
    })

    it('should throw on error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Error' }, { ok: false, status: 500 })
      )

      await expect(client.listMappings('graph_1')).rejects.toThrow('List mappings failed')
    })
  })

  describe('getMappingDetail', () => {
    it('should return mapping detail', async () => {
      const mockDetail = {
        mapping_id: 'map_1',
        associations: [{ from_element_id: 'coa_1', to_element_id: 'gaap_1', confidence: 0.95 }],
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(mockDetail))

      const result = await client.getMappingDetail('graph_1', 'map_1')

      expect(result).toEqual(mockDetail)
    })

    it('should throw on error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Error' }, { ok: false, status: 500 })
      )

      await expect(client.getMappingDetail('graph_1', 'map_1')).rejects.toThrow(
        'Get mapping detail failed'
      )
    })
  })

  describe('getMappingCoverage', () => {
    it('should return transformed coverage data', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          total_coa_elements: 150,
          mapped_count: 120,
          unmapped_count: 30,
          coverage_percent: 80.0,
          high_confidence: 100,
          medium_confidence: 15,
          low_confidence: 5,
        })
      )

      const result = await client.getMappingCoverage('graph_1', 'map_1')

      expect(result).toEqual({
        totalCoaElements: 150,
        mappedCount: 120,
        unmappedCount: 30,
        coveragePercent: 80.0,
        highConfidence: 100,
        mediumConfidence: 15,
        lowConfidence: 5,
      })
    })

    it('should default missing fields to 0', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({}))

      const result = await client.getMappingCoverage('graph_1', 'map_1')

      expect(result.totalCoaElements).toBe(0)
      expect(result.mappedCount).toBe(0)
      expect(result.unmappedCount).toBe(0)
      expect(result.coveragePercent).toBe(0)
      expect(result.highConfidence).toBe(0)
      expect(result.mediumConfidence).toBe(0)
      expect(result.lowConfidence).toBe(0)
    })

    it('should throw on error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Error' }, { ok: false, status: 500 })
      )

      await expect(client.getMappingCoverage('graph_1', 'map_1')).rejects.toThrow(
        'Get mapping coverage failed'
      )
    })
  })

  describe('createMapping', () => {
    it('should create a mapping association', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ success: true }))

      await expect(
        client.createMapping('graph_1', 'map_1', 'from_elem', 'to_elem', 0.9)
      ).resolves.toBeUndefined()
    })

    it('should accept call without explicit confidence', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ success: true }))

      await expect(
        client.createMapping('graph_1', 'map_1', 'from_elem', 'to_elem')
      ).resolves.toBeUndefined()
    })

    it('should throw on error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Error' }, { ok: false, status: 500 })
      )

      await expect(client.createMapping('graph_1', 'map_1', 'from', 'to')).rejects.toThrow(
        'Create mapping failed'
      )
    })
  })

  describe('deleteMapping', () => {
    it('should delete a mapping association', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ success: true }))

      await expect(client.deleteMapping('graph_1', 'map_1', 'assoc_1')).resolves.toBeUndefined()
    })

    it('should throw on error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Error' }, { ok: false, status: 500 })
      )

      await expect(client.deleteMapping('graph_1', 'map_1', 'assoc_1')).rejects.toThrow(
        'Delete mapping failed'
      )
    })
  })

  describe('autoMap', () => {
    it('should return operation ID', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ operation_id: 'op_automap_1' }))

      const result = await client.autoMap('graph_1', 'map_1')

      expect(result.operationId).toBe('op_automap_1')
    })

    it('should handle response with no operation_id', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({}))

      const result = await client.autoMap('graph_1', 'map_1')

      expect(result.operationId).toBeUndefined()
    })

    it('should throw on error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Error' }, { ok: false, status: 500 })
      )

      await expect(client.autoMap('graph_1', 'map_1')).rejects.toThrow('Auto-map failed')
    })
  })

  // ── Schedules ─────────────────────────────────────────────────────────

  describe('createSchedule', () => {
    const scheduleOptions = {
      name: 'Depreciation - Equipment',
      elementIds: ['elem_1', 'elem_2'],
      periodStart: '2025-01-01',
      periodEnd: '2025-12-31',
      monthlyAmount: 5000,
      entryTemplate: {
        debitElementId: 'debit_elem',
        creditElementId: 'credit_elem',
        entryType: 'adjusting',
        memoTemplate: 'Monthly depreciation',
      },
      taxonomyId: 'tax_usgaap',
      scheduleMetadata: {
        method: 'straight_line',
        originalAmount: 60000,
        residualValue: 0,
        usefulLifeMonths: 12,
        assetElementId: 'asset_elem',
      },
    }

    it('should create schedule and return transformed result', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          structure_id: 'sched_1',
          name: 'Depreciation - Equipment',
          taxonomy_id: 'tax_usgaap',
          total_periods: 12,
          total_facts: 24,
        })
      )

      const result = await client.createSchedule('graph_1', scheduleOptions)

      expect(result).toEqual({
        structureId: 'sched_1',
        name: 'Depreciation - Equipment',
        taxonomyId: 'tax_usgaap',
        totalPeriods: 12,
        totalFacts: 24,
      })
    })

    it('should handle schedule without metadata', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          structure_id: 'sched_2',
          name: 'Simple',
          taxonomy_id: 'tax',
          total_periods: 6,
          total_facts: 6,
        })
      )

      const simpleOptions = {
        name: 'Simple',
        elementIds: ['elem_1'],
        periodStart: '2025-01-01',
        periodEnd: '2025-06-30',
        monthlyAmount: 1000,
        entryTemplate: {
          debitElementId: 'debit',
          creditElementId: 'credit',
        },
      }

      const result = await client.createSchedule('graph_1', simpleOptions)

      expect(result.structureId).toBe('sched_2')
      expect(result.totalPeriods).toBe(6)
    })

    it('should throw on error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Error' }, { ok: false, status: 500 })
      )

      await expect(client.createSchedule('graph_1', scheduleOptions)).rejects.toThrow(
        'Create schedule failed'
      )
    })
  })

  describe('listSchedules', () => {
    it('should return transformed schedule list', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          schedules: [
            {
              structure_id: 'sched_1',
              name: 'Depreciation',
              taxonomy_name: 'US GAAP',
              entry_template: { debit_element_id: 'd', credit_element_id: 'c' },
              schedule_metadata: { method: 'straight_line' },
              total_periods: 12,
              periods_with_entries: 6,
            },
          ],
        })
      )

      const result = await client.listSchedules('graph_1')

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        structureId: 'sched_1',
        name: 'Depreciation',
        taxonomyName: 'US GAAP',
        entryTemplate: { debit_element_id: 'd', credit_element_id: 'c' },
        scheduleMetadata: { method: 'straight_line' },
        totalPeriods: 12,
        periodsWithEntries: 6,
      })
    })

    it('should handle null entry_template and schedule_metadata', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          schedules: [
            {
              structure_id: 'sched_1',
              name: 'Bare',
              taxonomy_name: 'GAAP',
              total_periods: 1,
              periods_with_entries: 0,
            },
          ],
        })
      )

      const result = await client.listSchedules('graph_1')

      expect(result[0].entryTemplate).toBeNull()
      expect(result[0].scheduleMetadata).toBeNull()
    })

    it('should return empty array when no schedules', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ schedules: [] }))

      const result = await client.listSchedules('graph_1')

      expect(result).toEqual([])
    })

    it('should throw on error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Error' }, { ok: false, status: 500 })
      )

      await expect(client.listSchedules('graph_1')).rejects.toThrow('List schedules failed')
    })
  })

  describe('getScheduleFacts', () => {
    it('should return transformed facts', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          facts: [
            {
              element_id: 'elem_1',
              element_name: 'Depreciation',
              value: 5000,
              period_start: '2025-01-01',
              period_end: '2025-01-31',
            },
            {
              element_id: 'elem_1',
              element_name: 'Depreciation',
              value: 5000,
              period_start: '2025-02-01',
              period_end: '2025-02-28',
            },
          ],
        })
      )

      const result = await client.getScheduleFacts('graph_1', 'sched_1')

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        elementId: 'elem_1',
        elementName: 'Depreciation',
        value: 5000,
        periodStart: '2025-01-01',
        periodEnd: '2025-01-31',
      })
    })

    it('should accept period filters', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ facts: [] }))

      const result = await client.getScheduleFacts('graph_1', 'sched_1', '2025-01-01', '2025-06-30')

      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(result).toEqual([])
    })

    it('should throw on error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Error' }, { ok: false, status: 500 })
      )

      await expect(client.getScheduleFacts('graph_1', 'sched_1')).rejects.toThrow(
        'Get schedule facts failed'
      )
    })
  })

  // ── Period Close ──────────────────────────────────────────────────────

  describe('getPeriodCloseStatus', () => {
    it('should return transformed close status', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          fiscal_period_start: '2025-01-01',
          fiscal_period_end: '2025-03-31',
          period_status: 'open',
          schedules: [
            {
              structure_id: 'sched_1',
              structure_name: 'Depreciation',
              amount: 15000,
              status: 'draft',
              entry_id: 'entry_1',
            },
            {
              structure_id: 'sched_2',
              structure_name: 'Amortization',
              amount: 3000,
              status: 'posted',
            },
          ],
          total_draft: 1,
          total_posted: 1,
        })
      )

      const result = await client.getPeriodCloseStatus('graph_1', '2025-01-01', '2025-03-31')

      expect(result.fiscalPeriodStart).toBe('2025-01-01')
      expect(result.fiscalPeriodEnd).toBe('2025-03-31')
      expect(result.periodStatus).toBe('open')
      expect(result.totalDraft).toBe(1)
      expect(result.totalPosted).toBe(1)
      expect(result.schedules).toHaveLength(2)
      expect(result.schedules[0]).toEqual({
        structureId: 'sched_1',
        structureName: 'Depreciation',
        amount: 15000,
        status: 'draft',
        entryId: 'entry_1',
      })
      expect(result.schedules[1].entryId).toBeNull()
    })

    it('should throw on error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Error' }, { ok: false, status: 500 })
      )

      await expect(
        client.getPeriodCloseStatus('graph_1', '2025-01-01', '2025-03-31')
      ).rejects.toThrow('Get period close status failed')
    })
  })

  describe('createClosingEntry', () => {
    it('should create and return closing entry', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          entry_id: 'entry_1',
          status: 'draft',
          posting_date: '2025-03-31',
          memo: 'Q1 depreciation',
          debit_element_id: 'debit_elem',
          credit_element_id: 'credit_elem',
          amount: 15000,
        })
      )

      const result = await client.createClosingEntry(
        'graph_1',
        'sched_1',
        '2025-03-31',
        '2025-01-01',
        '2025-03-31',
        'Q1 depreciation'
      )

      expect(result).toEqual({
        entryId: 'entry_1',
        status: 'draft',
        postingDate: '2025-03-31',
        memo: 'Q1 depreciation',
        debitElementId: 'debit_elem',
        creditElementId: 'credit_elem',
        amount: 15000,
      })
    })

    it('should work without memo', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          entry_id: 'entry_2',
          status: 'draft',
          posting_date: '2025-03-31',
          memo: '',
          debit_element_id: 'd',
          credit_element_id: 'c',
          amount: 1000,
        })
      )

      const result = await client.createClosingEntry(
        'graph_1',
        'sched_1',
        '2025-03-31',
        '2025-01-01',
        '2025-03-31'
      )

      expect(result.entryId).toBe('entry_2')
      expect(result.amount).toBe(1000)
    })

    it('should throw on error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Error' }, { ok: false, status: 500 })
      )

      await expect(
        client.createClosingEntry('graph_1', 'sched_1', '2025-03-31', '2025-01-01', '2025-03-31')
      ).rejects.toThrow('Create closing entry failed')
    })
  })

  // ── Closing Book ──────────────────────────────────────────────────────

  describe('getClosingBookStructures', () => {
    it('should return closing book structures', async () => {
      const mockData = {
        categories: [
          { name: 'Statements', structures: [{ id: 'str_1', name: 'Income Statement' }] },
          { name: 'Schedules', structures: [{ id: 'sched_1', name: 'Depreciation' }] },
        ],
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(mockData))

      const result = await client.getClosingBookStructures('graph_1')

      expect(result).toEqual(mockData)
    })

    it('should throw on error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Error' }, { ok: false, status: 500 })
      )

      await expect(client.getClosingBookStructures('graph_1')).rejects.toThrow(
        'Get closing book structures failed'
      )
    })
  })

  describe('getAccountRollups', () => {
    it('should return account rollups data', async () => {
      const mockRollups = {
        rollups: [
          {
            element_id: 'gaap_revenue',
            element_name: 'Revenue',
            accounts: [{ account_id: 'acc_1', name: 'Sales Revenue', balance: 100000 }],
            total: 100000,
          },
        ],
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(mockRollups))

      const result = await client.getAccountRollups('graph_1', {
        mappingId: 'map_1',
        startDate: '2025-01-01',
        endDate: '2025-03-31',
      })

      expect(result).toEqual(mockRollups)
    })

    it('should work without options', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ rollups: [] }))

      const result = await client.getAccountRollups('graph_1')

      expect(result).toEqual({ rollups: [] })
    })

    it('should throw on error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Error' }, { ok: false, status: 500 })
      )

      await expect(client.getAccountRollups('graph_1')).rejects.toThrow(
        'Get account rollups failed'
      )
    })
  })

  // ── Constructor ───────────────────────────────────────────────────────

  describe('constructor', () => {
    it('should create with minimal config', () => {
      const c = new LedgerClient({ baseUrl: 'http://localhost:8000' })
      expect(c).toBeInstanceOf(LedgerClient)
    })

    it('should accept all config options', () => {
      const c = new LedgerClient({
        baseUrl: 'http://localhost:8000',
        credentials: 'include',
        headers: { Authorization: 'Bearer token' },
        token: 'jwt-token',
      })
      expect(c).toBeInstanceOf(LedgerClient)
    })
  })
})
