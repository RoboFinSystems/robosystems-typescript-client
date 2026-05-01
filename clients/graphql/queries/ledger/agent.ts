import { gql } from 'graphql-request'

/**
 * Get a single agent by id (the agents detail view).
 *
 * `address` is a JSON dict — typically QB-shaped with `Line1`/`City`/
 * `CountrySubDivisionCode`/`PostalCode` keys.
 */
export const GET_AGENT = gql`
  query GetLedgerAgent($id: String!) {
    agent(id: $id) {
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
