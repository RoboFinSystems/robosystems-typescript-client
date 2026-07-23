import { gql } from 'graphql-request'

/**
 * Information Block envelope — the cross-block-type read that replaces
 * block-specific reads like `scheduleFacts` and (eventually)
 * `statement`. Returns the assembled envelope with bundled atoms
 * (elements, connections, facts) plus the typed artifact mechanics
 * branch. See `local/docs/specs/information-block.md` §2.
 */
export const GET_INFORMATION_BLOCK = gql`
  query GetInformationBlock($id: ID!, $scenarioId: String, $series: Boolean! = false) {
    informationBlock(id: $id, scenarioId: $scenarioId, series: $series) {
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
        textValue
        factType
        contentType
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
        scenarioId
        provenance
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
      verificationSummary {
        total
        passed
        failed
        errored
        skipped
        byCategory {
          category
          total
          passed
          failed
          errored
          skipped
        }
      }
      view {
        rendering {
          rows {
            elementId
            elementQname
            elementName
            classification
            balanceType
            itemType
            values
            textValue
            isSubtotal
            depth
          }
          periods {
            start
            end
            label
            forecast
          }
          validation {
            passed
            checks
            failures
            warnings
          }
          unmappedCount
        }
        chart {
          panels {
            label
            itemType
            kind
            series {
              key
              elementId
              label
            }
          }
        }
      }
    }
  }
`

/**
 * List Information Block envelopes with optional block_type + category
 * filters. Each returned envelope has the same shape as the
 * single-block read, so callers can page through ready-to-render
 * blocks.
 */
export const LIST_INFORMATION_BLOCKS = gql`
  query ListInformationBlocks(
    $blockType: String
    $category: String
    $limit: Int
    $offset: Int
    $scenarioId: String
  ) {
    informationBlocks(
      blockType: $blockType
      category: $category
      limit: $limit
      offset: $offset
      scenarioId: $scenarioId
    ) {
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
        textValue
        factType
        contentType
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
        scenarioId
        provenance
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
      verificationSummary {
        total
        passed
        failed
        errored
        skipped
        byCategory {
          category
          total
          passed
          failed
          errored
          skipped
        }
      }
      view {
        rendering {
          rows {
            elementId
            elementQname
            elementName
            classification
            balanceType
            itemType
            values
            textValue
            isSubtotal
            depth
          }
          periods {
            start
            end
            label
            forecast
          }
          validation {
            passed
            checks
            failures
            warnings
          }
          unmappedCount
        }
        chart {
          panels {
            label
            itemType
            kind
            series {
              key
              elementId
              label
            }
          }
        }
      }
    }
  }
`
