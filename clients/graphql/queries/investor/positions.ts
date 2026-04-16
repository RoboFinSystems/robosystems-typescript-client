import { gql } from 'graphql-request'

/**
 * Positions list with pagination and filters.
 *
 * `portfolioId` narrows to a single portfolio; `securityId` narrows
 * to all positions holding a specific security (useful for "who owns
 * this security across all portfolios" queries).
 */
export const LIST_POSITIONS = gql`
  query ListInvestorPositions(
    $portfolioId: String
    $securityId: String
    $status: String
    $limit: Int! = 100
    $offset: Int! = 0
  ) {
    positions(
      portfolioId: $portfolioId
      securityId: $securityId
      status: $status
      limit: $limit
      offset: $offset
    ) {
      positions {
        id
        portfolioId
        securityId
        securityName
        entityName
        quantity
        quantityType
        costBasis
        costBasisDollars
        currency
        currentValue
        currentValueDollars
        valuationDate
        valuationSource
        acquisitionDate
        dispositionDate
        status
        notes
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
