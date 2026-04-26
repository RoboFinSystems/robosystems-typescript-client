import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InvestorClient } from './InvestorClient'

function createMockResponse(data: unknown, options: { ok?: boolean; status?: number } = {}) {
  return {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    statusText: options.status === 200 ? 'OK' : 'Error',
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => data,
    text: async () => JSON.stringify(data),
    blob: async () => new Blob([JSON.stringify(data)]),
    arrayBuffer: async () => new TextEncoder().encode(JSON.stringify(data)).buffer,
  }
}

function gqlResponse<T>(data: T) {
  return createMockResponse({ data })
}

function envelopeResponse<T>(
  operation: string,
  result: T,
  status: 'completed' | 'pending' | 'failed' = 'completed'
) {
  return createMockResponse({
    operation,
    operationId: `op_${operation.toUpperCase()}_01`,
    status,
    result,
    at: '2026-04-14T12:00:00Z',
  })
}

const sampleBlockResult = {
  id: 'port_new',
  name: 'New Fund',
  description: null,
  strategy: 'growth',
  inception_date: '2026-01-01',
  base_currency: 'USD',
  owner: {
    id: 'ent_owner',
    name: 'Family Office',
    source_graph_id: null,
  },
  positions: [
    {
      id: 'pos_new',
      quantity: 100,
      quantity_type: 'shares',
      cost_basis_dollars: 1000,
      current_value_dollars: null,
      valuation_date: null,
      valuation_source: null,
      acquisition_date: '2026-01-01',
      status: 'active',
      notes: null,
      security: {
        id: 'sec_1',
        name: 'Series A Preferred',
        security_type: 'common_stock',
        security_subtype: null,
        is_active: true,
        issuer: {
          id: 'ent_issuer',
          name: 'ACME',
          source_graph_id: 'kg_acme',
        },
        source_graph_id: 'kg_acme',
      },
    },
  ],
  total_cost_basis_dollars: 1000,
  total_current_value_dollars: null,
  active_position_count: 1,
  created_at: '2026-04-14T00:00:00Z',
  updated_at: '2026-04-14T00:00:00Z',
}

