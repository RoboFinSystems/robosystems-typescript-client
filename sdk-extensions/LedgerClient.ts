'use client'

/**
 * Ledger Client for RoboSystems API
 *
 * High-level facade for everything the RoboLedger domain exposes:
 * entity, chart of accounts, transactions, taxonomy + mappings, fiscal
 * calendar, schedules, reports, and publish lists.
 *
 * **Transport split:**
 * - **Reads** go through GraphQL at `/extensions/{graph_id}/graphql`
 *   (via `graphql-request`, with typed documents produced by GraphQL
 *   Code Generator). The graph is in the URL, not in the query.
 * - **Writes** go through named command operations at
 *   `/extensions/roboledger/{graph_id}/operations/{operation_name}`
 *   (via the OpenAPI-generated `opXxx` functions in `../sdk/sdk.gen`).
 *   Each command returns an `OperationEnvelope`; the facade unwraps
 *   `envelope.result` and returns a friendly camelCase type.
 *
 * Consumers don't need to know which transport a method uses — the
 * facade signature stays stable. The only trick is that write method
 * results are cast from the envelope's untyped `result` field.
 */

import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import { ClientError } from 'graphql-request'
import {
  opAutoMapElements,
  opBuildFactGrid,
  opClosePeriod,
  opCreateAssociations,
  opCreateClosingEntry,
  opCreateElement,
  opCreateJournalEntry,
  opCreateManualClosingEntry,
  opCreateMappingAssociation,
  opCreateSchedule,
  opCreateStructure,
  opCreateTaxonomy,
  opDeleteAssociation,
  opDeleteElement,
  opDeleteJournalEntry,
  opDeleteMappingAssociation,
  opDeleteSchedule,
  opDeleteStructure,
  opDeleteTaxonomy,
  opInitializeLedger,
  opLinkEntityTaxonomy,
  opReopenPeriod,
  opReverseJournalEntry,
  opSetCloseTarget,
  opTruncateSchedule,
  opUpdateAssociation,
  opUpdateElement,
  opUpdateEntity,
  opUpdateJournalEntry,
  opUpdateSchedule,
  opUpdateStructure,
  opUpdateTaxonomy,
} from '../sdk/sdk.gen'
import type {
  AutoMapElementsOperation,
  BulkAssociationItem,
  BulkCreateAssociationsRequest,
  ClosePeriodOperation,
  CreateClosingEntryOperation,
  CreateElementRequest,
  CreateJournalEntryRequest,
  CreateManualClosingEntryRequest,
  CreateMappingAssociationOperation,
  CreateScheduleRequest,
  CreateStructureRequest,
  CreateTaxonomyRequest,
  CreateViewRequest,
  DeleteAssociationRequest,
  DeleteElementRequest,
  DeleteJournalEntryRequest,
  DeleteMappingAssociationOperation,
  DeleteScheduleRequest,
  DeleteStructureRequest,
  DeleteTaxonomyRequest,
  InitializeLedgerRequest,
  JournalEntryLineItemInput,
  LinkEntityTaxonomyRequest,
  OperationEnvelope,
  ReopenPeriodOperation,
  ReverseJournalEntryRequest,
  SetCloseTargetOperation,
  TruncateScheduleOperation,
  UpdateAssociationRequest,
  UpdateElementRequest,
  UpdateEntityRequest,
  UpdateJournalEntryRequest,
  UpdateScheduleRequest,
  UpdateStructureRequest,
  UpdateTaxonomyRequest,
} from '../sdk/types.gen'
import type { TokenProvider } from './graphql/client'
import { GraphQLClientCache } from './graphql/client'
import {
  GetLedgerAccountRollupsDocument,
  GetLedgerAccountTreeDocument,
  GetLedgerClosingBookStructuresDocument,
  GetLedgerEntityDocument,
  GetLedgerFiscalCalendarDocument,
  GetLedgerMappedTrialBalanceDocument,
  GetLedgerMappingCoverageDocument,
  GetLedgerMappingDocument,
  GetLedgerPeriodCloseStatusDocument,
  GetLedgerPeriodDraftsDocument,
  GetLedgerReportingTaxonomyDocument,
  GetLedgerScheduleFactsDocument,
  GetLedgerSummaryDocument,
  GetLedgerTransactionDocument,
  GetLedgerTrialBalanceDocument,
  ListLedgerAccountsDocument,
  ListLedgerElementsDocument,
  ListLedgerEntitiesDocument,
  ListLedgerMappingsDocument,
  ListLedgerSchedulesDocument,
  ListLedgerStructuresDocument,
  ListLedgerTaxonomiesDocument,
  ListLedgerTransactionsDocument,
  ListLedgerUnmappedElementsDocument,
  type GetLedgerAccountRollupsQuery,
  type GetLedgerAccountTreeQuery,
  type GetLedgerClosingBookStructuresQuery,
  type GetLedgerEntityQuery,
  type GetLedgerFiscalCalendarQuery,
  type GetLedgerMappedTrialBalanceQuery,
  type GetLedgerMappingCoverageQuery,
  type GetLedgerMappingQuery,
  type GetLedgerPeriodCloseStatusQuery,
  type GetLedgerPeriodDraftsQuery,
  type GetLedgerReportingTaxonomyQuery,
  type GetLedgerScheduleFactsQuery,
  type GetLedgerSummaryQuery,
  type GetLedgerTransactionQuery,
  type GetLedgerTrialBalanceQuery,
  type ListLedgerAccountsQuery,
  type ListLedgerElementsQuery,
  type ListLedgerEntitiesQuery,
  type ListLedgerMappingsQuery,
  type ListLedgerSchedulesQuery,
  type ListLedgerStructuresQuery,
  type ListLedgerTaxonomiesQuery,
  type ListLedgerTransactionsQuery,
  type ListLedgerUnmappedElementsQuery,
} from './graphql/generated/graphql'

