import { gql } from 'graphql-request'

/**
 * All active coa_mapping structures, the book mapping first. Returned as a
 * StructureList (same wire shape as `structures`, just filtered server-side
 * to `block_type = 'coa_mapping'`). `framework` is the reporting framework
 * each maps the chart into; a chart holds one mapping per framework.
 * `entityId` is the entity whose chart it maps from, and `$entityId`
 * keeps one entity's mappings.
 */
export const LIST_MAPPINGS = gql`
  query ListLedgerMappings($entityId: String) {
    mappings(entityId: $entityId) {
      structures {
        id
        name
        description
        blockType
        taxonomyId
        isActive
        framework
        entityId
      }
    }
  }
`
