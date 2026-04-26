import { gql } from 'graphql-request'

/**
 * Portfolio Block — molecule envelope for a portfolio.
 *
 * Returns the portfolio plus its active positions, the underlying
 * securities, and the owner / issuer entity references in a single
 * read. `sourceGraphId` on `SecurityLite` and `EntityLite` is the
 * cross-graph bridge that lets investor flows traverse to the
 * issuer's RoboLedger graph.
 */
export const GET_PORTFOLIO_BLOCK = gql`
  query GetInvestorPortfolioBlock($portfolioId: String!) {
    portfolioBlock(portfolioId: $portfolioId) {
      id
      name
      description
      strategy
      inceptionDate
      baseCurrency
      owner {
        id
        name
        sourceGraphId
      }
      positions {
        id
        quantity
        quantityType
        costBasisDollars
        currentValueDollars
        valuationDate
        valuationSource
        acquisitionDate
        status
        notes
        security {
          id
          name
          securityType
          securitySubtype
          isActive
          sourceGraphId
          issuer {
            id
            name
            sourceGraphId
          }
        }
      }
      totalCostBasisDollars
      totalCurrentValueDollars
      activePositionCount
      createdAt
      updatedAt
    }
  }
`
