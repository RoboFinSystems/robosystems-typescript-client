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
    it('should return a created outcome with entry details', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          outcome: 'created',
          entry_id: 'entry_1',
          status: 'draft',
          posting_date: '2025-03-31',
          memo: 'Q1 depreciation',
          debit_element_id: 'debit_elem',
          credit_element_id: 'credit_elem',
          amount: 15000,
          reason: null,
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
        outcome: 'created',
        entryId: 'entry_1',
        status: 'draft',
        postingDate: '2025-03-31',
        memo: 'Q1 depreciation',
        debitElementId: 'debit_elem',
        creditElementId: 'credit_elem',
        amount: 15000,
        reason: null,
      })
    })

    it('should surface a skipped outcome with null entry fields', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          outcome: 'skipped',
          entry_id: null,
          status: null,
          posting_date: null,
          memo: null,
          debit_element_id: null,
          credit_element_id: null,
          amount: null,
          reason: 'No in-scope fact for this period.',
        })
      )

      const result = await client.createClosingEntry(
        'graph_1',
        'sched_1',
        '2025-03-31',
        '2025-01-01',
        '2025-03-31'
      )

      expect(result.outcome).toBe('skipped')
      expect(result.entryId).toBeNull()
      expect(result.amount).toBeNull()
      expect(result.reason).toBe('No in-scope fact for this period.')
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

  // ── Fiscal Calendar ───────────────────────────────────────────────────

  const mockFiscalCalendar = {
    graph_id: 'graph_1',
    fiscal_year_start_month: 1,
    closed_through: '2026-02',
    close_target: '2026-03',
    gap_periods: 1,
    catch_up_sequence: ['2026-03'],
    closeable_now: true,
    blockers: [],
    last_close_at: '2026-03-01T00:00:00Z',
    initialized_at: '2025-01-01T00:00:00Z',
    last_sync_at: '2026-03-15T00:00:00Z',
    periods: [
      {
        name: '2026-03',
        start_date: '2026-03-01',
        end_date: '2026-03-31',
        status: 'open',
        closed_at: null,
      },
    ],
  }

  describe('initializeLedger', () => {
    it('should initialize and return calendar state', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          fiscal_calendar: mockFiscalCalendar,
          periods_created: 24,
          warnings: [],
        })
      )

      const result = await client.initializeLedger('graph_1', {
        closedThrough: '2026-02',
        fiscalYearStartMonth: 1,
      })

      expect(result.periodsCreated).toBe(24)
      expect(result.warnings).toEqual([])
      expect(result.fiscalCalendar.graphId).toBe('graph_1')
      expect(result.fiscalCalendar.closedThrough).toBe('2026-02')
      expect(result.fiscalCalendar.closeTarget).toBe('2026-03')
      expect(result.fiscalCalendar.catchUpSequence).toEqual(['2026-03'])
      expect(result.fiscalCalendar.closeableNow).toBe(true)
      expect(result.fiscalCalendar.periods).toHaveLength(1)
    })

    it('should propagate warnings for unimplemented features', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          fiscal_calendar: mockFiscalCalendar,
          periods_created: 0,
          warnings: ['auto_seed_schedules is not yet implemented.'],
        })
      )

      const result = await client.initializeLedger('graph_1', {
        autoSeedSchedules: true,
      })

      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0]).toContain('auto_seed_schedules')
    })

    it('should map camelCase options to snake_case body fields', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          fiscal_calendar: mockFiscalCalendar,
          periods_created: 12,
          warnings: [],
        })
      )

      await client.initializeLedger('graph_1', {
        closedThrough: '2026-02',
        fiscalYearStartMonth: 7,
        earliestDataPeriod: '2024-01',
        autoSeedSchedules: true,
        note: 'kickoff',
      })

      const request = mockFetch.mock.calls[0][0] as Request
      const body = JSON.parse(await request.text())
      expect(body).toEqual({
        closed_through: '2026-02',
        fiscal_year_start_month: 7,
        earliest_data_period: '2024-01',
        auto_seed_schedules: true,
        note: 'kickoff',
      })
    })

    it('should throw on 409 already-initialized', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'already initialized' }, { ok: false, status: 409 })
      )

      await expect(client.initializeLedger('graph_1')).rejects.toThrow('Initialize ledger failed')
    })
  })

  describe('getFiscalCalendar', () => {
    it('should return current calendar state', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockFiscalCalendar))

      const result = await client.getFiscalCalendar('graph_1')

      expect(result.graphId).toBe('graph_1')
      expect(result.closedThrough).toBe('2026-02')
      expect(result.gapPeriods).toBe(1)
      expect(result.blockers).toEqual([])
    })

    it('should throw on 404 calendar missing', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'Not initialized' }, { ok: false, status: 404 })
      )

      await expect(client.getFiscalCalendar('graph_1')).rejects.toThrow(
        'Get fiscal calendar failed'
      )
    })
  })

  describe('setCloseTarget', () => {
    it('should set target and return updated calendar', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          ...mockFiscalCalendar,
          close_target: '2026-06',
        })
      )

      const result = await client.setCloseTarget('graph_1', '2026-06', 'catch up Q2')

      expect(result.closeTarget).toBe('2026-06')
    })

    it('should throw on 422 invalid target', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(
          { detail: 'target cannot be before closed_through' },
          { ok: false, status: 422 }
        )
      )

      await expect(client.setCloseTarget('graph_1', '2025-01')).rejects.toThrow(
        'Set close target failed'
      )
    })
  })

  describe('closePeriod', () => {
    it('should close the period and return transition results', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          fiscal_calendar: {
            ...mockFiscalCalendar,
            closed_through: '2026-03',
            close_target: '2026-04',
          },
          period: '2026-03',
          entries_posted: 3,
          target_auto_advanced: true,
        })
      )

      const result = await client.closePeriod('graph_1', '2026-03')

      expect(result.period).toBe('2026-03')
      expect(result.entriesPosted).toBe(3)
      expect(result.targetAutoAdvanced).toBe(true)
      expect(result.fiscalCalendar.closedThrough).toBe('2026-03')
      expect(result.fiscalCalendar.closeTarget).toBe('2026-04')
    })

    it('should propagate allow_stale_sync flag', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          fiscal_calendar: mockFiscalCalendar,
          period: '2026-03',
          entries_posted: 0,
          target_auto_advanced: false,
        })
      )

      await client.closePeriod('graph_1', '2026-03', { allowStaleSync: true })

      // hey-api's client-fetch passes a Request object to fetch. Read the
      // body back off it to verify the flag was serialized.
      const request = mockFetch.mock.calls[0][0] as Request
      const body = await request.text()
      expect(body).toContain('"allow_stale_sync":true')
    })

    it('should throw on blocked close with structured detail', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(
          {
            detail: {
              message: 'Cannot close period',
              blockers: ['sync_stale'],
            },
          },
          { ok: false, status: 422 }
        )
      )

      await expect(client.closePeriod('graph_1', '2026-03')).rejects.toThrow('Close period failed')
    })
  })

  describe('reopenPeriod', () => {
    it('should reopen the period and return updated calendar', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          ...mockFiscalCalendar,
          closed_through: '2026-01',
        })
      )

      const result = await client.reopenPeriod('graph_1', '2026-02', 'missed expense')

      expect(result.closedThrough).toBe('2026-01')
    })

    it('should require reason propagation', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockFiscalCalendar))

      await client.reopenPeriod('graph_1', '2026-02', 'audit correction', 'see ticket #123')

      const request = mockFetch.mock.calls[0][0] as Request
      const body = await request.text()
      expect(body).toContain('"reason":"audit correction"')
      expect(body).toContain('"note":"see ticket #123"')
    })

    it('should throw on 422 when period not closed', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'not closed' }, { ok: false, status: 422 })
      )

      await expect(client.reopenPeriod('graph_1', '2026-02', 'reason')).rejects.toThrow(
        'Reopen period failed'
      )
    })
  })

  describe('listPeriodDrafts', () => {
    it('should return grouped draft entries with line items', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          period: '2026-03',
          period_start: '2026-03-01',
          period_end: '2026-03-31',
          draft_count: 1,
          total_debit: 15000,
          total_credit: 15000,
          all_balanced: true,
          drafts: [
            {
              entry_id: 'entry_1',
              posting_date: '2026-03-31',
              type: 'closing',
              memo: 'Monthly depreciation',
              provenance: 'schedule_derived',
              source_structure_id: 'str_sched',
              source_structure_name: 'Computer Depreciation',
              line_items: [
                {
                  line_item_id: 'li_1',
                  element_id: 'el_dep_exp',
                  element_code: '6100',
                  element_name: 'Depreciation Expense',
                  debit_amount: 15000,
                  credit_amount: 0,
                  description: null,
                },
                {
                  line_item_id: 'li_2',
                  element_id: 'el_accum_dep',
                  element_code: '1510',
                  element_name: 'Accumulated Depreciation',
                  debit_amount: 0,
                  credit_amount: 15000,
                  description: null,
                },
              ],
              total_debit: 15000,
              total_credit: 15000,
              balanced: true,
            },
          ],
        })
      )

      const result = await client.listPeriodDrafts('graph_1', '2026-03')

      expect(result.period).toBe('2026-03')
      expect(result.draftCount).toBe(1)
      expect(result.allBalanced).toBe(true)
      expect(result.drafts[0].entryId).toBe('entry_1')
      expect(result.drafts[0].sourceStructureName).toBe('Computer Depreciation')
      expect(result.drafts[0].lineItems).toHaveLength(2)
      expect(result.drafts[0].lineItems[0].elementCode).toBe('6100')
      expect(result.drafts[0].lineItems[0].debitAmount).toBe(15000)
      expect(result.drafts[0].balanced).toBe(true)
    })

    it('should surface unbalanced drafts', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          period: '2026-03',
          period_start: '2026-03-01',
          period_end: '2026-03-31',
          draft_count: 1,
          total_debit: 10000,
          total_credit: 9000,
          all_balanced: false,
          drafts: [
            {
              entry_id: 'entry_bad',
              posting_date: '2026-03-31',
              type: 'closing',
              memo: null,
              provenance: null,
              source_structure_id: null,
              source_structure_name: null,
              line_items: [
                {
                  line_item_id: 'li_1',
                  element_id: 'el_1',
                  element_code: null,
                  element_name: 'A',
                  debit_amount: 10000,
                  credit_amount: 0,
                  description: null,
                },
                {
                  line_item_id: 'li_2',
                  element_id: 'el_2',
                  element_code: null,
                  element_name: 'B',
                  debit_amount: 0,
                  credit_amount: 9000,
                  description: null,
                },
              ],
              total_debit: 10000,
              total_credit: 9000,
              balanced: false,
            },
          ],
        })
      )

      const result = await client.listPeriodDrafts('graph_1', '2026-03')

      expect(result.allBalanced).toBe(false)
      expect(result.drafts[0].balanced).toBe(false)
    })
  })

  // ── Schedule mutations (truncate + manual entry) ────────────────────

  describe('truncateSchedule', () => {
    it('should truncate and return counts', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          structure_id: 'sched_1',
          new_end_date: '2026-06-30',
          facts_deleted: 18,
          reason: 'Asset sold 2026-06-15',
        })
      )

      const result = await client.truncateSchedule('graph_1', 'sched_1', {
        newEndDate: '2026-06-30',
        reason: 'Asset sold 2026-06-15',
      })

      expect(result.structureId).toBe('sched_1')
      expect(result.newEndDate).toBe('2026-06-30')
      expect(result.factsDeleted).toBe(18)
      expect(result.reason).toBe('Asset sold 2026-06-15')
    })

    it('should throw on 422 mid-month date', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(
          { detail: 'new_end_date must be a month-end' },
          { ok: false, status: 422 }
        )
      )

      await expect(
        client.truncateSchedule('graph_1', 'sched_1', {
          newEndDate: '2026-06-15',
          reason: 'test',
        })
      ).rejects.toThrow('Truncate schedule failed')
    })
  })

  describe('createManualClosingEntry', () => {
    it('should create entry with arbitrary balanced line items', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          outcome: 'created',
          entry_id: 'entry_manual',
          status: 'draft',
          posting_date: '2026-03-15',
          memo: 'Sale of computer to Vendor X',
          debit_element_id: null,
          credit_element_id: null,
          amount: 500000,
          reason: null,
        })
      )

      const result = await client.createManualClosingEntry('graph_1', {
        postingDate: '2026-03-15',
        memo: 'Sale of computer to Vendor X',
        entryType: 'closing',
        lineItems: [
          { elementId: 'el_cash', debitAmount: 500000 },
          { elementId: 'el_asset', creditAmount: 300000 },
          { elementId: 'el_gain', creditAmount: 200000 },
        ],
      })

      expect(result.outcome).toBe('created')
      expect(result.entryId).toBe('entry_manual')
      expect(result.memo).toBe('Sale of computer to Vendor X')
    })

    it('should serialize line items to snake_case and default missing amounts to 0', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          outcome: 'created',
          entry_id: 'entry_manual',
          status: 'draft',
          posting_date: '2026-03-15',
          memo: 'Sale',
          debit_element_id: null,
          credit_element_id: null,
          amount: 500000,
          reason: null,
        })
      )

      await client.createManualClosingEntry('graph_1', {
        postingDate: '2026-03-15',
        memo: 'Sale',
        entryType: 'closing',
        lineItems: [
          { elementId: 'el_cash', debitAmount: 500000, description: 'cash in' },
          { elementId: 'el_asset', creditAmount: 300000 },
          { elementId: 'el_gain', creditAmount: 200000 },
        ],
      })

      const request = mockFetch.mock.calls[0][0] as Request
      const body = JSON.parse(await request.text())
      expect(body).toEqual({
        posting_date: '2026-03-15',
        memo: 'Sale',
        entry_type: 'closing',
        line_items: [
          {
            element_id: 'el_cash',
            debit_amount: 500000,
            credit_amount: 0,
            description: 'cash in',
          },
          {
            element_id: 'el_asset',
            debit_amount: 0,
            credit_amount: 300000,
            description: null,
          },
          {
            element_id: 'el_gain',
            debit_amount: 0,
            credit_amount: 200000,
            description: null,
          },
        ],
      })
    })

    it('should throw on 422 unbalanced line items', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ detail: 'line items must balance' }, { ok: false, status: 422 })
      )

      await expect(
        client.createManualClosingEntry('graph_1', {
          postingDate: '2026-03-15',
          memo: 'Unbalanced',
          lineItems: [{ elementId: 'el_a', debitAmount: 1000 }],
        })
      ).rejects.toThrow('Create manual closing entry failed')
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
