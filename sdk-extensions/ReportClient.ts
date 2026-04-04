'use client'

/**
 * Report Client for RoboSystems API
 *
 * High-level client for report lifecycle: create, list, view statements,
 * regenerate, share, and delete. Reports consume ledger data (mappings,
 * trial balance) as inputs — use LedgerClient for those concerns.
 */

import {
  addPublishListMembers,
  createPublishList,
  createReport,
  deletePublishList,
  deleteReport,
  getPublishList,
  getReport,
  getStatement,
  listPublishLists,
  listReports,
  regenerateReport,
  removePublishListMember,
  shareReport,
  updatePublishList,
} from '../sdk/sdk.gen'
import type {
  CreateReportRequest,
  FactRowResponse,
  PublishListDetailResponse,
  PublishListListResponse,
  PublishListMemberResponse,
  PublishListResponse,
  RegenerateReportRequest,
  ReportListResponse,
  ReportResponse,
  ShareReportResponse,
  StatementResponse,
  StructureSummary,
  ValidationCheckResponse,
} from '../sdk/types.gen'

// ── Friendly types ──────────────────────────────────────────────────────

export interface Report {
  id: string
  name: string
  taxonomyId: string
  generationStatus: string
  periodType: string
  periodStart: string | null
  periodEnd: string | null
  comparative: boolean
  mappingId: string | null
  aiGenerated: boolean
  createdAt: string
  lastGenerated: string | null
  structures: Structure[]
  /** Entity name (source company for shared reports, own entity for native) */
  entityName: string | null
  /** Non-null when this report was shared from another graph */
  sourceGraphId: string | null
  sourceReportId: string | null
  sharedAt: string | null
}

// Structure type re-exported from LedgerClient
import type { Structure } from './LedgerClient'
export type { Structure } from './LedgerClient'

export interface StatementPeriod {
  start: string
  end: string
  label: string
}

export interface StatementRow {
  elementId: string
  elementQname: string
  elementName: string
  classification: string
  values: (number | null)[]
  isSubtotal: boolean
  depth: number
}

export interface StatementData {
  reportId: string
  structureId: string
  structureName: string
  structureType: string
  periods: StatementPeriod[]
  rows: StatementRow[]
  validation: {
    passed: boolean
    checks: string[]
    failures: string[]
    warnings: string[]
  } | null
  unmappedCount: number
}

export interface ShareResult {
  reportId: string
  results: Array<{
    targetGraphId: string
    status: 'shared' | 'error'
    error: string | null
    factCount: number
  }>
}

export interface PublishList {
  id: string
  name: string
  description: string | null
  memberCount: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface PublishListDetail extends PublishList {
  members: PublishListMember[]
}

export interface PublishListMember {
  id: string
  targetGraphId: string
  targetGraphName: string | null
  targetOrgName: string | null
  addedBy: string
  addedAt: string
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
  /** When set, overrides periodStart/periodEnd/comparative with N explicit periods. */
  periods?: PeriodSpecInput[]
}

// ── Client ──────────────────────────────────────────────────────────────

export class ReportClient {
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

  /**
   * Create a report — generates facts for all structures in the taxonomy.
   */
  async create(graphId: string, options: CreateReportOptions): Promise<Report> {
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

    const response = await createReport({
      path: { graph_id: graphId },
      body,
    })

    if (response.error) {
      throw new Error(`Create report failed: ${JSON.stringify(response.error)}`)
    }

    return this._toReport(response.data as ReportResponse)
  }

  /**
   * List all reports for a graph (includes received shared reports).
   */
  async list(graphId: string): Promise<Report[]> {
    const response = await listReports({
      path: { graph_id: graphId },
    })

    if (response.error) {
      throw new Error(`List reports failed: ${JSON.stringify(response.error)}`)
    }

    const data = response.data as ReportListResponse
    return (data.reports ?? []).map((r) => this._toReport(r))
  }

