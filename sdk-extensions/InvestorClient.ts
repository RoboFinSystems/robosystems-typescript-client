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
  token?: string
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
    return envelope.result as unknown as InvestorPortfolio
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
    return envelope.result as unknown as InvestorPortfolio
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
    return envelope.result as unknown as InvestorSecurity
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
    return envelope.result as unknown as InvestorSecurity
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
    return envelope.result as unknown as InvestorPosition
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
    return envelope.result as unknown as InvestorPosition
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
