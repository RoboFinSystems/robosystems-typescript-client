import { gql } from 'graphql-request'

/**
 * All active schedule structures (depreciation, amortization, accrual)
 * with entry template + metadata. `entryTemplate` and `scheduleMetadata`
 * are JSON scalars — consume as untyped dicts in the facade.
 */
export const LIST_SCHEDULES = gql`
  query ListLedgerSchedules {
    schedules {
      schedules {
        structureId
        name
        taxonomyName
        entryTemplate
        scheduleMetadata
        totalPeriods
        periodsWithEntries
      }
    }
  }
`
