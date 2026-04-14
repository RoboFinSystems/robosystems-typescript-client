import { gql } from 'graphql-request'

/**
 * CoA elements that aren't yet mapped to any reporting concept.
 *
 * Optional `mappingId` scopes the check to a single mapping structure;
 * when omitted, checks across all mapping structures. Used by the
 * MappingAgent workflow and the manual mapping UI.
 */
export const LIST_UNMAPPED_ELEMENTS = gql`
  query ListLedgerUnmappedElements($mappingId: String) {
    unmappedElements(mappingId: $mappingId) {
      id
      code
      name
      classification
      balanceType
      externalSource
      suggestedTargets {
        elementId
        qname
        name
        confidence
      }
    }
  }
`
