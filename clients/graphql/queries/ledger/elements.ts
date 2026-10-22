import { gql } from 'graphql-request'

/**
 * Elements list with pagination. Filters narrow by taxonomy, source
 * system, classification, or abstract flag; `includeInactive` adds retired
 * accounts so one can be reactivated. Used by the mapping UI
 * to populate element pickers and by the CoA reconciliation views.
 */
export const LIST_ELEMENTS = gql`
  query ListLedgerElements(
    $taxonomyId: String
    $source: String
    $classification: String
    $isAbstract: Boolean
    $includeInactive: Boolean! = false
    $limit: Int! = 100
    $offset: Int! = 0
  ) {
    elements(
      taxonomyId: $taxonomyId
      source: $source
      classification: $classification
      isAbstract: $isAbstract
      includeInactive: $includeInactive
      limit: $limit
      offset: $offset
    ) {
      elements {
        id
        code
        name
        description
        qname
        namespace
        trait
        subClassification
        balanceType
        periodType
        isAbstract
        elementType
        source
        taxonomyId
        parentId
        depth
        isActive
        externalId
        externalSource
      }
      pagination {
        total
        limit
        offset
        hasMore
      }
    }
  }
`
