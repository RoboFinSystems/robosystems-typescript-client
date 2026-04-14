import { gql } from 'graphql-request'

/**
 * Single portfolio by id. Returns null if it doesn't exist.
 */
export const GET_PORTFOLIO = gql`
  query GetInvestorPortfolio($portfolioId: String!) {
    portfolio(portfolioId: $portfolioId) {
      id
      name
      description
      strategy
      inceptionDate
      baseCurrency
      createdAt
      updatedAt
    }
  }
`
