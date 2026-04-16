import { gql } from 'graphql-request'

/**
 * Ledger rollup counts + connection metadata.
 *
 * Pulls account/transaction/entry/line-item counts plus the
 * latest QB sync timestamp from the platform connections table.
 */
export const GET_SUMMARY = gql`
  query GetLedgerSummary {
    summary {
      graphId
      accountCount
      transactionCount
      entryCount
      lineItemCount
      earliestTransactionDate
      latestTransactionDate
      connectionCount
      lastSyncAt
    }
  }
`
