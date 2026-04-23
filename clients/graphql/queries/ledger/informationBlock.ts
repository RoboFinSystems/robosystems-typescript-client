import { gql } from 'graphql-request'

/**
 * Information Block envelope — the cross-block-type read that replaces
 * block-specific reads like `scheduleFacts` and (eventually)
 * `statement`. Returns the assembled envelope with bundled atoms
 * (elements, connections, facts) plus the typed artifact mechanics
 * branch. See `local/docs/specs/information-block.md` §2.
 */
export const GET_INFORMATION_BLOCK = gql`
  query GetInformationBlock($id: ID!) {
    informationBlock(id: $id) {
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
        parentheticalNote
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
  query ListInformationBlocks($blockType: String, $category: String, $limit: Int, $offset: Int) {
    informationBlocks(blockType: $blockType, category: $category, limit: $limit, offset: $offset) {
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
        parentheticalNote
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
    }
  }
`
