import { gql } from 'graphql-request'

/**
 * Where this graph's reports have been shared: each recipient graph, when,
 * by whom, how many facts it received, and whether the share was revoked.
 *
 * The sender's record behind `share-report` and `revoke-report-share`.
 * `reportId` narrows to one report; omitted, the list is the graph's whole
 * distribution log. Revoked shares are history and stay out unless
 * `includeRevoked` is set — a recipient shared to, revoked, and shared to
 * again has two rows, one revoked and one live.
 */
export const LIST_REPORT_SHARES = gql`
  query ListLedgerReportShares(
    $reportId: String
    $includeRevoked: Boolean! = false
    $limit: Int! = 100
    $offset: Int! = 0
  ) {
    reportShares(
      reportId: $reportId
      includeRevoked: $includeRevoked
      limit: $limit
      offset: $offset
    ) {
      reportShares {
        id
        reportId
        targetGraphId
        targetGraphName
        sharedBy
        sharedAt
        revokedAt
        factCount
      }
      pagination {
        total
        limit
        offset
        hasMore
      }
    }
  }
`
