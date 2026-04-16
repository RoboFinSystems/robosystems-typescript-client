import { gql } from 'graphql-request'

/**
 * Securities list with pagination and filters.
 *
 * `entityId` narrows to securities linked to a specific entity (useful
 * for cross-graph research into a company's equity structure).
 * `terms` is a JSON scalar — consume as an untyped dict in the facade.
 */
export const LIST_SECURITIES = gql`
  query ListInvestorSecurities(
    $entityId: String
    $securityType: String
    $isActive: Boolean
    $limit: Int! = 100
    $offset: Int! = 0
  ) {
    securities(
      entityId: $entityId
      securityType: $securityType
      isActive: $isActive
      limit: $limit
      offset: $offset
    ) {
      securities {
        id
        entityId
        entityName
        sourceGraphId
        name
        securityType
        securitySubtype
        terms
        isActive
        authorizedShares
        outstandingShares
        createdAt
        updatedAt
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
