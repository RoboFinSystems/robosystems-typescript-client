'use client'

/**
 * Report Client for RoboSystems API
 *
 * High-level facade for the report + publish-list surface:
 * create/list/view/regenerate/share/delete reports, render financial
 * statements, and manage publish lists (distribution lists for shared
 * reports). Reports consume ledger data (mappings, trial balance) as
 * inputs — use `LedgerClient` for those concerns.
 *
 * **Transport split:**
 * - **Reads** (listReports, getReport, getStatement, listPublishLists,
 *   getPublishList) go through GraphQL at
 *   `/extensions/{graph_id}/graphql`.
 * - **Writes** (createReport, regenerateReport, deleteReport, shareReport,
 *   and the publish-list CRUD) go through named operations at
 *   `/extensions/roboledger/{graph_id}/operations/{operation_name}`.
 *
 * Every write returns an `OperationEnvelope`; this facade unwraps
 * `envelope.result` for sync commands, or returns `{ operationId, status }`
 * for async dispatches (createReport, regenerateReport, shareReport).
 */

import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import { ClientError } from 'graphql-request'
import {
  opAddPublishListMembers,
  opCreatePublishList,
  opCreateReport,
  opDeletePublishList,
  opDeleteReport,
  opRegenerateReport,
  opRemovePublishListMember,
  opShareReport,
  opUpdatePublishList,
} from '../sdk/sdk.gen'
import type {
  AddPublishListMembersOperation,
  CreatePublishListRequest,
  CreateReportRequest,
  OperationEnvelope,
  UpdatePublishListOperation,
} from '../sdk/types.gen'
import { GraphQLClientCache } from './graphql/client'
import type { TokenProvider } from './graphql/client'
import {
  GetLedgerPublishListDocument,
  GetLedgerReportDocument,
  GetLedgerStatementDocument,
  ListLedgerPublishListsDocument,
  ListLedgerReportsDocument,
  type GetLedgerPublishListQuery,
  type GetLedgerReportQuery,
  type GetLedgerStatementQuery,
  type ListLedgerPublishListsQuery,
  type ListLedgerReportsQuery,
} from './graphql/generated/graphql'

// ── Types derived from GraphQL codegen ──────────────────────────────────

export type Report = NonNullable<GetLedgerReportQuery['report']>
export type ReportListItem = NonNullable<ListLedgerReportsQuery['reports']>['reports'][number]
export type StatementData = NonNullable<GetLedgerStatementQuery['statement']>
export type StatementPeriod = StatementData['periods'][number]
export type StatementRow = StatementData['rows'][number]

export type PublishList = NonNullable<
  ListLedgerPublishListsQuery['publishLists']
>['publishLists'][number]
export type PublishListDetail = NonNullable<GetLedgerPublishListQuery['publishList']>
export type PublishListMember = PublishListDetail['members'][number]

// ── Caller-facing option interfaces ─────────────────────────────────────

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
  /** When set, overrides periodStart/periodEnd/comparative with N explicit periods. */
  periods?: PeriodSpecInput[]
}

/**
 * Envelope around a report operation. `status === "completed"` means the
 * backend produced the report synchronously — `result` contains the
 * freshly-created report shape (same fields as `ReportListItem`), so
 * consumers can read `result?.id` immediately. For pending/failed
 * dispatches, `result` is null and consumers should subscribe to
 * `/v1/operations/{operationId}/stream` for progress.
 *
 * The loose `{ id; name; ... }` shape here intentionally mirrors the
 * GraphQL `report` field without pulling in every nullable child relation
 * — `create_report` and `regenerate_report` return a freshly-generated
 * row, not a fully-resolved GraphQL projection.
 */
export interface ReportOperationAck {
  operationId: string
  status: OperationEnvelope['status']
  /**
   * Synchronous command result. Populated for `status === "completed"`
   * dispatches where the backend produced the report inline.
   */
  result: Record<string, unknown> | null
}

