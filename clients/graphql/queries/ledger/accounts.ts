import { gql } from 'graphql-request'

/**
 * Flat account list (Chart of Accounts) with pagination and filters.
 *
 * `classification` filters to a single SFAC 6 class (asset / liability /
 * equity / revenue / expense). `isActive` filters by active flag.
 * Results are paginated via `limit` (default 100, max 1000) and `offset`.
 */
export const LIST_ACCOUNTS = gql`
  query ListLedgerAccounts(
    $classification: String
    $isActive: Boolean
    $limit: Int! = 100
    $offset: Int! = 0
  ) {
    accounts(classification: $classification, isActive: $isActive, limit: $limit, offset: $offset) {
      accounts {
        id
        code
        name
        description
        classification
        subClassification
        balanceType
        parentId
        depth
        currency
        isActive
        isPlaceholder
        accountType
        externalId
        externalSource
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
