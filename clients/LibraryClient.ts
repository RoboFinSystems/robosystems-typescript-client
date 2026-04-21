'use client'

/**
 * Library Client for RoboSystems API
 *
 * Read-only facade for the taxonomy library — the shared reference
 * material (sfac6, fac, rs-gaap, …, mapping taxonomies) that lives
 * in the extensions DB public schema.
 *
 * **Two access modes** — picked by the caller's `graphId`:
 *
 * - `"library"` (sentinel, default) → canonical browse of the public
 *   schema. Route: `POST /extensions/library/graphql`.
 * - Any tenant `graph_id` (`"kg…"`) → tenant schema + public fallback
 *   via search_path. Returns the tenant's library copy plus any
 *   tenant extensions of library tables (CoA elements, anchor
 *   associations). Route: `POST /extensions/{graph_id}/graphql`.
 *
 * Every method takes the `graphId` explicitly so a single facade
 * instance can serve both modes — the per-graph `GraphQLClientCache`
 * handles endpoint resolution.
 *
 * **Read-only**: the library is immutable at the DB level (triggers
 * block UPDATE/DELETE on rows whose `created_by='library-seeder'`),
 * so there's no write surface here. Tenant-scope writes against
 * tenant-owned rows go through `LedgerClient` (CoA commands).
 */

import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import { ClientError } from 'graphql-request'
import type { TokenProvider } from './graphql/client'
import { GraphQLClientCache } from './graphql/client'
import {
  GetLibraryElementArcsDocument,
  GetLibraryElementClassificationsDocument,
  GetLibraryElementDocument,
  GetLibraryElementEquivalentsDocument,
  GetLibraryTaxonomyDocument,
  ListLibraryElementsDocument,
  ListLibraryTaxonomiesDocument,
  ListLibraryTaxonomyArcsDocument,
  SearchLibraryElementsDocument,
  type GetLibraryElementArcsQuery,
  type GetLibraryElementClassificationsQuery,
  type GetLibraryElementEquivalentsQuery,
  type GetLibraryElementQuery,
  type GetLibraryTaxonomyQuery,
  type ListLibraryElementsQuery,
  type ListLibraryTaxonomiesQuery,
  type ListLibraryTaxonomyArcsQuery,
  type SearchLibraryElementsQuery,
} from './graphql/generated/graphql'

// ── Friendly types derived from GraphQL codegen ────────────────────────
//
// These are the single source of truth for library payload shapes —
// consumers should import them from here rather than redeclaring.

export type LibraryTaxonomy = ListLibraryTaxonomiesQuery['libraryTaxonomies'][number]
export type LibraryTaxonomyDetail = NonNullable<GetLibraryTaxonomyQuery['libraryTaxonomy']>

export type LibraryElement = ListLibraryElementsQuery['libraryElements'][number]
export type LibraryElementDetail = NonNullable<GetLibraryElementQuery['libraryElement']>
export type LibrarySearchResult = SearchLibraryElementsQuery['searchLibraryElements'][number]

export type LibraryLabel = LibraryElementDetail['labels'][number]
export type LibraryReference = LibraryElementDetail['references'][number]

export type LibraryArc = ListLibraryTaxonomyArcsQuery['libraryTaxonomyArcs'][number]
export type LibraryElementArc = GetLibraryElementArcsQuery['libraryElementArcs'][number]
export type LibraryElementClassification =
  GetLibraryElementClassificationsQuery['libraryElementClassifications'][number]
export type LibraryEquivalence = NonNullable<
  GetLibraryElementEquivalentsQuery['libraryElementEquivalents']
>

// ── Caller-facing option shapes ────────────────────────────────────────

export interface ListLibraryElementsOptions {
  taxonomyId?: string
  source?: string
  /** FASB elementsOfFinancialStatements axis (asset | liability | equity | revenue | expense | …). */
  classification?: string
  /** Cash-flow activity axis (operatingActivity | investingActivity | financingActivity). */
  activityType?: string
  elementType?: string
  /** `true` → abstract only; `false` → concrete only; omit for both. */
  isAbstract?: boolean | null
  limit?: number
  offset?: number
  includeLabels?: boolean
  includeReferences?: boolean
}

export interface SearchLibraryElementsOptions {
  source?: string
  limit?: number
}

export interface ListLibraryTaxonomyArcsOptions {
  associationType?: string
  limit?: number
  offset?: number
}

export interface ListLibraryTaxonomyArcsResult {
  arcs: LibraryArc[]
  count: number
}

export interface GetLibraryElementIdentifier {
  id?: string
  qname?: string
}

// ── Client ──────────────────────────────────────────────────────────────

/**
 * Sentinel graph_id for the canonical library read surface. Passing
 * this to any LibraryClient method routes the GraphQL request to
 * `/extensions/library/graphql` and reads from the public schema only.
 */
export const LIBRARY_GRAPH_ID = 'library'

interface LibraryClientConfig {
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

export class LibraryClient {
  private config: LibraryClientConfig
  private gql: GraphQLClientCache

  constructor(config: LibraryClientConfig) {
    this.config = config
    this.gql = new GraphQLClientCache(config)
  }

  // ── Taxonomies ──────────────────────────────────────────────────────

