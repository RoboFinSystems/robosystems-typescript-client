import { gql } from 'graphql-request'

/**
 * Single report definition with periods + available structures.
 * Returns null if the report doesn't exist.
 */
export const GET_REPORT = gql`
  query GetLedgerReport($reportId: String!) {
    report(reportId: $reportId) {
      id
      name
      taxonomyId
      generationStatus
      periodType
      periodStart
      periodEnd
      comparative
      mappingId
      aiGenerated
      createdAt
      lastGenerated
      entityName
      sourceGraphId
      sourceReportId
      sharedAt
      periods {
        start
        end
        label
      }
      structures {
        id
        name
        blockType
      }
    }
  }
`
