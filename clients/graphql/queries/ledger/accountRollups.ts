import { gql } from 'graphql-request'

/**
 * Account rollups grouped by reporting concept via the mapping structure.
 *
 * Pass `mappingId` to pin which mapping structure to roll up through;
 * `startDate` / `endDate` narrow to a specific period (both optional).
 */
export const GET_ACCOUNT_ROLLUPS = gql`
  query GetLedgerAccountRollups($mappingId: String, $startDate: Date, $endDate: Date) {
    accountRollups(mappingId: $mappingId, startDate: $startDate, endDate: $endDate) {
      mappingId
      mappingName
      totalMapped
      totalUnmapped
      groups {
        reportingElementId
        reportingName
        reportingQname
        trait
        balanceType
        total
        accounts {
          elementId
          accountName
          accountCode
          totalDebits
          totalCredits
          netBalance
        }
      }
    }
  }
`
