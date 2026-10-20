import { gql } from 'graphql-request'

/**
 * Trial balance for a period.
 *
 * Both dates are optional — omitting them returns a cumulative trial
 * balance from inception to now. `$dimensionType` with
 * `$dimensionMemberId` sums one management dimension member's lines
 * (`unallocated` for the untagged ones); such a balance need not foot, and
 * says so in `sliced`.
 */
export const GET_TRIAL_BALANCE = gql`
  query GetLedgerTrialBalance(
    $startDate: Date
    $endDate: Date
    $entityId: String
    $dimensionType: String
    $dimensionMemberId: String
  ) {
    trialBalance(
      startDate: $startDate
      endDate: $endDate
      entityId: $entityId
      dimensionType: $dimensionType
      dimensionMemberId: $dimensionMemberId
    ) {
      totalDebits
      totalCredits
      sliced
      rows {
        accountId
        accountCode
        accountName
        trait
        accountType
        totalDebits
        totalCredits
        netBalance
      }
    }
  }
`