// ── Friendly types derived from GraphQL codegen ────────────────────────
//
// These are the single source of truth for read payload shapes. Write
// methods also return these where the operation result is semantically
// the same thing (e.g. close-period returns the updated fiscal calendar,
// the same shape as the fiscalCalendar read).

export type LedgerEntity = NonNullable<GetLedgerEntityQuery['entity']>
export type LedgerEntitySummary = ListLedgerEntitiesQuery['entities'][number]

export type LedgerSummary = NonNullable<GetLedgerSummaryQuery['summary']>

export type LedgerAccountList = NonNullable<ListLedgerAccountsQuery['accounts']>
export type LedgerAccount = LedgerAccountList['accounts'][number]
export type LedgerAccountTree = NonNullable<GetLedgerAccountTreeQuery['accountTree']>
export type LedgerAccountRollups = NonNullable<GetLedgerAccountRollupsQuery['accountRollups']>

export type LedgerTrialBalance = NonNullable<GetLedgerTrialBalanceQuery['trialBalance']>
export type LedgerMappedTrialBalance = NonNullable<
  GetLedgerMappedTrialBalanceQuery['mappedTrialBalance']
>

export type LedgerTransactionList = NonNullable<ListLedgerTransactionsQuery['transactions']>
export type LedgerTransactionListItem = LedgerTransactionList['transactions'][number]
export type LedgerTransaction = NonNullable<GetLedgerTransactionQuery['transaction']>

export type LedgerReportingTaxonomy = NonNullable<
  GetLedgerReportingTaxonomyQuery['reportingTaxonomy']
>
export type LedgerTaxonomyList = NonNullable<ListLedgerTaxonomiesQuery['taxonomies']>
export type LedgerTaxonomy = LedgerTaxonomyList['taxonomies'][number]

export type LedgerElementList = NonNullable<ListLedgerElementsQuery['elements']>
export type LedgerElement = LedgerElementList['elements'][number]
export type LedgerUnmappedElement = ListLedgerUnmappedElementsQuery['unmappedElements'][number]

export type LedgerStructureList = NonNullable<ListLedgerStructuresQuery['structures']>
export type LedgerStructure = LedgerStructureList['structures'][number]

export type LedgerMappingList = NonNullable<ListLedgerMappingsQuery['mappings']>
export type LedgerMappingInfo = LedgerMappingList['structures'][number]
export type LedgerMapping = NonNullable<GetLedgerMappingQuery['mapping']>
export type LedgerMappingCoverage = NonNullable<GetLedgerMappingCoverageQuery['mappingCoverage']>

export type LedgerScheduleList = NonNullable<ListLedgerSchedulesQuery['schedules']>
export type LedgerSchedule = LedgerScheduleList['schedules'][number]
export type LedgerScheduleFacts = NonNullable<GetLedgerScheduleFactsQuery['scheduleFacts']>
export type LedgerScheduleFact = LedgerScheduleFacts['facts'][number]

export type LedgerPeriodCloseStatus = NonNullable<
  GetLedgerPeriodCloseStatusQuery['periodCloseStatus']
>
export type LedgerPeriodCloseItem = LedgerPeriodCloseStatus['schedules'][number]
export type LedgerPeriodDrafts = NonNullable<GetLedgerPeriodDraftsQuery['periodDrafts']>
export type LedgerDraftEntry = LedgerPeriodDrafts['drafts'][number]
export type LedgerDraftLineItem = LedgerDraftEntry['lineItems'][number]

export type LedgerClosingBookStructures = NonNullable<
  GetLedgerClosingBookStructuresQuery['closingBookStructures']
>

export type LedgerFiscalCalendar = NonNullable<GetLedgerFiscalCalendarQuery['fiscalCalendar']>
export type LedgerFiscalPeriod = LedgerFiscalCalendar['periods'][number]

// ── Write result shapes (envelope.result payloads) ─────────────────────
//
// Backend Pydantic models serialize these write results in snake_case.
// The facade converts to camelCase where the result is meaningful to
// consumers; for simple ack/ack-with-id payloads we keep the raw shape.

/** Snake-case shape returned in envelope.result for fiscal calendar writes. */
interface RawFiscalCalendar {
  graph_id: string
  fiscal_year_start_month: number
  closed_through: string | null
  close_target: string | null
  gap_periods: number
  catch_up_sequence: string[]
  closeable_now: boolean
  blockers: string[]
  last_close_at: string | null
  initialized_at: string | null
  last_sync_at: string | null
  periods: Array<{
    name: string
    start_date: string
    end_date: string
    status: string
    closed_at: string | null
  }>
}

interface RawInitializeLedgerResult {
  fiscal_calendar: RawFiscalCalendar
  periods_created: number
  warnings: string[]
}

interface RawClosePeriodResult {
  period: string
  entries_posted: number
  target_auto_advanced: boolean
  fiscal_calendar: RawFiscalCalendar
}

interface RawClosingEntryResult {
  outcome: ClosingEntryOutcome
  entry_id: string | null
  status: string | null
  posting_date: string | null
  memo: string | null
  debit_element_id: string | null
  credit_element_id: string | null
  amount: number | null
  reason: string | null
}

interface RawScheduleCreatedResult {
  structure_id: string
  name: string
  taxonomy_id: string
  total_periods: number
  total_facts: number
}

