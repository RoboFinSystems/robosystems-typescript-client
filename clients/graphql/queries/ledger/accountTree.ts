import { gql } from 'graphql-request'

/**
 * Hierarchical Chart of Accounts tree.
 *
 * The `AccountTreeNode` type is self-referencing (`children` is a list
 * of the same type). GraphQL doesn't have a schema-level depth cap, so
 * we manually select 4 levels deep here — enough for almost every CoA
 * in practice without blowing up the payload. Nodes beyond depth 4 are
 * silently truncated from the result. If a tenant's CoA ever exceeds
 * this, add a 5th level of `children { ... }` selections.
 */
export const GET_ACCOUNT_TREE = gql`
  query GetLedgerAccountTree {
    accountTree {
      totalAccounts
      roots {
        id
        code
        name
        classification
        accountType
        balanceType
        depth
        isActive
        children {
          id
          code
          name
          classification
          accountType
          balanceType
          depth
          isActive
          children {
            id
            code
            name
            classification
            accountType
            balanceType
            depth
            isActive
            children {
              id
              code
              name
              classification
              accountType
              balanceType
              depth
              isActive
            }
          }
        }
      }
    }
  }
`
