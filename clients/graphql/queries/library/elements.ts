import { gql } from 'graphql-request'

/**
 * List library elements with filters + pagination.
 *
 * `classification` filters on the FASB elementsOfFinancialStatements axis.
 * `activityType` filters on the cash-flow activity axis
 * (operatingActivity / investingActivity / financingActivity). Both axes
 * apply independently and can be combined.
 *
 * `isAbstract=true` → abstract only; `false` → concrete only; omit for both.
 *
 * `includeLabels` / `includeReferences` default `false`; the list view
 * doesn't render them and they add N+1-ish payload weight.
 */
export const LIST_LIBRARY_ELEMENTS = gql`
  query ListLibraryElements(
    $taxonomyId: ID
    $source: String
    $classification: String
    $activityType: String
    $elementType: String
    $isAbstract: Boolean
    $limit: Int! = 50
    $offset: Int! = 0
    $includeLabels: Boolean! = false
    $includeReferences: Boolean! = false
  ) {
    libraryElements(
      taxonomyId: $taxonomyId
      source: $source
      classification: $classification
      activityType: $activityType
      elementType: $elementType
      isAbstract: $isAbstract
      limit: $limit
      offset: $offset
      includeLabels: $includeLabels
      includeReferences: $includeReferences
    ) {
      id
      qname
      namespace
      name
      trait
      balanceType
      periodType
      isAbstract
      isMonetary
      elementType
      source
      taxonomyId
      parentId
      labels @include(if: $includeLabels) {
        role
        language
        text
      }
      references @include(if: $includeReferences) {
        refType
        citation
        uri
      }
    }
  }
`

/**
 * Substring search across qname, name, and standard label text.
 * Always returns labels + references inline — the search UI renders them.
 */
export const SEARCH_LIBRARY_ELEMENTS = gql`
  query SearchLibraryElements($query: String!, $source: String, $limit: Int! = 50) {
    searchLibraryElements(query: $query, source: $source, limit: $limit) {
      id
      qname
      namespace
      name
      trait
      balanceType
      periodType
      isAbstract
      isMonetary
      elementType
      source
      taxonomyId
      parentId
      labels {
        role
        language
        text
      }
      references {
        refType
        citation
        uri
      }
    }
  }
`

/**
 * Get a single element by id or by qname ('sfac6:Assets', etc).
 * Returns null when neither identifier resolves.
 */
export const GET_LIBRARY_ELEMENT = gql`
  query GetLibraryElement($id: ID, $qname: String) {
    libraryElement(id: $id, qname: $qname) {
      id
      qname
      namespace
      name
      trait
      balanceType
      periodType
      isAbstract
      isMonetary
      elementType
      source
      taxonomyId
      parentId
      labels {
        role
        language
        text
      }
      references {
        refType
        citation
        uri
      }
    }
  }
`
