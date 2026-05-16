import { gql } from 'graphql-request'

/**
 * Render a financial statement for a report + block_type.
 *
 * Structure types: `income_statement`, `balance_sheet`,
 * `equity_statement`, `custom`. Returns hierarchically-ordered rows
 * (with depth + subtotal flags) plus the guardrail validation result.
 * The caller usually renders `rows` directly as a nested tree.
 */
export const GET_STATEMENT = gql`
  query GetLedgerStatement($reportId: String!, $blockType: String!) {
    statement(reportId: $reportId, blockType: $blockType) {
      reportId
      structureId
      structureName
      blockType
      unmappedCount
      periods {
        start
        end
        label
      }
      rows {
        elementId
        elementQname
        elementName
        trait
        values
        isSubtotal
        depth
      }
      validation {
        passed
        checks
        failures
        warnings
      }
    }
  }
`
