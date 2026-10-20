import { gql } from 'graphql-request'

/**
 * One entity's posted lines on one account, oldest first, each with the
 * balance it leaves.
 *
 * The lines run from `openingBalance` to `closingBalance`, which is the trial
 * balance's for the same window added to the opening. An income or expense
 * account opens at the fiscal year's start (`openingFrom`). Each page carries
 * its own `pageOpeningBalance`; pass `nextCursor` as `$after` for the next.
 * `$includeDrafts` lists the window's drafts on the first page, outside every
 * balance. A dimension pair or `$flowElementId` reads one slice, and says so
 * in `sliced`.
 */
export const GET_ACCOUNT_REGISTER = gql`
  query GetLedgerAccountRegister(
    $accountId: String!
    $startDate: Date
    $endDate: Date
    $entityId: String
    $dimensionType: String
    $dimensionMemberId: String
    $flowElementId: String
    $includeDrafts: Boolean! = false
    $after: String
    $limit: Int
  ) {
    accountRegister(
      accountId: $accountId
      startDate: $startDate
      endDate: $endDate
      entityId: $entityId
      dimensionType: $dimensionType
      dimensionMemberId: $dimensionMemberId
      flowElementId: $flowElementId
      includeDrafts: $includeDrafts
      after: $after
      limit: $limit
    ) {
      account {
        id
        code
        name
        balanceType
        trait
        temporary
      }
      entityId
      startDate
      endDate
      openingFrom
      openingBalance
      totalDebits
      totalCredits
      closingBalance
      lineCount
      pageOpeningBalance
      nextCursor
      sliced
      draftsTruncated
      lines {
        ...RegisterLineFields
      }
      drafts {
        ...RegisterLineFields
      }
    }
  }

  fragment RegisterLineFields on RegisterLine {
    lineId
    entryId
    entryNumber
    postingDate
    entryType
    provenance
    status
    memo
    description
    debit
    credit
    balance
    triggeredByEventId
    triggeredByEventType
    reversalOf
    reversedBy
    agentId
    agentName
    flowElementId
    dimensions {
      id
      dimensionType
      name
    }
  }
`