// ── Client ──────────────────────────────────────────────────────────────

interface ReportClientConfig {
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

export class ReportClient {
  private config: ReportClientConfig
  private gql: GraphQLClientCache

  constructor(config: ReportClientConfig) {
    this.config = config
    this.gql = new GraphQLClientCache(config)
  }

  // ── Reports ─────────────────────────────────────────────────────────

  /**
   * Kick off report creation (async). Use the returned `operationId` to
   * subscribe to progress via SSE, then call `get()` once finished.
   */
  async create(graphId: string, options: CreateReportOptions): Promise<ReportOperationAck> {
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
      result: (envelope.result as Record<string, unknown> | null) ?? null,
    }
  }

  /** List all reports for a graph (includes received shared reports). */
  async list(graphId: string): Promise<ReportListItem[]> {
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
  async get(graphId: string, reportId: string): Promise<Report | null> {
    return this.gqlQuery(
      graphId,
      GetLedgerReportDocument,
      { reportId },
      'Get report',
      (data) => data.report
    )
  }

  /**
   * Render a financial statement — facts viewed through a structure.
   *
   * @param structureType - income_statement, balance_sheet, cash_flow_statement
   */
  async statement(
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
  async regenerate(
    graphId: string,
    reportId: string,
    periodStart?: string,
    periodEnd?: string
  ): Promise<ReportOperationAck> {
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
      result: (envelope.result as Record<string, unknown> | null) ?? null,
    }
  }

  /** Delete a report and its generated facts. */
  async delete(graphId: string, reportId: string): Promise<void> {
    await this.callOperation(
      'Delete report',
      opDeleteReport({
        path: { graph_id: graphId },
        body: { report_id: reportId },
      })
    )
  }

  /**
   * Share a published report to every member of a publish list (async).
   * Each target graph receives a snapshot copy of the report's facts.
   */
  async share(
    graphId: string,
    reportId: string,
    publishListId: string
  ): Promise<ReportOperationAck> {
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
      result: (envelope.result as Record<string, unknown> | null) ?? null,
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
  ): Promise<Record<string, unknown>> {
    const body: CreatePublishListRequest = {
      name,
      description: description ?? null,
    }
    const envelope = await this.callOperation(
      'Create publish list',
      opCreatePublishList({ path: { graph_id: graphId }, body })
    )
    return (envelope.result ?? {}) as Record<string, unknown>
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
  ): Promise<Record<string, unknown>> {
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
    return (envelope.result ?? {}) as Record<string, unknown>
  }

  /** Delete a publish list. */
  async deletePublishList(graphId: string, listId: string): Promise<void> {
    await this.callOperation(
      'Delete publish list',
      opDeletePublishList({
        path: { graph_id: graphId },
        body: { list_id: listId },
      })
    )
  }

  /** Add target graphs as members of a publish list. */
  async addMembers(
    graphId: string,
    listId: string,
    targetGraphIds: string[]
  ): Promise<Record<string, unknown>> {
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
    return (envelope.result ?? {}) as Record<string, unknown>
  }

  /** Remove a single member from a publish list. */
  async removeMember(
    graphId: string,
    listId: string,
    memberId: string
  ): Promise<{ deleted: boolean }> {
    const envelope = await this.callOperation(
      'Remove publish list member',
      opRemovePublishListMember({
        path: { graph_id: graphId },
        body: { list_id: listId, member_id: memberId },
      })
    )
    return (envelope.result ?? { deleted: true }) as { deleted: boolean }
  }

  // ── Internal helpers ────────────────────────────────────────────────

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
      const data = (await raw.call(client, document, variables)) as TData
      return pick(data)
    } catch (err) {
      if (err instanceof ClientError) {
        throw new Error(`${label} failed: ${JSON.stringify(err.response.errors ?? err.message)}`)
      }
      throw err
    }
  }

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
