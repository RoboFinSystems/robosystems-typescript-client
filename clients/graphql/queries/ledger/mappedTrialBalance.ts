import { gql } from 'graphql-request'

/**
 * Trial balance rolled up to reporting concepts via a mapping structure.
 *
 * Unlike `trialBalance`, which groups by raw CoA account, this query
 * groups by the US GAAP reporting concept each account maps to. Used
 * by the report builder to preview what a generated statement will
 * look like before materializing it.
 */
export const GET_MAPPED_TRIAL_BALANCE = gql`
  query GetLedgerMappedTrialBalance($mappingId: String!, $startDate: Date, $endDate: Date) {
    mappedTrialBalance(mappingId: $mappingId, startDate: $startDate, endDate: $endDate) {
      mappingId
      rows {
        reportingElementId
        qname
        reportingName
        trait
        balanceType
        totalDebits
        totalCredits
        netBalance
      }
    }
  }
`
