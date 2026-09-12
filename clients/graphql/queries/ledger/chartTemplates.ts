import { gql } from 'graphql-request'

/**
 * Shipped chart-of-accounts templates for `initializeChartOfAccounts` —
 * the fresh-company path to native books. Keys are stable (`saas`,
 * `services`, `product`); `accountCount` is the rows the template creates.
 */
export const LIST_CHART_TEMPLATES = gql`
  query ListChartTemplates {
    chartTemplates {
      key
      displayName
      description
      accountCount
    }
  }
`
