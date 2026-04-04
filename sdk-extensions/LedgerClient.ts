'use client'

/**
 * Ledger Client for RoboSystems API
 *
 * High-level client for all ledger concerns: chart of accounts, transactions,
 * trial balance, taxonomy, mappings, and AI auto-mapping. This is the
 * operational backbone — reports consume these as inputs.
 */

import {
  autoMapElements,
  createClosingEntry,
  createMappingAssociation,
  createSchedule,
  createStructure,
  deleteMappingAssociation,
  getLedgerAccountTree,
  getLedgerEntity,
  getLedgerSummary,
  getLedgerTransaction,
  getLedgerTrialBalance,
  getMappedTrialBalance,
  getMappingCoverage,
  getMappingDetail,
  getPeriodCloseStatus,
  getReportingTaxonomy,
  getScheduleFacts,
  listElements,
  listLedgerAccounts,
  listLedgerTransactions,
  listMappings,
  listSchedules,
  listStructures,
} from '../sdk/sdk.gen'
import type {
  AccountListResponse,
  AccountTreeResponse,
  ClosingEntryResponse,
  CreateClosingEntryRequest,
  CreateScheduleRequest,
  LedgerSummaryResponse,
  LedgerTransactionDetailResponse,
  LedgerTransactionListResponse,
  MappingCoverageResponse,
  MappingDetailResponse,
  PeriodCloseItemResponse,
  PeriodCloseStatusResponse,
  ScheduleCreatedResponse,
  ScheduleFactResponse,
  ScheduleFactsResponse,
  ScheduleListResponse,
  ScheduleSummaryResponse,
  TrialBalanceResponse,
} from '../sdk/types.gen'

// ── Friendly types ──────────────────────────────────────────────────────

export interface LedgerEntity {
  id: string
  name: string
  legalName: string | null
  entityType: string | null
  industry: string | null
  status: string | null
}

export interface MappingInfo {
  id: string
  name: string
  description: string | null
  structureType: string
  taxonomyId: string
  isActive: boolean
}

export interface MappingCoverage {
  totalCoaElements: number
  mappedCount: number
  unmappedCount: number
  coveragePercent: number
  highConfidence: number
  mediumConfidence: number
  lowConfidence: number
}

export interface Structure {
  id: string
  name: string
  structureType: string
}

export interface Schedule {
  structureId: string
  name: string
  taxonomyName: string
  entryTemplate: Record<string, unknown> | null
  scheduleMetadata: Record<string, unknown> | null
  totalPeriods: number
  periodsWithEntries: number
}

export interface ScheduleCreated {
  structureId: string
  name: string
  taxonomyId: string
  totalPeriods: number
  totalFacts: number
}

export interface ScheduleFact {
  elementId: string
  elementName: string
  value: number
  periodStart: string
  periodEnd: string
}

export interface PeriodCloseItem {
  structureId: string
  structureName: string
  amount: number
  status: string
  entryId: string | null
}

export interface PeriodCloseStatus {
  fiscalPeriodStart: string
  fiscalPeriodEnd: string
  periodStatus: string
  schedules: PeriodCloseItem[]
  totalDraft: number
  totalPosted: number
}

export interface ClosingEntry {
  entryId: string
  status: string
  postingDate: string
  memo: string
  debitElementId: string
  creditElementId: string
  amount: number
}

export interface CreateScheduleOptions {
  name: string
  elementIds: string[]
  periodStart: string
  periodEnd: string
  monthlyAmount: number
  entryTemplate: {
    debitElementId: string
    creditElementId: string
    entryType?: string
    memoTemplate?: string
  }
  taxonomyId?: string
  scheduleMetadata?: {
    method?: string
    originalAmount?: number
    residualValue?: number
    usefulLifeMonths?: number
    assetElementId?: string
  }
}

// ── Client ──────────────────────────────────────────────────────────────

export class LedgerClient {
  private config: {
    baseUrl: string
    credentials?: 'include' | 'same-origin' | 'omit'
    headers?: Record<string, string>
    token?: string
  }

