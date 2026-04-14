'use client'

/**
 * Investor Client for RoboSystems API
 *
 * High-level facade for the RoboInvestor domain: portfolios, securities,
 * positions, and portfolio holdings aggregation. Follows the same
 * hybrid transport pattern as `LedgerClient`:
 *
 * - **Reads** go through GraphQL at `/extensions/{graph_id}/graphql`.
 * - **Writes** go through named operations at
 *   `/extensions/roboinvestor/{graph_id}/operations/{operation_name}`.
 *
 * Every write returns an `OperationEnvelope`; this facade unwraps
 * `envelope.result` and returns a typed shape derived from the GraphQL
 * codegen output (which is the source of truth for read payload types).
 */

import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import { ClientError } from 'graphql-request'
import {
  opCreatePortfolio,
  opCreatePosition,
  opCreateSecurity,
  opDeletePortfolio,
  opDeletePosition,
  opDeleteSecurity,
  opUpdatePortfolio,
  opUpdatePosition,
  opUpdateSecurity,
} from '../sdk/sdk.gen'
import type {
  CreatePortfolioRequest,
  CreatePositionRequest,
  CreateSecurityRequest,
  OperationEnvelope,
  UpdatePortfolioOperation,
  UpdatePositionOperation,
  UpdateSecurityOperation,
} from '../sdk/types.gen'
import type { TokenProvider } from './graphql/client'
import { GraphQLClientCache } from './graphql/client'
import {
  GetInvestorHoldingsDocument,
  GetInvestorPortfolioDocument,
  GetInvestorPositionDocument,
  GetInvestorSecurityDocument,
  ListInvestorPortfoliosDocument,
  ListInvestorPositionsDocument,
  ListInvestorSecuritiesDocument,
  type GetInvestorHoldingsQuery,
  type GetInvestorPortfolioQuery,
  type GetInvestorPositionQuery,
  type GetInvestorSecurityQuery,
  type ListInvestorPortfoliosQuery,
  type ListInvestorPositionsQuery,
  type ListInvestorSecuritiesQuery,
} from './graphql/generated/graphql'

// ── Friendly types derived from GraphQL codegen ────────────────────────

