import { gql } from 'graphql-request'

/**
 * Get a single event block by id (the inbox detail view).
 *
 * `metadata` is a JSON dict — for QB-sourced events it carries the
 * nested `entries[]` shape (memo + posting_date + line_items) that the
 * journal_entry_recorded handler consumes on approve.
 */
export const GET_EVENT_BLOCK = gql`
  query GetLedgerEventBlock($id: String!) {
    eventBlock(id: $id) {
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
