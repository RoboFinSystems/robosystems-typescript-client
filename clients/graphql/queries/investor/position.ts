import { gql } from 'graphql-request'

/**
 * Single position by id. Returns null if it doesn't exist.
 */
export const GET_POSITION = gql`
  query GetInvestorPosition($positionId: String!) {
    position(positionId: $positionId) {
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
  }
`
