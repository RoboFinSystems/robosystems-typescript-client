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
  opAddPublishListMembers,
  opAutoMapElements,
  opBuildFactGrid,
  opClosePeriod,
  opCreateAgent,
  opCreateEventBlock,
  opCreateEventHandler,
  opCreateInformationBlock,
  opCreateMappingAssociation,
  opCreatePublishList,
  opCreateReport,
  opCreateTaxonomyBlock,
  opDeleteInformationBlock,
  opDeleteJournalEntry,
  opDeleteMappingAssociation,
  opDeletePublishList,
  opDeleteReport,
  opDeleteTaxonomyBlock,
  opEvaluateRules,
  opFileReport,
  opFinancialStatementAnalysis,
  opInitializeLedger,
  opLinkEntityTaxonomy,
  opLiveFinancialStatement,
  opPreviewEventBlock,
  opRegenerateReport,
  opRemovePublishListMember,
  opReopenPeriod,
  opSetCloseTarget,
  opShareReport,
  opTransitionFilingStatus,
  opUpdateAgent,
  opUpdateEntity,
  opUpdateEventBlock,
  opUpdateEventHandler,
  opUpdateInformationBlock,
  opUpdateJournalEntry,
  opUpdatePublishList,
  opUpdateTaxonomyBlock,
} from '../sdk/sdk.gen'
import type {
  AddPublishListMembersOperation,
  AssociationResponse,
  AutoMapElementsOperation,
  ClosePeriodOperation,
  CreateAgentRequest,
  CreateEventBlockRequest,
  CreateEventHandlerRequest,
  CreateInformationBlockRequest,
  CreateMappingAssociationOperation,
  CreatePublishListRequest,
  CreateReportRequest,
  CreateTaxonomyBlockRequest,
  CreateViewRequest,
  DeleteInformationBlockRequest,
  DeleteInformationBlockResponse,
  DeleteJournalEntryRequest,
  DeleteMappingAssociationOperation,
  DeleteResult,
  DeleteTaxonomyBlockRequest,
  DeleteTaxonomyBlockResponse,
  EntityTaxonomyResponse,
  EvaluateRulesRequest,
  EvaluateRulesResponse,
  EventBlockEnvelope,
  EventHandlerResponse,
  FileReportRequest,
  FinancialStatementAnalysisRequest,
  InformationBlockEnvelope,
  InitializeLedgerRequest,
  JournalEntryResponse,
  LedgerAgentResponse,
  LinkEntityTaxonomyRequest,
  LiveFinancialStatementRequest,
  OperationEnvelope,
  PreviewEventBlockResponse,
  PublishListMemberResponse,
  PublishListResponse,
  ReopenPeriodOperation,
  ReportResponse,
  SetCloseTargetOperation,
  ShareReportResponse,
  TaxonomyBlockEnvelope,
  TransitionFilingStatusRequest,
  UpdateAgentRequest,
  UpdateEntityRequest,
  UpdateEventBlockRequest,
  UpdateEventHandlerRequest,
  UpdateInformationBlockRequest,
  UpdateJournalEntryRequest,
  UpdatePublishListOperation,
  UpdateTaxonomyBlockRequest,
} from '../sdk/types.gen'
import type { TokenProvider } from './graphql/client'
import { GraphQLClientCache } from './graphql/client'
import {
  GetInformationBlockDocument,
  GetLedgerAccountRollupsDocument,
  GetLedgerAccountTreeDocument,
  GetLedgerAgentDocument,
  GetLedgerClosingBookStructuresDocument,
  GetLedgerEntityDocument,
  GetLedgerEventBlockDocument,
  GetLedgerFiscalCalendarDocument,
  GetLedgerMappedTrialBalanceDocument,
  GetLedgerMappingCoverageDocument,
  GetLedgerMappingDocument,
  GetLedgerPeriodCloseStatusDocument,
  GetLedgerPeriodDraftsDocument,
  GetLedgerPublishListDocument,
  GetLedgerReportDocument,
  GetLedgerReportingTaxonomyDocument,
  GetLedgerReportPackageDocument,
  GetLedgerStatementDocument,
  GetLedgerSummaryDocument,
  GetLedgerTransactionDocument,
  GetLedgerTrialBalanceDocument,
  ListInformationBlocksDocument,
  ListLedgerAccountsDocument,
  ListLedgerAgentsDocument,
  ListLedgerElementsDocument,
  ListLedgerEntitiesDocument,
  ListLedgerEventBlocksDocument,
  ListLedgerMappingsDocument,
  ListLedgerPublishListsDocument,
  ListLedgerReportsDocument,
  ListLedgerStructuresDocument,
  ListLedgerTaxonomiesDocument,
  ListLedgerTransactionsDocument,
  ListLedgerUnmappedElementsDocument,
  type GetInformationBlockQuery,
  type GetLedgerAccountRollupsQuery,
  type GetLedgerAccountTreeQuery,
  type GetLedgerAgentQuery,
  type GetLedgerClosingBookStructuresQuery,
  type GetLedgerEntityQuery,
  type GetLedgerEventBlockQuery,
  type GetLedgerFiscalCalendarQuery,
  type GetLedgerMappedTrialBalanceQuery,
  type GetLedgerMappingCoverageQuery,
  type GetLedgerMappingQuery,
  type GetLedgerPeriodCloseStatusQuery,
  type GetLedgerPeriodDraftsQuery,
  type GetLedgerPublishListQuery,
  type GetLedgerReportingTaxonomyQuery,
  type GetLedgerReportPackageQuery,
  type GetLedgerReportQuery,
  type GetLedgerStatementQuery,
  type GetLedgerSummaryQuery,
  type GetLedgerTransactionQuery,
  type GetLedgerTrialBalanceQuery,
  type ListInformationBlocksQuery,
  type ListLedgerAccountsQuery,
  type ListLedgerAgentsQuery,
  type ListLedgerElementsQuery,
  type ListLedgerEntitiesQuery,
  type ListLedgerEventBlocksQuery,
  type ListLedgerMappingsQuery,
  type ListLedgerPublishListsQuery,
  type ListLedgerReportsQuery,
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

export type LedgerEventBlock = ListLedgerEventBlocksQuery['eventBlocks'][number]
export type LedgerEventBlockDetail = NonNullable<GetLedgerEventBlockQuery['eventBlock']>

export type LedgerAgent = ListLedgerAgentsQuery['agents'][number]
export type LedgerAgentDetail = NonNullable<GetLedgerAgentQuery['agent']>

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

export type InformationBlock = NonNullable<GetInformationBlockQuery['informationBlock']>
export type InformationBlockList = ListInformationBlocksQuery['informationBlocks']
export type InformationBlockElement = InformationBlock['elements'][number]
export type InformationBlockConnection = InformationBlock['connections'][number]
export type InformationBlockFact = InformationBlock['facts'][number]

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

// Reports + publish lists + statements
export type Report = NonNullable<GetLedgerReportQuery['report']>
export type ReportPackage = NonNullable<GetLedgerReportPackageQuery['reportPackage']>
export type ReportPackageItem = ReportPackage['items'][number]
export type ReportListItem = NonNullable<ListLedgerReportsQuery['reports']>['reports'][number]
export type StatementData = NonNullable<GetLedgerStatementQuery['statement']>
export type StatementPeriod = StatementData['periods'][number]
export type StatementRow = StatementData['rows'][number]

export type PublishList = NonNullable<
  ListLedgerPublishListsQuery['publishLists']
>['publishLists'][number]
export type PublishListDetail = NonNullable<GetLedgerPublishListQuery['publishList']>
export type PublishListMember = PublishListDetail['members'][number]

export interface PeriodSpecInput {
  start: string
  end: string
  label: string
}

export interface CreateReportOptions {
  name: string
  mappingId: string
  periodStart: string
  periodEnd: string
  taxonomyId?: string
  periodType?: string
  comparative?: boolean
  periods?: PeriodSpecInput[]
}

/**
 * Wrapper returned by report write methods — pairs the audit-side
 * envelope fields (`operationId`, `status`) with the typed result
 * payload. Generic on ``T`` so each method advertises its specific
 * result type (e.g. ``ReportResponse`` for creates, ``DeleteResult``
 * for deletes).
 */
export interface ReportOperationAck<T = unknown> {
  operationId: string
  status: OperationEnvelope['status']
  result: T | null
}

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
  // §3.8 — auto-run rules on close. `null` when no schedules with facts
  // in the period had rules attached. Otherwise a status-keyed tally.
  rule_summary?: Record<string, number> | null
  // ids of schedule Structures whose rules were evaluated during the
  // close. Empty when `rule_summary` is null.
  evaluated_structure_ids?: string[]
}

