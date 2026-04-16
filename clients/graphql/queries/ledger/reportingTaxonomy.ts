import { gql } from 'graphql-request'

/**
 * The locked US GAAP reporting taxonomy for this graph (or null if
 * not loaded yet). This is the shared SFAC 6 → us-gaap hierarchy that
 * all reporting statements roll up through.
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
