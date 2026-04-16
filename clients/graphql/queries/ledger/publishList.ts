import { gql } from 'graphql-request'

/**
 * Single publish list with full member detail. Returns null if the
 * list doesn't exist or isn't accessible to the caller.
 */
export const GET_PUBLISH_LIST = gql`
  query GetLedgerPublishList($listId: String!) {
    publishList(listId: $listId) {
      id
      name
      description
      memberCount
      createdBy
      createdAt
      updatedAt
      members {
        id
        targetGraphId
        targetGraphName
        targetOrgName
        addedBy
        addedAt
      }
    }
  }
`
