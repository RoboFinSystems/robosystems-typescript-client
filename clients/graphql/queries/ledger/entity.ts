import { gql } from 'graphql-request'

/**
 * Ledger entity read queries.
 *
 * These are scanned by GraphQL Code Generator (see codegen.ts) to produce
 * typed DocumentNodes in ../generated/graphql.ts. Import the generated
 * types from the facade method, not from this file.
 *
 * **Graph scoping:** the GraphQL endpoint is mounted at
 * `/extensions/{graph_id}/graphql`, so `graph_id` is a URL path
 * parameter, not a query argument. Resolvers read it from the request
 * context, never from GraphQL variables. Facade methods pass `graphId`
 * as part of the request URL when calling `graphQLClient.request(...)`.
 */

export const GET_ENTITY = gql`
  query GetLedgerEntity {
    entity {
      id
      name
      legalName
      uri
      cik
      ticker
      exchange
      sic
      sicDescription
      category
      stateOfIncorporation
      fiscalYearEnd
      taxId
      lei
      industry
      entityType
      phone
      website
      status
      isParent
      parentEntityId
      source
      sourceId
      sourceGraphId
      connectionId
      addressLine1
      addressCity
      addressState
      addressPostalCode
      addressCountry
      createdAt
      updatedAt
    }
  }
`
