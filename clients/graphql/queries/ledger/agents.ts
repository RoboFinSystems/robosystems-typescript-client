import { gql } from 'graphql-request'

/**
 * List agents (REA-aligned counterparty graph).
 *
 * `agentType` filters to `customer`, `vendor`, or `employee`. `source`
 * scopes to a single ingestion source (e.g. `quickbooks`). `isActive`
 * defaults to `true` on the resolver — pass explicit `false` to see
 * deactivated agents, or `null` to see both.
 */
export const LIST_AGENTS = gql`
  query ListLedgerAgents(
    $agentType: String
    $source: String
    $isActive: Boolean = true
    $limit: Int! = 50
    $offset: Int! = 0
  ) {
    agents(
      agentType: $agentType
      source: $source
      isActive: $isActive
      limit: $limit
      offset: $offset
    ) {
      id
      agentType
      name
      legalName
      taxId
      registrationNumber
      duns
      lei
      email
      phone
      address
      source
      externalId
      isActive
      is1099Recipient
      createdAt
      updatedAt
      createdBy
    }
  }
`
