import { gql } from 'graphql-request'

/**
 * Report definitions for this graph, most recent first.
 *
 * `lifecycle` defaults to `CURRENT` (archived reports left out); `ARCHIVED`
 * returns only those, `ALL` every report.
 *
 * Includes both native reports (generated from this graph's books) and
 * shared reports (materialized from another graph via a publish list).
 * `sourceGraphId` / `sourceReportId` / `sharedAt` identify shared reports.
 */
export const LIST_REPORTS = gql`
  query ListLedgerReports($lifecycle: ReportLifecycle! = CURRENT) {
    reports(lifecycle: $lifecycle) {
      reports {
        id
        name
        taxonomyId
        generationStatus
        filingStatus
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