interface RawTruncateScheduleResult {
  structure_id: string
  new_end_date: string
  facts_deleted: number
  reason: string
}

export interface InitializeLedgerResult {
  fiscalCalendar: LedgerFiscalCalendar
  periodsCreated: number
  warnings: string[]
}

export interface ClosePeriodResult {
  period: string
  entriesPosted: number
  targetAutoAdvanced: boolean
  fiscalCalendar: LedgerFiscalCalendar
}

export type ClosingEntryOutcome = 'created' | 'unchanged' | 'regenerated' | 'removed' | 'skipped'

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

export interface ScheduleCreated {
  structureId: string
  name: string
  taxonomyId: string
  totalPeriods: number
  totalFacts: number
}

export interface TruncateScheduleResult {
  structureId: string
  newEndDate: string
  factsDeleted: number
  reason: string
}

export type LedgerEntryType = 'standard' | 'adjusting' | 'closing' | 'reversing'

// ── Caller-facing option interfaces ────────────────────────────────────

export interface InitializeLedgerOptions {
  closedThrough?: string | null
  fiscalYearStartMonth?: number
  earliestDataPeriod?: string | null
  autoSeedSchedules?: boolean
  note?: string | null
}

export interface ClosePeriodOptions {
  note?: string | null
  allowStaleSync?: boolean
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

export interface JournalEntryLineItem {
  elementId: string
  debitAmount?: number
  creditAmount?: number
  description?: string | null
}

export interface CreateJournalEntryOptions {
  postingDate: string
  memo: string
  lineItems: JournalEntryLineItem[]
  type?: LedgerEntryType
  status?: 'draft' | 'posted'
  transactionId?: string | null
  idempotencyKey?: string | null
}

// ── Client ──────────────────────────────────────────────────────────────

interface LedgerClientConfig {
  baseUrl: string
  credentials?: 'include' | 'same-origin' | 'omit'
  headers?: Record<string, string>
  /** Static credential — use `tokenProvider` instead if the JWT rotates. */
  token?: string
  /**
   * Dynamic credential callback. When set, invoked on every GraphQL
   * request so refreshes flow through automatically.
   */
  tokenProvider?: TokenProvider
}

export class LedgerClient {
  private config: LedgerClientConfig

  /**
   * Per-graph GraphQL client cache. The first call for a given graph
   * creates a `GraphQLClient` bound to `/extensions/{graph_id}/graphql`;
   * subsequent calls reuse it.
   */
  private gql: GraphQLClientCache

  constructor(config: LedgerClientConfig) {
    this.config = config
    this.gql = new GraphQLClientCache(config)
  }

  // ── Entity ──────────────────────────────────────────────────────────

  /**
   * Get the entity (company/organization) for this graph.
   * Returns null when the ledger has no entity yet.
   */
  async getEntity(graphId: string): Promise<LedgerEntity | null> {
    return this.gqlQuery(
      graphId,
      GetLedgerEntityDocument,
      undefined,
      'Get entity',
      (data) => data.entity
    )
  }

  /** List all entities for this graph, optionally filtered by source system. */
  async listEntities(
    graphId: string,
    options?: { source?: string }
  ): Promise<LedgerEntitySummary[]> {
    return this.gqlQuery(
      graphId,
      ListLedgerEntitiesDocument,
      { source: options?.source ?? null },
      'List entities',
      (data) => data.entities
    )
  }

  /**
   * Update the entity for this graph. Only non-null fields are applied.
   * Returns the updated entity.
   */
  async updateEntity(graphId: string, updates: UpdateEntityRequest): Promise<LedgerEntity> {
    const envelope = await this.callOperation(
      'Update entity',
      opUpdateEntity({
        path: { graph_id: graphId },
        body: updates,
      })
    )
    return envelope.result as unknown as LedgerEntity
  }

  // ── Summary ────────────────────────────────────────────────────────

  /** Ledger rollup counts + QB sync metadata. */
  async getSummary(graphId: string): Promise<LedgerSummary | null> {
    return this.gqlQuery(
      graphId,
      GetLedgerSummaryDocument,
      undefined,
      'Get summary',
      (data) => data.summary
    )
  }

  // ── Accounts (Chart of Accounts) ───────────────────────────────────

  /** List CoA accounts with optional filters and pagination. */
  async listAccounts(
    graphId: string,
    options?: {
      classification?: string
      isActive?: boolean
      limit?: number
      offset?: number
    }
  ): Promise<LedgerAccountList | null> {
    return this.gqlQuery(
      graphId,
      ListLedgerAccountsDocument,
      {
        classification: options?.classification ?? null,
        isActive: options?.isActive ?? null,
        limit: options?.limit ?? 100,
        offset: options?.offset ?? 0,
      },
      'List accounts',
      (data) => data.accounts
    )
  }

  /** Hierarchical Chart of Accounts (up to 4 levels deep). */
  async getAccountTree(graphId: string): Promise<LedgerAccountTree | null> {
    return this.gqlQuery(
      graphId,
      GetLedgerAccountTreeDocument,
      undefined,
      'Get account tree',
      (data) => data.accountTree
    )
  }

  /** Accounts rolled up to reporting concepts via a mapping structure. */
  async getAccountRollups(
    graphId: string,
    options?: { mappingId?: string; startDate?: string; endDate?: string }
  ): Promise<LedgerAccountRollups | null> {
    return this.gqlQuery(
      graphId,
      GetLedgerAccountRollupsDocument,
      {
        mappingId: options?.mappingId ?? null,
        startDate: options?.startDate ?? null,
        endDate: options?.endDate ?? null,
      },
      'Get account rollups',
      (data) => data.accountRollups
    )
  }

