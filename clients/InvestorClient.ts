'use client'

/**
 * Investor Client for RoboSystems API
 *
 * High-level facade for the RoboInvestor domain: portfolios (via the
 * Portfolio Block molecule), securities (Master Data CRUD), positions
 * (folded into Portfolio Block writes), and portfolio holdings
 * aggregation. Same hybrid transport pattern as `LedgerClient`:
 *
 * - **Reads** go through GraphQL at `/extensions/{graph_id}/graphql`.
 * - **Writes** go through named operations at
 *   `/extensions/roboinvestor/{graph_id}/operations/{operation_name}`.
 *
 * Portfolio + position writes flow through the **Portfolio Block**
 * envelope ops (`create-portfolio-block`, `update-portfolio-block`,
 * `delete-portfolio-block`); atom-level CRUD on portfolios/positions
 * has been retired. Securities remain Master Data CRUD.
 *
 * Every write returns an `OperationEnvelope`; this facade unwraps
 * `envelope.result` and returns a typed shape derived from the GraphQL
 * codegen output (which is the source of truth for read payload types).
 */

import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import { ClientError } from 'graphql-request'
import {
  opCreatePortfolioBlock,
  opCreateSecurity,
  opDeletePortfolioBlock,
  opDeleteSecurity,
  opUpdatePortfolioBlock,
  opUpdateSecurity,
} from '../sdk/sdk.gen'
import type {
  CreatePortfolioBlockRequest,
  CreateSecurityRequest,
  DeletePortfolioBlockOperation,
  OperationEnvelope,
  PortfolioBlockPortfolioPatch,
  PortfolioBlockPositions,
  UpdatePortfolioBlockOperation,
  UpdateSecurityOperation,
} from '../sdk/types.gen'
import type { TokenProvider } from './graphql/client'
import { GraphQLClientCache } from './graphql/client'
import {
  GetInvestorHoldingsDocument,
  GetInvestorPortfolioBlockDocument,
  GetInvestorPositionDocument,
  GetInvestorSecurityDocument,
  ListInvestorPortfoliosDocument,
  ListInvestorPositionsDocument,
  ListInvestorSecuritiesDocument,
  type GetInvestorHoldingsQuery,
  type GetInvestorPortfolioBlockQuery,
  type GetInvestorPositionQuery,
  type GetInvestorSecurityQuery,
  type ListInvestorPortfoliosQuery,
  type ListInvestorPositionsQuery,
  type ListInvestorSecuritiesQuery,
} from './graphql/generated/graphql'

// ── Friendly types derived from GraphQL codegen ────────────────────────

export type InvestorPortfolioList = NonNullable<ListInvestorPortfoliosQuery['portfolios']>
export type InvestorPortfolioSummary = InvestorPortfolioList['portfolios'][number]

export type InvestorPortfolioBlock = NonNullable<GetInvestorPortfolioBlockQuery['portfolioBlock']>
export type InvestorPositionBlock = InvestorPortfolioBlock['positions'][number]
export type InvestorSecurityLite = InvestorPositionBlock['security']
export type InvestorEntityLite = InvestorPortfolioBlock['owner']

export type InvestorSecurityList = NonNullable<ListInvestorSecuritiesQuery['securities']>
export type InvestorSecuritySummary = InvestorSecurityList['securities'][number]
export type InvestorSecurity = NonNullable<GetInvestorSecurityQuery['security']>

export type InvestorPositionList = NonNullable<ListInvestorPositionsQuery['positions']>
export type InvestorPositionSummary = InvestorPositionList['positions'][number]
export type InvestorPosition = NonNullable<GetInvestorPositionQuery['position']>

export type InvestorHoldings = NonNullable<GetInvestorHoldingsQuery['holdings']>
export type InvestorEntityHolding = InvestorHoldings['holdings'][number]
export type InvestorHeldSecurity = InvestorEntityHolding['securities'][number]

// ── Client ──────────────────────────────────────────────────────────────

interface InvestorClientConfig {
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

export class InvestorClient {
  private config: InvestorClientConfig
  private gql: GraphQLClientCache

  constructor(config: InvestorClientConfig) {
    this.config = config
    this.gql = new GraphQLClientCache(config)
  }

  // ── Portfolios (reads) ──────────────────────────────────────────────

