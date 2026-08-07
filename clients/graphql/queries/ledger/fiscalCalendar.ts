import { gql } from 'graphql-request'

/**
 * Fiscal calendar state — pointers, gap, closeable status, period list.
 *
 * The resolver blends extensions-DB data (calendar + periods) with a
 * platform-DB lookup for QB sync state (last_sync_at). Clients use
 * `closeableNow` + `blockers` as the close gate.
 *
 * The obligation and staleness detail fields populate only when their
 * corresponding blocker code is present, so a UI can name *which* schedules
 * are holding the close instead of just reporting that something is. They
 * are selected unconditionally here — the resolver returns 0 / [] / null
 * when the blocker isn't active, which costs nothing and keeps the document
 * free of a second round trip for the case that matters most.
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
      pendingObligationCount
      pendingObligationSample {
        eventId
        scheduleId
        scheduleName
        period
      }
      earliestPendingPeriod
      strandedObligationCount
      strandedObligationSample {
        eventId
        scheduleId
        scheduleName
        period
      }
      syncStaleDays
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
