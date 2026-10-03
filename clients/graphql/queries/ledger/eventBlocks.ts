import { gql } from 'graphql-request'

/**
 * List captured event blocks (the inbox surface).
 *
 * Filters are independent. `status` defaults to all on the wire, but
 * the inbox UI typically passes `'captured'` to show un-reviewed events.
 * `eventType` matches values like `invoice_issued`, `bill_received`,
 * `payment_received`, `bill_paid`, `sales_receipt_recorded`,
 * `journal_entry_recorded`. `eventCategory` groups them: `sales`,
 * `purchase`, `adjustment`. `isReconcilingItem` narrows to posted events
 * whose source payload changed afterwards and that await a decision.
 */
export const LIST_EVENT_BLOCKS = gql`
  query ListLedgerEventBlocks(
    $eventType: String
    $eventCategory: String
    $status: String
    $agentId: String
    $source: String
    $isReconcilingItem: Boolean
    $limit: Int! = 50
    $offset: Int! = 0
  ) {
    eventBlocks(
      eventType: $eventType
      eventCategory: $eventCategory
      status: $status
      agentId: $agentId
      source: $source
      isReconcilingItem: $isReconcilingItem
      limit: $limit
      offset: $offset
    ) {
      id
      eventType
      eventCategory
      eventClass
      status
      occurredAt
      effectiveAt
      source
      externalId
      externalUrl
      amount
      currency
      description
      metadata
      dimensionIds
      agentId
      resourceType
      resourceElementId
      replacedByEventId
      replacesEventId
      obligatedByEventId
      dischargesEventId
      createdAt
      createdBy
    }
  }
`