  constructor(config: {
    baseUrl: string
    credentials?: 'include' | 'same-origin' | 'omit'
    headers?: Record<string, string>
    token?: string
  }) {
    this.config = config
  }

  // ── Entity ──────────────────────────────────────────────────────────

  /**
   * Get the entity (company/organization) for this graph.
   */
  async getEntity(graphId: string): Promise<LedgerEntity | null> {
    const response = await getLedgerEntity({
      path: { graph_id: graphId },
    })

    if (response.response.status === 404) return null
    if (response.error) {
      throw new Error(`Get entity failed: ${JSON.stringify(response.error)}`)
    }

    const data = response.data as Record<string, unknown>
    return {
      id: data.id as string,
      name: data.name as string,
      legalName: (data.legal_name as string) ?? null,
      entityType: (data.entity_type as string) ?? null,
      industry: (data.industry as string) ?? null,
      status: (data.status as string) ?? null,
    }
  }

  // ── Accounts (Chart of Accounts) ───────────────────────────────────

  /**
   * List accounts (flat).
   */
  async listAccounts(graphId: string): Promise<AccountListResponse> {
    const response = await listLedgerAccounts({
      path: { graph_id: graphId },
    })

    if (response.error) {
      throw new Error(`List accounts failed: ${JSON.stringify(response.error)}`)
    }

    return response.data as AccountListResponse
  }

  /**
   * Get the account tree (hierarchical).
   */
  async getAccountTree(graphId: string): Promise<AccountTreeResponse> {
    const response = await getLedgerAccountTree({
      path: { graph_id: graphId },
    })

    if (response.error) {
      throw new Error(`Get account tree failed: ${JSON.stringify(response.error)}`)
    }

    return response.data as AccountTreeResponse
  }

  // ── Transactions ────────────────────────────────────────────────────

  /**
   * List transactions with optional date filters.
   */
  async listTransactions(
    graphId: string,
    options?: { startDate?: string; endDate?: string; limit?: number; offset?: number }
  ): Promise<LedgerTransactionListResponse> {
    const response = await listLedgerTransactions({
      path: { graph_id: graphId },
      query: {
        start_date: options?.startDate,
        end_date: options?.endDate,
        limit: options?.limit,
        offset: options?.offset,
      },
    })

    if (response.error) {
      throw new Error(`List transactions failed: ${JSON.stringify(response.error)}`)
    }

    return response.data as LedgerTransactionListResponse
  }

  /**
   * Get transaction detail with entries and line items.
   */
  async getTransaction(
    graphId: string,
    transactionId: string
  ): Promise<LedgerTransactionDetailResponse> {
    const response = await getLedgerTransaction({
      path: { graph_id: graphId, transaction_id: transactionId },
    })

    if (response.error) {
      throw new Error(`Get transaction failed: ${JSON.stringify(response.error)}`)
    }

    return response.data as LedgerTransactionDetailResponse
  }

  // ── Trial Balance ──────────────────────────────────────────────────

  /**
   * Get trial balance (CoA-level debits/credits).
   */
  async getTrialBalance(
    graphId: string,
    options?: { startDate?: string; endDate?: string }
  ): Promise<TrialBalanceResponse> {
    const response = await getLedgerTrialBalance({
      path: { graph_id: graphId },
      query: {
        start_date: options?.startDate,
        end_date: options?.endDate,
      },
    })

    if (response.error) {
      throw new Error(`Get trial balance failed: ${JSON.stringify(response.error)}`)
    }

    return response.data as TrialBalanceResponse
  }

  /**
   * Get mapped trial balance (CoA rolled up to GAAP concepts).
   */
  async getMappedTrialBalance(
    graphId: string,
    options?: { mappingId?: string; startDate?: string; endDate?: string }
  ): Promise<unknown> {
    const response = await getMappedTrialBalance({
      path: { graph_id: graphId },
      query: {
        mapping_id: options?.mappingId,
        start_date: options?.startDate,
        end_date: options?.endDate,
      },
    })

    if (response.error) {
      throw new Error(`Get mapped trial balance failed: ${JSON.stringify(response.error)}`)
    }

    return response.data
  }

