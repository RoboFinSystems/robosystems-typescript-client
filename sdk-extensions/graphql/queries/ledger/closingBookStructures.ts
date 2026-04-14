import { gql } from 'graphql-request'

/**
 * Closing book structures — grouped report and schedule structures
 * available in the current graph. Used by the close screen to show
 * what's available to close.
 */
export const GET_CLOSING_BOOK_STRUCTURES = gql`
  query GetLedgerClosingBookStructures {
    closingBookStructures {
      hasData
      categories {
        label
        items {
          id
          name
          itemType
          structureType
          reportId
          status
        }
      }
    }
  }
`
