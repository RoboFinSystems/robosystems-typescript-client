import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LIBRARY_GRAPH_ID, LibraryClient } from './LibraryClient'

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

const sampleElement = {
  id: 'el_assets',
  qname: 'sfac6:Assets',
  namespace: 'sfac6',
  name: 'Assets',
  classification: 'asset',
  balanceType: 'debit',
  periodType: 'instant',
  isAbstract: false,
  isMonetary: true,
  elementType: 'concept',
  source: 'sfac6',
  taxonomyId: 'tax_sfac6_v1',
  parentId: null,
  labels: [] as Array<{ role: string; language: string; text: string }>,
  references: [] as Array<{ refType: string | null; citation: string; uri: string | null }>,
}

describe('LibraryClient', () => {
  let client: LibraryClient
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    client = new LibraryClient({
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

  // ── Taxonomies ──────────────────────────────────────────────────────

  describe('listLibraryTaxonomies', () => {
    it('returns taxonomies and routes to the library sentinel by default', async () => {
      mockFetch.mockResolvedValueOnce(
        gqlResponse({
          libraryTaxonomies: [
            {
              id: 'tax_sfac6_v1',
              name: 'SFAC 6',
              description: 'FASB Statement of Financial Accounting Concepts No. 6',
              standard: 'sfac6',
              version: 'v1',
              namespaceUri: 'http://xbrlsite.com/seattlemethod/sfac6#',
              taxonomyType: 'reporting',
              isShared: true,
              isActive: true,
              isLocked: true,
              elementCount: 10,
            },
          ],
        })
      )
      const taxonomies = await client.listLibraryTaxonomies(LIBRARY_GRAPH_ID)
      expect(taxonomies).toHaveLength(1)
      expect(taxonomies[0].standard).toBe('sfac6')

      const url = mockFetch.mock.calls[0][0] as URL
      expect(url.href).toBe('http://localhost:8000/extensions/library/graphql')
    })

    it('routes to tenant endpoint when a tenant graphId is passed', async () => {
      mockFetch.mockResolvedValueOnce(gqlResponse({ libraryTaxonomies: [] }))
      await client.listLibraryTaxonomies('kg1234567890abcdef1234')
      const url = mockFetch.mock.calls[0][0] as URL
      expect(url.href).toBe('http://localhost:8000/extensions/kg1234567890abcdef1234/graphql')
    })

    it('passes includeElementCount when requested', async () => {
      mockFetch.mockResolvedValueOnce(gqlResponse({ libraryTaxonomies: [] }))
      await client.listLibraryTaxonomies(LIBRARY_GRAPH_ID, { includeElementCount: true })
      const init = mockFetch.mock.calls[0][1] as RequestInit
      const body = JSON.parse(init.body as string)
      expect(body.variables.includeElementCount).toBe(true)
    })
  })

  describe('getLibraryTaxonomy', () => {
    it('returns null when not found', async () => {
      mockFetch.mockResolvedValueOnce(gqlResponse({ libraryTaxonomy: null }))
      expect(await client.getLibraryTaxonomy(LIBRARY_GRAPH_ID, { id: 'tax_missing' })).toBeNull()
    })
  })

  // ── Elements ────────────────────────────────────────────────────────

  describe('listLibraryElements', () => {
    it('returns the element list', async () => {
      mockFetch.mockResolvedValueOnce(gqlResponse({ libraryElements: [sampleElement] }))
      const elements = await client.listLibraryElements(LIBRARY_GRAPH_ID, {
        taxonomyId: 'tax_sfac6_v1',
      })
      expect(elements).toHaveLength(1)
      expect(elements[0].qname).toBe('sfac6:Assets')
    })

    it('defaults limit to 50 and sends the filters verbatim', async () => {
      mockFetch.mockResolvedValueOnce(gqlResponse({ libraryElements: [] }))
      await client.listLibraryElements(LIBRARY_GRAPH_ID, {
        classification: 'asset',
      })
      const init = mockFetch.mock.calls[0][1] as RequestInit
      const body = JSON.parse(init.body as string)
      expect(body.variables.limit).toBe(50)
      expect(body.variables.classification).toBe('asset')
    })
  })

  describe('searchLibraryElements', () => {
    it('returns search results', async () => {
      mockFetch.mockResolvedValueOnce(gqlResponse({ searchLibraryElements: [sampleElement] }))
      const results = await client.searchLibraryElements(LIBRARY_GRAPH_ID, 'assets')
      expect(results).toHaveLength(1)
      expect(results[0].qname).toBe('sfac6:Assets')
    })
  })

  describe('getLibraryElement', () => {
    it('resolves by qname', async () => {
      mockFetch.mockResolvedValueOnce(gqlResponse({ libraryElement: sampleElement }))
      const el = await client.getLibraryElement(LIBRARY_GRAPH_ID, { qname: 'sfac6:Assets' })
      expect(el?.qname).toBe('sfac6:Assets')
    })

    it('returns null when neither identifier resolves', async () => {
      mockFetch.mockResolvedValueOnce(gqlResponse({ libraryElement: null }))
      expect(await client.getLibraryElement(LIBRARY_GRAPH_ID, {})).toBeNull()
    })
  })

  // ── Arcs / Equivalence ──────────────────────────────────────────────

  describe('listLibraryTaxonomyArcs', () => {
    it('returns arcs + count in a single round-trip', async () => {
      mockFetch.mockResolvedValueOnce(
        gqlResponse({
          libraryTaxonomyArcCount: 1,
          libraryTaxonomyArcs: [
            {
              id: 'arc_1',
              structureId: 'str_1',
              structureName: 'fac-to-rs-gaap',
              fromElementId: 'el_1',
              fromElementQname: 'fac:CostOfRevenue',
              fromElementName: 'Cost of Revenue',
              toElementId: 'el_2',
              toElementQname: 'rs-gaap:CostOfGoodsSold',
              toElementName: 'Cost of Goods Sold',
              associationType: 'equivalence',
              arcrole: 'http://.../class-equivalentClass',
              orderValue: null,
              weight: null,
            },
          ],
        })
      )
      const result = await client.listLibraryTaxonomyArcs(LIBRARY_GRAPH_ID, 'tax_fac_to_rs_gaap')
      expect(result.count).toBe(1)
      expect(result.arcs).toHaveLength(1)
      expect(result.arcs[0].fromElementQname).toBe('fac:CostOfRevenue')
    })
  })

  describe('getLibraryElementArcs', () => {
    it('returns directed arcs oriented from this element', async () => {
      mockFetch.mockResolvedValueOnce(
        gqlResponse({
          libraryElementArcs: [
            {
              id: 'arc_1',
              direction: 'outgoing',
              associationType: 'equivalence',
              arcrole: null,
              taxonomyId: 'tax_fac_to_rs_gaap',
              taxonomyStandard: 'fac-to-rs-gaap',
              taxonomyName: 'FAC → rs-gaap',
              structureId: 'str_1',
              structureName: 'Equivalence bridge',
              peer: {
                id: 'el_peer',
                qname: 'rs-gaap:CostOfGoodsSold',
                name: 'Cost of Goods Sold',
                classification: 'expense',
                source: 'rs-gaap',
              },
            },
          ],
        })
      )
      const arcs = await client.getLibraryElementArcs(LIBRARY_GRAPH_ID, 'el_1')
      expect(arcs).toHaveLength(1)
      expect(arcs[0].direction).toBe('outgoing')
      expect(arcs[0].peer.qname).toBe('rs-gaap:CostOfGoodsSold')
    })
  })

  describe('getLibraryElementEquivalents', () => {
    it('returns null when no equivalents exist', async () => {
      mockFetch.mockResolvedValueOnce(gqlResponse({ libraryElementEquivalents: null }))
      expect(await client.getLibraryElementEquivalents(LIBRARY_GRAPH_ID, 'el_1')).toBeNull()
    })
  })

  // ── Error handling ─────────────────────────────────────────────────

  describe('error handling', () => {
    it('surfaces GraphQL errors with the operation label', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          errors: [{ message: 'Authentication required' }],
        })
      )
      await expect(client.listLibraryTaxonomies(LIBRARY_GRAPH_ID)).rejects.toThrow(
        /List library taxonomies failed/
      )
    })
  })
})
