import { gql } from 'graphql-request'

/**
 * List library elements with filters + pagination.
 *
 * The three classification axes (`classification` / `statementContext` /
 * `derivationRole`) AND together. `isAbstract=true` → only abstract
 * grouping concepts; `false` → only concrete; omit for both.
 *
 * `includeLabels` / `includeReferences` default `false`; the list view
 * doesn't render them and they add N+1-ish payload weight.
 */
export const LIST_LIBRARY_ELEMENTS = gql`
  query ListLibraryElements(
    $taxonomyId: ID
    $source: String
    $classification: String
    $statementContext: String
    $derivationRole: String
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
      statementContext: $statementContext
      derivationRole: $derivationRole
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
      classification
      statementContext
      derivationRole
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
      classification
      statementContext
      derivationRole
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
      classification
      statementContext
      derivationRole
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
