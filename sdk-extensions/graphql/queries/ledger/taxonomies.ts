import { gql } from 'graphql-request'

/**
 * List active taxonomies. Optional `taxonomyType` filter narrows to
 * a single type (e.g. "reporting", "mapping", "chart_of_accounts").
 */
export const LIST_TAXONOMIES = gql`
  query ListLedgerTaxonomies($taxonomyType: String) {
    taxonomies(taxonomyType: $taxonomyType) {
      taxonomies {
        id
        name
        description
        taxonomyType
        version
        standard
        namespaceUri
        isShared
        isActive
        isLocked
        sourceTaxonomyId
        targetTaxonomyId
      }
    }
  }
`
