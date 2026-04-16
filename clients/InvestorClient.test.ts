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

  // ── Portfolios ──────────────────────────────────────────────────────

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

  describe('getPortfolio', () => {
    it('returns null when not found', async () => {
      mockFetch.mockResolvedValueOnce(gqlResponse({ portfolio: null }))
      expect(await client.getPortfolio('graph_1', 'port_x')).toBeNull()
    })
  })

  describe('createPortfolio', () => {
    it('converts the snake_case envelope result into a camelCase portfolio', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('create-portfolio', {
          id: 'port_new',
          name: 'New Fund',
          description: null,
          strategy: null,
          inception_date: '2026-01-01',
          base_currency: 'USD',
          created_at: '2026-04-14T00:00:00Z',
          updated_at: '2026-04-14T00:00:00Z',
        })
      )
      const portfolio = await client.createPortfolio('graph_1', { name: 'New Fund' })
      expect(portfolio.id).toBe('port_new')
      expect(portfolio.name).toBe('New Fund')
      expect(portfolio.inceptionDate).toBe('2026-01-01')
      expect(portfolio.baseCurrency).toBe('USD')
      expect(portfolio.createdAt).toBe('2026-04-14T00:00:00Z')
    })

    it('POSTs to the roboinvestor operations URL', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('create-portfolio', {
          id: 'port_new',
          name: 'New Fund',
          description: null,
          strategy: null,
          inception_date: null,
          base_currency: 'USD',
          created_at: '2026-04-14T00:00:00Z',
          updated_at: '2026-04-14T00:00:00Z',
        })
      )
      await client.createPortfolio('graph_42', { name: 'New Fund' })
      const req = mockFetch.mock.calls[0][0] as Request
      expect(req.url).toBe(
        'http://localhost:8000/extensions/roboinvestor/graph_42/operations/create-portfolio'
      )
      expect(req.method).toBe('POST')
    })
  })

  describe('updatePortfolio', () => {
    it('merges the portfolioId into the body and converts the result', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('update-portfolio', {
          id: 'port_1',
          name: 'Renamed',
          description: null,
          strategy: null,
          inception_date: null,
          base_currency: 'USD',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2026-04-14T00:00:00Z',
        })
      )
      const result = await client.updatePortfolio('graph_1', 'port_1', { name: 'Renamed' })
      expect(result.name).toBe('Renamed')
      expect(result.baseCurrency).toBe('USD')
      expect(result.updatedAt).toBe('2026-04-14T00:00:00Z')
      const req = mockFetch.mock.calls[0][0] as Request
      const body = JSON.parse(await req.text())
      expect(body.portfolio_id).toBe('port_1')
      expect(body.name).toBe('Renamed')
    })
  })

  describe('deletePortfolio', () => {
    it('returns deleted: true', async () => {
      mockFetch.mockResolvedValueOnce(envelopeResponse('delete-portfolio', { deleted: true }))
      const result = await client.deletePortfolio('graph_1', 'port_1')
      expect(result.deleted).toBe(true)
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

  // ── Positions ───────────────────────────────────────────────────────

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

  describe('createPosition', () => {
    it('converts the snake_case envelope result into a camelCase position', async () => {
      mockFetch.mockResolvedValueOnce(
        envelopeResponse('create-position', {
          id: 'pos_new',
          portfolio_id: 'port_1',
          security_id: 'sec_1',
          security_name: 'Series A Preferred',
          entity_name: 'ACME',
          quantity: 100,
          quantity_type: 'shares',
          cost_basis: 100000,
          cost_basis_dollars: 1000,
          currency: 'USD',
          current_value: null,
          current_value_dollars: null,
          valuation_date: null,
          valuation_source: null,
          acquisition_date: '2026-01-01',
          disposition_date: null,
          status: 'active',
          notes: null,
          created_at: '2026-04-14T00:00:00Z',
          updated_at: '2026-04-14T00:00:00Z',
        })
      )
      const position = await client.createPosition('graph_1', {
        portfolio_id: 'port_1',
        security_id: 'sec_1',
        quantity: 100,
      })
      expect(position.id).toBe('pos_new')
      expect(position.portfolioId).toBe('port_1')
      expect(position.securityId).toBe('sec_1')
      expect(position.securityName).toBe('Series A Preferred')
      expect(position.entityName).toBe('ACME')
      expect(position.quantityType).toBe('shares')
      expect(position.costBasis).toBe(100000)
      expect(position.costBasisDollars).toBe(1000)
      expect(position.acquisitionDate).toBe('2026-01-01')
      expect(position.currentValue).toBeNull()
      expect(position.status).toBe('active')
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
