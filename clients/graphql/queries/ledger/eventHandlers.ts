import { gql } from 'graphql-request'

export const EVENT_HANDLER_FIELDS = gql`
  fragment EventHandlerFields on EventHandler {
    id
    name
    description
    eventType
    eventCategory
    matchSource
    matchAgentType
    matchResourceType
    matchMetadataExpression
    transactionTemplate
    priority
    isActive
    origin
    suggestedBy
    confidence
    approvedBy
    approvedAt
    awaitingApproval
    createdAt
    updatedAt
    createdBy
  }
`

/**
 * The graph's event handlers — the rules that turn a matching event into GL
 * rows — highest priority first, active or not. A handler an AI client
 * created, or whose match or template an AI client last changed, is
 * `awaitingApproval` and takes no part in matching until a person approves
 * it.
 */
export const LIST_EVENT_HANDLERS = gql`
  query ListLedgerEventHandlers(
    $eventType: String
    $isActive: Boolean
    $awaitingApproval: Boolean
    $limit: Int! = 100
    $offset: Int! = 0
  ) {
    eventHandlers(
      eventType: $eventType
      isActive: $isActive
      awaitingApproval: $awaitingApproval
      limit: $limit
      offset: $offset
    ) {
      eventHandlers {
        ...EventHandlerFields
      }
      pagination {
        total
        limit
        offset
        hasMore
      }
    }
  }
  ${EVENT_HANDLER_FIELDS}
`

/** One event handler, or null. */
export const GET_EVENT_HANDLER = gql`
  query GetLedgerEventHandler($id: String!) {
    eventHandler(id: $id) {
      ...EventHandlerFields
    }
  }
  ${EVENT_HANDLER_FIELDS}
`
