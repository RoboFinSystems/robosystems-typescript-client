import { gql } from 'graphql-request'

/**
 * Publish lists (managed distribution lists for sharing reports to
 * other graphs). Paginated.
 */
export const LIST_PUBLISH_LISTS = gql`
  query ListLedgerPublishLists($limit: Int! = 100, $offset: Int! = 0) {
    publishLists(limit: $limit, offset: $offset) {
      publishLists {
        id
        name
        description
        memberCount
        createdBy
        createdAt
        updatedAt
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
