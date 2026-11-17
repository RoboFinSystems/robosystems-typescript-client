import { gql } from 'graphql-request'

/**
 * Structures list. Optional filters narrow by taxonomy or structure type
 * (e.g. "coa_mapping", "income_statement", "schedule").
 */
export const LIST_STRUCTURES = gql`
  query ListLedgerStructures($taxonomyId: String, $blockType: String) {
    structures(taxonomyId: $taxonomyId, blockType: $blockType) {
      structures {
        id
        name
        description
        blockType
        taxonomyId
        isActive
        framework
      }
    }
  }
`
