import { gql } from 'graphql-request'

/**
 * Get a single agent by id (the agents detail view).
 *
 * `address` is a JSON dict — typically QB-shaped with `Line1`/`City`/
 * `CountrySubDivisionCode`/`PostalCode` keys. `classifications` holds the
 * account each entity's bank lines are suggested, learned from committed lines
 * or set with `updateAgent`; `classification` is the group parent's, null
 * until it has one.
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
      classification {
        entityId
        elementId
        accountName
        mode
        confirmations
        overrides
        setBy
        setAt
        learnedFrom
      }
      classifications {
        entityId
        elementId
        accountName
        mode
        confirmations
        overrides
        setBy
        setAt
        learnedFrom
      }
      createdAt
      updatedAt
      createdBy
    }
  }
`
