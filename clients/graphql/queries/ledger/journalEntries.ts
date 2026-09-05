import { gql } from 'graphql-request'

/**
 * Journal entry list with pagination and filters — the entry-centric read.
 *
 * `transactions` walks transactions and hangs entries off them, so an entry
 * with no parent transaction appears in nothing it returns. The schedule
 * engine and the event handlers create exactly those, which is why everything
 * a period close posts is absent from that surface. Here `transactionId` is
 * null for a standalone entry rather than absent data.
 *
 * `provenance` filters to where the entry came from (`schedule_derived` for
 * what a close posted); `type` to the entry classification (`adjusting` /
 * `closing`); `status` to the draft/posted/reversed lifecycle.
 */
export const LIST_JOURNAL_ENTRIES = gql`
  query ListLedgerJournalEntries(
    $startDate: Date
    $endDate: Date
    $status: String
    $type: String
    $provenance: String
    $transactionId: String
    $limit: Int! = 100
    $offset: Int! = 0
  ) {
    journalEntries(
      startDate: $startDate
      endDate: $endDate
      status: $status
      type: $type
      provenance: $provenance
      transactionId: $transactionId
      limit: $limit
      offset: $offset
    ) {
      entries {
        id
        number
        transactionId
        type
        status
        postingDate
        memo
        provenance
        sourceStructureId
        sourceStructureName
        triggeredByEventId
        reversalOf
        postedAt
        totalDebit
        totalCredit
        balanced
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
      pagination {
        total
        limit
        offset
        hasMore
      }
    }
  }
`