  /** List portfolios with pagination. */
  async listPortfolios(
    graphId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<InvestorPortfolioList | null> {
    return this.gqlQuery(
      graphId,
      ListInvestorPortfoliosDocument,
      {
        limit: options?.limit ?? 100,
        offset: options?.offset ?? 0,
      },
      'List portfolios',
      (data) => data.portfolios
    )
  }

  /**
   * Get the Portfolio Block — molecule envelope with portfolio,
   * positions, securities, and entity references in a single read.
   * Returns null if the portfolio doesn't exist.
   */
  async getPortfolioBlock(
    graphId: string,
    portfolioId: string
  ): Promise<InvestorPortfolioBlock | null> {
    return this.gqlQuery(
      graphId,
      GetInvestorPortfolioBlockDocument,
      { portfolioId },
      'Get portfolio block',
      (data) => data.portfolioBlock
    )
  }

  // ── Portfolio Block (writes) ────────────────────────────────────────

  /**
   * Create a portfolio (with optional initial positions) atomically.
   * Each position references an existing security; this op never mints
   * securities — use `createSecurity` first.
   */
  async createPortfolioBlock(
    graphId: string,
    body: CreatePortfolioBlockRequest
  ): Promise<InvestorPortfolioBlock> {
    const envelope = await this.callOperation(
      'Create portfolio block',
      opCreatePortfolioBlock({ path: { graph_id: graphId }, body })
    )
    return rawToPortfolioBlock(envelope.result as unknown as RawPortfolioBlockResponse)
  }

  /**
   * Patch portfolio fields and apply position deltas (`add`, `update`,
   * `dispose`) atomically. All deltas roll back together on failure.
   * Pass only the fields/deltas you want changed — anything omitted
   * is left untouched.
   */
  async updatePortfolioBlock(
    graphId: string,
    portfolioId: string,
    updates: {
      portfolio?: PortfolioBlockPortfolioPatch
      positions?: PortfolioBlockPositions
    }
  ): Promise<InvestorPortfolioBlock> {
    const body: UpdatePortfolioBlockOperation = {
      portfolio_id: portfolioId,
      ...updates,
    }
    const envelope = await this.callOperation(
      'Update portfolio block',
      opUpdatePortfolioBlock({ path: { graph_id: graphId }, body })
    )
    return rawToPortfolioBlock(envelope.result as unknown as RawPortfolioBlockResponse)
  }

  /**
   * Cascade-delete the portfolio plus all of its positions. When the
   * portfolio still has active positions, the request must include
   * `confirmActivePositions: true` — safety belt to prevent accidental
   * cascade. Disposed-only portfolios delete without the flag.
   */
  async deletePortfolioBlock(
    graphId: string,
    portfolioId: string,
    options?: { confirmActivePositions?: boolean }
  ): Promise<{ deleted: boolean }> {
    const body: DeletePortfolioBlockOperation = {
      portfolio_id: portfolioId,
      confirm_active_positions: options?.confirmActivePositions ?? false,
    }
    const envelope = await this.callOperation(
      'Delete portfolio block',
      opDeletePortfolioBlock({ path: { graph_id: graphId }, body })
    )
    return (envelope.result ?? { deleted: true }) as { deleted: boolean }
  }

  // ── Securities ──────────────────────────────────────────────────────

  /** List securities with pagination and filters. */
  async listSecurities(
    graphId: string,
    options?: {
      entityId?: string
      securityType?: string
      isActive?: boolean
      limit?: number
      offset?: number
    }
  ): Promise<InvestorSecurityList | null> {
    return this.gqlQuery(
      graphId,
      ListInvestorSecuritiesDocument,
      {
        entityId: options?.entityId ?? null,
        securityType: options?.securityType ?? null,
        isActive: options?.isActive ?? null,
        limit: options?.limit ?? 100,
        offset: options?.offset ?? 0,
      },
      'List securities',
      (data) => data.securities
    )
  }

  /** Get a single security by id. Returns null if it doesn't exist. */
  async getSecurity(graphId: string, securityId: string): Promise<InvestorSecurity | null> {
    return this.gqlQuery(
      graphId,
      GetInvestorSecurityDocument,
      { securityId },
      'Get security',
      (data) => data.security
    )
  }

  /**
   * Create a new security. Passing `source_graph_id` auto-links to the
   * matching entity in the target graph.
   */
  async createSecurity(graphId: string, body: CreateSecurityRequest): Promise<InvestorSecurity> {
    const envelope = await this.callOperation(
      'Create security',
      opCreateSecurity({ path: { graph_id: graphId }, body })
    )
    return rawToInvestorSecurity(envelope.result as unknown as RawSecurityResponse)
  }

  /** Update a security's metadata. Only provided fields are applied. */
  async updateSecurity(
    graphId: string,
    securityId: string,
    updates: Omit<UpdateSecurityOperation, 'security_id'>
  ): Promise<InvestorSecurity> {
    const envelope = await this.callOperation(
      'Update security',
      opUpdateSecurity({
        path: { graph_id: graphId },
        body: {
          ...updates,
          security_id: securityId,
        } as UpdateSecurityOperation,
      })
    )
    return rawToInvestorSecurity(envelope.result as unknown as RawSecurityResponse)
  }

  /** Soft-delete a security (sets is_active=false). */
  async deleteSecurity(graphId: string, securityId: string): Promise<{ deleted: boolean }> {
    const envelope = await this.callOperation(
      'Delete security',
      opDeleteSecurity({
        path: { graph_id: graphId },
        body: { security_id: securityId },
      })
    )
    return (envelope.result ?? { deleted: true }) as { deleted: boolean }
  }

  // ── Positions (reads only — writes folded into Portfolio Block) ─────

  /** List positions with pagination and filters. */
  async listPositions(
    graphId: string,
    options?: {
      portfolioId?: string
      securityId?: string
      status?: string
      limit?: number
      offset?: number
    }
  ): Promise<InvestorPositionList | null> {
    return this.gqlQuery(
      graphId,
      ListInvestorPositionsDocument,
      {
        portfolioId: options?.portfolioId ?? null,
        securityId: options?.securityId ?? null,
        status: options?.status ?? null,
        limit: options?.limit ?? 100,
        offset: options?.offset ?? 0,
      },
      'List positions',
      (data) => data.positions
    )
  }

  /** Get a single position by id. Returns null if it doesn't exist. */
  async getPosition(graphId: string, positionId: string): Promise<InvestorPosition | null> {
    return this.gqlQuery(
      graphId,
      GetInvestorPositionDocument,
      { positionId },
      'Get position',
      (data) => data.position
    )
  }

  // ── Holdings (aggregation) ─────────────────────────────────────────

  /**
   * Get portfolio holdings grouped by entity. Returns the full list of
   * securities held and aggregate cost-basis / current-value for each
   * entity in the portfolio.
   */
  async getHoldings(graphId: string, portfolioId: string): Promise<InvestorHoldings | null> {
    return this.gqlQuery(
      graphId,
      GetInvestorHoldingsDocument,
      { portfolioId },
      'Get holdings',
      (data) => data.holdings
    )
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

// ── Module-private conversion helpers ─────────────────────────────────
//
// The RoboInvestor write operations return Pydantic-serialized envelopes
// where `result` is in snake_case. The GraphQL-derived `Investor*` types
// are in camelCase (matching the read path). These helpers are the single
// place where we bridge the two naming conventions on the write path,
// mirroring the equivalent helpers in `LedgerClient`. Keeping the unsafe
// `as unknown as` cast localized here means a backend schema drift surfaces
// in one place rather than silently at every call site.

interface RawSecurityResponse {
  id: string
  entity_id: string | null
  entity_name: string | null
  source_graph_id: string | null
  name: string
  security_type: string
  security_subtype: string | null
  terms: unknown
  is_active: boolean
  authorized_shares: number | null
  outstanding_shares: number | null
  created_at: string
  updated_at: string
}

interface RawEntityLite {
  id: string
  name: string
  source_graph_id: string | null
}

interface RawSecurityLite {
  id: string
  name: string
  security_type: string
  security_subtype: string | null
  is_active: boolean
  issuer: RawEntityLite | null
  source_graph_id: string | null
}

interface RawPositionBlock {
  id: string
  quantity: number
  quantity_type: string
  cost_basis_dollars: number
  current_value_dollars: number | null
  valuation_date: string | null
  valuation_source: string | null
  acquisition_date: string | null
  status: string
  notes: string | null
  security: RawSecurityLite
}

interface RawPortfolioBlockResponse {
  id: string
  name: string
  description: string | null
  strategy: string | null
  inception_date: string | null
  base_currency: string
  owner: RawEntityLite | null
  positions: RawPositionBlock[]
  total_cost_basis_dollars: number
  total_current_value_dollars: number | null
  active_position_count: number
  created_at: string
  updated_at: string
}

function rawToInvestorSecurity(raw: RawSecurityResponse): InvestorSecurity {
  return {
    id: raw.id,
    entityId: raw.entity_id,
    entityName: raw.entity_name,
    sourceGraphId: raw.source_graph_id,
    name: raw.name,
    securityType: raw.security_type,
    securitySubtype: raw.security_subtype,
    terms: raw.terms,
    isActive: raw.is_active,
    authorizedShares: raw.authorized_shares,
    outstandingShares: raw.outstanding_shares,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

function rawToEntityLite(raw: RawEntityLite | null): InvestorEntityLite {
  if (raw === null) return null
  return {
    id: raw.id,
    name: raw.name,
    sourceGraphId: raw.source_graph_id,
  }
}

function rawToSecurityLite(raw: RawSecurityLite): InvestorSecurityLite {
  return {
    id: raw.id,
    name: raw.name,
    securityType: raw.security_type,
    securitySubtype: raw.security_subtype,
    isActive: raw.is_active,
    issuer: rawToEntityLite(raw.issuer),
    sourceGraphId: raw.source_graph_id,
  }
}

function rawToPositionBlock(raw: RawPositionBlock): InvestorPositionBlock {
  return {
    id: raw.id,
    quantity: raw.quantity,
    quantityType: raw.quantity_type,
    costBasisDollars: raw.cost_basis_dollars,
    currentValueDollars: raw.current_value_dollars,
    valuationDate: raw.valuation_date,
    valuationSource: raw.valuation_source,
    acquisitionDate: raw.acquisition_date,
    status: raw.status,
    notes: raw.notes,
    security: rawToSecurityLite(raw.security),
  }
}

function rawToPortfolioBlock(raw: RawPortfolioBlockResponse): InvestorPortfolioBlock {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    strategy: raw.strategy,
    inceptionDate: raw.inception_date,
    baseCurrency: raw.base_currency,
    owner: rawToEntityLite(raw.owner),
    positions: raw.positions.map(rawToPositionBlock),
    totalCostBasisDollars: raw.total_cost_basis_dollars,
    totalCurrentValueDollars: raw.total_current_value_dollars,
    activePositionCount: raw.active_position_count,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}
