import { gql } from 'graphql-request'

/**
 * All report definitions for this graph, most recent first.
 *
 * Includes both native reports (generated from this graph's books) and
 * shared reports (materialized from another graph via a publish list).
 * `sourceGraphId` / `sourceReportId` / `sharedAt` identify shared reports.
 */
export const LIST_REPORTS = gql`
  query ListLedgerReports {
    reports {
      reports {
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
  }
`