  // ── Transactions ────────────────────────────────────────────────────

  /** List transactions with optional type + date filters and pagination. */
  async listTransactions(
    graphId: string,
    options?: {
      type?: string
      startDate?: string
      endDate?: string
      limit?: number
      offset?: number
    }
  ): Promise<LedgerTransactionList | null> {
    return this.gqlQuery(
      graphId,
      ListLedgerTransactionsDocument,
      {
        type: options?.type ?? null,
        startDate: options?.startDate ?? null,
        endDate: options?.endDate ?? null,
        limit: options?.limit ?? 100,
        offset: options?.offset ?? 0,
      },
      'List transactions',
      (data) => data.transactions
    )
  }

  /** Get transaction detail with entries + line items. */
  async getTransaction(graphId: string, transactionId: string): Promise<LedgerTransaction | null> {
    return this.gqlQuery(
      graphId,
      GetLedgerTransactionDocument,
      { transactionId },
      'Get transaction',
      (data) => data.transaction
    )
  }

  // ── Trial Balance ──────────────────────────────────────────────────

  /** Trial balance by raw CoA account. */
  async getTrialBalance(
    graphId: string,
    options?: { startDate?: string; endDate?: string }
  ): Promise<LedgerTrialBalance | null> {
    return this.gqlQuery(
      graphId,
      GetLedgerTrialBalanceDocument,
      {
        startDate: options?.startDate ?? null,
        endDate: options?.endDate ?? null,
      },
      'Get trial balance',
      (data) => data.trialBalance
    )
  }

  /** Trial balance rolled up to GAAP reporting concepts via a mapping. */
  async getMappedTrialBalance(
    graphId: string,
    mappingId: string,
    options?: { startDate?: string; endDate?: string }
  ): Promise<LedgerMappedTrialBalance | null> {
    return this.gqlQuery(
      graphId,
      GetLedgerMappedTrialBalanceDocument,
      {
        mappingId,
        startDate: options?.startDate ?? null,
        endDate: options?.endDate ?? null,
      },
      'Get mapped trial balance',
      (data) => data.mappedTrialBalance
    )
  }

  // ── Taxonomy ────────────────────────────────────────────────────────

  /** Get the locked US GAAP reporting taxonomy for this graph. */
  async getReportingTaxonomy(graphId: string): Promise<LedgerReportingTaxonomy | null> {
    return this.gqlQuery(
      graphId,
      GetLedgerReportingTaxonomyDocument,
      undefined,
      'Get reporting taxonomy',
      (data) => data.reportingTaxonomy
    )
  }

  /** List active taxonomies with optional type filter. */
  async listTaxonomies(
    graphId: string,
    options?: { taxonomyType?: string }
  ): Promise<LedgerTaxonomy[]> {
    const list = await this.gqlQuery(
      graphId,
      ListLedgerTaxonomiesDocument,
      { taxonomyType: options?.taxonomyType ?? null },
      'List taxonomies',
      (data) => data.taxonomies
    )
    return list?.taxonomies ?? []
  }

  /** Create a new taxonomy (used for CoA + mapping taxonomies). */
  async createTaxonomy(
    graphId: string,
    body: CreateTaxonomyRequest
  ): Promise<Record<string, unknown>> {
    const envelope = await this.callOperation(
      'Create taxonomy',
      opCreateTaxonomy({ path: { graph_id: graphId }, body })
    )
    return (envelope.result ?? {}) as Record<string, unknown>
  }

  /** Update mutable fields on a taxonomy. `taxonomy_type` is immutable. */
  async updateTaxonomy(
    graphId: string,
    body: UpdateTaxonomyRequest
  ): Promise<Record<string, unknown>> {
    const envelope = await this.callOperation(
      'Update taxonomy',
      opUpdateTaxonomy({ path: { graph_id: graphId }, body })
    )
    return (envelope.result ?? {}) as Record<string, unknown>
  }

  /** Soft-delete a taxonomy (`is_active=false`). */
  async deleteTaxonomy(graphId: string, taxonomyId: string): Promise<Record<string, unknown>> {
    const body: DeleteTaxonomyRequest = { taxonomy_id: taxonomyId }
    const envelope = await this.callOperation(
      'Delete taxonomy',
      opDeleteTaxonomy({ path: { graph_id: graphId }, body })
    )
    return (envelope.result ?? {}) as Record<string, unknown>
  }

  /**
   * Link the graph's entity to a taxonomy (ENTITY_HAS_TAXONOMY edge).
   * Idempotent — returns existing linkage if already present.
   */
  async linkEntityTaxonomy(
    graphId: string,
    body: LinkEntityTaxonomyRequest
  ): Promise<Record<string, unknown>> {
    const envelope = await this.callOperation(
      'Link entity taxonomy',
      opLinkEntityTaxonomy({ path: { graph_id: graphId }, body })
    )
    return (envelope.result ?? {}) as Record<string, unknown>
  }

  /** List elements (CoA accounts, GAAP concepts, etc.) with filters. */
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
  ): Promise<LedgerElementList | null> {
    return this.gqlQuery(
      graphId,
      ListLedgerElementsDocument,
      {
        taxonomyId: options?.taxonomyId ?? null,
        source: options?.source ?? null,
        classification: options?.classification ?? null,
        isAbstract: options?.isAbstract ?? null,
        limit: options?.limit ?? 100,
        offset: options?.offset ?? 0,
      },
      'List elements',
      (data) => data.elements
    )
  }

