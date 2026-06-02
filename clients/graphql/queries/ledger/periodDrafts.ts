import { gql } from 'graphql-request'

/**
 * Every draft entry for a fiscal period, fully expanded with line items
 * and balance check. Used pre-close to review what will be committed.
 *
 * `period` is YYYY-MM format. Balance check is server-side — `balanced`
 * per entry, `allBalanced` for the period total.
 *
 * This is also the close-review *outbox*: each draft carries its QB
 * write-back disposition (`willPublishToQb`) and the response carries a
 * publish summary (`qbWritebackConnectionId` / `qbWritePolicy` /
 * `qbPublishCount` / `localOnlyCount`) — which drafts `close-period` will
 * push to QuickBooks vs. post locally only.
 */
export const GET_PERIOD_DRAFTS = gql`
  query GetLedgerPeriodDrafts($period: String!) {
    periodDrafts(period: $period) {
      period
      periodStart
      periodEnd
      draftCount
      totalDebit
      totalCredit
      allBalanced
      qbWritebackConnectionId
      qbWritePolicy
      qbPublishCount
      localOnlyCount
      drafts {
        entryId
        postingDate
        type
        memo
        provenance
        sourceStructureId
        sourceStructureName
        totalDebit
        totalCredit
        balanced
        willPublishToQb
        lineItems {
          lineItemId
          elementId
          elementCode
          elementName
          debitAmount
          creditAmount
          description
        }
      }
    }
  }
`
