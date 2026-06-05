import { gql } from 'graphql-request'

/**
 * List the structures (extended link roles) contributed by a taxonomy —
 * the named presentation/calculation hierarchies (BS-classified,
 * IS-multistep, CashFlow, the calc DAG roots, etc). Pair a structure's
 * ``id`` with ``listLibraryTaxonomyArcs`` + a ``structureId`` filter to
 * load just that hierarchy's arcs — this is how the hierarchy view scopes
 * a tree to one role at a time.
 *
 * Pass ``taxonomyId`` to scope to a single taxonomy; pass ``blockType``
 * to filter to one statement kind (balance_sheet, income_statement,
 * cash_flow_statement, …).
 */
export const LIST_LIBRARY_STRUCTURES = gql`
  query ListLibraryStructures($taxonomyId: ID, $blockType: String) {
    libraryStructures(taxonomyId: $taxonomyId, blockType: $blockType) {
      id
      name
      blockType
      taxonomyId
      roleUri
      isActive
    }
  }
`

/**
 * Fetch one structure by id. Returns null when the id doesn't resolve.
 * Metadata only — pair with ``listLibraryTaxonomyArcs`` + a ``structureId``
 * filter to load the structure's arcs.
 */
export const GET_LIBRARY_STRUCTURE = gql`
  query GetLibraryStructure($id: ID!) {
    libraryStructure(id: $id) {
      id
      name
      blockType
      taxonomyId
      roleUri
      isActive
    }
  }
`
