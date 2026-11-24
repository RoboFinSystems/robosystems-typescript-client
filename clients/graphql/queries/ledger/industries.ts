import { gql } from 'graphql-request'

/**
 * The industry classification: every node an entity's `industry` can name,
 * parents before children. One list for every graph. A node's `id` is its
 * slug path, so its ancestors are the prefixes of its id; `path` is the
 * names from the sector down, for display. A node with `replacedBy` set is
 * retired and is not offered for new choices.
 */
export const LIST_INDUSTRIES = gql`
  query ListIndustries {
    industries {
      id
      parentId
      level
      label
      path
      carried
      replacedBy
    }
  }
`
