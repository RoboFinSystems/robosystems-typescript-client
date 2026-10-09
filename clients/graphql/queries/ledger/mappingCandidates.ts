import { gql } from 'graphql-request'

/**
 * rs-gaap concepts a CoA element of a given EFS classification may map to,
 * limited to concepts that render under the Reporting Style of the entity whose
 * chart is being mapped (`$entityId`, default the group parent; statement-level
 * subtotals excluded). This is the candidate set the mapping
 * picker should offer — mapping to anything outside it would land a fact on an
 * unreachable branch that never renders.
 */
export const MAPPING_CANDIDATES = gql`
  query MappingCandidates($classification: String!, $entityId: String) {
    mappingCandidates(classification: $classification, entityId: $entityId) {
      id
      name
      qname
      trait
    }
  }
`
