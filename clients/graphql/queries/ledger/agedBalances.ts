import { gql } from 'graphql-request'

/**
 * Receivables or payables aged at a date (`$asOf`, default today): totals by
 * days past due, a row per counterparty, and each entity's open items tied
 * out to its receivables or payables account. `$scope` is `entity` (one
 * entity's books, `$entityId` default the group parent) or `group` (the
 * parent and the members consolidated in full, with what they owe each other
 * set apart). A missing due date reads as due on receipt and is counted in
 * `defaultedDueDateCount`; the tie-out's `differenceCents` is never plugged.
 */
export const OPEN_ITEM_FIELDS = gql`
  fragment OpenItemFields on OpenItem {
    eventId
    entityId
    agentId
    occurredOn
    documentNumber
    description
    originalCents
    settledCents
    openCents
    currency
    dueDate
    dueDateBasis
    daysPastDue
    bucket
  }
`

export const AGED_BALANCES_FIELDS = gql`
  fragment AgedBalancesFields on AgedBalances {
    kind
    asOf
    scope
    entityId
    memberEntityIds
    buckets {
      ...AgingBucketsFields
    }
    agents {
      agentId
      agentName
      openItemCount
      oldestDueDate
      buckets {
        ...AgingBucketsFields
      }
    }
    defaultedDueDateCount
    intercompany {
      ...OpenItemFields
    }
    pairs {
      creditorEntityId
      debtorEntityId
      receivableCents
      payableCents
      differenceCents
    }
    tieOuts {
      entityId
      accounts {
        elementId
        code
        name
      }
      controlBalanceCents
      openItemsCents
      differenceCents
    }
  }

  fragment AgingBucketsFields on AgingBuckets {
    currentCents
    oneToThirtyCents
    thirtyOneToSixtyCents
    sixtyOneToNinetyCents
    overNinetyCents
    unappliedCreditCents
    totalCents
  }
`

export const AGED_RECEIVABLES = gql`
  query AgedReceivables($asOf: Date, $entityId: String, $scope: String! = "entity") {
    agedReceivables(asOf: $asOf, entityId: $entityId, scope: $scope) {
      ...AgedBalancesFields
    }
  }
  ${AGED_BALANCES_FIELDS}
  ${OPEN_ITEM_FIELDS}
`

export const AGED_PAYABLES = gql`
  query AgedPayables($asOf: Date, $entityId: String, $scope: String! = "entity") {
    agedPayables(asOf: $asOf, entityId: $entityId, scope: $scope) {
      ...AgedBalancesFields
    }
  }
  ${AGED_BALANCES_FIELDS}
  ${OPEN_ITEM_FIELDS}
`

/**
 * One counterparty's open invoices (`receivables`) or bills (`payables`) at
 * a date, oldest first, each with its due date, age and bucket: the drill
 * from an aged row into its documents.
 */
export const OPEN_ITEMS_FOR_AGENT = gql`
  query OpenItemsForAgent($agentId: String!, $kind: String!, $asOf: Date, $entityId: String) {
    openItemsForAgent(agentId: $agentId, kind: $kind, asOf: $asOf, entityId: $entityId) {
      ...OpenItemFields
    }
  }
  ${OPEN_ITEM_FIELDS}
`

/**
 * The open invoices or bills a payment or bank line may settle, an exact
 * amount match first, then the oldest due date; `classifiedToControl` says
 * the line went to a receivables or payables account, where the inbox offers
 * the pick. The choice is recorded with `discharge_allocations` on
 * `updateEventBlock`.
 */
export const DISCHARGE_CANDIDATES = gql`
  query DischargeCandidates($eventId: String!) {
    dischargeCandidates(eventId: $eventId) {
      eventId
      kind
      amountCents
      classifiedToControl
      candidates {
        ...OpenItemFields
      }
    }
  }
  ${OPEN_ITEM_FIELDS}
`
