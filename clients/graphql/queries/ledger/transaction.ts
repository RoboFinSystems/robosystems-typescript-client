import { gql } from 'graphql-request'

/**
 * Single transaction with full entry + line item drill-down.
 *
 * Returns null when the transaction doesn't exist in this graph.
 */
export const GET_TRANSACTION = gql`
  query GetLedgerTransaction($transactionId: String!) {
    transaction(transactionId: $transactionId) {
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
      sourceId
      status
      postedAt
      entries {
        id
        number
        type
        postingDate
        memo
        status
        postedAt
        lineItems {
          id
          accountId
          accountName
          accountCode
          debitAmount
          creditAmount
          description
          lineOrder
        }
      }
    }
  }
`