  /** CoA elements not yet mapped to a reporting concept. */
  async listUnmappedElements(
    graphId: string,
    options?: { mappingId?: string }
  ): Promise<LedgerUnmappedElement[]> {
    return this.gqlQuery(
      graphId,
      ListLedgerUnmappedElementsDocument,
      { mappingId: options?.mappingId ?? null },
      'List unmapped elements',
      (data) => data.unmappedElements
    )
  }

  /** Create a new element within a taxonomy (native CoA account, etc.). */
  async createElement(
    graphId: string,
    body: CreateElementRequest
  ): Promise<Record<string, unknown>> {
    const envelope = await this.callOperation(
      'Create element',
      opCreateElement({ path: { graph_id: graphId }, body })
    )
    return (envelope.result ?? {}) as Record<string, unknown>
  }

  /** Update mutable fields on an element. `taxonomy_id` and `source` are immutable. */
  async updateElement(
    graphId: string,
    body: UpdateElementRequest
  ): Promise<Record<string, unknown>> {
    const envelope = await this.callOperation(
      'Update element',
      opUpdateElement({ path: { graph_id: graphId }, body })
    )
    return (envelope.result ?? {}) as Record<string, unknown>
  }

  /** Soft-delete an element (`is_active=false`). */
  async deleteElement(graphId: string, elementId: string): Promise<Record<string, unknown>> {
    const body: DeleteElementRequest = { element_id: elementId }
    const envelope = await this.callOperation(
      'Delete element',
      opDeleteElement({ path: { graph_id: graphId }, body })
    )
    return (envelope.result ?? {}) as Record<string, unknown>
  }

  // ── Structures ──────────────────────────────────────────────────────

  /** List reporting structures (IS, BS, CF, schedules) with optional filters. */
  async listStructures(
    graphId: string,
    options?: { taxonomyId?: string; structureType?: string }
  ): Promise<LedgerStructure[]> {
    const list = await this.gqlQuery(
      graphId,
      ListLedgerStructuresDocument,
      {
        taxonomyId: options?.taxonomyId ?? null,
        structureType: options?.structureType ?? null,
      },
      'List structures',
      (data) => data.structures
    )
    return list?.structures ?? []
  }

  /**
   * Create a new structure. Most common use is a CoA→reporting mapping
   * structure; also used for custom statement + schedule structures.
   */
  async createStructure(graphId: string, body: CreateStructureRequest): Promise<LedgerMappingInfo> {
    const envelope = await this.callOperation(
      'Create structure',
      opCreateStructure({ path: { graph_id: graphId }, body })
    )
    return envelope.result as unknown as LedgerMappingInfo
  }

  /** Convenience wrapper — create a CoA→GAAP mapping structure. */
  async createMappingStructure(
    graphId: string,
    options?: {
      name?: string
      description?: string | null
      taxonomyId?: string
    }
  ): Promise<LedgerMappingInfo> {
    const body: CreateStructureRequest = {
      name: options?.name ?? 'CoA to Reporting',
      structure_type: 'coa_mapping',
      taxonomy_id: options?.taxonomyId ?? 'tax_usgaap_reporting',
      description: options?.description ?? 'Map Chart of Accounts to US GAAP reporting concepts',
    }
    const envelope = await this.callOperation(
      'Create mapping structure',
      opCreateStructure({ path: { graph_id: graphId }, body })
    )
    return envelope.result as unknown as LedgerMappingInfo
  }

  /** Update mutable fields on a structure. `structure_type` is immutable. */
  async updateStructure(
    graphId: string,
    body: UpdateStructureRequest
  ): Promise<Record<string, unknown>> {
    const envelope = await this.callOperation(
      'Update structure',
      opUpdateStructure({ path: { graph_id: graphId }, body })
    )
    return (envelope.result ?? {}) as Record<string, unknown>
  }

  /** Soft-delete a structure (`is_active=false`). */
  async deleteStructure(graphId: string, structureId: string): Promise<Record<string, unknown>> {
    const body: DeleteStructureRequest = { structure_id: structureId }
    const envelope = await this.callOperation(
      'Delete structure',
      opDeleteStructure({ path: { graph_id: graphId }, body })
    )
    return (envelope.result ?? {}) as Record<string, unknown>
  }

  // ── Mappings ────────────────────────────────────────────────────────

  /** List active CoA→reporting mapping structures. */
  async listMappings(graphId: string): Promise<LedgerMappingInfo[]> {
    const list = await this.gqlQuery(
      graphId,
      ListLedgerMappingsDocument,
      undefined,
      'List mappings',
      (data) => data.mappings
    )
    return list?.structures ?? []
  }

  /** Get a mapping structure with all its associations. */
  async getMapping(graphId: string, mappingId: string): Promise<LedgerMapping | null> {
    return this.gqlQuery(
      graphId,
      GetLedgerMappingDocument,
      { mappingId },
      'Get mapping',
      (data) => data.mapping
    )
  }

  /** Mapping coverage stats — how many CoA elements are mapped. */
  async getMappingCoverage(
    graphId: string,
    mappingId: string
  ): Promise<LedgerMappingCoverage | null> {
    return this.gqlQuery(
      graphId,
      GetLedgerMappingCoverageDocument,
      { mappingId },
      'Get mapping coverage',
      (data) => data.mappingCoverage
    )
  }

  /** Create a manual mapping association between two elements. */
  async createMappingAssociation(
    graphId: string,
    body: CreateMappingAssociationOperation
  ): Promise<Record<string, unknown>> {
    const envelope = await this.callOperation(
      'Create mapping association',
      opCreateMappingAssociation({ path: { graph_id: graphId }, body })
    )
    return (envelope.result ?? {}) as Record<string, unknown>
  }

