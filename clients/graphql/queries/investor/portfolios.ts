import { gql } from 'graphql-request'

/**
 * Portfolio list with pagination.
 */
export const LIST_PORTFOLIOS = gql`
  query ListInvestorPortfolios($limit: Int! = 100, $offset: Int! = 0) {
    portfolios(limit: $limit, offset: $offset) {
      portfolios {
        id
        name
        description
        strategy
        inceptionDate
        baseCurrency
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
