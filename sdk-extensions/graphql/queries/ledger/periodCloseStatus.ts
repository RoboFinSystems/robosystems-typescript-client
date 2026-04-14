import { gql } from 'graphql-request'

/**
 * Schedule-derived close status for a fiscal period. Shows which
 * schedules have pending / drafted / posted closing entries and how
 * many drafts exist in total.
 */
export const GET_PERIOD_CLOSE_STATUS = gql`
  query GetLedgerPeriodCloseStatus($periodStart: Date!, $periodEnd: Date!) {
    periodCloseStatus(periodStart: $periodStart, periodEnd: $periodEnd) {
      fiscalPeriodStart
      fiscalPeriodEnd
      periodStatus
      totalDraft
      totalPosted
      schedules {
        structureId
        structureName
        amount
        status
        entryId
        reversalEntryId
        reversalStatus
      }
    }
  }
`