  /** Delete a mapping association. */
  async deleteMappingAssociation(
    graphId: string,
    body: DeleteMappingAssociationOperation
  ): Promise<{ deleted: boolean }> {
    const envelope = await this.callOperation(
      'Delete mapping association',
      opDeleteMappingAssociation({ path: { graph_id: graphId }, body })
    )
    return (envelope.result ?? { deleted: true }) as { deleted: boolean }
  }

  /**
   * Trigger the AI MappingAgent. Returns the operation id — async; the
   * agent runs in the background. Consumers can subscribe to progress
   * via `/v1/operations/{operationId}/stream`.
   */
  async autoMapElements(
    graphId: string,
    body: AutoMapElementsOperation
  ): Promise<{ operationId: string; status: OperationEnvelope['status'] }> {
    const envelope = await this.callOperation(
      'Auto-map elements',
      opAutoMapElements({ path: { graph_id: graphId }, body })
    )
    return { operationId: envelope.operationId, status: envelope.status }
  }

  /** Bulk create associations within a single structure, atomically. */
  async createAssociations(
    graphId: string,
    structureId: string,
    associations: BulkAssociationItem[]
  ): Promise<Record<string, unknown>> {
    const body: BulkCreateAssociationsRequest = { structure_id: structureId, associations }
    const envelope = await this.callOperation(
      'Create associations',
      opCreateAssociations({ path: { graph_id: graphId }, body })
    )
    return (envelope.result ?? {}) as Record<string, unknown>
  }

  /** Update mutable fields on an association (order, weight, confidence). */
  async updateAssociation(
    graphId: string,
    body: UpdateAssociationRequest
  ): Promise<Record<string, unknown>> {
    const envelope = await this.callOperation(
      'Update association',
      opUpdateAssociation({ path: { graph_id: graphId }, body })
    )
    return (envelope.result ?? {}) as Record<string, unknown>
  }

  /** Hard-delete an association (any type: presentation, calculation, mapping). */
  async deleteAssociation(graphId: string, associationId: string): Promise<{ deleted: boolean }> {
    const body: DeleteAssociationRequest = { association_id: associationId }
    const envelope = await this.callOperation(
      'Delete association',
      opDeleteAssociation({ path: { graph_id: graphId }, body })
    )
    return (envelope.result ?? { deleted: true }) as { deleted: boolean }
  }

  // ── Schedules ──────────────────────────────────────────────────────

  /** List all schedule structures with metadata. */
  async listSchedules(graphId: string): Promise<LedgerSchedule[]> {
    const list = await this.gqlQuery(
      graphId,
      ListLedgerSchedulesDocument,
      undefined,
      'List schedules',
      (data) => data.schedules
    )
    return list?.schedules ?? []
  }

  /** Schedule facts optionally filtered by period window. */
  async getScheduleFacts(
    graphId: string,
    structureId: string,
    options?: { periodStart?: string; periodEnd?: string }
  ): Promise<LedgerScheduleFact[]> {
    const facts = await this.gqlQuery(
      graphId,
      GetLedgerScheduleFactsDocument,
      {
        structureId,
        periodStart: options?.periodStart ?? null,
        periodEnd: options?.periodEnd ?? null,
      },
      'Get schedule facts',
      (data) => data.scheduleFacts
    )
    return facts?.facts ?? []
  }

