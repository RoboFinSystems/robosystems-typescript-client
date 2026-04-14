import { gql } from 'graphql-request'

/**
 * Fiscal calendar state — pointers, gap, closeable status, period list.
 *
 * The resolver blends extensions-DB data (calendar + periods) with a
 * platform-DB lookup for QB sync state (last_sync_at). Clients use
 * `closeableNow` + `blockers` as the close gate.
 */
export const GET_FISCAL_CALENDAR = gql`
  query GetLedgerFiscalCalendar {
    fiscalCalendar {
      graphId
      fiscalYearStartMonth
      closedThrough
      closeTarget
      gapPeriods
      catchUpSequence
      closeableNow
      blockers
      lastCloseAt
      initializedAt
      lastSyncAt
      periods {
        name
        startDate
        endDate
        status
        closedAt
      }
    }
  }
`
