import { gql } from 'graphql-request'

/**
 * List all entities for this graph (bare list, no pagination).
 *
 * Optional `source` filter narrows to entities from a specific source
 * system (e.g. "linked" for entities auto-linked from shared reports).
 */
export const LIST_ENTITIES = gql`
  query ListLedgerEntities($source: String) {
    entities(source: $source) {
      id
      name
      legalName
      ticker
      cik
      industry
      entityType
      status
      isParent
      parentEntityId
      source
      sourceGraphId
      connectionId
      createdAt
      updatedAt
    }
  }
`
