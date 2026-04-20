import { gql } from 'graphql-request'

/**
 * List every arc contributed by a taxonomy (via its structures) + the
 * total count in one round-trip. For mapping taxonomies
 * (fac-to-rs-gaap, sfac6-to-fac, type-subtype) this is the primary
 * browse view — the arcs ARE what the taxonomy contributes.
 */
export const LIST_LIBRARY_TAXONOMY_ARCS = gql`
  query ListLibraryTaxonomyArcs(
    $taxonomyId: ID!
    $associationType: String
    $limit: Int! = 200
    $offset: Int! = 0
  ) {
    libraryTaxonomyArcCount(taxonomyId: $taxonomyId)
    libraryTaxonomyArcs(
      taxonomyId: $taxonomyId
      associationType: $associationType
      limit: $limit
      offset: $offset
    ) {
      id
      structureId
      structureName
      fromElementId
      fromElementQname
      fromElementName
      toElementId
      toElementQname
      toElementName
      associationType
      arcrole
      orderValue
      weight
    }
  }
`

/**
 * All mapping arcs where this element is source or target. Covers
 * every `taxonomy_type='mapping'` bridge — equivalence,
 * general-special, type-subtype. Each row is oriented from the
 * element's perspective (`direction` = 'outgoing' | 'incoming').
 */
export const GET_LIBRARY_ELEMENT_ARCS = gql`
  query GetLibraryElementArcs($id: ID!) {
    libraryElementArcs(id: $id) {
      id
      direction
      associationType
      arcrole
      taxonomyId
      taxonomyStandard
      taxonomyName
      structureId
      structureName
      peer {
        id
        qname
        name
        classification
        statementContext
        derivationRole
        source
      }
    }
  }
`

/**
 * Equivalence fan-out (FAC ↔ us-gaap collapse). Returns the element
 * and the peers that share an equivalence arc with it.
 */
export const GET_LIBRARY_ELEMENT_EQUIVALENTS = gql`
  query GetLibraryElementEquivalents($id: ID!) {
    libraryElementEquivalents(id: $id) {
      element {
        id
        qname
        name
        classification
        statementContext
        derivationRole
        source
      }
      equivalents {
        id
        qname
        name
        classification
        statementContext
        derivationRole
        source
      }
    }
  }
`
