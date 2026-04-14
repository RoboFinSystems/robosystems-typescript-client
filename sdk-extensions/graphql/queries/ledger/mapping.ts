import { gql } from 'graphql-request'

/**
 * Single mapping structure with all its associations. Returns null if
 * the structure doesn't exist.
 */
export const GET_MAPPING = gql`
  query GetLedgerMapping($mappingId: String!) {
    mapping(mappingId: $mappingId) {
      id
      name
      structureType
      taxonomyId
      totalAssociations
      associations {
        id
        structureId
        fromElementId
        fromElementName
        fromElementQname
        toElementId
        toElementName
        toElementQname
        associationType
        orderValue
        weight
        confidence
        suggestedBy
        approvedBy
      }
    }
  }
`
