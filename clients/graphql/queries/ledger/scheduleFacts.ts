import { gql } from 'graphql-request'

/**
 * In-scope facts for a schedule. Optional `periodStart` / `periodEnd`
 * narrow to a single period window. Historical facts (pre-
 * `closed_through` at creation time) are hidden — only in-scope rows
 * that drive actual closing entries are returned.
 */
export const GET_SCHEDULE_FACTS = gql`
  query GetLedgerScheduleFacts($structureId: String!, $periodStart: Date, $periodEnd: Date) {
    scheduleFacts(structureId: $structureId, periodStart: $periodStart, periodEnd: $periodEnd) {
      structureId
      facts {
        elementId
        elementName
        value
        periodStart
        periodEnd
      }
    }
  }
`
