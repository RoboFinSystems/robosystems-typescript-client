import { gql } from 'graphql-request'

/**
 * Trial balance for a period.
 *
 * Both dates are optional — omitting them returns a cumulative trial
 * balance from inception to now.
 */
export const GET_TRIAL_BALANCE = gql`
  query GetLedgerTrialBalance($startDate: Date, $endDate: Date, $entityId: String) {
    trialBalance(startDate: $startDate, endDate: $endDate, entityId: $entityId) {
      totalDebits
      totalCredits
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
