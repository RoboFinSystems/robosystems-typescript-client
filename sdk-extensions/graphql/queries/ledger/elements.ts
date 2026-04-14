import { gql } from 'graphql-request'

/**
 * Elements list with pagination. Filters narrow by taxonomy, source
 * system, classification, or abstract flag. Used by the mapping UI
 * to populate element pickers and by the CoA reconciliation views.
 */
export const LIST_ELEMENTS = gql`
  query ListLedgerElements(
    $taxonomyId: String
    $source: String
    $classification: String
    $isAbstract: Boolean
    $limit: Int! = 100
    $offset: Int! = 0
  ) {
    elements(
      taxonomyId: $taxonomyId
      source: $source
      classification: $classification
      isAbstract: $isAbstract
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
        classification
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
