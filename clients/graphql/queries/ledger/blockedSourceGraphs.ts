import { gql } from 'graphql-request'

/**
 * Source graphs barred from sharing reports into this graph.
 *
 * Cross-graph sharing is authorized capability-style — whoever holds this
 * graph's id can copy a published report into it — so this list is the
 * recipient's exit. Manage it with the `block-source-graph` /
 * `unblock-source-graph` operations.
 */
export const LIST_BLOCKED_SOURCE_GRAPHS = gql`
  query ListLedgerBlockedSourceGraphs($limit: Int! = 100, $offset: Int! = 0) {
    blockedSourceGraphs(limit: $limit, offset: $offset) {
      blockedSourceGraphs {
        id
        sourceGraphId
        sourceGraphName
        blockedBy
        blockedAt
        reason
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