interface RawScheduleCreatedResult {
  structure_id: string
  name: string
  taxonomy_id: string
  total_periods: number
  total_facts: number
  // §3.8 — populated when create_schedule (or update_schedule on a
  // template change) re-runs the rule engine. Otherwise null.
  rule_summary?: Record<string, number> | null
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
  /**
   * §3.8 — aggregated rule-eval outcome across every schedule Structure
   * with facts in the closed period. Keys: `pass` / `fail` / `error` /
   * `skipped`. `null` when no schedules had facts in the period.
   */
  ruleSummary: Record<string, number> | null
  /** ids of schedule Structures whose rules were evaluated. */
  evaluatedStructureIds: string[]
}

export interface ScheduleCreated {
  structureId: string
  name: string
  taxonomyId: string
  totalPeriods: number
  totalFacts: number
  /**
   * §3.8 — populated when create_schedule (or update_schedule on a
   * template change) re-runs the rule engine. Keys: `pass` / `fail` /
   * `error` / `skipped`. `null` when no rules were re-evaluated.
   */
  ruleSummary: Record<string, number> | null
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
  /**
   * Who fired the event. Defaults to `'manual'` (user-initiated journal
   * entry). Sync adapters (QuickBooks, Plaid, etc.) override with their
   * adapter name. Must match the server's CHECK constraint set:
   * `manual | schedule | system | quickbooks | xero | plaid`.
   */
  source?: string
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

