import { gql } from 'graphql-request'

/**
 * CoA → GAAP mapping coverage stats. Used by the MappingAgent to
 * decide "am I done yet?" and by the close screen to show progress.
 */
export const GET_MAPPING_COVERAGE = gql`
  query GetLedgerMappingCoverage($mappingId: String!) {
    mappingCoverage(mappingId: $mappingId) {
      mappingId
      totalCoaElements
      mappedCount
      unmappedCount
      coveragePercent
      highConfidence
      mediumConfidence
      lowConfidence
    }
  }
`