export type InvestorPortfolioList = NonNullable<ListInvestorPortfoliosQuery['portfolios']>
export type InvestorPortfolioSummary = InvestorPortfolioList['portfolios'][number]
export type InvestorPortfolio = NonNullable<GetInvestorPortfolioQuery['portfolio']>

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

  // ── Portfolios ──────────────────────────────────────────────────────

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

  /** Get a single portfolio by id. Returns null if it doesn't exist. */
  async getPortfolio(graphId: string, portfolioId: string): Promise<InvestorPortfolio | null> {
    return this.gqlQuery(
      graphId,
      GetInvestorPortfolioDocument,
      { portfolioId },
      'Get portfolio',
      (data) => data.portfolio
    )
  }

  /** Create a new portfolio. Returns the created portfolio. */
  async createPortfolio(graphId: string, body: CreatePortfolioRequest): Promise<InvestorPortfolio> {
    const envelope = await this.callOperation(
      'Create portfolio',
      opCreatePortfolio({ path: { graph_id: graphId }, body })
    )
    return rawToInvestorPortfolio(envelope.result as unknown as RawPortfolioResponse)
  }

  /** Update a portfolio's metadata. Only provided fields are applied. */
  async updatePortfolio(
    graphId: string,
    portfolioId: string,
    updates: Omit<UpdatePortfolioOperation, 'portfolio_id'>
  ): Promise<InvestorPortfolio> {
    const envelope = await this.callOperation(
      'Update portfolio',
      opUpdatePortfolio({
        path: { graph_id: graphId },
        body: {
          ...updates,
          portfolio_id: portfolioId,
        } as UpdatePortfolioOperation,
      })
    )
    return rawToInvestorPortfolio(envelope.result as unknown as RawPortfolioResponse)
  }

  /**
   * Delete a portfolio. Fails with 409 if the portfolio still has active
   * positions — dispose those first.
   */
  async deletePortfolio(graphId: string, portfolioId: string): Promise<{ deleted: boolean }> {
    const envelope = await this.callOperation(
      'Delete portfolio',
      opDeletePortfolio({
        path: { graph_id: graphId },
        body: { portfolio_id: portfolioId },
      })
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

  // ── Positions ───────────────────────────────────────────────────────

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

  /** Create a new position. */
  async createPosition(graphId: string, body: CreatePositionRequest): Promise<InvestorPosition> {
    const envelope = await this.callOperation(
      'Create position',
      opCreatePosition({ path: { graph_id: graphId }, body })
    )
    return rawToInvestorPosition(envelope.result as unknown as RawPositionResponse)
  }

  /** Update a position. Only provided fields are applied. */
  async updatePosition(
    graphId: string,
    positionId: string,
    updates: Omit<UpdatePositionOperation, 'position_id'>
  ): Promise<InvestorPosition> {
    const envelope = await this.callOperation(
      'Update position',
      opUpdatePosition({
        path: { graph_id: graphId },
        body: {
          ...updates,
          position_id: positionId,
        } as UpdatePositionOperation,
      })
    )
    return rawToInvestorPosition(envelope.result as unknown as RawPositionResponse)
  }

  /** Delete (dispose) a position. */
  async deletePosition(graphId: string, positionId: string): Promise<{ deleted: boolean }> {
    const envelope = await this.callOperation(
      'Delete position',
      opDeletePosition({
        path: { graph_id: graphId },
        body: { position_id: positionId },
      })
    )
    return (envelope.result ?? { deleted: true }) as { deleted: boolean }
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

// ── Module-private conversion helpers ─────────────────────────────────
//
// The RoboInvestor write operations (create/update portfolio, security,
// position) return Pydantic-serialized envelopes where `result` is in
// snake_case. The GraphQL-derived `InvestorPortfolio` / `InvestorSecurity`
// / `InvestorPosition` types are in camelCase (matching the read path).
//
// These helpers are the single place where we bridge the two naming
// conventions on the write path, mirroring the `rawFiscalCalendarToCamel`
// / `rawToClosingEntry` pattern in `LedgerClient`. Keeping the unsafe
// `as unknown as` cast localized to these helpers means a backend schema
// drift surfaces here rather than silently at every call site.

interface RawPortfolioResponse {
  id: string
  name: string
  description: string | null
  strategy: string | null
  inception_date: string | null
  base_currency: string
  created_at: string
  updated_at: string
}

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

interface RawPositionResponse {
  id: string
  portfolio_id: string
  security_id: string
  security_name: string | null
  entity_name: string | null
  quantity: number
  quantity_type: string
  cost_basis: number
  cost_basis_dollars: number
  currency: string
  current_value: number | null
  current_value_dollars: number | null
  valuation_date: string | null
  valuation_source: string | null
  acquisition_date: string | null
  disposition_date: string | null
  status: string
  notes: string | null
  created_at: string
  updated_at: string
}

function rawToInvestorPortfolio(raw: RawPortfolioResponse): InvestorPortfolio {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    strategy: raw.strategy,
    inceptionDate: raw.inception_date,
    baseCurrency: raw.base_currency,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
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

function rawToInvestorPosition(raw: RawPositionResponse): InvestorPosition {
  return {
    id: raw.id,
    portfolioId: raw.portfolio_id,
    securityId: raw.security_id,
    securityName: raw.security_name,
    entityName: raw.entity_name,
    quantity: raw.quantity,
    quantityType: raw.quantity_type,
    costBasis: raw.cost_basis,
    costBasisDollars: raw.cost_basis_dollars,
    currency: raw.currency,
    currentValue: raw.current_value,
    currentValueDollars: raw.current_value_dollars,
    valuationDate: raw.valuation_date,
    valuationSource: raw.valuation_source,
    acquisitionDate: raw.acquisition_date,
    dispositionDate: raw.disposition_date,
    status: raw.status,
    notes: raw.notes,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}