  // ── Event Blocks (Inbox) ────────────────────────────────────────────

  /**
   * List captured event blocks for the inbox surface.
   *
   * Pass `status: 'captured'` for the default un-reviewed view. Use
   * `eventType` filters like `'invoice_issued'` / `'bill_received'` to
   * narrow by source class. Approve/reject via `updateEventBlock`.
   */
  async listEventBlocks(
    graphId: string,
    options?: {
      eventType?: string
      eventCategory?: string
      status?: string
      agentId?: string
      source?: string
      limit?: number
      offset?: number
    }
  ): Promise<LedgerEventBlock[]> {
    return this.gqlQuery(
      graphId,
      ListLedgerEventBlocksDocument,
      {
        eventType: options?.eventType ?? null,
        eventCategory: options?.eventCategory ?? null,
        status: options?.status ?? null,
        agentId: options?.agentId ?? null,
        source: options?.source ?? null,
        limit: options?.limit ?? 50,
        offset: options?.offset ?? 0,
      },
      'List event blocks',
      (data) => data.eventBlocks
    )
  }

  /** Get event block detail (carries the metadata blob with nested entries). */
  async getEventBlock(graphId: string, eventId: string): Promise<LedgerEventBlockDetail | null> {
    return this.gqlQuery(
      graphId,
      GetLedgerEventBlockDocument,
      { id: eventId },
      'Get event block',
      (data) => data.eventBlock
    )
  }

  // ── Agents (REA counterparties) ─────────────────────────────────────

  /**
   * List agents — REA-aligned counterparties (customers, vendors,
   * employees). Defaults to active agents only; pass `isActive: null`
   * to include deactivated ones.
   */
  async listAgents(
    graphId: string,
    options?: {
      agentType?: string
      source?: string
      isActive?: boolean | null
      limit?: number
      offset?: number
    }
  ): Promise<LedgerAgent[]> {
    return this.gqlQuery(
      graphId,
      ListLedgerAgentsDocument,
      {
        agentType: options?.agentType ?? null,
        source: options?.source ?? null,
        isActive: options?.isActive === undefined ? true : options.isActive,
        limit: options?.limit ?? 50,
        offset: options?.offset ?? 0,
      },
      'List agents',
      (data) => data.agents
    )
  }

