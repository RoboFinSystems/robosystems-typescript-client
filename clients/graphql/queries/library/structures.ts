import { gql } from 'graphql-request'

/**
 * List the structures (presentation/calculation/definition/dimension
 * hierarchies) contributed by a taxonomy. Each structure groups arcs
 * by ``arcRoleUri`` — for FAC presentation that's BS-classified,
 * IS-multistep, CashFlow, etc.
 *
 * Pass ``taxonomyId`` to scope to a single taxonomy; pass
 * ``structureType`` to filter to one kind of hierarchy.
 */
export const LIST_LIBRARY_STRUCTURES = gql`
  query ListLibraryStructures($taxonomyId: ID, $structureType: String) {
    libraryStructures(taxonomyId: $taxonomyId, structureType: $structureType) {
      id
      name
      structureType
      taxonomyId
      roleUri
      isActive
    }
  }
`

/**
 * Fetch one structure by id. Returns null when the id doesn't resolve.
 * Returns metadata only; pair with ``listLibraryTaxonomyArcs`` and a
 * ``structureId`` filter to load the structure's arcs.
 */
export const GET_LIBRARY_STRUCTURE = gql`
  query GetLibraryStructure($id: ID!) {
    libraryStructure(id: $id) {
      id
      name
      structureType
      taxonomyId
      roleUri
      isActive
    }
  }
`
