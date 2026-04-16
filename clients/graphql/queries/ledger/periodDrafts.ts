import { gql } from 'graphql-request'

/**
 * Every draft entry for a fiscal period, fully expanded with line items
 * and balance check. Used pre-close to review what will be committed.
 *
 * `period` is YYYY-MM format. Balance check is server-side — `balanced`
 * per entry, `allBalanced` for the period total.
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