  // ── Summary ────────────────────────────────────────────────────────

  /**
   * Get ledger summary (account count, transaction count, date range).
   */
  async getSummary(graphId: string): Promise<LedgerSummaryResponse> {
    const response = await getLedgerSummary({
      path: { graph_id: graphId },
    })

    if (response.error) {
      throw new Error(`Get summary failed: ${JSON.stringify(response.error)}`)
    }

    return response.data as LedgerSummaryResponse
  }

  // ── Taxonomy ────────────────────────────────────────────────────────

  /**
   * Get the reporting taxonomy (US GAAP seed).
   */
  async getReportingTaxonomy(graphId: string): Promise<unknown> {
    const response = await getReportingTaxonomy({
      path: { graph_id: graphId },
    })

    if (response.error) {
      throw new Error(`Get reporting taxonomy failed: ${JSON.stringify(response.error)}`)
    }

    return response.data
  }

  /**
   * List reporting structures (IS, BS, CF) for a taxonomy.
   */
  async listStructures(graphId: string, taxonomyId?: string): Promise<Structure[]> {
    const response = await listStructures({
      path: { graph_id: graphId },
      query: taxonomyId ? { taxonomy_id: taxonomyId } : undefined,
    })

    if (response.error) {
      throw new Error(`List structures failed: ${JSON.stringify(response.error)}`)
    }

    const data = response.data as { structures?: Array<Record<string, unknown>> }
    return (data.structures ?? []).map((s) => ({
      id: s.id as string,
      name: s.name as string,
      structureType: s.structure_type as string,
    }))
  }

  /**
   * List elements (CoA accounts, GAAP concepts, etc.).
   */
  async listElements(
    graphId: string,
    options?: {
      taxonomyId?: string
      source?: string
      classification?: string
      isAbstract?: boolean
      limit?: number
      offset?: number
    }
  ): Promise<unknown> {
    const response = await listElements({
      path: { graph_id: graphId },
      query: {
        taxonomy_id: options?.taxonomyId,
        source: options?.source,
        classification: options?.classification,
        is_abstract: options?.isAbstract,
        limit: options?.limit,
        offset: options?.offset,
      },
    })

    if (response.error) {
      throw new Error(`List elements failed: ${JSON.stringify(response.error)}`)
    }

    return response.data
  }

  // ── Mappings ────────────────────────────────────────────────────────

  /**
   * Create a new CoA→GAAP mapping structure.
   * Returns the created mapping info.
   */
  async createMappingStructure(
    graphId: string,
    options?: { name?: string; description?: string; taxonomyId?: string }
  ): Promise<MappingInfo> {
    const response = await createStructure({
      path: { graph_id: graphId },
      body: {
        name: options?.name ?? 'CoA to Reporting',
        description: options?.description ?? 'Map Chart of Accounts to US GAAP reporting concepts',
        structure_type: 'coa_mapping',
        taxonomy_id: options?.taxonomyId ?? 'tax_usgaap_reporting',
      },
    })

    if (response.error) {
      throw new Error(`Create mapping structure failed: ${JSON.stringify(response.error)}`)
    }

    const data = response.data as Record<string, unknown>
    return {
      id: data.id as string,
      name: data.name as string,
      description: (data.description as string) ?? null,
      structureType: data.structure_type as string,
      taxonomyId: data.taxonomy_id as string,
      isActive: (data.is_active as boolean) ?? true,
    }
  }

  /**
   * List available CoA→GAAP mapping structures.
   */
  async listMappings(graphId: string): Promise<MappingInfo[]> {
    const response = await listMappings({
      path: { graph_id: graphId },
    })

    if (response.error) {
      throw new Error(`List mappings failed: ${JSON.stringify(response.error)}`)
    }

    const data = response.data as { structures?: Array<Record<string, unknown>> }
    return (data.structures ?? []).map((s) => ({
      id: s.id as string,
      name: s.name as string,
      description: (s.description as string) ?? null,
      structureType: s.structure_type as string,
      taxonomyId: s.taxonomy_id as string,
      isActive: (s.is_active as boolean) ?? true,
    }))
  }