  /** Get agent detail by id. */
  async getAgent(graphId: string, agentId: string): Promise<LedgerAgentDetail | null> {
    return this.gqlQuery(
      graphId,
      GetLedgerAgentDocument,
      { id: agentId },
      'Get agent',
      (data) => data.agent
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

  /**
   * Link the graph's entity to a taxonomy (ENTITY_HAS_TAXONOMY edge).
   * Idempotent — returns existing linkage if already present.
   */
  async linkEntityTaxonomy(
    graphId: string,
    body: LinkEntityTaxonomyRequest
  ): Promise<EntityTaxonomyResponse> {
    const envelope = await this.callOperation(
      'Link entity taxonomy',
      opLinkEntityTaxonomy({ path: { graph_id: graphId }, body })
    )
    return this.requireResult('Link entity taxonomy', envelope.result)
  }

  /**
   * Create a taxonomy block atomically (taxonomy + structures + elements +
   * associations + rules in one envelope).
   */
  async createTaxonomyBlock(
    graphId: string,
    body: CreateTaxonomyBlockRequest,
    idempotencyKey?: string
  ): Promise<TaxonomyBlockEnvelope> {
    const headers = idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined
    const envelope = await this.callOperation(
      'Create taxonomy block',
      opCreateTaxonomyBlock({ path: { graph_id: graphId }, body, headers })
    )
    return this.requireResult('Create taxonomy block', envelope.result)
  }

  /** Update a taxonomy block — add/update/remove elements, structures, associations, or rules. */
  async updateTaxonomyBlock(
    graphId: string,
    body: UpdateTaxonomyBlockRequest
  ): Promise<TaxonomyBlockEnvelope> {
    const envelope = await this.callOperation(
      'Update taxonomy block',
      opUpdateTaxonomyBlock({ path: { graph_id: graphId }, body })
    )
    return this.requireResult('Update taxonomy block', envelope.result)
  }

  /** Delete a taxonomy block. Cascades through elements, structures, and associations. */
  async deleteTaxonomyBlock(
    graphId: string,
    body: DeleteTaxonomyBlockRequest
  ): Promise<DeleteTaxonomyBlockResponse> {
    const envelope = await this.callOperation(
      'Delete taxonomy block',
      opDeleteTaxonomyBlock({ path: { graph_id: graphId }, body })
    )
    return (envelope.result ?? { deleted: true }) as DeleteTaxonomyBlockResponse
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
  ): Promise<AssociationResponse> {
    const envelope = await this.callOperation(
      'Create mapping association',
      opCreateMappingAssociation({ path: { graph_id: graphId }, body })
    )
    return this.requireResult('Create mapping association', envelope.result)
  }

  /** Delete a mapping association. */
  async deleteMappingAssociation(
    graphId: string,
    body: DeleteMappingAssociationOperation
  ): Promise<DeleteResult> {
    const envelope = await this.callOperation(
      'Delete mapping association',
      opDeleteMappingAssociation({ path: { graph_id: graphId }, body })
    )
    return (envelope.result ?? { deleted: true }) as DeleteResult
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

  // ── Information Blocks ─────────────────────────────────────────────

  /**
   * Fetch an Information Block envelope by id — the generic
   * cross-block-type read. Returns `null` when the block doesn't exist
   * (or its type isn't registered). See `information-block.md`.
   */
  async getInformationBlock(graphId: string, id: string): Promise<InformationBlock | null> {
    const block = await this.gqlQuery(
      graphId,
      GetInformationBlockDocument,
      { id },
      'Get information block',
      (data) => data.informationBlock ?? null
    )
    return block ?? null
  }

  /**
   * List Information Block envelopes with optional block_type + category
   * filters. Replaces the old `listSchedules` method — callers use
   * `{blockType: 'schedule'}` to get the same set of blocks.
   */
  async listInformationBlocks(
    graphId: string,
    options?: {
      blockType?: string
      category?: string
      limit?: number
      offset?: number
    }
  ): Promise<InformationBlockList> {
    const blocks = await this.gqlQuery(
      graphId,
      ListInformationBlocksDocument,
      {
        blockType: options?.blockType ?? null,
        category: options?.category ?? null,
        limit: options?.limit ?? null,
        offset: options?.offset ?? null,
      },
      'List information blocks',
      (data) => data.informationBlocks
    )
    return blocks ?? []
  }

  // ── Schedules ──────────────────────────────────────────────────────

  /** Create a new schedule with pre-generated monthly facts. */
  async createSchedule(graphId: string, options: CreateScheduleOptions): Promise<ScheduleCreated> {
    const body: CreateInformationBlockRequest = {
      block_type: 'schedule',
      payload: {
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
      },
    }
    const envelope = await this.callOperation(
      'Create schedule',
      opCreateInformationBlock({ path: { graph_id: graphId }, body })
    )
    const raw = envelope.result as unknown as RawScheduleCreatedResult
    return {
      structureId: raw.structure_id,
      name: raw.name,
      taxonomyId: raw.taxonomy_id,
      totalPeriods: raw.total_periods,
      totalFacts: raw.total_facts,
      ruleSummary: raw.rule_summary ?? null,
    }
  }

  /** Update mutable fields on a schedule (name, entry_template, metadata). */
  async updateSchedule(
    graphId: string,
    structureId: string,
    options: { name?: string }
  ): Promise<InformationBlockEnvelope> {
    const body: UpdateInformationBlockRequest = {
      block_type: 'schedule',
      payload: { structure_id: structureId, ...options },
    }
    const envelope = await this.callOperation(
      'Update schedule',
      opUpdateInformationBlock({ path: { graph_id: graphId }, body })
    )
    return this.requireResult('Update schedule', envelope.result)
  }

  /** Permanently delete a schedule (cascades through facts + associations). */
  async deleteSchedule(
    graphId: string,
    structureId: string
  ): Promise<DeleteInformationBlockResponse> {
    const body: DeleteInformationBlockRequest = {
      block_type: 'schedule',
      payload: { structure_id: structureId },
    }
    const envelope = await this.callOperation(
      'Delete schedule',
      opDeleteInformationBlock({ path: { graph_id: graphId }, body })
    )
    return (envelope.result ?? { deleted: true }) as DeleteInformationBlockResponse
  }

  /**
   * Dispose of a schedule asset — atomically truncates forward facts,
   * deletes the SumEquals rule, and posts a balanced disposal entry.
   *
   * Routes through `create-event-block` with `event_type='asset_disposed'`.
   * `occurred_at` is required and represents the disposal date.
   * `source` defaults to `'manual'` (user-initiated disposal); sync
   * adapters override.
   */
  async disposeSchedule(
    graphId: string,
    options: {
      scheduleId: string
      occurredAt: string
      proceeds?: number
      proceedsElementId?: string | null
      gainLossElementId?: string | null
      memo?: string | null
      reason?: string
      source?: string
    }
  ): Promise<EventBlockEnvelope> {
    const body: CreateEventBlockRequest = {
      event_type: 'asset_disposed',
      event_category: 'adjustment',
      source: options.source ?? 'manual',
      occurred_at: options.occurredAt,
      apply_handlers: true,
      metadata: {
        schedule_id: options.scheduleId,
        proceeds: options.proceeds ?? 0,
        proceeds_element_id: options.proceedsElementId ?? null,
        gain_loss_element_id: options.gainLossElementId ?? null,
        memo: options.memo ?? null,
        reason: options.reason ?? 'asset_disposed_event',
      },
    }
    const envelope = await this.callOperation(
      'Dispose schedule',
      opCreateEventBlock({ path: { graph_id: graphId }, body })
    )
    return this.requireResult('Dispose schedule', envelope.result)
  }

  /** Evaluate taxonomy rules against facts in a structure. */
  async evaluateRules(graphId: string, body: EvaluateRulesRequest): Promise<EvaluateRulesResponse> {
    const envelope = await this.callOperation(
      'Evaluate rules',
      opEvaluateRules({ path: { graph_id: graphId }, body })
    )
    return this.requireResult('Evaluate rules', envelope.result)
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
   * schedule for a period.
   *
   * Routes through `create-event-block` with
   * `event_type='schedule_entry_due'`. Returns the EventBlockEnvelope —
   * the underlying handler is idempotent and dispatches to one of
   * created / unchanged / regenerated / removed / skipped internally.
   */
  async createClosingEntry(
    graphId: string,
    structureId: string,
    postingDate: string,
    periodStart: string,
    periodEnd: string,
    memo?: string
  ): Promise<EventBlockEnvelope> {
    const body: CreateEventBlockRequest = {
      event_type: 'schedule_entry_due',
      event_category: 'recognition',
      // Always 'schedule' — this op is schedule-driven by definition.
      source: 'schedule',
      occurred_at: `${postingDate}T00:00:00Z`,
      apply_handlers: true,
      metadata: {
        schedule_id: structureId,
        posting_date: postingDate,
        period_start: periodStart,
        period_end: periodEnd,
        memo: memo ?? null,
      },
    }
    const envelope = await this.callOperation(
      'Create closing entry',
      opCreateEventBlock({ path: { graph_id: graphId }, body })
    )
    return this.requireResult('Create closing entry', envelope.result)
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
      ruleSummary: raw.rule_summary ?? null,
      evaluatedStructureIds: raw.evaluated_structure_ids ?? [],
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
   * Routes through `create-event-block` with
   * `event_type='journal_entry_recorded'` — the Python handler forwards
   * to the internal journal-entry command. Defaults to `status='draft'`;
   * pass `status='posted'` for historical data imports.
   *
   * Supply `idempotencyKey` to make the call safe to retry — replays
   * within 24 hours return the same envelope. Reusing the key with a
   * different body returns HTTP 409.
   *
   * Returns the EventBlockEnvelope (event row fields); query the ledger
   * separately if you need the resulting entry_id.
   */
  async createJournalEntry(
    graphId: string,
    options: CreateJournalEntryOptions
  ): Promise<EventBlockEnvelope> {
    const body: CreateEventBlockRequest = {
      event_type: 'journal_entry_recorded',
      event_category: 'adjustment',
      source: options.source ?? 'manual',
      occurred_at: `${options.postingDate}T00:00:00Z`,
      apply_handlers: true,
      metadata: {
        posting_date: options.postingDate,
        memo: options.memo,
        line_items: options.lineItems.map((li) => ({
          element_id: li.elementId,
          debit_amount: li.debitAmount,
          credit_amount: li.creditAmount,
          description: li.description ?? null,
        })),
        type: options.type ?? 'standard',
        status: options.status ?? 'draft',
        transaction_id: options.transactionId ?? null,
      },
    }
    const headers = options.idempotencyKey
      ? { 'Idempotency-Key': options.idempotencyKey }
      : undefined
    const envelope = await this.callOperation(
      'Create journal entry',
      opCreateEventBlock({ path: { graph_id: graphId }, body, headers })
    )
    return this.requireResult('Create journal entry', envelope.result)
  }

  /** Update a draft journal entry. Posted entries are immutable. */
  async updateJournalEntry(
    graphId: string,
    body: UpdateJournalEntryRequest
  ): Promise<JournalEntryResponse> {
    const envelope = await this.callOperation(
      'Update journal entry',
      opUpdateJournalEntry({ path: { graph_id: graphId }, body })
    )
    return this.requireResult('Update journal entry', envelope.result)
  }

  /** Hard-delete a draft journal entry. Posted entries must be reversed. */
  async deleteJournalEntry(graphId: string, entryId: string): Promise<DeleteResult> {
    const body: DeleteJournalEntryRequest = { entry_id: entryId }
    const envelope = await this.callOperation(
      'Delete journal entry',
      opDeleteJournalEntry({ path: { graph_id: graphId }, body })
    )
    return (envelope.result ?? { deleted: true }) as DeleteResult
  }

  /**
   * Reverse a posted journal entry — creates an offsetting entry and marks
   * the original as reversed.
   *
   * Routes through `create-event-block` with
   * `event_type='journal_entry_reversed'`. `source` defaults to `'manual'`
   * — sync adapters override.
   */
  async reverseJournalEntry(
    graphId: string,
    entryId: string,
    options?: {
      postingDate?: string | null
      memo?: string | null
      reason?: string | null
      source?: string
    }
  ): Promise<EventBlockEnvelope> {
    const occurredDate = options?.postingDate ?? new Date().toISOString().slice(0, 10)
    const body: CreateEventBlockRequest = {
      event_type: 'journal_entry_reversed',
      event_category: 'adjustment',
      source: options?.source ?? 'manual',
      occurred_at: `${occurredDate}T00:00:00Z`,
      apply_handlers: true,
      metadata: {
        entry_id: entryId,
        posting_date: options?.postingDate ?? null,
        memo: options?.memo ?? null,
        reason: options?.reason ?? null,
      },
    }
    const envelope = await this.callOperation(
      'Reverse journal entry',
      opCreateEventBlock({ path: { graph_id: graphId }, body })
    )
    return this.requireResult('Reverse journal entry', envelope.result)
  }

  // ── Event blocks (generic preview + status transitions) ──────────────

  /**
   * Dry-run an event block — resolve the handler, evaluate metadata, and
   * return the planned GL rows without writing anything. Companion to
   * `createJournalEntry` / `reverseJournalEntry` / `createClosingEntry` /
   * `disposeSchedule`: pass the same body you'd send to those methods
   * (the underlying `CreateEventBlockRequest`) and inspect what the
   * handler would do.
   */
  async previewEventBlock(
    graphId: string,
    body: CreateEventBlockRequest
  ): Promise<PreviewEventBlockResponse> {
    const envelope = await this.callOperation(
      'Preview event block',
      opPreviewEventBlock({ path: { graph_id: graphId }, body })
    )
    return this.requireResult('Preview event block', envelope.result)
  }

  /**
   * Apply a status transition and/or field corrections to an existing
   * event block. Use for posting drafts (`classified` → `committed` →
   * `fulfilled`), voiding, superseding (correction chains), or patching
   * `description` / `effective_at` / `metadata`.
   */
  async updateEventBlock(
    graphId: string,
    body: UpdateEventBlockRequest
  ): Promise<EventBlockEnvelope> {
    const envelope = await this.callOperation(
      'Update event block',
      opUpdateEventBlock({ path: { graph_id: graphId }, body })
    )
    return this.requireResult('Update event block', envelope.result)
  }

  // ── Agents (REA counterparties) ───────────────────────────────────────

  /**
   * Create an agent — REA counterparty (customer, vendor, employee, etc.)
   * referenced by event blocks via `agent_id`. `(source, external_id)` is
   * unique when `external_id` is provided, so external-source ingestion is
   * idempotent at the DB level.
   */
  async createAgent(
    graphId: string,
    body: CreateAgentRequest,
    idempotencyKey?: string
  ): Promise<LedgerAgentResponse> {
    const headers = idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined
    const envelope = await this.callOperation(
      'Create agent',
      opCreateAgent({ path: { graph_id: graphId }, body, headers })
    )
    return this.requireResult('Create agent', envelope.result)
  }

  /**
   * Update an agent. `metadata_patch` is a partial merge into the existing
   * metadata object; all other fields replace.
   */
  async updateAgent(graphId: string, body: UpdateAgentRequest): Promise<LedgerAgentResponse> {
    const envelope = await this.callOperation(
      'Update agent',
      opUpdateAgent({ path: { graph_id: graphId }, body })
    )
    return this.requireResult('Update agent', envelope.result)
  }

  // ── Event handlers (DSL handler registry) ────────────────────────────

  /**
   * Register a tenant-configurable event handler — DSL row in the
   * `event_handlers` table that drives `create-event-block` for event
   * types not covered by a Python handler. Match selectors plus a
   * `transaction_template` describing the GL rows to produce.
   */
  async createEventHandler(
    graphId: string,
    body: CreateEventHandlerRequest
  ): Promise<EventHandlerResponse> {
    const envelope = await this.callOperation(
      'Create event handler',
      opCreateEventHandler({ path: { graph_id: graphId }, body })
    )
    return this.requireResult('Create event handler', envelope.result)
  }

  /**
   * Update a registered event handler. Pass `approve: true` to flip an
   * AI-suggested handler from unapproved to active.
   */
  async updateEventHandler(
    graphId: string,
    body: UpdateEventHandlerRequest
  ): Promise<EventHandlerResponse> {
    const envelope = await this.callOperation(
      'Update event handler',
      opUpdateEventHandler({ path: { graph_id: graphId }, body })
    )
    return this.requireResult('Update event handler', envelope.result)
  }

  // ── Financial statements (graph-backed) ──────────────────────────────

  /**
   * Live financial statement — pulls facts directly from the graph for
   * an explicit period window (or fiscal year) and returns the statement
   * shape without a persisted Report row. Useful for ad-hoc previews and
   * dashboards.
   */
  async liveFinancialStatement(
    graphId: string,
    body: LiveFinancialStatementRequest
  ): Promise<Record<string, unknown>> {
    const envelope = await this.callOperation(
      'Live financial statement',
      opLiveFinancialStatement({ path: { graph_id: graphId }, body })
    )
    return (envelope.result ?? {}) as Record<string, unknown>
  }

  /**
   * Run a financial statement analysis against an existing report.
   * On shared-repo graphs (e.g. SEC), `ticker` is required; on tenant
   * graphs it's ignored. Either pass an explicit `report_id` or let the
   * server auto-resolve via `fiscal_year` + `period_type`.
   */
  async financialStatementAnalysis(
    graphId: string,
    body: FinancialStatementAnalysisRequest
  ): Promise<Record<string, unknown>> {
    const envelope = await this.callOperation(
      'Financial statement analysis',
      opFinancialStatementAnalysis({ path: { graph_id: graphId }, body })
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

  // ── Reports, statements, and publish lists ──────────────────────────────

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

  // ── Reports ─────────────────────────────────────────────────────────

  /**
   * Kick off report creation (async). Use the returned `operationId` to
   * subscribe to progress via SSE, then call `getReport()` once finished.
   */
  async createReport(
    graphId: string,
    options: CreateReportOptions
  ): Promise<ReportOperationAck<ReportResponse>> {
    const body: CreateReportRequest = {
      name: options.name,
      mapping_id: options.mappingId,
      period_start: options.periodStart,
      period_end: options.periodEnd,
      taxonomy_id: options.taxonomyId ?? 'tax_usgaap_reporting',
      period_type: options.periodType ?? 'quarterly',
      comparative: options.comparative ?? true,
    }
    if (options.periods && options.periods.length > 0) {
      body.periods = options.periods
    }
    const envelope = await this.callOperation(
      'Create report',
      opCreateReport({ path: { graph_id: graphId }, body })
    )
    return {
      operationId: envelope.operationId,
      status: envelope.status,
      result: envelope.result ?? null,
    }
  }

  /** List all reports for a graph (includes received shared reports). */
  async listReports(graphId: string): Promise<ReportListItem[]> {
    const list = await this.gqlQuery(
      graphId,
      ListLedgerReportsDocument,
      undefined,
      'List reports',
      (data) => data.reports
    )
    return list?.reports ?? []
  }

  /** Get a single report with its period list + available structures. */
  async getReport(graphId: string, reportId: string): Promise<Report | null> {
    return this.gqlQuery(
      graphId,
      GetLedgerReportDocument,
      { reportId },
      'Get report',
      (data) => data.report
    )
  }

  /**
   * Rehydrate a Report as a package — Report metadata + N
   * `InformationBlock` envelopes (one per attached FactSet). Drives the
   * package viewer; returns everything needed to render BS + IS (and any
   * other statements the Report generated) without per-section fetches.
   */
  async getReportPackage(graphId: string, reportId: string): Promise<ReportPackage | null> {
    return this.gqlQuery(
      graphId,
      GetLedgerReportPackageDocument,
      { reportId },
      'Get report package',
      (data) => data.reportPackage
    )
  }

  /**
   * Render a financial statement — facts viewed through a structure.
   *
   * @param structureType - income_statement, balance_sheet, cash_flow_statement
   */
  async getStatement(
    graphId: string,
    reportId: string,
    structureType: string
  ): Promise<StatementData | null> {
    return this.gqlQuery(
      graphId,
      GetLedgerStatementDocument,
      { reportId, structureType },
      'Get statement',
      (data) => data.statement
    )
  }

  /**
   * Regenerate an existing report (async). Returns an operation id;
   * subscribe via SSE for progress.
   */
  async regenerateReport(
    graphId: string,
    reportId: string,
    periodStart?: string,
    periodEnd?: string
  ): Promise<ReportOperationAck<ReportResponse>> {
    const envelope = await this.callOperation(
      'Regenerate report',
      opRegenerateReport({
        path: { graph_id: graphId },
        body: {
          report_id: reportId,
          period_start: periodStart,
          period_end: periodEnd,
        } as Parameters<typeof opRegenerateReport>[0]['body'],
      })
    )
    return {
      operationId: envelope.operationId,
      status: envelope.status,
      result: envelope.result ?? null,
    }
  }

  /** Delete a report and its generated facts. */
  async deleteReport(graphId: string, reportId: string): Promise<DeleteResult> {
    const envelope = await this.callOperation(
      'Delete report',
      opDeleteReport({
        path: { graph_id: graphId },
        body: { report_id: reportId },
      })
    )
    return (envelope.result ?? { deleted: true }) as DeleteResult
  }

  /**
   * Share a published report to every member of a publish list. Each
   * target graph receives a snapshot copy of the report's facts.
   */
  async shareReport(
    graphId: string,
    reportId: string,
    publishListId: string
  ): Promise<ReportOperationAck<ShareReportResponse>> {
    const envelope = await this.callOperation(
      'Share report',
      opShareReport({
        path: { graph_id: graphId },
        body: {
          report_id: reportId,
          publish_list_id: publishListId,
        } as Parameters<typeof opShareReport>[0]['body'],
      })
    )
    return {
      operationId: envelope.operationId,
      status: envelope.status,
      result: envelope.result ?? null,
    }
  }

  /**
   * Transition a Report's filing_status to 'filed' — locks the package.
   * Allowed from 'draft' or 'under_review'. Stamps filed_at + filed_by
   * from the auth context + server clock.
   */
  async fileReport(graphId: string, reportId: string): Promise<ReportOperationAck<ReportResponse>> {
    const body: FileReportRequest = { report_id: reportId }
    const envelope = await this.callOperation(
      'File report',
      opFileReport({ path: { graph_id: graphId }, body })
    )
    return {
      operationId: envelope.operationId,
      status: envelope.status,
      result: envelope.result ?? null,
    }
  }

  /**
   * Move a Report along the non-file legs of the filing lifecycle
   * (draft ↔ under_review, filed → archived). Use ``fileReport`` to
   * reach 'filed' so the audit fields land cleanly.
   */
  async transitionFilingStatus(
    graphId: string,
    reportId: string,
    targetStatus: string
  ): Promise<ReportOperationAck<ReportResponse>> {
    const body: TransitionFilingStatusRequest = {
      report_id: reportId,
      target_status: targetStatus,
    }
    const envelope = await this.callOperation(
      'Transition filing status',
      opTransitionFilingStatus({ path: { graph_id: graphId }, body })
    )
    return {
      operationId: envelope.operationId,
      status: envelope.status,
      result: envelope.result ?? null,
    }
  }

  /** Check if a report was received via sharing (vs locally created). */
  isSharedReport(report: Report): boolean {
    return report.sourceGraphId !== null
  }

  // ── Publish Lists ────────────────────────────────────────────────────

  /** List publish lists with pagination. */
  async listPublishLists(
    graphId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<PublishList[]> {
    const list = await this.gqlQuery(
      graphId,
      ListLedgerPublishListsDocument,
      {
        limit: options?.limit ?? 100,
        offset: options?.offset ?? 0,
      },
      'List publish lists',
      (data) => data.publishLists
    )
    return list?.publishLists ?? []
  }

  /** Create a new publish list. */
  async createPublishList(
    graphId: string,
    name: string,
    description?: string
  ): Promise<PublishListResponse> {
    const body: CreatePublishListRequest = {
      name,
      description: description ?? null,
    }
    const envelope = await this.callOperation(
      'Create publish list',
      opCreatePublishList({ path: { graph_id: graphId }, body })
    )
    return this.requireResult('Create publish list', envelope.result)
  }

  /** Get a single publish list with its full member list. */
  async getPublishList(graphId: string, listId: string): Promise<PublishListDetail | null> {
    return this.gqlQuery(
      graphId,
      GetLedgerPublishListDocument,
      { listId },
      'Get publish list',
      (data) => data.publishList
    )
  }

  /** Update a publish list's name or description. */
  async updatePublishList(
    graphId: string,
    listId: string,
    updates: { name?: string; description?: string | null }
  ): Promise<PublishListResponse> {
    const envelope = await this.callOperation(
      'Update publish list',
      opUpdatePublishList({
        path: { graph_id: graphId },
        body: {
          list_id: listId,
          name: updates.name,
          description: updates.description ?? null,
        } as UpdatePublishListOperation,
      })
    )
    return this.requireResult('Update publish list', envelope.result)
  }

  /** Delete a publish list. */
  async deletePublishList(graphId: string, listId: string): Promise<DeleteResult> {
    const envelope = await this.callOperation(
      'Delete publish list',
      opDeletePublishList({
        path: { graph_id: graphId },
        body: { list_id: listId },
      })
    )
    return (envelope.result ?? { deleted: true }) as DeleteResult
  }

  /** Add target graphs as members of a publish list. */
  async addPublishListMembers(
    graphId: string,
    listId: string,
    targetGraphIds: string[]
  ): Promise<PublishListMemberResponse[]> {
    const envelope = await this.callOperation(
      'Add publish list members',
      opAddPublishListMembers({
        path: { graph_id: graphId },
        body: {
          list_id: listId,
          target_graph_ids: targetGraphIds,
        } as AddPublishListMembersOperation,
      })
    )
    return this.requireResult('Add publish list members', envelope.result)
  }

  /** Remove a single member from a publish list. */
  async removePublishListMember(
    graphId: string,
    listId: string,
    memberId: string
  ): Promise<DeleteResult> {
    const envelope = await this.callOperation(
      'Remove publish list member',
      opRemovePublishListMember({
        path: { graph_id: graphId },
        body: { list_id: listId, member_id: memberId },
      })
    )
    return (envelope.result ?? { deleted: true }) as DeleteResult
  }

  // ── Internal helpers ────────────────────────────────────────────────

  /**
   * Await an SDK-generated `opXxx(...)` call, throw a readable error on
   * non-2xx, and return the parsed envelope on success.
   *
   * Generic over the SDK call's response shape so typed ops (e.g.
   * `opCreateEventBlock`, which returns
   * `OperationEnvelopeEventBlockEnvelope`) flow through with a typed
   * `envelope.result` instead of being widened to `unknown`. Untyped
   * ops continue to land as `OperationEnvelope` automatically.
   */
  private async callOperation<T>(
    label: string,
    call: Promise<{ data?: T; error?: unknown }>
  ): Promise<T> {
    const response = await call
    if (response.error !== undefined) {
      throw new Error(`${label} failed: ${JSON.stringify(response.error)}`)
    }
    if (response.data === undefined) {
      throw new Error(`${label} failed: empty response`)
    }
    return response.data
  }

  /**
   * Unwrap the typed result from an OperationEnvelope. Throws when the
   * server returned an envelope with no `result` field — generally a
   * sign that a synchronous operation failed silently.
   */
  private requireResult<T>(label: string, result: T | null | undefined): T {
    if (result === null || result === undefined) {
      throw new Error(`${label}: operation envelope had no result`)
    }
    return result
  }
}

// ── Module-private conversion helpers ─────────────────────────────────

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
