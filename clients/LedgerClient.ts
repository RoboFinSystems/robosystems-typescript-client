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
 *   (via the OpenAPI-generated command functions in `../sdk/sdk.gen`,
 *   called with this facade's own `baseUrl`, credential and headers).
 *   Each command returns an `OperationEnvelope`; the facade unwraps
 *   `envelope.result`.
 *
 * Consumers don't need to know which transport a method uses — the
 * facade signature stays stable. Most write results are the generated
 * (snake_case) response types the typed envelopes carry; a few are
 * mapped to the camelCase read shapes, and ops whose envelope `result`
 * is untyped are cast to a local raw type before mapping.
 */

import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import { ClientError } from 'graphql-request'
import {
  addPublishListMembers,
  autoMapElements,
  bindTextBlock,
  blockSourceGraph,
  buildFactGrid,
  closePeriod,
  computeMetrics,
  createAgent,
  createEntity,
  createEventBlock,
  createEventHandler,
  createInformationBlock,
  createMappingAssociation,
  createPublishList,
  createReport,
  createTaxonomyBlock,
  deleteInformationBlock,
  deleteJournalEntry,
  deleteMappingAssociation,
  deletePublishList,
  deleteReport,
  deleteTaxonomyBlock,
  evaluateRules,
  fileReport,
  financialStatementAnalysis,
  initializeChartOfAccounts,
  initializeLedger,
  linkBankAccount,
  linkEntityTaxonomy,
  liveFinancialStatement,
  previewEventBlock,
  previewReconciliations,
  previewReconcilingItem,
  promoteObligations,
  rebuildSchedule,
  recordStatementBalance,
  refreshReconciliations,
  regenerateReport,
  removePublishListMember,
  reopenPeriod,
  resolveReconcilingItem,
  revokeReportShare,
  setCloseTarget,
  setReconciliationPolicy,
  shareReport,
  signOffReconciliation,
  transitionFilingStatus,
  unblockSourceGraph,
  updateAgent,
  updateEntity,
  updateEventBlock,
  updateEventHandler,
  updateInformationBlock,
  updateJournalEntry,
  updatePublishList,
  updateTaxonomyBlock,
} from '../sdk/sdk.gen'
import type {
  AddPublishListMembersOperation,
  AssociationResponse,
  AutoMapElementsOperation,
  BindTextBlockRequest,
  BindTextBlockResponse,
  BlockedSourceGraphResponse,
  BlockSourceGraphResult,
  ClosePeriodOperation,
  ComputeMetricsRequest,
  ComputeMetricsResponse,
  CreateAgentRequest,
  CreateEntityRequest,
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
  FinancialStatementAnalysisResponse,
  InformationBlockEnvelope,
  InitializeChartOfAccountsRequest,
  InitializeChartOfAccountsResponse,
  InitializeLedgerRequest,
  JournalEntryResponse,
  LedgerAgentResponse,
  LedgerEntityResponse,
  LinkBankAccountRequest,
  LinkBankAccountResponse,
  LinkEntityTaxonomyRequest,
  LiveFinancialStatementRequest,
  LiveFinancialStatementResponse,
  OperationEnvelope,
  PreviewEventBlockResponse,
  PreviewReconciliationsRequest,
  PromoteObligationsRequest,
  PromoteObligationsResponse,
  PublishListMemberResponse,
  PublishListResponse,
  RebuildScheduleRequest,
  ReconciliationComponent,
  ReconciliationListResponse,
  ReconciliationPolicyResponse,
  ReconciliationPreviewResponse,
  ReconciliationRow,
  ReconciliationSummary,
  ReconcilingItemPlan,
  RecordStatementBalanceRequest,
  RefreshReconciliationsRequest,
  ReopenPeriodOperation,
  ReportResponse,
  ResolveReconcilingItemRequest,
  ResolveReconcilingItemResponse,
  RevokeReportShareResponse,
  SetCloseTargetOperation,
  SetReconciliationPolicyRequest,
  ShareReportResponse,
  SignOffReconciliationRequest,
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
  ViewResponse,
} from '../sdk/types.gen'
import type { TokenProvider } from './graphql/client'
import { GraphQLClientCache, toGraphQLError } from './graphql/client'
import {
  GetInformationBlockDocument,
  GetInformationBlockWindowedDocument,
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
  GetLedgerReportDownloadUrlDocument,
  GetLedgerReportingTaxonomyDocument,
  GetLedgerReportPackageDocument,
  GetLedgerStatementDocument,
  GetLedgerSummaryDocument,
  GetLedgerTransactionDocument,
  GetLedgerTrialBalanceDocument,
  ListChartTemplatesDocument,
  ListInformationBlocksDocument,
  ListLedgerAccountsDocument,
  ListLedgerAgentsDocument,
  ListLedgerBankAccountsDocument,
  ListLedgerBankAccountsQuery,
  ListLedgerBlockedSourceGraphsDocument,
  ListLedgerElementsDocument,
  ListLedgerEntitiesDocument,
  ListLedgerEventBlocksDocument,
  ListLedgerJournalEntriesDocument,
  ListLedgerMappingsDocument,
  ListLedgerPublishListsDocument,
  ListLedgerReconciliationsDocument,
  ListLedgerReportsDocument,
  ListLedgerStructuresDocument,
  ListLedgerTaxonomiesDocument,
  ListLedgerTransactionsDocument,
  ListLedgerUnmappedElementsDocument,
  MappingCandidatesDocument,
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
  type ListChartTemplatesQuery,
  type ListInformationBlocksQuery,
  type ListLedgerAccountsQuery,
  type ListLedgerAgentsQuery,
  type ListLedgerBlockedSourceGraphsQuery,
  type ListLedgerElementsQuery,
  type ListLedgerEntitiesQuery,
  type ListLedgerEventBlocksQuery,
  type ListLedgerJournalEntriesQuery,
  type ListLedgerMappingsQuery,
  type ListLedgerPublishListsQuery,
  type ListLedgerReconciliationsQuery,
  type ListLedgerReportsQuery,
  type ListLedgerStructuresQuery,
  type ListLedgerTaxonomiesQuery,
  type ListLedgerTransactionsQuery,
  type ListLedgerUnmappedElementsQuery,
  type MappingCandidatesQuery,
  type ReportDownloadFormat,
  type ReportLifecycle,
} from './graphql/generated/graphql'
import { restCallOptions, withIdempotencyKey, type RestCallOptions } from './rest'

// Re-export the structured GraphQL error type so consumers importing
// from the `@robosystems/client/ledger` subpath can `instanceof` it.
export { GraphQLError } from './graphql/client'
export type { ReportLifecycle }

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
export type LedgerBankAccountList = NonNullable<ListLedgerBankAccountsQuery['bankAccounts']>
export type LedgerBankAccount = LedgerBankAccountList['accounts'][number]

export type LedgerTrialBalance = NonNullable<GetLedgerTrialBalanceQuery['trialBalance']>
export type LedgerMappedTrialBalance = NonNullable<
  GetLedgerMappedTrialBalanceQuery['mappedTrialBalance']
>

export type LedgerTransactionList = NonNullable<ListLedgerTransactionsQuery['transactions']>
export type LedgerTransactionListItem = LedgerTransactionList['transactions'][number]
export type LedgerTransaction = NonNullable<GetLedgerTransactionQuery['transaction']>

export type LedgerJournalEntryList = NonNullable<ListLedgerJournalEntriesQuery['journalEntries']>
export type LedgerJournalEntry = LedgerJournalEntryList['entries'][number]

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
export type LedgerMappingCandidate = MappingCandidatesQuery['mappingCandidates'][number]
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
/** A shipped chart-of-accounts template — `listChartTemplates()` row. */
export type LedgerChartTemplate = ListChartTemplatesQuery['chartTemplates'][number]
export type LedgerFiscalPeriod = LedgerFiscalCalendar['periods'][number]

/** Every reconciliation block's standing for one period. */
export type LedgerReconciliationList = NonNullable<
  ListLedgerReconciliationsQuery['reconciliations']
>
/** One reconciliation block's standing for a period. */
export type LedgerReconciliation = LedgerReconciliationList['reconciliations'][number]
/** One account: the ledger's balance, the independent balance, the difference. */
export type LedgerReconciliationRow = LedgerReconciliation['differences'][number]
/** One part of an account's independent balance: a schedule, or a statement. */
export type LedgerReconciliationComponent = LedgerReconciliation['components'][number]

// Reports + publish lists + statements
export type Report = NonNullable<GetLedgerReportQuery['report']>
export type ReportPackage = NonNullable<GetLedgerReportPackageQuery['reportPackage']>
export type ReportPackageItem = ReportPackage['items'][number]
// A report's block renders through the same viewers as a read block, so its
// selection must keep pace with the information-block documents.
type AssertTrue<T extends true> = T
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ReportBlockIsInformationBlock = AssertTrue<
  ReportPackageItem['block'] extends InformationBlock ? true : false
>
export type ReportListItem = NonNullable<ListLedgerReportsQuery['reports']>['reports'][number]
export type StatementData = NonNullable<GetLedgerStatementQuery['statement']>
export type StatementPeriod = StatementData['periods'][number]
export type StatementRow = StatementData['rows'][number]

export type PublishList = NonNullable<
  ListLedgerPublishListsQuery['publishLists']
>['publishLists'][number]
export type PublishListDetail = NonNullable<GetLedgerPublishListQuery['publishList']>
export type PublishListMember = PublishListDetail['members'][number]

export type BlockedSourceGraph = NonNullable<
  ListLedgerBlockedSourceGraphsQuery['blockedSourceGraphs']
>['blockedSourceGraphs'][number]

/**
 * Presigned-URL response for a Report bundle download.
 *
 * Returned by ``LedgerClient.getReportDownloadUrl`` — the
 * ``downloadUrl`` is a time-limited URL that streams the
 * serialization artifact directly from object storage. Browser
 * callers typically follow the URL via ``window.location.href`` or
 * an anchor element to trigger the file download.
 */
export interface ReportBundleDownloadResponse {
  /** Presigned URL that streams the bundle directly from S3. */
  downloadUrl: string
  /** ISO-8601 UTC instant at which the presigned URL stops working. */
  expiresAt: string
  /** MIME type of the artifact behind the URL. */
  contentType: string
  /** Serialization flavor — ``tavi``, ``holon-jsonld`` or ``xbrl-2.1``. */
  format: string
  /** Bundle generation number stamped on the Report. */
  generationCount: number
}

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
  /**
   * The entity the report is for. Omit for the entity whose chart
   * `mappingId` maps from; named alongside another entity's mapping, the
   * server refuses it.
   */
  entityId?: string | null
}

