import { gql } from 'graphql-request'

/**
 * rs-gaap concepts a CoA element of a given EFS classification may map to,
 * limited to concepts that render under the graph's active Reporting Style
 * (statement-level subtotals excluded). This is the candidate set the mapping
 * picker should offer — mapping to anything outside it would land a fact on an
 * unreachable branch that never renders.
 */
export const MAPPING_CANDIDATES = gql`
  query MappingCandidates($classification: String!) {
    mappingCandidates(classification: $classification) {
      id
      name
      qname
      trait
    }
  }
`
