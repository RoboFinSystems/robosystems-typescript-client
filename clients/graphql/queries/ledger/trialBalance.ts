import { gql } from 'graphql-request'

/**
 * Trial balance for a period.
 *
 * Both dates are optional — omitting them returns a cumulative trial
 * balance from inception to now.
 */
export const GET_TRIAL_BALANCE = gql`
  query GetLedgerTrialBalance($startDate: Date, $endDate: Date) {
    trialBalance(startDate: $startDate, endDate: $endDate) {
      totalDebits
      totalCredits
      rows {
        accountId
        accountCode
        accountName
        classification
        accountType
        totalDebits
        totalCredits
        netBalance
      }
    }
  }
`