  /** Create a new schedule with pre-generated monthly facts. */
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
    const envelope = await this.callOperation(
      'Create schedule',
      opCreateSchedule({ path: { graph_id: graphId }, body })
    )
    const raw = envelope.result as unknown as RawScheduleCreatedResult
    return {
      structureId: raw.structure_id,
      name: raw.name,
      taxonomyId: raw.taxonomy_id,
      totalPeriods: raw.total_periods,
      totalFacts: raw.total_facts,
    }
  }

  /** Update mutable fields on a schedule (name, entry_template, metadata). */
  async updateSchedule(
    graphId: string,
    body: UpdateScheduleRequest
  ): Promise<Record<string, unknown>> {
    const envelope = await this.callOperation(
      'Update schedule',
      opUpdateSchedule({ path: { graph_id: graphId }, body })
    )
    return (envelope.result ?? {}) as Record<string, unknown>
  }

  /** Permanently delete a schedule (cascades through facts + associations). */
  async deleteSchedule(graphId: string, structureId: string): Promise<{ deleted: boolean }> {
    const body: DeleteScheduleRequest = { structure_id: structureId }
    const envelope = await this.callOperation(
      'Delete schedule',
      opDeleteSchedule({ path: { graph_id: graphId }, body })
    )
    return (envelope.result ?? { deleted: true }) as { deleted: boolean }
  }

  /** Truncate a schedule — end it early at `newEndDate`. */
  async truncateSchedule(
    graphId: string,
    structureId: string,
    options: TruncateScheduleOptions
  ): Promise<TruncateScheduleResult> {
    const body: TruncateScheduleOperation = {
      structure_id: structureId,
      new_end_date: options.newEndDate,
      reason: options.reason,
    }
    const envelope = await this.callOperation(
      'Truncate schedule',
      opTruncateSchedule({ path: { graph_id: graphId }, body })
    )
    const raw = envelope.result as unknown as RawTruncateScheduleResult
    return {
      structureId: raw.structure_id,
      newEndDate: raw.new_end_date,
      factsDeleted: raw.facts_deleted,
      reason: raw.reason,
    }
  }

  // ── Period close ────────────────────────────────────────────────────

  /** Close status for all schedules in a fiscal period. */
  async getPeriodCloseStatus(
    graphId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<LedgerPeriodCloseStatus | null> {
    return this.gqlQuery(
      graphId,
      GetLedgerPeriodCloseStatusDocument,
      { periodStart, periodEnd },
      'Get period close status',
      (data) => data.periodCloseStatus
    )
  }

  /** All draft entries in a period, fully expanded for review pre-close. */
  async listPeriodDrafts(graphId: string, period: string): Promise<LedgerPeriodDrafts | null> {
    return this.gqlQuery(
      graphId,
      GetLedgerPeriodDraftsDocument,
      { period },
      'List period drafts',
      (data) => data.periodDrafts
    )
  }

  /**
   * Idempotently create (or refresh) a draft closing entry from a
   * schedule for a period. See `ClosingEntryOutcome` for semantics.
   */
  async createClosingEntry(
    graphId: string,
    structureId: string,
    postingDate: string,
    periodStart: string,
    periodEnd: string,
    memo?: string
  ): Promise<ClosingEntry> {
    const body: CreateClosingEntryOperation = {
      structure_id: structureId,
      posting_date: postingDate,
      period_start: periodStart,
      period_end: periodEnd,
      memo: memo ?? undefined,
    }
    const envelope = await this.callOperation(
      'Create closing entry',
      opCreateClosingEntry({ path: { graph_id: graphId }, body })
    )
    return rawToClosingEntry(envelope.result as unknown as RawClosingEntryResult)
  }

  /**
   * Create a manual balanced closing entry (not tied to a schedule).
   * Used for disposals, adjustments, and one-off closing events.
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
    const envelope = await this.callOperation(
      'Create manual closing entry',
      opCreateManualClosingEntry({ path: { graph_id: graphId }, body })
    )
    return rawToClosingEntry(envelope.result as unknown as RawClosingEntryResult)
  }

  // ── Closing book ───────────────────────────────────────────────────

  /** Grouped closing book structures for the close-screen sidebar. */
  async getClosingBookStructures(graphId: string): Promise<LedgerClosingBookStructures | null> {
    return this.gqlQuery(
      graphId,
      GetLedgerClosingBookStructuresDocument,
      undefined,
      'Get closing book structures',
      (data) => data.closingBookStructures
    )
  }

  // ── Fiscal Calendar ────────────────────────────────────────────────

  /** Current fiscal calendar state — pointers, gap, closeable status. */
  async getFiscalCalendar(graphId: string): Promise<LedgerFiscalCalendar | null> {
    return this.gqlQuery(
      graphId,
      GetLedgerFiscalCalendarDocument,
      undefined,
      'Get fiscal calendar',
      (data) => data.fiscalCalendar
    )
  }

  /** One-time ledger initialization — seed fiscal calendar + periods. */
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
    const envelope = await this.callOperation(
      'Initialize ledger',
      opInitializeLedger({ path: { graph_id: graphId }, body })
    )
    const raw = envelope.result as unknown as RawInitializeLedgerResult
    return {
      fiscalCalendar: rawFiscalCalendarToCamel(raw.fiscal_calendar),
      periodsCreated: raw.periods_created ?? 0,
      warnings: raw.warnings ?? [],
    }
  }

  /** Set the user-controlled close target (YYYY-MM). */
  async setCloseTarget(
    graphId: string,
    period: string,
    note?: string | null
  ): Promise<LedgerFiscalCalendar> {
    const body: SetCloseTargetOperation = { period, note: note ?? null }
    const envelope = await this.callOperation(
      'Set close target',
      opSetCloseTarget({ path: { graph_id: graphId }, body })
    )
    return rawFiscalCalendarToCamel(envelope.result as unknown as RawFiscalCalendar)
  }

  /** Close a fiscal period — the final commit action. */
  async closePeriod(
    graphId: string,
    period: string,
    options?: ClosePeriodOptions
  ): Promise<ClosePeriodResult> {
    const body: ClosePeriodOperation = {
      period,
      note: options?.note ?? null,
      allow_stale_sync: options?.allowStaleSync,
    }
    const envelope = await this.callOperation(
      'Close period',
      opClosePeriod({ path: { graph_id: graphId }, body })
    )
    const raw = envelope.result as unknown as RawClosePeriodResult
    return {
      period: raw.period,
      entriesPosted: raw.entries_posted ?? 0,
      targetAutoAdvanced: raw.target_auto_advanced ?? false,
      fiscalCalendar: rawFiscalCalendarToCamel(raw.fiscal_calendar),
    }
  }

  /** Reopen a closed fiscal period. Requires a reason for the audit log. */
  async reopenPeriod(
    graphId: string,
    period: string,
    reason: string,
    note?: string | null
  ): Promise<LedgerFiscalCalendar> {
    const body: ReopenPeriodOperation = {
      period,
      reason,
      note: note ?? null,
    }
    const envelope = await this.callOperation(
      'Reopen period',
      opReopenPeriod({ path: { graph_id: graphId }, body })
    )
    return rawFiscalCalendarToCamel(envelope.result as unknown as RawFiscalCalendar)
  }

  // ── Journal entries (native accounting writes) ──────────────────────

  /**
   * Create a journal entry with balanced line items (DR=CR enforced).
   *
   * Defaults to `status='draft'`. Pass `status='posted'` for historical
   * data import where entries represent already-happened business events.
   *
   * Supply `idempotencyKey` to make the call safe to retry — replays
   * within 24 hours return the same envelope. Reusing the key with a
   * different body returns HTTP 409.
   */
  async createJournalEntry(
    graphId: string,
    options: CreateJournalEntryOptions
  ): Promise<Record<string, unknown>> {
    const body: CreateJournalEntryRequest = {
      posting_date: options.postingDate,
      memo: options.memo,
      line_items: options.lineItems.map(
        (li): JournalEntryLineItemInput => ({
          element_id: li.elementId,
          debit_amount: li.debitAmount,
          credit_amount: li.creditAmount,
          description: li.description ?? null,
        })
      ),
      type: options.type,
      status: options.status,
      transaction_id: options.transactionId ?? null,
    }
    const envelope = await this.callOperation(
      'Create journal entry',
      opCreateJournalEntry({ path: { graph_id: graphId }, body })
    )
    return (envelope.result ?? {}) as Record<string, unknown>
  }

  /** Update a draft journal entry. Posted entries are immutable. */
  async updateJournalEntry(
    graphId: string,
    body: UpdateJournalEntryRequest
  ): Promise<Record<string, unknown>> {
    const envelope = await this.callOperation(
      'Update journal entry',
      opUpdateJournalEntry({ path: { graph_id: graphId }, body })
    )
    return (envelope.result ?? {}) as Record<string, unknown>
  }

  /** Hard-delete a draft journal entry. Posted entries must be reversed. */
  async deleteJournalEntry(graphId: string, entryId: string): Promise<{ deleted: boolean }> {
    const body: DeleteJournalEntryRequest = { entry_id: entryId }
    const envelope = await this.callOperation(
      'Delete journal entry',
      opDeleteJournalEntry({ path: { graph_id: graphId }, body })
    )
    return (envelope.result ?? { deleted: true }) as { deleted: boolean }
  }

  /**
   * Reverse a posted journal entry — creates an offsetting entry and marks
   * the original as reversed.
   */
  async reverseJournalEntry(
    graphId: string,
    entryId: string,
    options?: { postingDate?: string | null; memo?: string | null }
  ): Promise<Record<string, unknown>> {
    const body: ReverseJournalEntryRequest = {
      entry_id: entryId,
      posting_date: options?.postingDate ?? null,
      memo: options?.memo ?? null,
    }
    const envelope = await this.callOperation(
      'Reverse journal entry',
      opReverseJournalEntry({ path: { graph_id: graphId }, body })
    )
    return (envelope.result ?? {}) as Record<string, unknown>
  }

  // ── Fact grid (graph-backed analytical query) ─────────────────────

  /**
   * Build a multi-dimensional fact grid against the graph schema.
   *
   * Runs against LadybugDB (not the extensions OLTP database) and returns
   * a deduplicated pivot table of XBRL facts. Works for both roboledger
   * tenant graphs (after materialization) and the SEC shared repository.
   */
  async buildFactGrid(graphId: string, body: CreateViewRequest): Promise<Record<string, unknown>> {
    const envelope = await this.callOperation(
      'Build fact grid',
      opBuildFactGrid({ path: { graph_id: graphId }, body })
    )
    return (envelope.result ?? {}) as Record<string, unknown>
  }

  // Reports, statements, and publish lists live on `ReportClient`.

  // ── Internal helpers ────────────────────────────────────────────────

  /**
   * Run a typed GraphQL query against the per-graph endpoint and
   * translate ClientError into a readable facade error.
   */
  private async gqlQuery<TData, TVars extends object, TResult>(
    graphId: string,
    document: TypedDocumentNode<TData, TVars>,
    variables: TVars | undefined,
    label: string,
    pick: (data: TData) => TResult
  ): Promise<TResult> {
    try {
      const client = this.gql.get(graphId)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = client.request as (doc: unknown, vars?: unknown) => Promise<any>
      // graphql-request's overloads don't cleanly resolve for generic
      // helpers wrapping codegen's `Exact<>` var types, so we bypass
      // the typed overload with a narrow cast of `request` itself.
      const data = (await raw.call(client, document, variables)) as TData
      return pick(data)
    } catch (err) {
      if (err instanceof ClientError) {
        throw new Error(`${label} failed: ${JSON.stringify(err.response.errors ?? err.message)}`)
      }
      throw err
    }
  }

  /**
   * Await an SDK-generated `opXxx(...)` call, throw a readable error on
   * non-2xx, and return the `OperationEnvelope` on success.
   */
  private async callOperation(
    label: string,
    call: Promise<{ data?: OperationEnvelope; error?: unknown }>
  ): Promise<OperationEnvelope> {
    const response = await call
    if (response.error !== undefined) {
      throw new Error(`${label} failed: ${JSON.stringify(response.error)}`)
    }
    if (response.data === undefined) {
      throw new Error(`${label} failed: empty response`)
    }
    return response.data
  }
}

// ── Module-private conversion helpers ─────────────────────────────────

function rawToClosingEntry(data: RawClosingEntryResult): ClosingEntry {
  return {
    outcome: data.outcome,
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

function rawFiscalCalendarToCamel(raw: RawFiscalCalendar): LedgerFiscalCalendar {
  return {
    graphId: raw.graph_id,
    fiscalYearStartMonth: raw.fiscal_year_start_month,
    closedThrough: raw.closed_through ?? null,
    closeTarget: raw.close_target ?? null,
    gapPeriods: raw.gap_periods ?? 0,
    catchUpSequence: raw.catch_up_sequence ?? [],
    closeableNow: raw.closeable_now ?? false,
    blockers: raw.blockers ?? [],
    lastCloseAt: raw.last_close_at ?? null,
    initializedAt: raw.initialized_at ?? null,
    lastSyncAt: raw.last_sync_at ?? null,
    periods: (raw.periods ?? []).map((p) => ({
      name: p.name,
      startDate: p.start_date,
      endDate: p.end_date,
      status: p.status,
      closedAt: p.closed_at ?? null,
    })),
  }
}
