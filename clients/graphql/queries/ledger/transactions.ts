import { gql } from 'graphql-request'

/**
 * Transaction list with pagination and filters.
 *
 * `type` filters to a single transaction type (Bill, Invoice, Payment, etc).
 * `startDate` / `endDate` filter by transaction date.
 */
export const LIST_TRANSACTIONS = gql`
  query ListLedgerTransactions(
    $type: String
    $startDate: Date
    $endDate: Date
    $limit: Int! = 100
    $offset: Int! = 0
  ) {
    transactions(
      type: $type
      startDate: $startDate
      endDate: $endDate
      limit: $limit
      offset: $offset
    ) {
      transactions {
        id
        number
        type
        category
        amount
        currency
        date
        dueDate
        merchantName
        referenceNumber
        description
        source
        status
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