  /**
   * Get a report with its available structures.
   */
  async get(graphId: string, reportId: string): Promise<Report> {
    const response = await getReport({
      path: { graph_id: graphId, report_id: reportId },
    })

    if (response.error) {
      throw new Error(`Get report failed: ${JSON.stringify(response.error)}`)
    }

    return this._toReport(response.data as ReportResponse)
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
  ): Promise<StatementData> {
    const response = await getStatement({
      path: { graph_id: graphId, report_id: reportId, structure_type: structureType },
    })

    if (response.error) {
      throw new Error(`Get statement failed: ${JSON.stringify(response.error)}`)
    }

    const data = response.data as StatementResponse
    return {
      reportId: data.report_id,
      structureId: data.structure_id,
      structureName: data.structure_name,
      structureType: data.structure_type,
      periods: (data.periods ?? []).map((p) => ({
        start: p.start,
        end: p.end,
        label: p.label,
      })),
      rows: (data.rows ?? []).map((r: FactRowResponse) => ({
        elementId: r.element_id,
        elementQname: r.element_qname,
        elementName: r.element_name,
        classification: r.classification,
        values: r.values ?? [],
        isSubtotal: r.is_subtotal ?? false,
        depth: r.depth ?? 0,
      })),
      validation: data.validation
        ? {
            passed: (data.validation as ValidationCheckResponse).passed,
            checks: (data.validation as ValidationCheckResponse).checks,
            failures: (data.validation as ValidationCheckResponse).failures,
            warnings: (data.validation as ValidationCheckResponse).warnings,
          }
        : null,
      unmappedCount: data.unmapped_count ?? 0,
    }
  }

