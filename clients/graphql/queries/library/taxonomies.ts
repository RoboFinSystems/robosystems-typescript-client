import { gql } from 'graphql-request'

/**
 * List every curated taxonomy visible at the current graph_id:
 * - On `graph_id="library"` → canonical library (public schema).
 * - On a tenant graph_id → tenant's library copy + any tenant
 *   taxonomies (e.g. the entity's CoA).
 *
 * Pass `includeElementCount: true` to populate the `elementCount` field
 * (one COUNT(*) per row — skip for list UIs that don't render it).
 */
export const LIST_LIBRARY_TAXONOMIES = gql`
  query ListLibraryTaxonomies($standard: String, $includeElementCount: Boolean! = false) {
    libraryTaxonomies(standard: $standard, includeElementCount: $includeElementCount) {
      id
      name
      description
      standard
      version
      namespaceUri
      taxonomyType
      isShared
      isActive
      isLocked
      elementCount
    }
  }
`

/**
 * Fetch one taxonomy by id OR by (standard, version). Returns null
 * when neither a matching id nor a (standard, version) pair is found.
 */
export const GET_LIBRARY_TAXONOMY = gql`
  query GetLibraryTaxonomy(
    $id: ID
    $standard: String
    $version: String
    $includeElementCount: Boolean! = false
  ) {
    libraryTaxonomy(
      id: $id
      standard: $standard
      version: $version
      includeElementCount: $includeElementCount
    ) {
      id
      name
      description
      standard
      version
      namespaceUri
      taxonomyType
      isShared
      isActive
      isLocked
      elementCount
    }
  }
`
