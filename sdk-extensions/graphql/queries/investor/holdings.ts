import { gql } from 'graphql-request'

/**
 * Portfolio holdings grouped by entity. For each entity held, returns
 * the full list of securities and aggregate cost basis / current value.
 *
 * `portfolioId` is required — this always operates on a single portfolio
 * (there's no "holdings across all portfolios" aggregate today).
 */
export const GET_HOLDINGS = gql`
  query GetInvestorHoldings($portfolioId: String!) {
    holdings(portfolioId: $portfolioId) {
      totalEntities
      totalPositions
      holdings {
        entityId
        entityName
        sourceGraphId
        totalCostBasisDollars
        totalCurrentValueDollars
        positionCount
        securities {
          securityId
          securityName
          securityType
          quantity
          quantityType
          costBasisDollars
          currentValueDollars
        }
      }
    }
  }
`
