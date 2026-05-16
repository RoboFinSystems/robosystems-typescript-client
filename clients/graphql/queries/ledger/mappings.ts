import { gql } from 'graphql-request'

/**
 * All active coa_mapping structures. Returned as a StructureList (same
 * wire shape as `structures`, just filtered server-side to
 * `block_type = 'coa_mapping'`).
 */
export const LIST_MAPPINGS = gql`
  query ListLedgerMappings {
    mappings {
      structures {
        id
        name
        description
        blockType
        taxonomyId
        isActive
      }
    }
  }
`