  /**
   * List every taxonomy visible at this graph_id.
   *
   * On the `"library"` sentinel this is the canonical set (sfac6,
   * fac, rs-gaap, …). On a tenant graph_id this also includes the
   * tenant's own CoA and any custom taxonomies they've created.
   */
  async listLibraryTaxonomies(
    graphId: string,
    options?: { standard?: string; includeElementCount?: boolean }
  ): Promise<LibraryTaxonomy[]> {
    return this.gqlQuery(
      graphId,
      ListLibraryTaxonomiesDocument,
      {
        standard: options?.standard ?? null,
        includeElementCount: options?.includeElementCount ?? false,
      },
      'List library taxonomies',
      (data) => data.libraryTaxonomies
    )
  }

  /** Fetch one taxonomy by id or by (standard, version). */
  async getLibraryTaxonomy(
    graphId: string,
    identifier: { id?: string; standard?: string; version?: string },
    options?: { includeElementCount?: boolean }
  ): Promise<LibraryTaxonomyDetail | null> {
    return this.gqlQuery(
      graphId,
      GetLibraryTaxonomyDocument,
      {
        id: identifier.id ?? null,
        standard: identifier.standard ?? null,
        version: identifier.version ?? null,
        includeElementCount: options?.includeElementCount ?? false,
      },
      'Get library taxonomy',
      (data) => data.libraryTaxonomy
    )
  }

  // ── Elements ────────────────────────────────────────────────────────

  /** List library elements with filters + pagination. */
  async listLibraryElements(
    graphId: string,
    options?: ListLibraryElementsOptions
  ): Promise<LibraryElement[]> {
    return this.gqlQuery(
      graphId,
      ListLibraryElementsDocument,
      {
        taxonomyId: options?.taxonomyId ?? null,
        source: options?.source ?? null,
        classification: options?.classification ?? null,
        activityType: options?.activityType ?? null,
        elementType: options?.elementType ?? null,
        isAbstract: options?.isAbstract ?? null,
        limit: options?.limit ?? 50,
        offset: options?.offset ?? 0,
        includeLabels: options?.includeLabels ?? false,
        includeReferences: options?.includeReferences ?? false,
      },
      'List library elements',
      (data) => data.libraryElements
    )
  }

  /**
   * Substring search across qname, name, and standard label text.
   * Always includes labels + references inline — search UIs render them.
   */
  async searchLibraryElements(
    graphId: string,
    query: string,
    options?: SearchLibraryElementsOptions
  ): Promise<LibrarySearchResult[]> {
    return this.gqlQuery(
      graphId,
      SearchLibraryElementsDocument,
      {
        query,
        source: options?.source ?? null,
        limit: options?.limit ?? 50,
      },
      'Search library elements',
      (data) => data.searchLibraryElements
    )
  }

  /**
   * Get a single element by id or by qname. Returns null when neither
   * identifier is supplied or neither resolves.
   */
  async getLibraryElement(
    graphId: string,
    identifier: GetLibraryElementIdentifier
  ): Promise<LibraryElementDetail | null> {
    return this.gqlQuery(
      graphId,
      GetLibraryElementDocument,
      {
        id: identifier.id ?? null,
        qname: identifier.qname ?? null,
      },
      'Get library element',
      (data) => data.libraryElement
    )
  }

  // ── Arcs / Equivalence ──────────────────────────────────────────────

  /**
   * All arcs contributed by a taxonomy, plus their total count, in one
   * round-trip. For mapping taxonomies (fac-to-rs-gaap, sfac6-to-fac,
   * type-subtype) this is the primary browse view.
   */
  async listLibraryTaxonomyArcs(
    graphId: string,
    taxonomyId: string,
    options?: ListLibraryTaxonomyArcsOptions
  ): Promise<ListLibraryTaxonomyArcsResult> {
    return this.gqlQuery(
      graphId,
      ListLibraryTaxonomyArcsDocument,
      {
        taxonomyId,
        associationType: options?.associationType ?? null,
        limit: options?.limit ?? 200,
        offset: options?.offset ?? 0,
      },
      'List library taxonomy arcs',
      (data) => ({
        arcs: data.libraryTaxonomyArcs,
        count: data.libraryTaxonomyArcCount,
      })
    )
  }

  /**
   * All mapping arcs where this element is source or target. Covers
   * every `taxonomy_type='mapping'` bridge — equivalence,
   * general-special, type-subtype.
   */
  async getLibraryElementArcs(graphId: string, id: string): Promise<LibraryElementArc[]> {
    return this.gqlQuery(
      graphId,
      GetLibraryElementArcsDocument,
      { id },
      'Get library element arcs',
      (data) => data.libraryElementArcs
    )
  }

  /** All classification traits (category + identifier) assigned to this element. */
  async getLibraryElementClassifications(
    graphId: string,
    id: string
  ): Promise<LibraryElementClassification[]> {
    return this.gqlQuery(
      graphId,
      GetLibraryElementClassificationsDocument,
      { id },
      'Get library element classifications',
      (data) => data.libraryElementClassifications
    )
  }

  /** Equivalence fan-out (FAC ↔ us-gaap collapse). */
  async getLibraryElementEquivalents(
    graphId: string,
    id: string
  ): Promise<LibraryEquivalence | null> {
    return this.gqlQuery(
      graphId,
      GetLibraryElementEquivalentsDocument,
      { id },
      'Get library element equivalents',
      (data) => data.libraryElementEquivalents
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
}
