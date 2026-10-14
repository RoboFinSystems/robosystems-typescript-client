import { gql } from 'graphql-request'

/**
 * How one month's bank lines were classified, per suggestion source: taken
 * as suggested, overridden, split, or chosen with no suggestion to take, and
 * the share that needed a person's choice. Counted from the lines committed
 * in the month (`$period`, `YYYY-MM`, over the lines' own dates) for one
 * entity (`$entityId`, default the group parent); lines posted before
 * outcomes were recorded are `unstamped` and outside the share. This is the
 * override rate: never quote a match rate that did not come from here.
 */
export const CLASSIFICATION_STATS = gql`
  query ClassificationStats($period: String!, $entityId: String) {
    classificationStats(period: $period, entityId: $entityId) {
      period
      entityId
      lines
      accepted
      overridden
      unsuggested
      split
      unstamped
      humanChoiceShare
      openLines
      bySource {
        source
        lines
        accepted
        overridden
        unsuggested
        split
      }
    }
  }
`
