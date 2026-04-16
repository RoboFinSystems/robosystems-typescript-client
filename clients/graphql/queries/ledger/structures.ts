import { gql } from 'graphql-request'

/**
 * Structures list. Optional filters narrow by taxonomy or structure type
 * (e.g. "coa_mapping", "statement_income", "schedule").
 */
export const LIST_STRUCTURES = gql`
  query ListLedgerStructures($taxonomyId: String, $structureType: String) {
    structures(taxonomyId: $taxonomyId, structureType: $structureType) {
      structures {
        id
        name
        description
        structureType
        taxonomyId
        isActive
      }
    }
  }
`
