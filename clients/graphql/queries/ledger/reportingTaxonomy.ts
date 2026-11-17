import { gql } from 'graphql-request'

/**
 * The locked US GAAP (`us-gaap`) reporting taxonomy for this graph, or
 * null when the graph carries none. Statements render through rs-gaap,
 * the canonical reporting framework, not through this taxonomy.
 */
export const GET_REPORTING_TAXONOMY = gql`
  query GetLedgerReportingTaxonomy {
    reportingTaxonomy {
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
`
