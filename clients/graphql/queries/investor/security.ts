import { gql } from 'graphql-request'

/**
 * Single security by id. Returns null if it doesn't exist.
 */
export const GET_SECURITY = gql`
  query GetInvestorSecurity($securityId: String!) {
    security(securityId: $securityId) {
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
  }
`