// ── Write result shapes (envelope.result payloads) ─────────────────────
//
// Backend Pydantic models serialize these write results in snake_case.
// The facade converts to camelCase where the result is meaningful to
// consumers; for simple ack/ack-with-id payloads we keep the raw shape.

/** Snake-case shape returned in envelope.result for fiscal calendar writes. */
interface RawObligationDetail {
  event_id: string
  schedule_id?: string | null
  schedule_name?: string | null
  period: string
}

interface RawFiscalCalendar {
  graph_id: string
  entity_id?: string | null
  fiscal_year_start_month: number
  closed_through: string | null
  close_target: string | null
  gap_periods: number
  catch_up_sequence: string[]
  closeable_now: boolean
  blockers: string[]
  // Detail for actionable blockers — the API populates each only when its
  // corresponding code is in `blockers`, so a caller can name which
  // schedules hold the close rather than just that something does.
  pending_obligation_count?: number
  pending_obligation_sample?: RawObligationDetail[]
  earliest_pending_period?: string | null
  stranded_obligation_count?: number
  stranded_obligation_sample?: RawObligationDetail[]
  sync_stale_days?: number | null
  reconciling_item_count?: number
  reconciling_item_sample?: string[]
  unposted_source_event_count?: number
  unposted_source_event_sample?: string[]
  unreconciled_account_count?: number
  unreconciled_account_sample?: string[]
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
  entries_published_to_qb?: number
  entries_posted_locally?: number
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
  /**
   * Total drafts the close moved to posted, across both post paths. A close
   * that published everything to QuickBooks used to report 0 here, because
   * the pre-publish step promotes each draft before the local bulk
   * transition counts it; both paths are summed now.
   */
  entriesPosted: number
  /** Drafts published to QuickBooks by the close's pre-publish step. */
  entriesPublishedToQb: number
  /** Drafts posted by the local bulk transition (never reach QuickBooks). */
  entriesPostedLocally: number
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

/**
 * Result of `createSchedule`.
 *
 * Deliberately narrower than {@link ScheduleCreated}: `create-information-block`
 * returns an InformationBlockEnvelope, which carries no period/rule rollup.
 * This method previously advertised `totalPeriods` / `ruleSummary` and decoded
 * a `structure_id` that isn't on the wire, so every one of those fields —
 * including `structureId` — read `undefined` at runtime. Use
 * {@link LedgerClient.rebuildSchedule} when you need the rebuild summary.
 */
export interface ScheduleBlockCreated {
  /** The created block's id, which is the structure id. */
  structureId: string
  name: string
  /** Null when the created block carries no taxonomy association. */
  taxonomyId: string | null
  /** Fact count on the created block; null when the response omitted facts. */
  totalFacts: number | null
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
  /** The entity whose calendar is seeded. Omitted: the group parent. */
  entityId?: string | null
  closedThrough?: string | null
  fiscalYearStartMonth?: number
  earliestDataPeriod?: string | null
  autoSeedSchedules?: boolean
  note?: string | null
}

/** A shipped chart template key — the `key` of a `listChartTemplates()` row. */
export type ChartTemplateKey = InitializeChartOfAccountsRequest['template']

export interface InitializeChartOfAccountsOptions {
  /** The entity the chart belongs to. Omitted: the group parent. */
  entityId?: string | null
  /**
   * Legal form for the equity mapping: `corporation`, `llc` or `partnership`.
   * Defaults to the graph's primary entity, then to corporation.
   */
  entityType?: string | null
  /** Chart display name. Defaults to 'Chart of Accounts'. */
  name?: string | null
}

export interface InitializeChartOfAccountsResult {
  taxonomyId: string
  name: string
  template: ChartTemplateKey
  /** Legal form the equity rows were mapped for. */
  entityType: string
  elementsCreated: number
  mappingsCreated: number
  /** Frameworks the chart was mapped into (rs-gaap today). */
  frameworks: string[]
  /** Targets that did not resolve, or a framework this graph does not carry. Never fatal. */
  unresolved: string[]
}

/**
 * Which of the graph's entities a call is about. Omitted, it is the group
 * parent: the entity the graph's own source connection books for. Every
 * graph has one; a graph with subsidiaries has more, and each keeps its own
 * books, chart and calendar.
 */
export interface EntityScopeOptions {
  entityId?: string | null
}

export interface ClosePeriodOptions extends EntityScopeOptions {
  note?: string | null
  allowStaleSync?: boolean
  /**
   * Close despite matured obligations that were never drafted, knowingly
   * omitting those adjusting entries. Prefer re-running promotion with
   * handler dispatch, or voiding the obligations. The override is recorded
   * in the close audit note.
   */
  allowStrandedObligations?: boolean
  /**
   * Close despite a reconciliation the close waits on that is not
   * reconciled for the period, or was never compared for it. Prefer
   * `refreshReconciliations` and clearing what it reports. The override is
   * recorded in the close audit note.
   */
  allowUnreconciledAccounts?: boolean
  /**
   * Close despite posted events whose source payload changed afterwards and
   * that nobody has decided on. Prefer `resolveReconcilingItem` on each.
   * The override is recorded in the close audit note.
   */
  allowReconcilingItems?: boolean
  /**
   * Close despite source events dated in the period that were never
   * committed; once it closes they cannot post into it. Prefer committing
   * or voiding each. The override is recorded in the close audit note.
   */
  allowUnpostedSourceEvents?: boolean
}

/** Which reconciliation check to run. */
export type ReconciliationMethod = NonNullable<PreviewReconciliationsRequest['method']>

export interface PreviewReconciliationsOptions {
  /** Defaults to `source_ledger`, which needs a connected QuickBooks ledger. */
  method?: ReconciliationMethod
  /** Also return the accounts that tie. */
  includeTied?: boolean
}

/** One comparison of the ledger with something outside it. Nothing is recorded. */
export interface LedgerReconciliationPreview {
  period: string
  asOf: string
  fiscalYearStart: string
  method: string
  source: string
  reportBasis: string | null
  lastSyncAt: string | null
  accountsCompared: number
  accountsTied: number
  accountsDifferent: number
  /** Sum of the absolute differences across accounts, not a net figure. */
  totalDifference: number
  /** Accounts that do not tie, largest first; tied ones follow with `includeTied`. */
  rows: LedgerReconciliationRow[]
  notes: string[]
}

export interface RecordStatementBalanceInput {
  /** The balance-sheet account the statement is for. */
  elementId: string
  /** The statement's ending date, as YYYY-MM-DD. */
  asOf: string
  /**
   * The ending balance as the statement shows it: a positive number in the
   * account's normal direction (money in a bank account, or the amount owed
   * on a loan or a card).
   */
  balance: number
  /** The statement itself, as a document already on the graph. */
  documentId?: string | null
  note?: string | null
}

/** Policy fields to change; an omitted field keeps its value. */
export interface ReconciliationPolicyChanges {
  requiredForClose?: boolean
  materiality?: number
  reviewRequired?: boolean
  separateReviewer?: boolean
}

export interface LedgerReconciliationPolicy {
  structureId: string
  requiredForClose: boolean
  materiality: number
  reviewRequired: boolean
  separateReviewer: boolean
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
    /**
     * The day the cost went on the books (YYYY-MM-DD), when that is before
     * the schedule's first period. The schedule reconciliation carries the
     * cost from that day.
     */
    bookedOn?: string
  }
  /** The entity whose books the schedule belongs to. Omit for the group parent. */
  entityId?: string | null
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
   * request and REST write so refreshes flow through automatically.
   */
  tokenProvider?: TokenProvider
  /** GraphQL request timeout in milliseconds (default 60s). */
  timeout?: number
  /**
   * Replays of a rate-limited (429) request. Defaults to
   * `DEFAULT_MAX_RETRIES`; set `0` to surface the rejection immediately.
   */
  maxRetries?: number
  /** Base of the retry backoff, in milliseconds. */
  retryDelay?: number
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
   * Get an entity of this graph: the group parent, or the one `entityId`
   * names. Returns null when the ledger has no entity yet.
   */
  async getEntity(graphId: string, options?: EntityScopeOptions): Promise<LedgerEntity | null> {
    return this.gqlQuery(
      graphId,
      GetLedgerEntityDocument,
      { entityId: options?.entityId ?? null },
      'Get entity',
      (data) => data.entity
    )
  }

