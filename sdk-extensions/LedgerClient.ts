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
  closeFiscalPeriod,
  createClosingEntry,
  createManualClosingEntry,
  createMappingAssociation,
  createSchedule,
  createStructure,
  deleteMappingAssociation,
  getAccountRollups,
  getClosingBookStructures,
  getFiscalCalendar,
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
  initializeLedger,
  listElements,
  listLedgerAccounts,
  listLedgerTransactions,
  listMappings,
  listPeriodDrafts,
  listSchedules,
  listStructures,
  reopenFiscalPeriod,
  setCloseTarget,
  truncateSchedule,
} from '../sdk/sdk.gen'
import type {
  AccountListResponse,
  AccountRollupsResponse,
  AccountTreeResponse,
  ClosePeriodRequest,
  ClosePeriodResponse,
  ClosingBookStructuresResponse,
  ClosingEntryResponse,
  CreateClosingEntryRequest,
  CreateManualClosingEntryRequest,
  CreateScheduleRequest,
  FiscalCalendarResponse,
  InitializeLedgerRequest,
  InitializeLedgerResponse,
  LedgerSummaryResponse,
  LedgerTransactionDetailResponse,
  LedgerTransactionListResponse,
  MappingCoverageResponse,
  MappingDetailResponse,
  PeriodCloseItemResponse,
  PeriodCloseStatusResponse,
  PeriodDraftsResponse,
  ReopenPeriodRequest,
  ScheduleCreatedResponse,
  ScheduleFactResponse,
  ScheduleFactsResponse,
  ScheduleListResponse,
  ScheduleSummaryResponse,
  SetCloseTargetRequest,
  TrialBalanceResponse,
  TruncateScheduleRequest,
  TruncateScheduleResponse,
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

/**
 * Outcome of an idempotent `createClosingEntry` call.
 *
 * - `created`     — no prior draft, new draft created
 * - `unchanged`   — prior draft matches current schedule fact, no-op
 * - `regenerated` — prior draft was stale, replaced with a fresh one
 * - `removed`     — prior draft existed but schedule no longer covers this period
 * - `skipped`     — no prior draft and no in-scope fact; nothing to do
 */
export type ClosingEntryOutcome = 'created' | 'unchanged' | 'regenerated' | 'removed' | 'skipped'

/**
 * Result of an idempotent closing-entry call. `entry_id`, `amount`, and
 * related fields are null for `removed` and `skipped` outcomes.
 */
export interface ClosingEntry {
  outcome: ClosingEntryOutcome
  entryId: string | null
  status: string | null
  postingDate: string | null
  memo: string | null
  debitElementId: string | null
  creditElementId: string | null
  amount: number | null
  reason: string | null
}

export type LedgerEntryType = 'standard' | 'adjusting' | 'closing' | 'reversing'

// ── Fiscal calendar types ──────────────────────────────────────────────

export interface FiscalPeriodSummary {
  name: string
  startDate: string
  endDate: string
  status: string
  closedAt: string | null
}

export interface FiscalCalendarState {
  graphId: string
  fiscalYearStartMonth: number
  closedThrough: string | null
  closeTarget: string | null
  gapPeriods: number
  catchUpSequence: string[]
  closeableNow: boolean
  blockers: string[]
  lastCloseAt: string | null
  initializedAt: string | null
  lastSyncAt: string | null
  periods: FiscalPeriodSummary[]
}

export interface InitializeLedgerOptions {
  closedThrough?: string | null
  fiscalYearStartMonth?: number
  earliestDataPeriod?: string | null
  autoSeedSchedules?: boolean
  note?: string | null
}

export interface InitializeLedgerResult {
  fiscalCalendar: FiscalCalendarState
  periodsCreated: number
  warnings: string[]
}

export interface ClosePeriodOptions {
  note?: string | null
  allowStaleSync?: boolean
}

export interface ClosePeriodResult {
  period: string
  entriesPosted: number
  targetAutoAdvanced: boolean
  fiscalCalendar: FiscalCalendarState
}

export interface DraftLineItemView {
  lineItemId: string
  elementId: string
  elementCode: string | null
  elementName: string
  debitAmount: number
  creditAmount: number
  description: string | null
}

export interface DraftEntryView {
  entryId: string
  postingDate: string
  type: string
  memo: string | null
  provenance: string | null
  sourceStructureId: string | null
  sourceStructureName: string | null
  lineItems: DraftLineItemView[]
  totalDebit: number
  totalCredit: number
  balanced: boolean
}

export interface PeriodDraftsView {
  period: string
  periodStart: string
  periodEnd: string
  draftCount: number
  totalDebit: number
  totalCredit: number
  allBalanced: boolean
  drafts: DraftEntryView[]
}

export interface ManualClosingLineItem {
  elementId: string
  debitAmount?: number
  creditAmount?: number
  description?: string | null
}

export interface CreateManualClosingEntryOptions {
  postingDate: string
  memo: string
  lineItems: ManualClosingLineItem[]
  entryType?: LedgerEntryType
}

export interface TruncateScheduleOptions {
  newEndDate: string
  reason: string
}

export interface TruncateScheduleResult {
  structureId: string
  newEndDate: string
  factsDeleted: number
  reason: string
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
    entryType?: LedgerEntryType
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
   * Idempotently create (or refresh) a draft closing entry from a schedule's
   * facts for a period. The `outcome` field describes what actually happened:
   *
   * - `created`     — new draft
   * - `unchanged`   — existing draft still matches the schedule; no-op
   * - `regenerated` — existing draft was stale; replaced
   * - `removed`     — schedule no longer covers this period; stale draft deleted
   * - `skipped`     — no existing draft and no in-scope fact; nothing to do
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
    return toClosingEntry(data)
  }

  // ── Closing Book ─────────────────────────────────────────────────────

  /**
   * Get all closing book structure categories for the sidebar.
   * Returns statements, account rollups, schedules, trial balance,
   * and period close grouped into categories.
   */
  async getClosingBookStructures(graphId: string): Promise<ClosingBookStructuresResponse> {
    const response = await getClosingBookStructures({
      path: { graph_id: graphId },
    })

    if (response.error) {
      throw new Error(`Get closing book structures failed: ${JSON.stringify(response.error)}`)
    }

    return response.data as ClosingBookStructuresResponse
  }

  /**
   * Get account rollups — CoA accounts grouped by reporting element with balances.
   * Shows how company-specific accounts roll up to standardized reporting lines.
   */
  async getAccountRollups(
    graphId: string,
    options?: { mappingId?: string; startDate?: string; endDate?: string }
  ): Promise<AccountRollupsResponse> {
    const response = await getAccountRollups({
      path: { graph_id: graphId },
      query: {
        mapping_id: options?.mappingId,
        start_date: options?.startDate,
        end_date: options?.endDate,
      },
    })

    if (response.error) {
      throw new Error(`Get account rollups failed: ${JSON.stringify(response.error)}`)
    }

    return response.data as AccountRollupsResponse
  }

  // ── Fiscal Calendar ─────────────────────────────────────────────────

  /**
   * Initialize the fiscal calendar for a graph. Creates FiscalPeriod rows
   * for the data window, sets `closed_through` / `close_target`, and emits
   * an `initialized` audit event. Fails with 409 if already initialized.
   */
  async initializeLedger(
    graphId: string,
    options?: InitializeLedgerOptions
  ): Promise<InitializeLedgerResult> {
    const body: InitializeLedgerRequest = {
      closed_through: options?.closedThrough ?? null,
      fiscal_year_start_month: options?.fiscalYearStartMonth,
      earliest_data_period: options?.earliestDataPeriod ?? null,
      auto_seed_schedules: options?.autoSeedSchedules,
      note: options?.note ?? null,
    }

    const response = await initializeLedger({
      path: { graph_id: graphId },
      body,
    })

    if (response.error) {
      throw new Error(`Initialize ledger failed: ${JSON.stringify(response.error)}`)
    }

    const data = response.data as InitializeLedgerResponse
    return {
      fiscalCalendar: toFiscalCalendarState(data.fiscal_calendar),
      periodsCreated: data.periods_created ?? 0,
      warnings: data.warnings ?? [],
    }
  }

  /**
   * Get the current fiscal calendar state — pointers, gap, closeable status.
   */
  async getFiscalCalendar(graphId: string): Promise<FiscalCalendarState> {
    const response = await getFiscalCalendar({
      path: { graph_id: graphId },
    })

    if (response.error) {
      throw new Error(`Get fiscal calendar failed: ${JSON.stringify(response.error)}`)
    }

    return toFiscalCalendarState(response.data as FiscalCalendarResponse)
  }

  /**
   * Set the close target for a graph. Validates that the target is not in
   * the future and not before `closed_through`.
   */
  async setCloseTarget(
    graphId: string,
    period: string,
    note?: string | null
  ): Promise<FiscalCalendarState> {
    const body: SetCloseTargetRequest = {
      period,
      note: note ?? null,
    }

    const response = await setCloseTarget({
      path: { graph_id: graphId },
      body,
    })

    if (response.error) {
      throw new Error(`Set close target failed: ${JSON.stringify(response.error)}`)
    }

    return toFiscalCalendarState(response.data as FiscalCalendarResponse)
  }

  /**
   * Close a fiscal period — the final commit action.
   *
   * Validates closeable gates, transitions all draft entries in the period
   * to `posted`, marks the FiscalPeriod closed, and advances `closed_through`
   * (auto-advancing `close_target` when reached).
   */
  async closePeriod(
    graphId: string,
    period: string,
    options?: ClosePeriodOptions
  ): Promise<ClosePeriodResult> {
    const body: ClosePeriodRequest = {
      note: options?.note ?? null,
      allow_stale_sync: options?.allowStaleSync,
    }

    const response = await closeFiscalPeriod({
      path: { graph_id: graphId, period },
      body,
    })

    if (response.error) {
      throw new Error(`Close period failed: ${JSON.stringify(response.error)}`)
    }

    const data = response.data as ClosePeriodResponse
    return {
      period: data.period,
      entriesPosted: data.entries_posted ?? 0,
      targetAutoAdvanced: data.target_auto_advanced ?? false,
      fiscalCalendar: toFiscalCalendarState(data.fiscal_calendar),
    }
  }

  /**
   * Reopen a closed fiscal period. Requires a non-empty `reason` for the
   * audit log. Posted entries stay posted; the period transitions to
   * `closing` so the user can post adjustments and re-close.
   */
  async reopenPeriod(
    graphId: string,
    period: string,
    reason: string,
    note?: string | null
  ): Promise<FiscalCalendarState> {
    const body: ReopenPeriodRequest = {
      reason,
      note: note ?? null,
    }

    const response = await reopenFiscalPeriod({
      path: { graph_id: graphId, period },
      body,
    })

    if (response.error) {
      throw new Error(`Reopen period failed: ${JSON.stringify(response.error)}`)
    }

    return toFiscalCalendarState(response.data as FiscalCalendarResponse)
  }

  /**
   * List all draft entries in a fiscal period for review before close.
   * Fully expanded with line items, element metadata, and per-entry balance.
   *
   * Pure read — call repeatedly without side effects.
   */
  async listPeriodDrafts(graphId: string, period: string): Promise<PeriodDraftsView> {
    const response = await listPeriodDrafts({
      path: { graph_id: graphId, period },
    })

    if (response.error) {
      throw new Error(`List period drafts failed: ${JSON.stringify(response.error)}`)
    }

    const data = response.data as PeriodDraftsResponse
    return {
      period: data.period,
      periodStart: data.period_start,
      periodEnd: data.period_end,
      draftCount: data.draft_count,
      totalDebit: data.total_debit,
      totalCredit: data.total_credit,
      allBalanced: data.all_balanced,
      drafts: (data.drafts ?? []).map((d) => ({
        entryId: d.entry_id,
        postingDate: d.posting_date,
        type: d.type,
        memo: d.memo ?? null,
        provenance: d.provenance ?? null,
        sourceStructureId: d.source_structure_id ?? null,
        sourceStructureName: d.source_structure_name ?? null,
        lineItems: d.line_items.map((li) => ({
          lineItemId: li.line_item_id,
          elementId: li.element_id,
          elementCode: li.element_code ?? null,
          elementName: li.element_name,
          debitAmount: li.debit_amount,
          creditAmount: li.credit_amount,
          description: li.description ?? null,
        })),
        totalDebit: d.total_debit,
        totalCredit: d.total_credit,
        balanced: d.balanced,
      })),
    }
  }

  // ── Schedule mutations ──────────────────────────────────────────────

  /**
   * Truncate a schedule — end it early by deleting facts with
   * `period_start > new_end_date`, along with any stale draft entries they
   * produced. Historical posted facts are preserved.
   *
   * `new_end_date` must be a month-end date (service enforces this).
   */
  async truncateSchedule(
    graphId: string,
    structureId: string,
    options: TruncateScheduleOptions
  ): Promise<TruncateScheduleResult> {
    const body: TruncateScheduleRequest = {
      new_end_date: options.newEndDate,
      reason: options.reason,
    }

    const response = await truncateSchedule({
      path: { graph_id: graphId, structure_id: structureId },
      body,
    })

    if (response.error) {
      throw new Error(`Truncate schedule failed: ${JSON.stringify(response.error)}`)
    }

    const data = response.data as TruncateScheduleResponse
    return {
      structureId: data.structure_id,
      newEndDate: data.new_end_date,
      factsDeleted: data.facts_deleted,
      reason: data.reason,
    }
  }

  /**
   * Create a manual draft closing entry with arbitrary balanced line items.
   * Not tied to a schedule — used for disposals, adjustments, and other
   * one-off closing events.
   *
   * Line items must sum to balanced debits/credits. Rejects entries
   * targeting an already-closed period.
   */
  async createManualClosingEntry(
    graphId: string,
    options: CreateManualClosingEntryOptions
  ): Promise<ClosingEntry> {
    const body: CreateManualClosingEntryRequest = {
      posting_date: options.postingDate,
      memo: options.memo,
      entry_type: options.entryType,
      line_items: options.lineItems.map((li) => ({
        element_id: li.elementId,
        debit_amount: li.debitAmount ?? 0,
        credit_amount: li.creditAmount ?? 0,
        description: li.description ?? null,
      })),
    }

    const response = await createManualClosingEntry({
      path: { graph_id: graphId },
      body,
    })

    if (response.error) {
      throw new Error(`Create manual closing entry failed: ${JSON.stringify(response.error)}`)
    }

    return toClosingEntry(response.data as ClosingEntryResponse)
  }
}