  /**
   * Get mapping detail — all associations with element names.
   */
  async getMappingDetail(graphId: string, mappingId: string): Promise<MappingDetailResponse> {
    const response = await getMappingDetail({
      path: { graph_id: graphId, mapping_id: mappingId },
    })

    if (response.error) {
      throw new Error(`Get mapping detail failed: ${JSON.stringify(response.error)}`)
    }

    return response.data as MappingDetailResponse
  }

  /**
   * Get mapping coverage — how many CoA elements are mapped.
   */
  async getMappingCoverage(graphId: string, mappingId: string): Promise<MappingCoverage> {
    const response = await getMappingCoverage({
      path: { graph_id: graphId, mapping_id: mappingId },
    })

    if (response.error) {
      throw new Error(`Get mapping coverage failed: ${JSON.stringify(response.error)}`)
    }

    const data = response.data as MappingCoverageResponse
    return {
      totalCoaElements: data.total_coa_elements ?? 0,
      mappedCount: data.mapped_count ?? 0,
      unmappedCount: data.unmapped_count ?? 0,
      coveragePercent: data.coverage_percent ?? 0,
      highConfidence: data.high_confidence ?? 0,
      mediumConfidence: data.medium_confidence ?? 0,
      lowConfidence: data.low_confidence ?? 0,
    }
  }

  /**
   * Create a manual mapping association (CoA element → GAAP element).
   */
  async createMapping(
    graphId: string,
    mappingId: string,
    fromElementId: string,
    toElementId: string,
    confidence?: number
  ): Promise<void> {
    const response = await createMappingAssociation({
      path: { graph_id: graphId, mapping_id: mappingId },
      body: {
        from_element_id: fromElementId,
        to_element_id: toElementId,
        confidence: confidence ?? 1.0,
      },
    })

    if (response.error) {
      throw new Error(`Create mapping failed: ${JSON.stringify(response.error)}`)
    }
  }

  /**
   * Delete a mapping association.
   */
  async deleteMapping(graphId: string, mappingId: string, associationId: string): Promise<void> {
    const response = await deleteMappingAssociation({
      path: { graph_id: graphId, mapping_id: mappingId, association_id: associationId },
    })

    if (response.error) {
      throw new Error(`Delete mapping failed: ${JSON.stringify(response.error)}`)
    }
  }

  /**
   * Trigger AI auto-mapping (MappingAgent).
   * Returns immediately — the agent runs in the background.
   */
  async autoMap(graphId: string, mappingId: string): Promise<{ operationId?: string }> {
    const response = await autoMapElements({
      path: { graph_id: graphId, mapping_id: mappingId },
    })

    if (response.error) {
      throw new Error(`Auto-map failed: ${JSON.stringify(response.error)}`)
    }

    const data = response.data as Record<string, unknown> | undefined
    return {
      operationId: data?.operation_id as string | undefined,
    }
  }

  // ── Schedules ──────────────────────────────────────────────────────

  /**
   * Create a schedule with pre-generated monthly facts.
   */
  async createSchedule(graphId: string, options: CreateScheduleOptions): Promise<ScheduleCreated> {
    const body: CreateScheduleRequest = {
      name: options.name,
      element_ids: options.elementIds,
      period_start: options.periodStart,
      period_end: options.periodEnd,
      monthly_amount: options.monthlyAmount,
      entry_template: {
        debit_element_id: options.entryTemplate.debitElementId,
        credit_element_id: options.entryTemplate.creditElementId,
        entry_type: options.entryTemplate.entryType,
        memo_template: options.entryTemplate.memoTemplate,
      },
      taxonomy_id: options.taxonomyId,
      schedule_metadata: options.scheduleMetadata
        ? {
            method: options.scheduleMetadata.method,
            original_amount: options.scheduleMetadata.originalAmount,
            residual_value: options.scheduleMetadata.residualValue,
            useful_life_months: options.scheduleMetadata.usefulLifeMonths,
            asset_element_id: options.scheduleMetadata.assetElementId,
          }
        : undefined,
    }

    const response = await createSchedule({
      path: { graph_id: graphId },
      body,
    })

    if (response.error) {
      throw new Error(`Create schedule failed: ${JSON.stringify(response.error)}`)
    }

    const data = response.data as ScheduleCreatedResponse
    return {
      structureId: data.structure_id,
      name: data.name,
      taxonomyId: data.taxonomy_id,
      totalPeriods: data.total_periods,
      totalFacts: data.total_facts,
    }
  }