  /**
   * Regenerate a report with new period dates.
   */
  async regenerate(
    graphId: string,
    reportId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<Report> {
    const response = await regenerateReport({
      path: { graph_id: graphId, report_id: reportId },
      body: { period_start: periodStart, period_end: periodEnd } as RegenerateReportRequest,
    })

    if (response.error) {
      throw new Error(`Regenerate report failed: ${JSON.stringify(response.error)}`)
    }

    return this._toReport(response.data as ReportResponse)
  }

  /**
   * Delete a report and its generated facts.
   */
  async delete(graphId: string, reportId: string): Promise<void> {
    const response = await deleteReport({
      path: { graph_id: graphId, report_id: reportId },
    })

    if (response.error) {
      throw new Error(`Delete report failed: ${JSON.stringify(response.error)}`)
    }
  }

  /**
   * Share a published report to all members of a publish list (snapshot copy).
   */
  async share(graphId: string, reportId: string, publishListId: string): Promise<ShareResult> {
    const response = await shareReport({
      path: { graph_id: graphId, report_id: reportId },
      body: { publish_list_id: publishListId },
    })

    if (response.error) {
      throw new Error(`Share report failed: ${JSON.stringify(response.error)}`)
    }

    const data = response.data as ShareReportResponse
    return {
      reportId: data.report_id,
      results: (data.results ?? []).map((r) => ({
        targetGraphId: r.target_graph_id,
        status: r.status as 'shared' | 'error',
        error: r.error ?? null,
        factCount: r.fact_count ?? 0,
      })),
    }
  }

  /** Check if a report was received via sharing (vs locally created). */
  isSharedReport(report: Report): boolean {
    return report.sourceGraphId !== null
  }

  // ── Publish Lists ────────────────────────────────────────────────────

  async listPublishLists(graphId: string): Promise<PublishList[]> {
    const response = await listPublishLists({
      path: { graph_id: graphId },
    })
    if (response.error) {
      throw new Error(`List publish lists failed: ${JSON.stringify(response.error)}`)
    }
    const data = response.data as PublishListListResponse
    return (data.publish_lists ?? []).map((pl) => this._toPublishList(pl))
  }

  async createPublishList(
    graphId: string,
    name: string,
    description?: string
  ): Promise<PublishList> {
    const response = await createPublishList({
      path: { graph_id: graphId },
      body: { name, description: description ?? null },
    })
    if (response.error) {
      throw new Error(`Create publish list failed: ${JSON.stringify(response.error)}`)
    }
    return this._toPublishList(response.data as PublishListResponse)
  }

  async getPublishList(graphId: string, listId: string): Promise<PublishListDetail> {
    const response = await getPublishList({
      path: { graph_id: graphId, list_id: listId },
    })
    if (response.error) {
      throw new Error(`Get publish list failed: ${JSON.stringify(response.error)}`)
    }
    const data = response.data as PublishListDetailResponse
    return {
      ...this._toPublishList(data),
      members: (data.members ?? []).map((m) => this._toMember(m)),
    }
  }

  async updatePublishList(
    graphId: string,
    listId: string,
    updates: { name?: string; description?: string }
  ): Promise<PublishList> {
    const response = await updatePublishList({
      path: { graph_id: graphId, list_id: listId },
      body: updates,
    })
    if (response.error) {
      throw new Error(`Update publish list failed: ${JSON.stringify(response.error)}`)
    }
    return this._toPublishList(response.data as PublishListResponse)
  }

  async deletePublishList(graphId: string, listId: string): Promise<void> {
    const response = await deletePublishList({
      path: { graph_id: graphId, list_id: listId },
    })
    if (response.error) {
      throw new Error(`Delete publish list failed: ${JSON.stringify(response.error)}`)
    }
  }

  async addMembers(
    graphId: string,
    listId: string,
    targetGraphIds: string[]
  ): Promise<PublishListMember[]> {
    const response = await addPublishListMembers({
      path: { graph_id: graphId, list_id: listId },
      body: { target_graph_ids: targetGraphIds },
    })
    if (response.error) {
      throw new Error(`Add members failed: ${JSON.stringify(response.error)}`)
    }
    return ((response.data as PublishListMemberResponse[]) ?? []).map((m) => this._toMember(m))
  }

  async removeMember(graphId: string, listId: string, memberId: string): Promise<void> {
    const response = await removePublishListMember({
      path: { graph_id: graphId, list_id: listId, member_id: memberId },
    })
    if (response.error) {
      throw new Error(`Remove member failed: ${JSON.stringify(response.error)}`)
    }
  }

  private _toPublishList(pl: PublishListResponse): PublishList {
    return {
      id: pl.id,
      name: pl.name,
      description: pl.description ?? null,
      memberCount: pl.member_count ?? 0,
      createdBy: pl.created_by,
      createdAt: pl.created_at,
      updatedAt: pl.updated_at,
    }
  }

  private _toMember(m: PublishListMemberResponse): PublishListMember {
    return {
      id: m.id,
      targetGraphId: m.target_graph_id,
      targetGraphName: m.target_graph_name ?? null,
      targetOrgName: m.target_org_name ?? null,
      addedBy: m.added_by,
      addedAt: m.added_at,
    }
  }

  private _toReport(r: ReportResponse): Report {
    return {
      id: r.id,
      name: r.name,
      taxonomyId: r.taxonomy_id,
      generationStatus: r.generation_status,
      periodType: r.period_type,
      periodStart: r.period_start ?? null,
      periodEnd: r.period_end ?? null,
      comparative: r.comparative,
      mappingId: r.mapping_id ?? null,
      aiGenerated: r.ai_generated ?? false,
      createdAt: r.created_at,
      lastGenerated: r.last_generated ?? null,
      structures: (r.structures ?? []).map((s: StructureSummary) => ({
        id: s.id,
        name: s.name,
        structureType: s.structure_type,
      })),
      entityName: r.entity_name ?? null,
      sourceGraphId: r.source_graph_id ?? null,
      sourceReportId: r.source_report_id ?? null,
      sharedAt: r.shared_at ?? null,
    }
  }
}