// ── Internal helpers ──────────────────────────────────────────────────

function toClosingEntry(data: ClosingEntryResponse): ClosingEntry {
  return {
    outcome: data.outcome as ClosingEntryOutcome,
    entryId: data.entry_id ?? null,
    status: data.status ?? null,
    postingDate: data.posting_date ?? null,
    memo: data.memo ?? null,
    debitElementId: data.debit_element_id ?? null,
    creditElementId: data.credit_element_id ?? null,
    amount: data.amount ?? null,
    reason: data.reason ?? null,
  }
}

function toFiscalCalendarState(data: FiscalCalendarResponse): FiscalCalendarState {
  return {
    graphId: data.graph_id,
    fiscalYearStartMonth: data.fiscal_year_start_month,
    closedThrough: data.closed_through ?? null,
    closeTarget: data.close_target ?? null,
    gapPeriods: data.gap_periods ?? 0,
    catchUpSequence: data.catch_up_sequence ?? [],
    closeableNow: data.closeable_now ?? false,
    blockers: data.blockers ?? [],
    lastCloseAt: data.last_close_at ?? null,
    initializedAt: data.initialized_at ?? null,
    lastSyncAt: data.last_sync_at ?? null,
    periods: (data.periods ?? []).map((p) => ({
      name: p.name,
      startDate: p.start_date,
      endDate: p.end_date,
      status: p.status,
      closedAt: p.closed_at ?? null,
    })),
  }
}