  /**
   * List all schedules for a graph.
   */
  async listSchedules(graphId: string): Promise<Schedule[]> {
    const response = await listSchedules({
      path: { graph_id: graphId },
    })

    if (response.error) {
      throw new Error(`List schedules failed: ${JSON.stringify(response.error)}`)
    }

    const data = response.data as ScheduleListResponse
    return (data.schedules ?? []).map((s: ScheduleSummaryResponse) => ({
      structureId: s.structure_id,
      name: s.name,
      taxonomyName: s.taxonomy_name,
      entryTemplate: s.entry_template ?? null,
      scheduleMetadata: s.schedule_metadata ?? null,
      totalPeriods: s.total_periods,
      periodsWithEntries: s.periods_with_entries,
    }))
  }

  /**
   * Get facts for a schedule, optionally filtered by period.
   */
  async getScheduleFacts(
    graphId: string,
    structureId: string,
    periodStart?: string,
    periodEnd?: string
  ): Promise<ScheduleFact[]> {
    const response = await getScheduleFacts({
      path: { graph_id: graphId, structure_id: structureId },
      query: {
        period_start: periodStart ?? null,
        period_end: periodEnd ?? null,
      },
    })

    if (response.error) {
      throw new Error(`Get schedule facts failed: ${JSON.stringify(response.error)}`)
    }

    const data = response.data as ScheduleFactsResponse
    return (data.facts ?? []).map((f: ScheduleFactResponse) => ({
      elementId: f.element_id,
      elementName: f.element_name,
      value: f.value,
      periodStart: f.period_start,
      periodEnd: f.period_end,
    }))
  }

  /**
   * Get close status for all schedules in a fiscal period.
   */
  async getPeriodCloseStatus(
    graphId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<PeriodCloseStatus> {
    const response = await getPeriodCloseStatus({
      path: { graph_id: graphId },
      query: { period_start: periodStart, period_end: periodEnd },
    })

    if (response.error) {
      throw new Error(`Get period close status failed: ${JSON.stringify(response.error)}`)
    }

    const data = response.data as PeriodCloseStatusResponse
    return {
      fiscalPeriodStart: data.fiscal_period_start,
      fiscalPeriodEnd: data.fiscal_period_end,
      periodStatus: data.period_status,
      schedules: (data.schedules ?? []).map((s: PeriodCloseItemResponse) => ({
        structureId: s.structure_id,
        structureName: s.structure_name,
        amount: s.amount,
        status: s.status,
        entryId: s.entry_id ?? null,
      })),
      totalDraft: data.total_draft,
      totalPosted: data.total_posted,
    }
  }

  /**
   * Create a draft closing entry from a schedule's facts for a period.
   */
  async createClosingEntry(
    graphId: string,
    structureId: string,
    postingDate: string,
    periodStart: string,
    periodEnd: string,
    memo?: string
  ): Promise<ClosingEntry> {
    const body: CreateClosingEntryRequest = {
      posting_date: postingDate,
      period_start: periodStart,
      period_end: periodEnd,
      memo: memo ?? undefined,
    }

    const response = await createClosingEntry({
      path: { graph_id: graphId, structure_id: structureId },
      body,
    })

    if (response.error) {
      throw new Error(`Create closing entry failed: ${JSON.stringify(response.error)}`)
    }

    const data = response.data as ClosingEntryResponse
    return {
      entryId: data.entry_id,
      status: data.status,
      postingDate: data.posting_date,
      memo: data.memo,
      debitElementId: data.debit_element_id,
      creditElementId: data.credit_element_id,
      amount: data.amount,
    }
  }
}
