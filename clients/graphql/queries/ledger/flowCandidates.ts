import { gql } from 'graphql-request'

/**
 * The cash flow rows a line may be tagged with. A flow is a second
 * classification beside the account: it overrides the account's default flow
 * on the cash flow and equity statements (a bank line's
 * `classified_flow_qname`, a journal-entry line's
 * `transaction_description_code`). These are the leaf investing and financing
 * rows of the entity's cash flow statement under its Reporting Style
 * (`$entityId`, default the group parent) — the set the write path accepts —
 * so a picker built from them never offers a row the statement cannot
 * present. Statement order: investing, then financing.
 */
export const FLOW_CANDIDATES = gql`
  query FlowCandidates($entityId: String) {
    flowCandidates(entityId: $entityId) {
      elementId
      qname
      name
      activity
    }
  }
`
