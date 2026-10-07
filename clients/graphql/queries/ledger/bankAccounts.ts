import { gql } from 'graphql-request'

/**
 * The group's bank and card accounts: every chart account a feed books to,
 * or that a source system types as a bank or card account, with the entity
 * whose chart it is in and the health of the connection that writes to it.
 */
export const LIST_BANK_ACCOUNTS = gql`
  query ListLedgerBankAccounts($entityId: String) {
    bankAccounts(entityId: $entityId) {
      total
      accounts {
        id
        code
        name
        kind
        balanceType
        isActive
        entityId
        entityName
        source
        connectionId
        institution
        feedAccountId
        feedAccountName
        feedAccountKind
        connectionStatus
        lastSyncAt
        lastSyncStatus
      }
    }
  }
`