describe('InvestorClient', () => {
  let client: InvestorClient
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    client = new InvestorClient({
      baseUrl: 'http://localhost:8000',
      token: 'test-token',
    })
    mockFetch = vi.fn()
    global.fetch = mockFetch as unknown as typeof fetch
    globalThis.fetch = mockFetch as unknown as typeof fetch
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── Portfolios (list / block read) ──────────────────────────────────

  describe('listPortfolios', () => {
    it('returns the paginated portfolio list', async () => {
      mockFetch.mockResolvedValueOnce(
        gqlResponse({
          portfolios: {
            portfolios: [
              {
                id: 'port_1',
                name: 'Seed Fund I',
                description: null,
                strategy: 'early-stage',
                inceptionDate: '2024-01-01',
                baseCurrency: 'USD',
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T00:00:00Z',
              },
            ],
            pagination: { total: 1, limit: 100, offset: 0, hasMore: false },
          },
        })
      )
      const list = await client.listPortfolios('graph_1')
      expect(list?.portfolios).toHaveLength(1)
      expect(list?.portfolios[0].name).toBe('Seed Fund I')
    })
  })

  describe('getPortfolioBlock', () => {
    it('returns null when not found', async () => {
      mockFetch.mockResolvedValueOnce(gqlResponse({ portfolioBlock: null }))
      expect(await client.getPortfolioBlock('graph_1', 'port_x')).toBeNull()
    })

    it('returns the molecule envelope when found', async () => {
      mockFetch.mockResolvedValueOnce(
        gqlResponse({
          portfolioBlock: {
            id: 'port_1',
            name: 'Seed Fund I',
            description: null,
            strategy: 'early-stage',
            inceptionDate: '2024-01-01',
            baseCurrency: 'USD',
            owner: { id: 'ent_owner', name: 'FO', sourceGraphId: null },
            positions: [],
            totalCostBasisDollars: 0,
            totalCurrentValueDollars: null,
            activePositionCount: 0,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        })
      )
      const block = await client.getPortfolioBlock('graph_1', 'port_1')
      expect(block?.id).toBe('port_1')
      expect(block?.owner?.name).toBe('FO')
      expect(block?.positions).toEqual([])
    })
  })

  // ── Portfolio Block writes ──────────────────────────────────────────

  describe('createPortfolioBlock', () => {
    it('converts the snake_case envelope result into a camelCase block', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('create-portfolio-block', sampleBlockResult))
      const block = await client.createPortfolioBlock('graph_1', {
        portfolio: { name: 'New Fund', strategy: 'growth' },
        positions: [{ security_id: 'sec_1', quantity: 100, cost_basis: 100000 }],
      })
      expect(block.id).toBe('port_new')
      expect(block.baseCurrency).toBe('USD')
      expect(block.owner?.name).toBe('Family Office')
      expect(block.positions).toHaveLength(1)
      expect(block.positions[0].quantityType).toBe('shares')
      expect(block.positions[0].security.issuer?.sourceGraphId).toBe('kg_acme')
      expect(block.activePositionCount).toBe(1)
    })

    it('POSTs to the create-portfolio-block operation URL', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('create-portfolio-block', sampleBlockResult))
      await client.createPortfolioBlock('graph_42', {
        portfolio: { name: 'New Fund' },
      })
      const req = mockFetch.mock.calls[0][0] as Request
      expect(req.url).toBe(
        'http://localhost:8000/extensions/roboinvestor/graph_42/operations/create-portfolio-block'
      )
      expect(req.method).toBe('POST')
    })
  })

  describe('updatePortfolioBlock', () => {
    it('merges the portfolioId into the body and converts the result', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('update-portfolio-block', {
          ...sampleBlockResult,
          name: 'Renamed Fund',
        })
      )
      const block = await client.updatePortfolioBlock('graph_1', 'port_1', {
        portfolio: { name: 'Renamed Fund' },
        positions: { dispose: [{ id: 'pos_old' }] },
      })
      expect(block.name).toBe('Renamed Fund')
      const req = mockFetch.mock.calls[0][0] as Request
      const body = JSON.parse(await req.text())
      expect(body.portfolio_id).toBe('port_1')
      expect(body.portfolio.name).toBe('Renamed Fund')
      expect(body.positions.dispose[0].id).toBe('pos_old')
    })
  })

  describe('deletePortfolioBlock', () => {
    it('returns deleted: true and does not send confirm flag by default', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('delete-portfolio-block', { deleted: true }))
      const result = await client.deletePortfolioBlock('graph_1', 'port_1')
      expect(result.deleted).toBe(true)
      const req = mockFetch.mock.calls[0][0] as Request
      const body = JSON.parse(await req.text())
      expect(body.portfolio_id).toBe('port_1')
      expect(body.confirm_active_positions).toBe(false)
    })

    it('forwards confirmActivePositions when set', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('delete-portfolio-block', { deleted: true }))
      await client.deletePortfolioBlock('graph_1', 'port_1', { confirmActivePositions: true })
      const req = mockFetch.mock.calls[0][0] as Request
      const body = JSON.parse(await req.text())
      expect(body.confirm_active_positions).toBe(true)
    })
  })

  // ── Securities ──────────────────────────────────────────────────────

  describe('listSecurities', () => {
    it('forwards entityId filter as a GraphQL variable', async () => {
      mockFetch.mockResolvedValueOnce(
        gqlResponse({
          securities: {
            securities: [],
            pagination: { total: 0, limit: 100, offset: 0, hasMore: false },
          },
        })
      )
      await client.listSecurities('graph_1', { entityId: 'ent_1' })
      // graphql-request uses positional fetch(url, init) rather than fetch(Request).
      const init = mockFetch.mock.calls[0][1] as RequestInit
      const body = JSON.parse(init.body as string)
      expect(body.variables.entityId).toBe('ent_1')
    })
  })

  describe('createSecurity', () => {
    it('converts the snake_case envelope result into a camelCase security', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('create-security', {
          id: 'sec_new',
          entity_id: 'ent_1',
          entity_name: 'ACME',
          source_graph_id: null,
          name: 'Series A Preferred',
          security_type: 'equity',
          security_subtype: 'preferred',
          terms: {},
          is_active: true,
          authorized_shares: 1000000,
          outstanding_shares: 500000,
          created_at: '2026-04-14T00:00:00Z',
          updated_at: '2026-04-14T00:00:00Z',
        })
      )
      const security = await client.createSecurity('graph_1', {
        name: 'Series A Preferred',
        security_type: 'equity',
        entity_id: 'ent_1',
      })
      expect(security.id).toBe('sec_new')
      expect(security.entityId).toBe('ent_1')
      expect(security.entityName).toBe('ACME')
      expect(security.securityType).toBe('equity')
      expect(security.securitySubtype).toBe('preferred')
      expect(security.isActive).toBe(true)
      expect(security.authorizedShares).toBe(1000000)
      expect(security.outstandingShares).toBe(500000)
    })
  })

  // ── Positions (read-only) ───────────────────────────────────────────

  describe('listPositions', () => {
    it('returns positions with pagination', async () => {
      mockFetch.mockResolvedValueOnce(
        gqlResponse({
          positions: {
            positions: [
              {
                id: 'pos_1',
                portfolioId: 'port_1',
                securityId: 'sec_1',
                securityName: 'Series A Preferred',
                entityName: 'ACME',
                quantity: 100,
                quantityType: 'shares',
                costBasis: 100000,
                costBasisDollars: 1000,
                currency: 'USD',
                currentValue: null,
                currentValueDollars: null,
                valuationDate: null,
                valuationSource: null,
                acquisitionDate: '2026-01-01',
                dispositionDate: null,
                status: 'active',
                notes: null,
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
              },
            ],
            pagination: { total: 1, limit: 100, offset: 0, hasMore: false },
          },
        })
      )
      const list = await client.listPositions('graph_1')
      expect(list?.positions).toHaveLength(1)
    })
  })

  // ── Holdings ────────────────────────────────────────────────────────

  describe('getHoldings', () => {
    it('returns the aggregated holdings', async () => {
      mockFetch.mockResolvedValueOnce(
        gqlResponse({
          holdings: {
            totalEntities: 1,
            totalPositions: 2,
            holdings: [
              {
                entityId: 'ent_1',
                entityName: 'ACME',
                sourceGraphId: null,
                totalCostBasisDollars: 2000,
                totalCurrentValueDollars: 2500,
                positionCount: 2,
                securities: [
                  {
                    securityId: 'sec_1',
                    securityName: 'Series A Preferred',
                    securityType: 'equity',
                    quantity: 100,
                    quantityType: 'shares',
                    costBasisDollars: 1000,
                    currentValueDollars: 1250,
                  },
                ],
              },
            ],
          },
        })
      )
      const holdings = await client.getHoldings('graph_1', 'port_1')
      expect(holdings?.totalEntities).toBe(1)
      expect(holdings?.holdings[0].securities).toHaveLength(1)
    })
  })

  describe('constructor', () => {
    it('creates with minimal config', () => {
      const c = new InvestorClient({ baseUrl: 'http://localhost:8000' })
      expect(c).toBeInstanceOf(InvestorClient)
    })
  })
})
