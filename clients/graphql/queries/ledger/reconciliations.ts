import { gql } from 'graphql-request'

/**
 * Every reconciliation block's standing for one period: whether the ledger
 * ties to the balance outside it, what the two sides were, and who compared
 * and reviewed them.
 *
 * A block not yet compared for the period reads `not_started`. Comparisons
 * are recorded by `refreshReconciliations` and `recordStatementBalance`.
 * `notes` is only populated on a refresh; a read returns it empty.
 *
 * On a bank-fed account a statement's `components` list the ledger lines the
 * bank had not cleared (`kind: outstanding`), and a statement ending before
 * the period's last day carries a `rollForward` to it.
 */
export const LIST_RECONCILIATIONS = gql`
  query ListLedgerReconciliations($period: String!, $entityId: String) {
    reconciliations(period: $period, entityId: $entityId) {
      period
      asOf
      notes
      reconciliations {
        structureId
        name
        scope
        method
        elementId
        requiredForClose
        materiality
        statementCycle
        period
        asOf
        status
        unreconciledDifference
        accountsCompared
        accountsDifferent
        ledgerBalance
        independentBalance
        balanceAsOf
        components {
          name
          amount
          kind
          postingDate
          entryId
          structureId
          eventId
          documentId
          note
        }
        rollForward {
          statementAsOf
          through
          bankLines
          bankActivity
          bankBalance
          ledgerBalance
          outstanding
          feedBalance
          feedBalanceReadOn
        }
        source
        comparedAt
        factSetId
        comparedBy
        comparedVia
        reviewRequired
        separateReviewer
        reviewedBy
        reviewedAt
        selfReviewed
        differences {
          elementId
          accountCode
          accountName
          sourceAccountId
          statement
          ledgerBalance
          independentBalance
          difference
          status
          asOf
          components {
            name
            amount
            kind
            postingDate
            entryId
            structureId
            eventId
            documentId
            note
          }
          rollForward {
            statementAsOf
            through
            bankLines
            bankActivity
            bankBalance
            ledgerBalance
            outstanding
            feedBalance
            feedBalanceReadOn
          }
        }
      }
    }
  }
`
