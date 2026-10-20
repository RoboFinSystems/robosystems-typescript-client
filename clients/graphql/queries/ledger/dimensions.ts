import { gql } from 'graphql-request'

/**
 * The graph's management dimension members — departments, classes,
 * locations, projects — by axis then name, each with how many ledger lines
 * carry it. `$dimensionType` narrows to one axis; `$includeInactive` adds
 * retired members, which stay on the lines that carry them.
 */
export const LIST_DIMENSIONS = gql`
  query ListLedgerDimensions($dimensionType: String, $includeInactive: Boolean! = false) {
    dimensions(dimensionType: $dimensionType, includeInactive: $includeInactive) {
      types
      dimensions {
        id
        dimensionType
        name
        value
        source
        isActive
        lineCount
        createdAt
      }
    }
  }
`
