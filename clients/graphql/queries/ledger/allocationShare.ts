import { gql } from 'graphql-request'

export const ALLOCATION_OVERRIDE_FIELDS = gql`
  fragment AllocationOverrideFields on AllocationOverrideRecord {
    period
    amount
    percentage
    basis
    setBy
  }
`

/**
 * The outside owners' share of a member's result for one month: the
 * pro-rata figure its ownership gives, the override set with
 * `set-allocation-override` if any, and the share the consolidating entries
 * use. Amounts are cents.
 */
export const GET_ALLOCATION_SHARE = gql`
  query GetLedgerAllocationShare($entityId: String!, $period: String!) {
    allocationShare(entityId: $entityId, period: $period) {
      entityId
      entityName
      period
      consolidationMethod
      ownershipPct
      outsidePct
      monthResult
      proRataAmount
      override {
        ...AllocationOverrideFields
      }
      effectiveAmount
      closed
    }
  }
  ${ALLOCATION_OVERRIDE_FIELDS}
`

/** Every month a member's allocation override is set for, oldest first. */
export const LIST_ALLOCATION_OVERRIDES = gql`
  query ListLedgerAllocationOverrides($entityId: String!) {
    allocationOverrides(entityId: $entityId) {
      entityId
      overrides {
        ...AllocationOverrideFields
      }
    }
  }
  ${ALLOCATION_OVERRIDE_FIELDS}
`