  /**
   * List the graph's entities, optionally filtered by source system. The
   * group parent is the row with `isParent`; a subsidiary names its
   * `parentEntityId` and may carry an `ownershipPct`.
   */
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
    const envelope = await this.callOperation('Update entity', (o) =>
      updateEntity({ ...o, path: { graph_id: graphId }, body: updates })
    )
    // The REST envelope carries LedgerEntityResponse (snake_case); LedgerEntity
    // is the GraphQL camelCase shape that getEntity returns. The old
    // `as unknown as` cast asserted one was the other, so every multi-word
    // field — parentEntityId, isParent, legalName, entityType … — read
    // `undefined` on the object handed back after a save. Map instead, so the
    // declared return type is true and updateEntity stays interchangeable with
    // getEntity.
    const raw = this.requireResult('Update entity', envelope.result)
    return entityResponseToCamel(raw)
  }

  /**
   * Create an entity in this graph. A graph's first entity becomes the group
   * parent; every later one is a subsidiary of the parent unless
   * `parent_entity_id` names another entity. The `ticker` prefixes the
   * entity's account names and is unique in the graph (derived from the
   * name's initials when omitted). Returns the entity in the shape
   * `getEntity` returns.
   */
  async createEntity(graphId: string, body: CreateEntityRequest): Promise<LedgerEntity> {
    const envelope = await this.callOperation('Create entity', (o) =>
      createEntity({ ...o, path: { graph_id: graphId }, body })
    )
    const raw = this.requireResult('Create entity', envelope.result)
    return entityResponseToCamel(raw)
  }

  // ── Summary ────────────────────────────────────────────────────────

  /** Ledger rollup counts + QB sync metadata. */
  async getSummary(graphId: string, options?: EntityScopeOptions): Promise<LedgerSummary | null> {
    return this.gqlQuery(
      graphId,
      GetLedgerSummaryDocument,
      { entityId: options?.entityId ?? null },
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
      entityId?: string | null
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
        entityId: options?.entityId ?? null,
      },
      'List accounts',
      (data) => data.accounts
    )
  }

  /** Hierarchical Chart of Accounts (up to 4 levels deep). */
  async getAccountTree(
    graphId: string,
    options?: EntityScopeOptions
  ): Promise<LedgerAccountTree | null> {
    return this.gqlQuery(
      graphId,
      GetLedgerAccountTreeDocument,
      { entityId: options?.entityId ?? null },
      'Get account tree',
      (data) => data.accountTree
    )
  }

  /** Accounts rolled up to reporting concepts via a mapping structure. */
  async getAccountRollups(
    graphId: string,
    options?: { mappingId?: string; startDate?: string; endDate?: string; entityId?: string | null }
  ): Promise<LedgerAccountRollups | null> {
    return this.gqlQuery(
      graphId,
      GetLedgerAccountRollupsDocument,
      {
        mappingId: options?.mappingId ?? null,
        startDate: options?.startDate ?? null,
        endDate: options?.endDate ?? null,
        entityId: options?.entityId ?? null,
      },
      'Get account rollups',
      (data) => data.accountRollups
    )
  }

  // ── Bank accounts ─────────────────────────────────────────────────────

  /**
   * The group's bank and card accounts: every chart account a feed books to,
   * or that a source system types as a bank or card account, with the entity
   * whose chart it is in (`entityId`, the books its lines go into), what
   * writes to it (`source`: a feed provider, `quickbooks`, or null for an
   * account kept by hand) and the connection's status and last sync. Pass
   * `entityId` for one entity's accounts; omit it for the whole group.
   */
  async listBankAccounts(
    graphId: string,
    options?: EntityScopeOptions
  ): Promise<LedgerBankAccountList | null> {
    return this.gqlQuery(
      graphId,
      ListLedgerBankAccountsDocument,
      { entityId: options?.entityId ?? null },
      'List bank accounts',
      (data) => data.bankAccounts
    )
  }

  /**
   * Point a bank feed's account at a chart account. `element_id` links an
   * existing account (its chart's entity takes the feed); `entity_id` alone
   * creates one in that entity's chart. This is how a feed account is bound
   * to a subsidiary: lines still in the inbox move with it, posted entries
   * stay where they were posted. An account another connection already
   * feeds is refused.
   */
  async linkBankAccount(
    graphId: string,
    body: LinkBankAccountRequest
  ): Promise<LinkBankAccountResponse> {
    const envelope = await this.callOperation('Link bank account', (o) =>
      linkBankAccount({ ...o, path: { graph_id: graphId }, body })
    )
    return this.requireResult('Link bank account', envelope.result)
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
      entityId?: string | null
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
        entityId: options?.entityId ?? null,
      },
      'List transactions',
      (data) => data.transactions
    )
  }

  // ── Journal entries ─────────────────────────────────────────────────

  /**
   * List journal entries with their line items, newest first.
   *
   * The entry-centric read. `listTransactions` walks transactions and hangs
   * entries off them, so an entry with no parent transaction appears in
   * nothing it returns — and the schedule engine and event handlers create
   * exactly those, which is why everything a period close posts is absent
   * from that surface. Here `transactionId` is null for a standalone entry
   * rather than absent data.
   *
   * Filter by `provenance` (`schedule_derived` for what a close posted),
   * `type` (`adjusting` / `closing`), `status`, or a parent `transactionId`.
   */
  async listJournalEntries(
    graphId: string,
    options?: {
      startDate?: string
      endDate?: string
      status?: string
      type?: string
      provenance?: string
      transactionId?: string
      limit?: number
      offset?: number
      entityId?: string | null
    }
  ): Promise<LedgerJournalEntryList | null> {
    return this.gqlQuery(
      graphId,
      ListLedgerJournalEntriesDocument,
      {
        startDate: options?.startDate ?? null,
        endDate: options?.endDate ?? null,
        status: options?.status ?? null,
        type: options?.type ?? null,
        provenance: options?.provenance ?? null,
        transactionId: options?.transactionId ?? null,
        limit: options?.limit ?? 100,
        offset: options?.offset ?? 0,
        entityId: options?.entityId ?? null,
      },
      'List journal entries',
      (data) => data.journalEntries
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
      /** Only posted events whose source payload changed afterwards. */
      isReconcilingItem?: boolean
      limit?: number
      offset?: number
      entityId?: string | null
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
        isReconcilingItem: options?.isReconcilingItem ?? null,
        limit: options?.limit ?? 50,
        offset: options?.offset ?? 0,
        entityId: options?.entityId ?? null,
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
    options?: { startDate?: string; endDate?: string; entityId?: string | null }
  ): Promise<LedgerTrialBalance | null> {
    return this.gqlQuery(
      graphId,
      GetLedgerTrialBalanceDocument,
      {
        startDate: options?.startDate ?? null,
        endDate: options?.endDate ?? null,
        entityId: options?.entityId ?? null,
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
    const envelope = await this.callOperation('Link entity taxonomy', (o) =>
      linkEntityTaxonomy({ ...o, path: { graph_id: graphId }, body })
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
    const envelope = await this.callOperation('Create taxonomy block', (o) =>
      createTaxonomyBlock({
        ...withIdempotencyKey(o, idempotencyKey),
        path: { graph_id: graphId },
        body,
      })
    )
    return this.requireResult('Create taxonomy block', envelope.result)
  }

  /** Update a taxonomy block — add/update/remove elements, structures, associations, or rules. */
  async updateTaxonomyBlock(
    graphId: string,
    body: UpdateTaxonomyBlockRequest
  ): Promise<TaxonomyBlockEnvelope> {
    const envelope = await this.callOperation('Update taxonomy block', (o) =>
      updateTaxonomyBlock({ ...o, path: { graph_id: graphId }, body })
    )
    return this.requireResult('Update taxonomy block', envelope.result)
  }

  /** Delete a taxonomy block. Cascades through elements, structures, and associations. */
  async deleteTaxonomyBlock(
    graphId: string,
    body: DeleteTaxonomyBlockRequest
  ): Promise<DeleteTaxonomyBlockResponse> {
    const envelope = await this.callOperation('Delete taxonomy block', (o) =>
      deleteTaxonomyBlock({ ...o, path: { graph_id: graphId }, body })
    )
    return (envelope.result ?? { deleted: true }) as DeleteTaxonomyBlockResponse
  }

  /**
   * Bind a platform Document (or one section) to a disclosure element as a
   * Nonnumeric text-block fact in a standing 'disclosure' FactSet.
   * Re-binding the same element and period replaces the fact
   * (`replaced: true` in the response).
   */
  async bindTextBlock(
    graphId: string,
    body: BindTextBlockRequest,
    idempotencyKey?: string
  ): Promise<BindTextBlockResponse> {
    const envelope = await this.callOperation('Bind text block', (o) =>
      bindTextBlock({ ...withIdempotencyKey(o, idempotencyKey), path: { graph_id: graphId }, body })
    )
    return this.requireResult('Bind text block', envelope.result)
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

  /**
   * rs-gaap concepts a CoA element of the given EFS `classification`
   * (asset / liability / equity / revenue / expense) may map to — limited
   * to concepts that render under the Reporting Style of the entity whose
   * chart is being mapped (`options.entityId`, default the group parent),
   * with statement-level subtotals excluded. Use this to populate the
   * mapping picker so it never offers an unreachable target.
   */
  async getMappingCandidates(
    graphId: string,
    classification: string,
    options?: { entityId?: string | null }
  ): Promise<LedgerMappingCandidate[]> {
    return this.gqlQuery(
      graphId,
      MappingCandidatesDocument,
      { classification, entityId: options?.entityId ?? null },
      'Mapping candidates',
      (data) => data.mappingCandidates
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
    options?: { taxonomyId?: string; blockType?: string }
  ): Promise<LedgerStructure[]> {
    const list = await this.gqlQuery(
      graphId,
      ListLedgerStructuresDocument,
      {
        taxonomyId: options?.taxonomyId ?? null,
        blockType: options?.blockType ?? null,
      },
      'List structures',
      (data) => data.structures
    )
    return list?.structures ?? []
  }

  // ── Mappings ────────────────────────────────────────────────────────

  /**
   * List active CoA→reporting mapping structures, the book mapping first.
   * Each carries `framework`: the reporting framework it maps the chart into,
   * and `entityId`: the entity whose chart it maps from, so whose reports it
   * can produce. `options.entityId` keeps that entity's mappings only.
   */
  async listMappings(
    graphId: string,
    options?: { entityId?: string | null }
  ): Promise<LedgerMappingInfo[]> {
    const list = await this.gqlQuery(
      graphId,
      ListLedgerMappingsDocument,
      { entityId: options?.entityId ?? null },
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
    const envelope = await this.callOperation('Create mapping association', (o) =>
      createMappingAssociation({ ...o, path: { graph_id: graphId }, body })
    )
    return this.requireResult('Create mapping association', envelope.result)
  }

  /** Delete a mapping association. */
  async deleteMappingAssociation(
    graphId: string,
    body: DeleteMappingAssociationOperation
  ): Promise<DeleteResult> {
    const envelope = await this.callOperation('Delete mapping association', (o) =>
      deleteMappingAssociation({ ...o, path: { graph_id: graphId }, body })
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
    const envelope = await this.callOperation('Auto-map elements', (o) =>
      autoMapElements({ ...o, path: { graph_id: graphId }, body })
    )
    return { operationId: envelope.operationId, status: envelope.status }
  }

  // ── Information Blocks ─────────────────────────────────────────────

  /**
   * Fetch an Information Block envelope by id — the generic
   * cross-block-type read. Returns `null` when the block doesn't exist
   * (or its type isn't registered). See `information-block.md`.
   *
   * `options.scenarioId` selects the FactSet slice: omitted = actuals;
   * a forecast block's structure id = that scenario's parallel universe
   * (statement envelopes bind its latest computed month, metric
   * envelopes extend the series with "(forecast)"-labeled columns).
   *
   * `options.series` renders a statement block as its whole report-set
   * time series — one column per period; combined with `scenarioId` the
   * columns cross the actuals/forecast seam and forecast columns carry
   * `periods[].forecast === true`. Non-statement block types ignore it
   * (metric envelopes are always the full series).
   *
   * `options.seriesHistory` / `options.seriesForecast` window the series
   * to its seam-adjacent columns — the last N actual columns and the
   * first N forecast columns; omitted = unbounded. Passing either sends
   * the windowed query document, which requires a backend that knows the
   * window arguments — a pre-window server rejects it. Callers that
   * never pass a window keep the un-windowed document and stay
   * compatible with older backends.
   *
   * `options.entityId` picks whose books a block shared by the group
   * reads (statements, metrics, disclosures); omitted, the scenario's
   * entity, else the group parent. A schedule, reconciliation or forecast
   * always reads its own entity's. The envelope's `entityId` names the
   * entity it read.
   */
  async getInformationBlock(
    graphId: string,
    id: string,
    options?: {
      scenarioId?: string
      series?: boolean
      seriesHistory?: number
      seriesForecast?: number
      entityId?: string | null
    }
  ): Promise<InformationBlock | null> {
    const windowed = options?.seriesHistory !== undefined || options?.seriesForecast !== undefined
    const block = windowed
      ? await this.gqlQuery(
          graphId,
          GetInformationBlockWindowedDocument,
          {
            id,
            scenarioId: options?.scenarioId ?? null,
            series: options?.series ?? false,
            seriesHistory: options?.seriesHistory ?? null,
            seriesForecast: options?.seriesForecast ?? null,
            entityId: options?.entityId ?? null,
          },
          'Get information block',
          (data) => data.informationBlock ?? null
        )
      : await this.gqlQuery(
          graphId,
          GetInformationBlockDocument,
          {
            id,
            scenarioId: options?.scenarioId ?? null,
            series: options?.series ?? false,
            entityId: options?.entityId ?? null,
          },
          'Get information block',
          (data) => data.informationBlock ?? null
        )
    return block ?? null
  }

  /**
   * List Information Block envelopes with optional block_type + category
   * filters. Replaces the old `listSchedules` method — callers use
   * `{blockType: 'schedule'}` to get the same set of blocks.
   * `options.scenarioId` threads into each envelope's FactSet binding
   * (the block list itself is scenario-independent).
   *
   * `options.entityId` (omitted: the scenario's entity, else the group
   * parent) lists the blocks shared by the group plus that entity's own
   * schedules, reconciliations and forecasts, never another entity's;
   * shared blocks read its books.
   */
  async listInformationBlocks(
    graphId: string,
    options?: {
      blockType?: string
      category?: string
      limit?: number
      offset?: number
      scenarioId?: string
      entityId?: string | null
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
        scenarioId: options?.scenarioId ?? null,
        entityId: options?.entityId ?? null,
      },
      'List information blocks',
      (data) => data.informationBlocks
    )
    return blocks ?? []
  }

  // ── Schedules ──────────────────────────────────────────────────────

  /**
   * Create an Information Block of any registered block_type.
   *
   * Generic wrapper over `create-information-block`. Pass a typed
   * `CreateInformationBlockRequest` body — the discriminator routes
   * server-side to the correct dispatch handler. Convenience methods
   * exist for specific block types (e.g. `createSchedule`); for
   * block types without one (currently `rollforward`), use this
   * generic entry.
   */
  async createInformationBlock(
    graphId: string,
    body: CreateInformationBlockRequest,
    options?: { idempotencyKey?: string }
  ): Promise<InformationBlockEnvelope> {
    const envelope = await this.callOperation('Create information block', (o) =>
      createInformationBlock({
        ...withIdempotencyKey(o, options?.idempotencyKey),
        path: { graph_id: graphId },
        body,
      })
    )
    return this.requireResult('Create information block', envelope.result)
  }

  /**
   * Update an Information Block in place. Generic wrapper over
   * `update-information-block`.
   */
  async updateInformationBlock(
    graphId: string,
    body: UpdateInformationBlockRequest
  ): Promise<InformationBlockEnvelope> {
    const envelope = await this.callOperation('Update information block', (o) =>
      updateInformationBlock({ ...o, path: { graph_id: graphId }, body })
    )
    return this.requireResult('Update information block', envelope.result)
  }

  /**
   * Delete an Information Block. Generic wrapper over
   * `delete-information-block`. Cascades through any facts /
   * associations tied to the block.
   */
  async deleteInformationBlock(
    graphId: string,
    body: DeleteInformationBlockRequest
  ): Promise<DeleteInformationBlockResponse> {
    const envelope = await this.callOperation('Delete information block', (o) =>
      deleteInformationBlock({ ...o, path: { graph_id: graphId }, body })
    )
    return (envelope.result ?? { deleted: true }) as DeleteInformationBlockResponse
  }

  /** Create a new schedule with pre-generated monthly facts. */
  async createSchedule(
    graphId: string,
    options: CreateScheduleOptions
  ): Promise<ScheduleBlockCreated> {
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
        ...(options.entityId ? { entity_id: options.entityId } : {}),
        schedule_metadata: options.scheduleMetadata
          ? {
              method: options.scheduleMetadata.method,
              original_amount: options.scheduleMetadata.originalAmount,
              residual_value: options.scheduleMetadata.residualValue,
              useful_life_months: options.scheduleMetadata.usefulLifeMonths,
              asset_element_id: options.scheduleMetadata.assetElementId,
              booked_on: options.scheduleMetadata.bookedOn,
            }
          : undefined,
      },
    }
    const envelope = await this.callOperation('Create schedule', (o) =>
      createInformationBlock({ ...o, path: { graph_id: graphId }, body })
    )
    // `create-information-block` returns an InformationBlockEnvelope, not the
    // ScheduleCreatedResponse shape this used to decode — there is no
    // `structure_id` / `total_periods` / `total_facts` / `rule_summary` on the
    // wire, so all four read `undefined` and callers got
    // `structureId: undefined`. The block's own `id` is the structure id.
    // `rebuildSchedule` below is unaffected: that route does return
    // ScheduleCreatedResponse.
    const block = this.requireResult('Create schedule', envelope.result)
    return {
      structureId: block.id,
      name: block.name,
      taxonomyId: block.taxonomy_id ?? null,
      totalFacts: block.facts?.length ?? null,
    }
  }

  /**
   * Rename a schedule. For other block fields use `updateInformationBlock`
   * with a `schedule` payload.
   */
  async updateSchedule(
    graphId: string,
    structureId: string,
    options: { name?: string }
  ): Promise<InformationBlockEnvelope> {
    const body: UpdateInformationBlockRequest = {
      block_type: 'schedule',
      payload: { structure_id: structureId, ...options },
    }
    const envelope = await this.callOperation('Update schedule', (o) =>
      updateInformationBlock({ ...o, path: { graph_id: graphId }, body })
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
    const envelope = await this.callOperation('Delete schedule', (o) =>
      deleteInformationBlock({ ...o, path: { graph_id: graphId }, body })
    )
    return (envelope.result ?? { deleted: true }) as DeleteInformationBlockResponse
  }

  /**
   * Rebuild a schedule in place — atomic alternative to
   * delete-then-recreate (which orphans pending obligations). Preserves
   * the structure id, element associations, and taxonomy; voids the old
   * pending obligation chain; deletes the old facts + SumEquals rules;
   * and regenerates fresh forward facts + a fresh obligation chain from
   * the schedule's stored definition. The historical-vs-in-scope split
   * is re-derived from the CURRENT fiscal calendar `closed_through`, so
   * a rebuild re-scopes the schedule to today's close state. Use this to
   * pick up a fixed generator without orphaning obligations.
   *
   * Returns the {@link ScheduleCreated} rebuild summary (periods, facts,
   * rule results) — richer than `createSchedule`'s {@link ScheduleBlockCreated}.
   */
  async rebuildSchedule(
    graphId: string,
    structureId: string,
    options?: { idempotencyKey?: string }
  ): Promise<ScheduleCreated> {
    const body: RebuildScheduleRequest = { structure_id: structureId }
    const envelope = await this.callOperation('Rebuild schedule', (o) =>
      rebuildSchedule({
        ...withIdempotencyKey(o, options?.idempotencyKey),
        path: { graph_id: graphId },
        body,
      })
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
    const envelope = await this.callOperation('Dispose schedule', (o) =>
      createEventBlock({ ...o, path: { graph_id: graphId }, body })
    )
    return this.requireResult('Dispose schedule', envelope.result)
  }

  /** Evaluate taxonomy rules against facts in a structure. */
  async evaluateRules(graphId: string, body: EvaluateRulesRequest): Promise<EvaluateRulesResponse> {
    const envelope = await this.callOperation('Evaluate rules', (o) =>
      evaluateRules({ ...o, path: { graph_id: graphId }, body })
    )
    return this.requireResult('Evaluate rules', envelope.result)
  }

  /**
   * Compute a metric block's `Derive` rules for a period, upserting the
   * standing `factset_type='metric'` FactSet (one per structure +
   * entity + period_end; re-running a period replaces its facts).
   * Operands bind to the entity's most recent persisted report facts at
   * `period_end`. Unresolvable metrics come back in `skipped` with a
   * reason rather than failing the run.
   */
  async computeMetrics(
    graphId: string,
    body: ComputeMetricsRequest,
    options?: { idempotencyKey?: string }
  ): Promise<ComputeMetricsResponse> {
    const envelope = await this.callOperation('Compute metrics', (o) =>
      computeMetrics({
        ...withIdempotencyKey(o, options?.idempotencyKey),
        path: { graph_id: graphId },
        body,
      })
    )
    return this.requireResult('Compute metrics', envelope.result)
  }

  // ── Period close ────────────────────────────────────────────────────

  /** Close status for all schedules in a fiscal period. */
  async getPeriodCloseStatus(
    graphId: string,
    periodStart: string,
    periodEnd: string,
    options?: EntityScopeOptions
  ): Promise<LedgerPeriodCloseStatus | null> {
    return this.gqlQuery(
      graphId,
      GetLedgerPeriodCloseStatusDocument,
      { periodStart, periodEnd, entityId: options?.entityId ?? null },
      'Get period close status',
      (data) => data.periodCloseStatus
    )
  }

  /** All draft entries in a period, fully expanded for review pre-close. */
  async listPeriodDrafts(
    graphId: string,
    period: string,
    options?: EntityScopeOptions
  ): Promise<LedgerPeriodDrafts | null> {
    return this.gqlQuery(
      graphId,
      GetLedgerPeriodDraftsDocument,
      { period, entityId: options?.entityId ?? null },
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
    const envelope = await this.callOperation('Create closing entry', (o) =>
      createEventBlock({ ...o, path: { graph_id: graphId }, body })
    )
    return this.requireResult('Create closing entry', envelope.result)
  }

  // ── Closing book ───────────────────────────────────────────────────

  /** Grouped closing book structures for the close-screen sidebar. */
  async getClosingBookStructures(
    graphId: string,
    options?: EntityScopeOptions
  ): Promise<LedgerClosingBookStructures | null> {
    return this.gqlQuery(
      graphId,
      GetLedgerClosingBookStructuresDocument,
      { entityId: options?.entityId ?? null },
      'Get closing book structures',
      (data) => data.closingBookStructures
    )
  }

  // ── Fiscal Calendar ────────────────────────────────────────────────

  /**
   * Current fiscal calendar state — pointers, gap, closeable status — for the
   * group parent, or for the entity `entityId` names.
   */
  async getFiscalCalendar(
    graphId: string,
    options?: EntityScopeOptions
  ): Promise<LedgerFiscalCalendar | null> {
    return this.gqlQuery(
      graphId,
      GetLedgerFiscalCalendarDocument,
      { entityId: options?.entityId ?? null },
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
      entity_id: options?.entityId ?? null,
      closed_through: options?.closedThrough ?? null,
      fiscal_year_start_month: options?.fiscalYearStartMonth,
      earliest_data_period: options?.earliestDataPeriod ?? null,
      auto_seed_schedules: options?.autoSeedSchedules,
      note: options?.note ?? null,
    }
    const envelope = await this.callOperation('Initialize ledger', (o) =>
      initializeLedger({ ...o, path: { graph_id: graphId }, body })
    )
    const raw = envelope.result as unknown as RawInitializeLedgerResult
    return {
      fiscalCalendar: rawFiscalCalendarToCamel(raw.fiscal_calendar),
      periodsCreated: raw.periods_created ?? 0,
      warnings: raw.warnings ?? [],
    }
  }

  // ── Chart of Accounts ──────────────────────────────────────────────

  /** Shipped chart-of-accounts templates for `initializeChartOfAccounts`. */
  async listChartTemplates(graphId: string): Promise<LedgerChartTemplate[]> {
    return this.gqlQuery(
      graphId,
      ListChartTemplatesDocument,
      undefined,
      'List chart templates',
      (data) => data.chartTemplates
    )
  }

  /**
   * One-time chart of accounts from a shipped template — the fresh-company
   * path to native books. Refused (409) once the graph has any chart of
   * accounts; a QuickBooks-synced tenant never needs this. Customize the
   * result with `updateTaxonomyBlock`.
   */
  async initializeChartOfAccounts(
    graphId: string,
    template: ChartTemplateKey,
    options?: InitializeChartOfAccountsOptions
  ): Promise<InitializeChartOfAccountsResult> {
    const body: InitializeChartOfAccountsRequest = {
      template,
      entity_id: options?.entityId ?? null,
      entity_type: options?.entityType ?? null,
      name: options?.name ?? null,
    }
    const envelope = await this.callOperation('Initialize chart of accounts', (o) =>
      initializeChartOfAccounts({ ...o, path: { graph_id: graphId }, body })
    )
    const raw = envelope.result as unknown as InitializeChartOfAccountsResponse
    return {
      taxonomyId: raw.taxonomy_id,
      name: raw.name,
      template: raw.template,
      entityType: raw.entity_type,
      elementsCreated: raw.elements_created,
      mappingsCreated: raw.mappings_created,
      frameworks: raw.frameworks ?? [],
      unresolved: raw.unresolved ?? [],
    }
  }

  /** Set the user-controlled close target (YYYY-MM). */
  async setCloseTarget(
    graphId: string,
    period: string,
    note?: string | null,
    options?: EntityScopeOptions
  ): Promise<LedgerFiscalCalendar> {
    const body: SetCloseTargetOperation = {
      period,
      note: note ?? null,
      entity_id: options?.entityId ?? null,
    }
    const envelope = await this.callOperation('Set close target', (o) =>
      setCloseTarget({ ...o, path: { graph_id: graphId }, body })
    )
    return rawFiscalCalendarToCamel(envelope.result as unknown as RawFiscalCalendar)
  }

  /**
   * Close a fiscal period — the final commit action — on the group parent,
   * or on the entity `entityId` names. Each entity closes on its own.
   */
  async closePeriod(
    graphId: string,
    period: string,
    options?: ClosePeriodOptions
  ): Promise<ClosePeriodResult> {
    const body: ClosePeriodOperation = {
      period,
      entity_id: options?.entityId ?? null,
      note: options?.note ?? null,
      allow_stale_sync: options?.allowStaleSync,
      allow_stranded_obligations: options?.allowStrandedObligations,
      allow_unreconciled_accounts: options?.allowUnreconciledAccounts,
      allow_reconciling_items: options?.allowReconcilingItems,
      allow_unposted_source_events: options?.allowUnpostedSourceEvents,
    }
    const envelope = await this.callOperation('Close period', (o) =>
      closePeriod({ ...o, path: { graph_id: graphId }, body })
    )
    const raw = envelope.result as unknown as RawClosePeriodResult
    return {
      period: raw.period,
      entriesPosted: raw.entries_posted ?? 0,
      entriesPublishedToQb: raw.entries_published_to_qb ?? 0,
      entriesPostedLocally: raw.entries_posted_locally ?? 0,
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
    note?: string | null,
    options?: EntityScopeOptions
  ): Promise<LedgerFiscalCalendar> {
    const body: ReopenPeriodOperation = {
      period,
      reason,
      note: note ?? null,
      entity_id: options?.entityId ?? null,
    }
    const envelope = await this.callOperation('Reopen period', (o) =>
      reopenPeriod({ ...o, path: { graph_id: graphId }, body })
    )
    return rawFiscalCalendarToCamel(envelope.result as unknown as RawFiscalCalendar)
  }

  // ── Reconciliations ─────────────────────────────────────────────────

  /**
   * Every reconciliation block's standing at a period end (YYYY-MM). A block
   * not yet compared for the period reads `not_started`.
   */
  async listReconciliations(
    graphId: string,
    period: string,
    options?: EntityScopeOptions
  ): Promise<LedgerReconciliationList | null> {
    return this.gqlQuery(
      graphId,
      ListLedgerReconciliationsDocument,
      { period, entityId: options?.entityId ?? null },
      'List reconciliations',
      (data) => data.reconciliations
    )
  }

  /**
   * What changed on a reconciling item (a posted event whose source payload
   * changed afterwards) and what each treatment would do. Writes nothing.
   * List the items with `listEventBlocks(graphId, { isReconcilingItem: true })`.
   */
  async previewReconcilingItem(graphId: string, eventId: string): Promise<ReconcilingItemPlan> {
    const envelope = await this.callOperation('Preview reconciling item', (o) =>
      previewReconcilingItem({ ...o, path: { graph_id: graphId }, body: { event_id: eventId } })
    )
    return this.requireResult('Preview reconciling item', envelope.result)
  }

  /**
   * Decide one reconciling item: `restate` the affected months, `catch_up`
   * with an entry in the open period, or `acknowledge` that it was handled
   * elsewhere (a note is required). Omit `disposition` to take the default
   * the preview reports. Pass the preview's `drift_detected_at` as
   * `expected_drift_detected_at`: the resolution is refused when the item
   * was flagged again since, and must be previewed again.
   */
  async resolveReconcilingItem(
    graphId: string,
    body: ResolveReconcilingItemRequest
  ): Promise<ResolveReconcilingItemResponse> {
    const envelope = await this.callOperation('Resolve reconciling item', (o) =>
      resolveReconcilingItem({ ...o, path: { graph_id: graphId }, body })
    )
    return this.requireResult('Resolve reconciling item', envelope.result)
  }

  /**
   * Draft the closing entry of every matured schedule obligation, including
   * ones promoted earlier and never drafted. The drafts post when the period
   * closes. Safe to repeat.
   */
  async promoteObligations(
    graphId: string,
    body: PromoteObligationsRequest = {}
  ): Promise<PromoteObligationsResponse> {
    const envelope = await this.callOperation('Promote obligations', (o) =>
      promoteObligations({ ...o, path: { graph_id: graphId }, body })
    )
    return this.requireResult('Promote obligations', envelope.result)
  }

  /** Compare the ledger with something outside it. Records nothing. */
  async previewReconciliations(
    graphId: string,
    period: string,
    options?: PreviewReconciliationsOptions
  ): Promise<LedgerReconciliationPreview> {
    const body: PreviewReconciliationsRequest = {
      period,
      method: options?.method,
      include_tied: options?.includeTied,
    }
    const envelope = await this.callOperation('Preview reconciliations', (o) =>
      previewReconciliations({ ...o, path: { graph_id: graphId }, body })
    )
    return reconciliationPreviewToCamel(envelope.result as unknown as ReconciliationPreviewResponse)
  }

  /**
   * Run every reconciliation that applies at a period end and record each
   * result on its block. `notes` names any check that could not run.
   */
  async refreshReconciliations(graphId: string, period: string): Promise<LedgerReconciliationList> {
    const body: RefreshReconciliationsRequest = { period }
    const envelope = await this.callOperation('Refresh reconciliations', (o) =>
      refreshReconciliations({ ...o, path: { graph_id: graphId }, body })
    )
    return reconciliationListToCamel(envelope.result as unknown as ReconciliationListResponse)
  }

  /**
   * Record a statement's ending balance for an account and reconcile the
   * account to it for the period the statement ends in. Writes no books.
   */
  async recordStatementBalance(
    graphId: string,
    input: RecordStatementBalanceInput
  ): Promise<LedgerReconciliation> {
    const body: RecordStatementBalanceRequest = {
      element_id: input.elementId,
      as_of: input.asOf,
      balance: input.balance,
      document_id: input.documentId ?? null,
      note: input.note ?? null,
    }
    const envelope = await this.callOperation('Record statement balance', (o) =>
      recordStatementBalance({ ...o, path: { graph_id: graphId }, body })
    )
    return reconciliationSummaryToCamel(envelope.result as unknown as ReconciliationSummary)
  }

  /** Change how much the close cares about one reconciliation. */
  async setReconciliationPolicy(
    graphId: string,
    structureId: string,
    changes: ReconciliationPolicyChanges
  ): Promise<LedgerReconciliationPolicy> {
    const body: SetReconciliationPolicyRequest = {
      structure_id: structureId,
      required_for_close: changes.requiredForClose,
      materiality: changes.materiality,
      review_required: changes.reviewRequired,
      separate_reviewer: changes.separateReviewer,
    }
    const envelope = await this.callOperation('Set reconciliation policy', (o) =>
      setReconciliationPolicy({ ...o, path: { graph_id: graphId }, body })
    )
    const raw = envelope.result as unknown as ReconciliationPolicyResponse
    return {
      structureId: raw.structure_id,
      requiredForClose: raw.required_for_close,
      materiality: raw.materiality,
      reviewRequired: raw.review_required,
      separateReviewer: raw.separate_reviewer,
    }
  }

  /**
   * Sign off a reconciled period as its reviewer. Only a member of the graph
   * can; a later change to any balance lapses the sign-off.
   */
  async signOffReconciliation(
    graphId: string,
    structureId: string,
    period: string,
    note?: string | null
  ): Promise<LedgerReconciliation> {
    const body: SignOffReconciliationRequest = {
      structure_id: structureId,
      period,
      note: note ?? null,
    }
    const envelope = await this.callOperation('Sign off reconciliation', (o) =>
      signOffReconciliation({ ...o, path: { graph_id: graphId }, body })
    )
    return reconciliationSummaryToCamel(envelope.result as unknown as ReconciliationSummary)
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
    const envelope = await this.callOperation('Create journal entry', (o) =>
      createEventBlock({
        ...withIdempotencyKey(o, options.idempotencyKey),
        path: { graph_id: graphId },
        body,
      })
    )
    return this.requireResult('Create journal entry', envelope.result)
  }

  /** Update a draft journal entry. Posted entries are immutable. */
  async updateJournalEntry(
    graphId: string,
    body: UpdateJournalEntryRequest
  ): Promise<JournalEntryResponse> {
    const envelope = await this.callOperation('Update journal entry', (o) =>
      updateJournalEntry({ ...o, path: { graph_id: graphId }, body })
    )
    return this.requireResult('Update journal entry', envelope.result)
  }

  /** Hard-delete a draft journal entry. Posted entries must be reversed. */
  async deleteJournalEntry(graphId: string, entryId: string): Promise<DeleteResult> {
    const body: DeleteJournalEntryRequest = { entry_id: entryId }
    const envelope = await this.callOperation('Delete journal entry', (o) =>
      deleteJournalEntry({ ...o, path: { graph_id: graphId }, body })
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
    const envelope = await this.callOperation('Reverse journal entry', (o) =>
      createEventBlock({ ...o, path: { graph_id: graphId }, body })
    )
    return this.requireResult('Reverse journal entry', envelope.result)
  }

  // ── Event blocks (generic preview + status transitions) ──────────────

  /**
   * Create an event block directly. Use for support-class events
   * (`event_class: 'support'`) with categories `approval`, `control`,
   * `reconciliation`, or `inquiry`, which the specialized helpers don't
   * cover. Economic events should generally go through
   * `createJournalEntry`, `createClosingEntry`, etc., but this works for
   * those too.
   *
   * Supply `idempotencyKey` to make the call safe to retry — replays
   * within 24 hours return the same envelope.
   */
  async createEventBlock(
    graphId: string,
    body: CreateEventBlockRequest,
    idempotencyKey?: string
  ): Promise<EventBlockEnvelope> {
    const envelope = await this.callOperation('Create event block', (o) =>
      createEventBlock({
        ...withIdempotencyKey(o, idempotencyKey),
        path: { graph_id: graphId },
        body,
      })
    )
    return this.requireResult('Create event block', envelope.result)
  }

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
    const envelope = await this.callOperation('Preview event block', (o) =>
      previewEventBlock({ ...o, path: { graph_id: graphId }, body })
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
    const envelope = await this.callOperation('Update event block', (o) =>
      updateEventBlock({ ...o, path: { graph_id: graphId }, body })
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
    const envelope = await this.callOperation('Create agent', (o) =>
      createAgent({ ...withIdempotencyKey(o, idempotencyKey), path: { graph_id: graphId }, body })
    )
    return this.requireResult('Create agent', envelope.result)
  }

  /**
   * Update an agent. `metadata_patch` is a partial merge into the existing
   * metadata object; all other fields replace.
   */
  async updateAgent(graphId: string, body: UpdateAgentRequest): Promise<LedgerAgentResponse> {
    const envelope = await this.callOperation('Update agent', (o) =>
      updateAgent({ ...o, path: { graph_id: graphId }, body })
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
    const envelope = await this.callOperation('Create event handler', (o) =>
      createEventHandler({ ...o, path: { graph_id: graphId }, body })
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
    const envelope = await this.callOperation('Update event handler', (o) =>
      updateEventHandler({ ...o, path: { graph_id: graphId }, body })
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
  ): Promise<LiveFinancialStatementResponse> {
    const envelope = await this.callOperation('Live financial statement', (o) =>
      liveFinancialStatement({ ...o, path: { graph_id: graphId }, body })
    )
    return this.requireResult('Live financial statement', envelope.result)
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
  ): Promise<FinancialStatementAnalysisResponse> {
    const envelope = await this.callOperation('Financial statement analysis', (o) =>
      financialStatementAnalysis({ ...o, path: { graph_id: graphId }, body })
    )
    return this.requireResult('Financial statement analysis', envelope.result)
  }

  // ── Fact grid (graph-backed analytical query) ─────────────────────

  /**
   * Build a multi-dimensional fact grid against the graph schema.
   *
   * Runs against LadybugDB (not the extensions OLTP database) and returns
   * a deduplicated pivot table of XBRL facts. Works for both roboledger
   * tenant graphs (after materialization) and the SEC shared repository.
   */
  async buildFactGrid(graphId: string, body: CreateViewRequest): Promise<ViewResponse> {
    const envelope = await this.callOperation('Build fact grid', (o) =>
      buildFactGrid({ ...o, path: { graph_id: graphId }, body })
    )
    return this.requireResult('Build fact grid', envelope.result)
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
        throw toGraphQLError(label, err)
      }
      throw err
    }
  }

  // ── Reports ─────────────────────────────────────────────────────────

  /**
   * Generate report facts from the ledger and publish a Report
   * definition. Synchronous — the backend materializes the report
   * inline and this resolves with the published report header.
   */
  async createReport(graphId: string, options: CreateReportOptions): Promise<ReportResponse> {
    const body: CreateReportRequest = {
      name: options.name,
      mapping_id: options.mappingId,
      period_start: options.periodStart,
      period_end: options.periodEnd,
      taxonomy_id: options.taxonomyId ?? 'rs-gaap',
      period_type: options.periodType ?? 'quarterly',
      comparative: options.comparative ?? true,
    }
    if (options.periods && options.periods.length > 0) {
      body.periods = options.periods
    }
    if (options.entityId) {
      body.entity_id = options.entityId
    }
    const envelope = await this.callOperation('Create report', (o) =>
      createReport({ ...o, path: { graph_id: graphId }, body })
    )
    return this.requireResult('Create report', envelope.result)
  }

  /**
   * List reports for a graph (includes received shared reports).
   *
   * `lifecycle` defaults to `CURRENT`, which leaves archived reports out;
   * `ARCHIVED` returns only those, `ALL` every report.
   */
  async listReports(
    graphId: string,
    options: { lifecycle?: ReportLifecycle; entityId?: string | null } = {}
  ): Promise<ReportListItem[]> {
    const list = await this.gqlQuery(
      graphId,
      ListLedgerReportsDocument,
      {
        ...(options.lifecycle ? { lifecycle: options.lifecycle } : {}),
        entityId: options.entityId ?? null,
      },
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
   * @param blockType - income_statement, balance_sheet, cash_flow_statement
   */
  async getStatement(
    graphId: string,
    reportId: string,
    blockType: string
  ): Promise<StatementData | null> {
    return this.gqlQuery(
      graphId,
      GetLedgerStatementDocument,
      { reportId, blockType },
      'Get statement',
      (data) => data.statement
    )
  }

  /**
   * Re-run fact generation for an existing Report against the latest
   * ledger state. Synchronous — resolves with the regenerated report
   * header.
   */
  async regenerateReport(
    graphId: string,
    reportId: string,
    periodStart?: string,
    periodEnd?: string
  ): Promise<ReportResponse> {
    const envelope = await this.callOperation('Regenerate report', (o) =>
      regenerateReport({
        ...o,
        path: { graph_id: graphId },
        body: {
          report_id: reportId,
          period_start: periodStart,
          period_end: periodEnd,
        } as Parameters<typeof regenerateReport>[0]['body'],
      })
    )
    return this.requireResult('Regenerate report', envelope.result)
  }

  /** Delete a report and its generated facts. */
  async deleteReport(graphId: string, reportId: string): Promise<DeleteResult> {
    const envelope = await this.callOperation('Delete report', (o) =>
      deleteReport({ ...o, path: { graph_id: graphId }, body: { report_id: reportId } })
    )
    return (envelope.result ?? { deleted: true }) as DeleteResult
  }

  /**
   * Get a short-lived presigned URL for downloading a published
   * Report's serialization bundle.
   *
   * A download is a read, so this resolves through GraphQL
   * (`reportDownloadUrl`) — the retired `GET .../reports/{id}/download`
   * REST resource is gone. Every flavor resolves to a presigned S3 URL:
   * the Tavi model is stamped at publish time; the holon and XBRL are
   * materialized + cached on first request. The returned `downloadUrl` is valid for
   * `expiresIn` seconds (default 300, max 3600); browser callers
   * navigate to it via `window.location.href` (or an `<a href>` click)
   * to trigger the download — the server-set Content-Disposition forces
   * "attachment" with a versioned filename.
   *
   * Returns `null` when the report doesn't exist. A report that has
   * never been published surfaces a `REPORT_BUNDLE_NOT_AVAILABLE`
   * GraphQL error (regenerate it to produce a bundle).
   *
   * @param graphId Graph identifier owning the Report.
   * @param reportId Report identifier (rpt_-prefixed ULID).
   * @param options.format Serialization flavor — `HOLON_JSONLD` (default, the
   *   holon, which carries the whole report), `TAVI` (the Project Tavi
   *   compiled model stamped at publish), or `XBRL_2_1`.
   * @param options.expiresIn Presigned URL lifetime, in seconds.
   */
  async getReportDownloadUrl(
    graphId: string,
    reportId: string,
    options: { format?: ReportDownloadFormat; expiresIn?: number } = {}
  ): Promise<ReportBundleDownloadResponse | null> {
    return this.gqlQuery(
      graphId,
      GetLedgerReportDownloadUrlDocument,
      {
        reportId,
        format: options.format ?? 'HOLON_JSONLD',
        expiresIn: options.expiresIn ?? 300,
      },
      'Get report download URL',
      (data) => {
        const node = data.reportDownloadUrl
        if (!node) return null
        return {
          downloadUrl: node.downloadUrl,
          expiresAt: node.expiresAt,
          contentType: node.contentType,
          format: node.format,
          generationCount: node.generationCount,
        }
      }
    )
  }

  /**
   * Share a published report to every member of a publish list. Each
   * target graph receives a snapshot copy of the report's facts.
   * Synchronous — per-recipient outcomes appear in the response's
   * `results` list.
   */
  async shareReport(
    graphId: string,
    reportId: string,
    publishListId: string
  ): Promise<ShareReportResponse> {
    const envelope = await this.callOperation('Share report', (o) =>
      shareReport({
        ...o,
        path: { graph_id: graphId },
        body: {
          report_id: reportId,
          publish_list_id: publishListId,
        } as Parameters<typeof shareReport>[0]['body'],
      })
    )
    return this.requireResult('Share report', envelope.result)
  }

  /**
   * Transition a Report's filing_status to 'filed' — locks the package.
   * Allowed from 'draft' or 'under_review'. Stamps filed_at + filed_by
   * from the auth context + server clock. Synchronous — resolves with
   * the updated report header.
   */
  async fileReport(graphId: string, reportId: string): Promise<ReportResponse> {
    const body: FileReportRequest = { report_id: reportId }
    const envelope = await this.callOperation('File report', (o) =>
      fileReport({ ...o, path: { graph_id: graphId }, body })
    )
    return this.requireResult('File report', envelope.result)
  }

  /**
   * Move a Report along the non-file legs of the filing lifecycle
   * (draft ↔ under_review, filed ↔ archived). Archiving takes a filed
   * report off the current list without deleting it; unarchiving returns
   * it to 'filed'. Use ``fileReport`` to file a draft so the audit fields
   * land cleanly. Synchronous — resolves with the updated report header.
   */
  async transitionFilingStatus(
    graphId: string,
    reportId: string,
    targetStatus: string
  ): Promise<ReportResponse> {
    const body: TransitionFilingStatusRequest = {
      report_id: reportId,
      target_status: targetStatus,
    }
    const envelope = await this.callOperation('Transition filing status', (o) =>
      transitionFilingStatus({ ...o, path: { graph_id: graphId }, body })
    )
    return this.requireResult('Transition filing status', envelope.result)
  }

  /** Check if a report was received via sharing (vs locally created). */
  isSharedReport(report: Report): boolean {
    return report.sourceGraphId !== null
  }

  /**
   * Withdraw a report previously shared to one recipient graph.
   *
   * The sender's half of the share controls: deletes the copy from that
   * recipient's schema and marks the share revoked. Scoped to a single
   * recipient, so withdrawing a distribution to a whole publish list is
   * one call per member.
   *
   * A recipient who already deleted the copy themselves is not an error —
   * the share is still marked revoked and `copyDeleted` comes back false.
   * The linked entity in the recipient's graph is left in place, so an
   * investor's declared holding survives the withdrawal.
   */
  async revokeReportShare(
    graphId: string,
    reportId: string,
    targetGraphId: string
  ): Promise<RevokeReportShareResponse> {
    const envelope = await this.callOperation('Revoke report share', (o) =>
      revokeReportShare({
        ...o,
        path: { graph_id: graphId },
        body: {
          report_id: reportId,
          target_graph_id: targetGraphId,
        } as Parameters<typeof revokeReportShare>[0]['body'],
      })
    )
    return this.requireResult('Revoke report share', envelope.result)
  }

  // ── Blocked source graphs ────────────────────────────────────────────
  //
  // Sharing is authorized capability-style — whoever holds this graph's id
  // can copy a published report into it — so these are the recipient's exit.

  /** List source graphs barred from sharing reports into this graph. */
  async listBlockedSourceGraphs(
    graphId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<BlockedSourceGraph[]> {
    const list = await this.gqlQuery(
      graphId,
      ListLedgerBlockedSourceGraphsDocument,
      {
        limit: options?.limit ?? 100,
        offset: options?.offset ?? 0,
      },
      'List blocked source graphs',
      (data) => data.blockedSourceGraphs
    )
    return list?.blockedSourceGraphs ?? []
  }

  /**
   * Bar a graph from sharing reports into this one.
   *
   * Read the sender's id off the `sourceGraphId` provenance field of a
   * report that was shared to you. Blocking is idempotent: re-blocking
   * returns `alreadyBlocked: true` and preserves the original `blockedAt`.
   *
   * With `purge`, every report already shared in from that source is
   * deleted along with its fact sets and facts; reports this graph
   * authored are never touched. `reason` is a note for your own records
   * and is never disclosed to the sender.
   */
  async blockSourceGraph(
    graphId: string,
    sourceGraphId: string,
    options?: { reason?: string; purge?: boolean }
  ): Promise<BlockSourceGraphResult> {
    const envelope = await this.callOperation('Block source graph', (o) =>
      blockSourceGraph({
        ...o,
        path: { graph_id: graphId },
        body: {
          source_graph_id: sourceGraphId,
          ...(options?.reason !== undefined ? { reason: options.reason } : {}),
          purge: options?.purge ?? false,
        } as Parameters<typeof blockSourceGraph>[0]['body'],
      })
    )
    return this.requireResult('Block source graph', envelope.result)
  }

  /**
   * Lift a block, allowing that source to share in again.
   *
   * Reports removed by an earlier purge are not restored — unblocking
   * reopens the channel, it does not undo.
   */
  async unblockSourceGraph(
    graphId: string,
    sourceGraphId: string
  ): Promise<BlockedSourceGraphResponse> {
    const envelope = await this.callOperation('Unblock source graph', (o) =>
      unblockSourceGraph({
        ...o,
        path: { graph_id: graphId },
        body: {
          source_graph_id: sourceGraphId,
        } as Parameters<typeof unblockSourceGraph>[0]['body'],
      })
    )
    return this.requireResult('Unblock source graph', envelope.result)
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
    const envelope = await this.callOperation('Create publish list', (o) =>
      createPublishList({ ...o, path: { graph_id: graphId }, body })
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
    // The server applies only the fields present, so an omitted key must
    // stay off the wire; an explicit `description: null` still clears it.
    const body: UpdatePublishListOperation = { list_id: listId }
    if (updates.name !== undefined) body.name = updates.name
    if (updates.description !== undefined) body.description = updates.description
    const envelope = await this.callOperation('Update publish list', (o) =>
      updatePublishList({ ...o, path: { graph_id: graphId }, body })
    )
    return this.requireResult('Update publish list', envelope.result)
  }

  /** Delete a publish list. */
  async deletePublishList(graphId: string, listId: string): Promise<DeleteResult> {
    const envelope = await this.callOperation('Delete publish list', (o) =>
      deletePublishList({ ...o, path: { graph_id: graphId }, body: { list_id: listId } })
    )
    return (envelope.result ?? { deleted: true }) as DeleteResult
  }

  /** Add target graphs as members of a publish list. */
  async addPublishListMembers(
    graphId: string,
    listId: string,
    targetGraphIds: string[]
  ): Promise<PublishListMemberResponse[]> {
    const envelope = await this.callOperation('Add publish list members', (o) =>
      addPublishListMembers({
        ...o,
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
    const envelope = await this.callOperation('Remove publish list member', (o) =>
      removePublishListMember({
        ...o,
        path: { graph_id: graphId },
        body: { list_id: listId, member_id: memberId },
      })
    )
    return (envelope.result ?? { deleted: true }) as DeleteResult
  }

  // ── Internal helpers ────────────────────────────────────────────────

  /**
   * Run an SDK-generated command call with this facade's per-call
   * transport options (`baseUrl`, credential, headers), throw a readable
   * error on non-2xx, and return the parsed envelope on success.
   *
   * Generic over the SDK call's response shape so typed ops (e.g.
   * `createEventBlock`, which returns
   * `OperationEnvelopeEventBlockEnvelope`) flow through with a typed
   * `envelope.result` instead of being widened to `unknown`. Untyped
   * ops continue to land as `OperationEnvelope` automatically.
   */
  private async callOperation<T>(
    label: string,
    call: (options: RestCallOptions) => Promise<{ data?: T; error?: unknown }>
  ): Promise<T> {
    const response = await call(await restCallOptions(this.config))
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

function rawObligationDetailToCamel(raw: RawObligationDetail) {
  return {
    eventId: raw.event_id,
    scheduleId: raw.schedule_id ?? null,
    scheduleName: raw.schedule_name ?? null,
    period: raw.period,
  }
}

function rawFiscalCalendarToCamel(raw: RawFiscalCalendar): LedgerFiscalCalendar {
  return {
    graphId: raw.graph_id,
    entityId: raw.entity_id ?? null,
    fiscalYearStartMonth: raw.fiscal_year_start_month,
    closedThrough: raw.closed_through ?? null,
    closeTarget: raw.close_target ?? null,
    gapPeriods: raw.gap_periods ?? 0,
    catchUpSequence: raw.catch_up_sequence ?? [],
    closeableNow: raw.closeable_now ?? false,
    blockers: raw.blockers ?? [],
    pendingObligationCount: raw.pending_obligation_count ?? 0,
    pendingObligationSample: (raw.pending_obligation_sample ?? []).map(rawObligationDetailToCamel),
    earliestPendingPeriod: raw.earliest_pending_period ?? null,
    strandedObligationCount: raw.stranded_obligation_count ?? 0,
    strandedObligationSample: (raw.stranded_obligation_sample ?? []).map(
      rawObligationDetailToCamel
    ),
    syncStaleDays: raw.sync_stale_days ?? null,
    reconcilingItemCount: raw.reconciling_item_count ?? 0,
    reconcilingItemSample: raw.reconciling_item_sample ?? [],
    unpostedSourceEventCount: raw.unposted_source_event_count ?? 0,
    unpostedSourceEventSample: raw.unposted_source_event_sample ?? [],
    unreconciledAccountCount: raw.unreconciled_account_count ?? 0,
    unreconciledAccountSample: raw.unreconciled_account_sample ?? [],
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

function reconciliationComponentToCamel(
  raw: ReconciliationComponent
): LedgerReconciliationComponent {
  return {
    name: raw.name,
    amount: raw.amount,
    structureId: raw.structure_id ?? null,
    eventId: raw.event_id ?? null,
    documentId: raw.document_id ?? null,
    note: raw.note ?? null,
  }
}

function reconciliationRowToCamel(raw: ReconciliationRow): LedgerReconciliationRow {
  return {
    elementId: raw.element_id ?? null,
    accountCode: raw.account_code ?? null,
    accountName: raw.account_name,
    sourceAccountId: raw.source_account_id ?? null,
    statement: raw.statement ?? null,
    ledgerBalance: raw.ledger_balance,
    independentBalance: raw.independent_balance,
    difference: raw.difference,
    status: raw.status,
    asOf: raw.as_of ?? null,
    components: (raw.components ?? []).map(reconciliationComponentToCamel),
  }
}

/**
 * Map the REST `ReconciliationSummary` (snake_case) onto the GraphQL shape
 * `listReconciliations` returns, so a read and a write give the same object.
 */
function reconciliationSummaryToCamel(raw: ReconciliationSummary): LedgerReconciliation {
  return {
    structureId: raw.structure_id,
    name: raw.name,
    scope: raw.scope,
    method: raw.method,
    elementId: raw.element_id ?? null,
    requiredForClose: raw.required_for_close,
    materiality: raw.materiality,
    period: raw.period,
    asOf: raw.as_of,
    status: raw.status,
    unreconciledDifference: raw.unreconciled_difference ?? null,
    accountsCompared: raw.accounts_compared ?? null,
    accountsDifferent: raw.accounts_different ?? null,
    ledgerBalance: raw.ledger_balance ?? null,
    independentBalance: raw.independent_balance ?? null,
    balanceAsOf: raw.balance_as_of ?? null,
    components: (raw.components ?? []).map(reconciliationComponentToCamel),
    source: raw.source ?? null,
    comparedAt: raw.compared_at ?? null,
    factSetId: raw.fact_set_id ?? null,
    comparedBy: raw.compared_by ?? null,
    comparedVia: raw.compared_via ?? null,
    reviewRequired: raw.review_required,
    separateReviewer: raw.separate_reviewer,
    reviewedBy: raw.reviewed_by ?? null,
    reviewedAt: raw.reviewed_at ?? null,
    selfReviewed: raw.self_reviewed ?? null,
    differences: (raw.differences ?? []).map(reconciliationRowToCamel),
  }
}

function reconciliationListToCamel(raw: ReconciliationListResponse): LedgerReconciliationList {
  return {
    period: raw.period,
    asOf: raw.as_of,
    notes: raw.notes ?? [],
    reconciliations: (raw.reconciliations ?? []).map(reconciliationSummaryToCamel),
  }
}

function reconciliationPreviewToCamel(
  raw: ReconciliationPreviewResponse
): LedgerReconciliationPreview {
  return {
    period: raw.period,
    asOf: raw.as_of,
    fiscalYearStart: raw.fiscal_year_start,
    method: raw.method,
    source: raw.source,
    reportBasis: raw.report_basis ?? null,
    lastSyncAt: raw.last_sync_at ?? null,
    accountsCompared: raw.accounts_compared,
    accountsTied: raw.accounts_tied,
    accountsDifferent: raw.accounts_different,
    totalDifference: raw.total_difference,
    rows: (raw.rows ?? []).map(reconciliationRowToCamel),
    notes: raw.notes ?? [],
  }
}

/**
 * Map the REST `LedgerEntityResponse` (snake_case) onto the GraphQL
 * `LedgerEntity` (camelCase) that `getEntity` returns, so callers can treat the
 * result of a read and a write interchangeably.
 */
function entityResponseToCamel(raw: LedgerEntityResponse): LedgerEntity {
  return {
    id: raw.id,
    name: raw.name,
    legalName: raw.legal_name ?? null,
    uri: raw.uri ?? null,
    cik: raw.cik ?? null,
    ticker: raw.ticker ?? null,
    exchange: raw.exchange ?? null,
    sic: raw.sic ?? null,
    sicDescription: raw.sic_description ?? null,
    category: raw.category ?? null,
    stateOfIncorporation: raw.state_of_incorporation ?? null,
    fiscalYearEnd: raw.fiscal_year_end ?? null,
    taxId: raw.tax_id ?? null,
    lei: raw.lei ?? null,
    industry: raw.industry ?? null,
    entityType: raw.entity_type ?? null,
    reportingStyleId: raw.reporting_style_id ?? null,
    phone: raw.phone ?? null,
    website: raw.website ?? null,
    status: raw.status ?? null,
    isParent: raw.is_parent ?? null,
    parentEntityId: raw.parent_entity_id ?? null,
    ownershipPct: raw.ownership_pct ?? null,
    source: raw.source ?? null,
    sourceId: raw.source_id ?? null,
    sourceGraphId: raw.source_graph_id ?? null,
    connectionId: raw.connection_id ?? null,
    addressLine1: raw.address_line1 ?? null,
    addressCity: raw.address_city ?? null,
    addressState: raw.address_state ?? null,
    addressPostalCode: raw.address_postal_code ?? null,
    addressCountry: raw.address_country ?? null,
    createdAt: raw.created_at ?? null,
    updatedAt: raw.updated_at ?? null,
  } as LedgerEntity
}
