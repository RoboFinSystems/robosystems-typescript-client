import { gql } from 'graphql-request'

/**
 * Report rehydrated as a package — Report metadata + N rendered
 * Information Block envelopes (one per attached FactSet). Drives the
 * `/reports/[id]` package viewer; replaces the per-statement
 * `getStatement(reportId, blockType)` round-trip flow.
 *
 * Each item's `block` is a fully-rehydrated `InformationBlock` envelope
 * pinned to its specific FactSet snapshot, so the frontend can render
 * the package without per-section refetches.
 */
export const GET_REPORT_PACKAGE = gql`
  query GetLedgerReportPackage($reportId: String!) {
    reportPackage(reportId: $reportId) {
      id
      name
      description
      taxonomyId
      periodType
      periodStart
      periodEnd
      generationStatus
      lastGenerated
      filingStatus
      filedAt
      filedBy
      supersedesId
      supersededById
      sourceGraphId
      sourceReportId
      sharedAt
      entityName
      aiGenerated
      createdAt
      createdBy
      items {
        factSetId
        structureId
        displayOrder
        block {
          id
          blockType
          name
          displayName
          category
          taxonomyId
          taxonomyName
          informationModel {
            conceptArrangement
            memberArrangement
          }
          artifact {
            topic
            rendererNote
            template
            mechanics
          }
          elements {
            id
            qname
            name
            code
            elementType
            isAbstract
            isMonetary
            balanceType
            periodType
          }
          connections {
            id
            fromElementId
            toElementId
            associationType
            arcrole
            orderValue
            weight
          }
          facts {
            id
            elementId
            value
            periodStart
            periodEnd
            periodType
            unit
            factScope
            factSetId
          }
          rules {
            id
            ruleCategory
            rulePattern
            ruleCheckKind
            ruleExpression
            ruleMessage
            ruleSeverity
            ruleOrigin
            ruleTarget {
              targetKind
              targetRefId
            }
            ruleVariables {
              variableName
              variableQname
            }
          }
          factSet {
            id
            structureId
            periodStart
            periodEnd
            factsetType
            entityId
            reportId
          }
          verificationResults {
            id
            ruleId
            structureId
            factSetId
            status
            message
            periodStart
            periodEnd
            evaluatedAt
          }
          view {
            rendering {
              rows {
                elementId
                elementQname
                elementName
                classification
                balanceType
                values
                isSubtotal
                depth
              }
              periods {
                start
                end
                label
              }
              validation {
                passed
                checks
                failures
                warnings
              }
              unmappedCount
            }
          }
        }
      }
    }
  }
`
