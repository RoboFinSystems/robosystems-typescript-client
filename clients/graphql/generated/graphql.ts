/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] }
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> =
  T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never }
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core'
export type ReportDownloadFormat = 'HOLON_JSONLD' | 'JSONLD' | 'XBRL_2_1'

export type GetInvestorHoldingsQueryVariables = Exact<{
  portfolioId: string
}>

export type GetInvestorHoldingsQuery = {
  holdings: {
    totalEntities: number
    totalPositions: number
    holdings: Array<{
      entityId: string
      entityName: string
      sourceGraphId: string | null
      totalCostBasisDollars: number
      totalCurrentValueDollars: number | null
      positionCount: number
      securities: Array<{
        securityId: string
        securityName: string
        securityType: string
        quantity: number
        quantityType: string
        costBasisDollars: number
        currentValueDollars: number | null
      }>
    }>
  } | null
}

export type GetInvestorPortfolioBlockQueryVariables = Exact<{
  portfolioId: string
}>

export type GetInvestorPortfolioBlockQuery = {
  portfolioBlock: {
    id: string
    name: string
    description: string | null
    strategy: string | null
    inceptionDate: string | null
    baseCurrency: string
    totalCostBasisDollars: number
    totalCurrentValueDollars: number | null
    activePositionCount: number
    createdAt: string
    updatedAt: string
    owner: { id: string; name: string; sourceGraphId: string | null } | null
    positions: Array<{
      id: string
      quantity: number
      quantityType: string
      costBasisDollars: number
      currentValueDollars: number | null
      valuationDate: string | null
      valuationSource: string | null
      acquisitionDate: string | null
      status: string
      notes: string | null
      security: {
        id: string
        name: string
        securityType: string
        securitySubtype: string | null
        isActive: boolean
        sourceGraphId: string | null
        issuer: { id: string; name: string; sourceGraphId: string | null } | null
      }
    }>
  } | null
}

export type ListInvestorPortfoliosQueryVariables = Exact<{
  limit?: number
  offset?: number
}>

export type ListInvestorPortfoliosQuery = {
  portfolios: {
    portfolios: Array<{
      id: string
      name: string
      description: string | null
      strategy: string | null
      inceptionDate: string | null
      baseCurrency: string
      createdAt: string
      updatedAt: string
    }>
    pagination: { total: number; limit: number; offset: number; hasMore: boolean }
  } | null
}

export type GetInvestorPositionQueryVariables = Exact<{
  positionId: string
}>

export type GetInvestorPositionQuery = {
  position: {
    id: string
    portfolioId: string
    securityId: string
    securityName: string | null
    entityName: string | null
    quantity: number
    quantityType: string
    costBasis: number
    costBasisDollars: number
    currency: string
    currentValue: number | null
    currentValueDollars: number | null
    valuationDate: string | null
    valuationSource: string | null
    acquisitionDate: string | null
    dispositionDate: string | null
    status: string
    notes: string | null
    createdAt: string
    updatedAt: string
  } | null
}

export type ListInvestorPositionsQueryVariables = Exact<{
  portfolioId: string | null | undefined
  securityId: string | null | undefined
  status: string | null | undefined
  limit?: number
  offset?: number
}>

export type ListInvestorPositionsQuery = {
  positions: {
    positions: Array<{
      id: string
      portfolioId: string
      securityId: string
      securityName: string | null
      entityName: string | null
      quantity: number
      quantityType: string
      costBasis: number
      costBasisDollars: number
      currency: string
      currentValue: number | null
      currentValueDollars: number | null
      valuationDate: string | null
      valuationSource: string | null
      acquisitionDate: string | null
      dispositionDate: string | null
      status: string
      notes: string | null
      createdAt: string
      updatedAt: string
    }>
    pagination: { total: number; limit: number; offset: number; hasMore: boolean }
  } | null
}

export type ListInvestorSecuritiesQueryVariables = Exact<{
  entityId: string | null | undefined
  securityType: string | null | undefined
  isActive: boolean | null | undefined
  limit?: number
  offset?: number
}>

export type ListInvestorSecuritiesQuery = {
  securities: {
    securities: Array<{
      id: string
      entityId: string | null
      entityName: string | null
      sourceGraphId: string | null
      name: string
      securityType: string
      securitySubtype: string | null
      terms: unknown
      isActive: boolean
      authorizedShares: number | null
      outstandingShares: number | null
      createdAt: string
      updatedAt: string
    }>
    pagination: { total: number; limit: number; offset: number; hasMore: boolean }
  } | null
}

export type GetInvestorSecurityQueryVariables = Exact<{
  securityId: string
}>

export type GetInvestorSecurityQuery = {
  security: {
    id: string
    entityId: string | null
    entityName: string | null
    sourceGraphId: string | null
    name: string
    securityType: string
    securitySubtype: string | null
    terms: unknown
    isActive: boolean
    authorizedShares: number | null
    outstandingShares: number | null
    createdAt: string
    updatedAt: string
  } | null
}

export type GetLedgerAccountRollupsQueryVariables = Exact<{
  mappingId: string | null | undefined
  startDate: string | null | undefined
  endDate: string | null | undefined
}>

export type GetLedgerAccountRollupsQuery = {
  accountRollups: {
    mappingId: string
    mappingName: string
    totalMapped: number
    totalUnmapped: number
    groups: Array<{
      reportingElementId: string
      reportingName: string
      reportingQname: string
      trait: string
      balanceType: string
      total: number
      accounts: Array<{
        elementId: string
        accountName: string
        accountCode: string | null
        totalDebits: number
        totalCredits: number
        netBalance: number
      }>
    }>
  } | null
}

export type GetLedgerAccountTreeQueryVariables = Exact<{ [key: string]: never }>

export type GetLedgerAccountTreeQuery = {
  accountTree: {
    totalAccounts: number
    roots: Array<{
      id: string
      code: string | null
      name: string
      trait: string | null
      accountType: string | null
      balanceType: string
      depth: number
      isActive: boolean
      children: Array<{
        id: string
        code: string | null
        name: string
        trait: string | null
        accountType: string | null
        balanceType: string
        depth: number
        isActive: boolean
        children: Array<{
          id: string
          code: string | null
          name: string
          trait: string | null
          accountType: string | null
          balanceType: string
          depth: number
          isActive: boolean
          children: Array<{
            id: string
            code: string | null
            name: string
            trait: string | null
            accountType: string | null
            balanceType: string
            depth: number
            isActive: boolean
          }>
        }>
      }>
    }>
  } | null
}

export type ListLedgerAccountsQueryVariables = Exact<{
  classification: string | null | undefined
  isActive: boolean | null | undefined
  limit?: number
  offset?: number
}>

export type ListLedgerAccountsQuery = {
  accounts: {
    accounts: Array<{
      id: string
      code: string | null
      name: string
      description: string | null
      subClassification: string | null
      balanceType: string
      parentId: string | null
      depth: number
      currency: string
      isActive: boolean
      isPlaceholder: boolean
      accountType: string | null
      externalId: string | null
      externalSource: string | null
    }>
    pagination: { total: number; limit: number; offset: number; hasMore: boolean }
  } | null
}

export type GetLedgerAgentQueryVariables = Exact<{
  id: string
}>

export type GetLedgerAgentQuery = {
  agent: {
    id: string
    agentType: string
    name: string
    legalName: string | null
    taxId: string | null
    registrationNumber: string | null
    duns: string | null
    lei: string | null
    email: string | null
    phone: string | null
    address: unknown
    source: string
    externalId: string | null
    isActive: boolean
    is1099Recipient: boolean
    createdAt: string | null
    updatedAt: string | null
    createdBy: string | null
  } | null
}

export type ListLedgerAgentsQueryVariables = Exact<{
  agentType: string | null | undefined
  source: string | null | undefined
  isActive?: boolean | null | undefined
  limit?: number
  offset?: number
}>

export type ListLedgerAgentsQuery = {
  agents: Array<{
    id: string
    agentType: string
    name: string
    legalName: string | null
    taxId: string | null
    registrationNumber: string | null
    duns: string | null
    lei: string | null
    email: string | null
    phone: string | null
    address: unknown
    source: string
    externalId: string | null
    isActive: boolean
    is1099Recipient: boolean
    createdAt: string | null
    updatedAt: string | null
    createdBy: string | null
  }>
}

export type ListLedgerBlockedSourceGraphsQueryVariables = Exact<{
  limit?: number
  offset?: number
}>

export type ListLedgerBlockedSourceGraphsQuery = {
  blockedSourceGraphs: {
    blockedSourceGraphs: Array<{
      id: string
      sourceGraphId: string
      sourceGraphName: string | null
      blockedBy: string
      blockedAt: string
      reason: string | null
    }>
    pagination: { total: number; limit: number; offset: number; hasMore: boolean }
  } | null
}

export type GetLedgerClosingBookStructuresQueryVariables = Exact<{ [key: string]: never }>

export type GetLedgerClosingBookStructuresQuery = {
  closingBookStructures: {
    hasData: boolean
    categories: Array<{
      label: string
      items: Array<{
        id: string
        name: string
        itemType: string
        blockType: string | null
        reportId: string | null
        status: string | null
      }>
    }>
  } | null
}

export type ListLedgerElementsQueryVariables = Exact<{
  taxonomyId: string | null | undefined
  source: string | null | undefined
  classification: string | null | undefined
  isAbstract: boolean | null | undefined
  limit?: number
  offset?: number
}>

export type ListLedgerElementsQuery = {
  elements: {
    elements: Array<{
      id: string
      code: string | null
      name: string
      description: string | null
      qname: string | null
      namespace: string | null
      trait: string | null
      subClassification: string | null
      balanceType: string
      periodType: string
      isAbstract: boolean
      elementType: string
      source: string
      taxonomyId: string | null
      parentId: string | null
      depth: number
      isActive: boolean
      externalId: string | null
      externalSource: string | null
    }>
    pagination: { total: number; limit: number; offset: number; hasMore: boolean }
  } | null
}

export type ListLedgerEntitiesQueryVariables = Exact<{
  source: string | null | undefined
}>

export type ListLedgerEntitiesQuery = {
  entities: Array<{
    id: string
    name: string
    legalName: string | null
    ticker: string | null
    cik: string | null
    industry: string | null
    entityType: string | null
    status: string
    isParent: boolean
    parentEntityId: string | null
    source: string
    sourceGraphId: string | null
    connectionId: string | null
    createdAt: string | null
    updatedAt: string | null
  }>
}

export type GetLedgerEntityQueryVariables = Exact<{ [key: string]: never }>

export type GetLedgerEntityQuery = {
  entity: {
    id: string
    name: string
    legalName: string | null
    uri: string | null
    cik: string | null
    ticker: string | null
    exchange: string | null
    sic: string | null
    sicDescription: string | null
    category: string | null
    stateOfIncorporation: string | null
    fiscalYearEnd: string | null
    taxId: string | null
    lei: string | null
    industry: string | null
    entityType: string | null
    phone: string | null
    website: string | null
    status: string
    isParent: boolean
    parentEntityId: string | null
    source: string
    sourceId: string | null
    sourceGraphId: string | null
    connectionId: string | null
    addressLine1: string | null
    addressCity: string | null
    addressState: string | null
    addressPostalCode: string | null
    addressCountry: string | null
    createdAt: string | null
    updatedAt: string | null
  } | null
}

export type GetLedgerEventBlockQueryVariables = Exact<{
  id: string
}>

export type GetLedgerEventBlockQuery = {
  eventBlock: {
    id: string
    eventType: string
    eventCategory: string
    eventClass: string
    status: string
    occurredAt: string
    effectiveAt: string | null
    source: string
    externalId: string | null
    externalUrl: string | null
    amount: number | null
    currency: string
    description: string | null
    metadata: unknown
    dimensionIds: Array<string>
    agentId: string | null
    resourceType: string | null
    resourceElementId: string | null
    replacedByEventId: string | null
    replacesEventId: string | null
    obligatedByEventId: string | null
    dischargesEventId: string | null
    createdAt: string
    createdBy: string
  } | null
}

export type ListLedgerEventBlocksQueryVariables = Exact<{
  eventType: string | null | undefined
  eventCategory: string | null | undefined
  status: string | null | undefined
  agentId: string | null | undefined
  source: string | null | undefined
  limit?: number
  offset?: number
}>

export type ListLedgerEventBlocksQuery = {
  eventBlocks: Array<{
    id: string
    eventType: string
    eventCategory: string
    eventClass: string
    status: string
    occurredAt: string
    effectiveAt: string | null
    source: string
    externalId: string | null
    externalUrl: string | null
    amount: number | null
    currency: string
    description: string | null
    metadata: unknown
    dimensionIds: Array<string>
    agentId: string | null
    resourceType: string | null
    resourceElementId: string | null
    replacedByEventId: string | null
    replacesEventId: string | null
    obligatedByEventId: string | null
    dischargesEventId: string | null
    createdAt: string
    createdBy: string
  }>
}

export type GetLedgerFiscalCalendarQueryVariables = Exact<{ [key: string]: never }>

export type GetLedgerFiscalCalendarQuery = {
  fiscalCalendar: {
    graphId: string
    fiscalYearStartMonth: number
    closedThrough: string | null
    closeTarget: string | null
    gapPeriods: number
    catchUpSequence: Array<string>
    closeableNow: boolean
    blockers: Array<string>
    pendingObligationCount: number
    earliestPendingPeriod: string | null
    strandedObligationCount: number
    syncStaleDays: number | null
    lastCloseAt: string | null
    initializedAt: string | null
    lastSyncAt: string | null
    pendingObligationSample: Array<{
      eventId: string
      scheduleId: string | null
      scheduleName: string | null
      period: string
    }>
    strandedObligationSample: Array<{
      eventId: string
      scheduleId: string | null
      scheduleName: string | null
      period: string
    }>
    periods: Array<{
      name: string
      startDate: string
      endDate: string
      status: string
      closedAt: string | null
    }>
  } | null
}

export type GetInformationBlockQueryVariables = Exact<{
  id: string | number
  scenarioId: string | null | undefined
  series?: boolean
}>

export type GetInformationBlockQuery = {
  informationBlock: {
    id: string
    blockType: string
    name: string
    displayName: string
    category: string
    taxonomyId: string | null
    taxonomyName: string | null
    informationModel: { conceptArrangement: string | null; memberArrangement: string | null }
    artifact: {
      topic: string | null
      rendererNote: string | null
      template: unknown
      mechanics: unknown
    }
    elements: Array<{
      id: string
      qname: string | null
      name: string
      code: string | null
      elementType: string
      isAbstract: boolean
      isMonetary: boolean
      balanceType: string | null
      periodType: string | null
    }>
    connections: Array<{
      id: string
      fromElementId: string
      toElementId: string
      associationType: string
      arcrole: string | null
      orderValue: number | null
      weight: number | null
    }>
    facts: Array<{
      id: string
      elementId: string
      value: number | null
      textValue: string | null
      factType: string
      contentType: string | null
      periodStart: string | null
      periodEnd: string
      periodType: string
      unit: string
      factScope: string
      factSetId: string | null
    }>
    rules: Array<{
      id: string
      ruleCategory: string
      rulePattern: string | null
      ruleCheckKind: string | null
      ruleExpression: string
      ruleMessage: string | null
      ruleSeverity: string
      ruleOrigin: string
      ruleTarget: { targetKind: string; targetRefId: string } | null
      ruleVariables: Array<{ variableName: string; variableQname: string | null }>
    }>
    factSet: {
      id: string
      structureId: string | null
      periodStart: string | null
      periodEnd: string
      factsetType: string
      entityId: string
      reportId: string | null
      scenarioId: string | null
      provenance: unknown
    } | null
    verificationResults: Array<{
      id: string
      ruleId: string
      structureId: string | null
      factSetId: string | null
      status: string
      message: string | null
      periodStart: string | null
      periodEnd: string | null
      evaluatedAt: string | null
    }>
    verificationSummary: {
      total: number
      passed: number
      failed: number
      errored: number
      skipped: number
      byCategory: Array<{
        category: string
        total: number
        passed: number
        failed: number
        errored: number
        skipped: number
      }>
    } | null
    view: {
      rendering: {
        unmappedCount: number
        rows: Array<{
          elementId: string
          elementQname: string | null
          elementName: string
          classification: string | null
          balanceType: string | null
          itemType: string | null
          values: Array<number | null>
          textValue: string | null
          isSubtotal: boolean
          depth: number
        }>
        periods: Array<{
          start: string
          end: string
          label: string | null
          forecast: boolean | null
        }>
        validation: {
          passed: boolean
          checks: Array<string>
          failures: Array<string>
          warnings: Array<string>
        } | null
      } | null
      chart: {
        panels: Array<{
          label: string | null
          itemType: string | null
          kind: string
          series: Array<{ key: string; elementId: string; label: string }>
        }>
      } | null
    }
  } | null
}

export type GetInformationBlockWindowedQueryVariables = Exact<{
  id: string | number
  scenarioId: string | null | undefined
  series?: boolean
  seriesHistory: number | null | undefined
  seriesForecast: number | null | undefined
}>

export type GetInformationBlockWindowedQuery = {
  informationBlock: {
    id: string
    blockType: string
    name: string
    displayName: string
    category: string
    taxonomyId: string | null
    taxonomyName: string | null
    informationModel: { conceptArrangement: string | null; memberArrangement: string | null }
    artifact: {
      topic: string | null
      rendererNote: string | null
      template: unknown
      mechanics: unknown
    }
    elements: Array<{
      id: string
      qname: string | null
      name: string
      code: string | null
      elementType: string
      isAbstract: boolean
      isMonetary: boolean
      balanceType: string | null
      periodType: string | null
    }>
    connections: Array<{
      id: string
      fromElementId: string
      toElementId: string
      associationType: string
      arcrole: string | null
      orderValue: number | null
      weight: number | null
    }>
    facts: Array<{
      id: string
      elementId: string
      value: number | null
      textValue: string | null
      factType: string
      contentType: string | null
      periodStart: string | null
      periodEnd: string
      periodType: string
      unit: string
      factScope: string
      factSetId: string | null
    }>
    rules: Array<{
      id: string
      ruleCategory: string
      rulePattern: string | null
      ruleCheckKind: string | null
      ruleExpression: string
      ruleMessage: string | null
      ruleSeverity: string
      ruleOrigin: string
      ruleTarget: { targetKind: string; targetRefId: string } | null
      ruleVariables: Array<{ variableName: string; variableQname: string | null }>
    }>
    factSet: {
      id: string
      structureId: string | null
      periodStart: string | null
      periodEnd: string
      factsetType: string
      entityId: string
      reportId: string | null
      scenarioId: string | null
      provenance: unknown
    } | null
    verificationResults: Array<{
      id: string
      ruleId: string
      structureId: string | null
      factSetId: string | null
      status: string
      message: string | null
      periodStart: string | null
      periodEnd: string | null
      evaluatedAt: string | null
    }>
    verificationSummary: {
      total: number
      passed: number
      failed: number
      errored: number
      skipped: number
      byCategory: Array<{
        category: string
        total: number
        passed: number
        failed: number
        errored: number
        skipped: number
      }>
    } | null
    view: {
      rendering: {
        unmappedCount: number
        rows: Array<{
          elementId: string
          elementQname: string | null
          elementName: string
          classification: string | null
          balanceType: string | null
          itemType: string | null
          values: Array<number | null>
          textValue: string | null
          isSubtotal: boolean
          depth: number
        }>
        periods: Array<{
          start: string
          end: string
          label: string | null
          forecast: boolean | null
        }>
        validation: {
          passed: boolean
          checks: Array<string>
          failures: Array<string>
          warnings: Array<string>
        } | null
      } | null
      chart: {
        panels: Array<{
          label: string | null
          itemType: string | null
          kind: string
          series: Array<{ key: string; elementId: string; label: string }>
        }>
      } | null
    }
  } | null
}

export type ListInformationBlocksQueryVariables = Exact<{
  blockType: string | null | undefined
  category: string | null | undefined
  limit: number | null | undefined
  offset: number | null | undefined
  scenarioId: string | null | undefined
}>

export type ListInformationBlocksQuery = {
  informationBlocks: Array<{
    id: string
    blockType: string
    name: string
    displayName: string
    category: string
    taxonomyId: string | null
    taxonomyName: string | null
    informationModel: { conceptArrangement: string | null; memberArrangement: string | null }
    artifact: {
      topic: string | null
      rendererNote: string | null
      template: unknown
      mechanics: unknown
    }
    elements: Array<{
      id: string
      qname: string | null
      name: string
      code: string | null
      elementType: string
      isAbstract: boolean
      isMonetary: boolean
      balanceType: string | null
      periodType: string | null
    }>
    connections: Array<{
      id: string
      fromElementId: string
      toElementId: string
      associationType: string
      arcrole: string | null
      orderValue: number | null
      weight: number | null
    }>
    facts: Array<{
      id: string
      elementId: string
      value: number | null
      textValue: string | null
      factType: string
      contentType: string | null
      periodStart: string | null
      periodEnd: string
      periodType: string
      unit: string
      factScope: string
      factSetId: string | null
    }>
    rules: Array<{
      id: string
      ruleCategory: string
      rulePattern: string | null
      ruleCheckKind: string | null
      ruleExpression: string
      ruleMessage: string | null
      ruleSeverity: string
      ruleOrigin: string
      ruleTarget: { targetKind: string; targetRefId: string } | null
      ruleVariables: Array<{ variableName: string; variableQname: string | null }>
    }>
    factSet: {
      id: string
      structureId: string | null
      periodStart: string | null
      periodEnd: string
      factsetType: string
      entityId: string
      reportId: string | null
      scenarioId: string | null
      provenance: unknown
    } | null
    verificationResults: Array<{
      id: string
      ruleId: string
      structureId: string | null
      factSetId: string | null
      status: string
      message: string | null
      periodStart: string | null
      periodEnd: string | null
      evaluatedAt: string | null
    }>
    verificationSummary: {
      total: number
      passed: number
      failed: number
      errored: number
      skipped: number
      byCategory: Array<{
        category: string
        total: number
        passed: number
        failed: number
        errored: number
        skipped: number
      }>
    } | null
    view: {
      rendering: {
        unmappedCount: number
        rows: Array<{
          elementId: string
          elementQname: string | null
          elementName: string
          classification: string | null
          balanceType: string | null
          itemType: string | null
          values: Array<number | null>
          textValue: string | null
          isSubtotal: boolean
          depth: number
        }>
        periods: Array<{
          start: string
          end: string
          label: string | null
          forecast: boolean | null
        }>
        validation: {
          passed: boolean
          checks: Array<string>
          failures: Array<string>
          warnings: Array<string>
        } | null
      } | null
      chart: {
        panels: Array<{
          label: string | null
          itemType: string | null
          kind: string
          series: Array<{ key: string; elementId: string; label: string }>
        }>
      } | null
    }
  }>
}

export type GetLedgerMappedTrialBalanceQueryVariables = Exact<{
  mappingId: string
  startDate: string | null | undefined
  endDate: string | null | undefined
}>

export type GetLedgerMappedTrialBalanceQuery = {
  mappedTrialBalance: {
    mappingId: string
    rows: Array<{
      reportingElementId: string
      qname: string
      reportingName: string
      trait: string | null
      balanceType: string | null
      totalDebits: number
      totalCredits: number
      netBalance: number
    }>
  } | null
}

export type GetLedgerMappingQueryVariables = Exact<{
  mappingId: string
}>

export type GetLedgerMappingQuery = {
  mapping: {
    id: string
    name: string
    blockType: string
    taxonomyId: string
    totalAssociations: number
    associations: Array<{
      id: string
      structureId: string
      fromElementId: string
      fromElementName: string | null
      fromElementQname: string | null
      toElementId: string
      toElementName: string | null
      toElementQname: string | null
      associationType: string
      orderValue: number | null
      weight: number | null
      confidence: number | null
      suggestedBy: string | null
      approvedBy: string | null
    }>
  } | null
}

export type MappingCandidatesQueryVariables = Exact<{
  classification: string
}>

export type MappingCandidatesQuery = {
  mappingCandidates: Array<{ id: string; name: string; qname: string | null; trait: string | null }>
}

export type GetLedgerMappingCoverageQueryVariables = Exact<{
  mappingId: string
}>

export type GetLedgerMappingCoverageQuery = {
  mappingCoverage: {
    mappingId: string
    totalCoaElements: number
    mappedCount: number
    unmappedCount: number
    coveragePercent: number
    highConfidence: number
    mediumConfidence: number
    lowConfidence: number
  } | null
}

export type ListLedgerMappingsQueryVariables = Exact<{ [key: string]: never }>

export type ListLedgerMappingsQuery = {
  mappings: {
    structures: Array<{
      id: string
      name: string
      description: string | null
      blockType: string
      taxonomyId: string
      isActive: boolean
    }>
  } | null
}

export type GetLedgerPeriodCloseStatusQueryVariables = Exact<{
  periodStart: string
  periodEnd: string
}>

export type GetLedgerPeriodCloseStatusQuery = {
  periodCloseStatus: {
    fiscalPeriodStart: string
    fiscalPeriodEnd: string
    periodStatus: string
    totalDraft: number
    totalPosted: number
    schedules: Array<{
      structureId: string
      structureName: string
      amount: number
      status: string
      entryId: string | null
      reversalEntryId: string | null
      reversalStatus: string | null
    }>
  } | null
}

export type GetLedgerPeriodDraftsQueryVariables = Exact<{
  period: string
}>

export type GetLedgerPeriodDraftsQuery = {
  periodDrafts: {
    period: string
    periodStart: string
    periodEnd: string
    draftCount: number
    totalDebit: number
    totalCredit: number
    allBalanced: boolean
    qbWritebackConnectionId: string | null
    qbWritePolicy: string | null
    qbPublishCount: number
    localOnlyCount: number
    drafts: Array<{
      entryId: string
      postingDate: string
      type: string
      memo: string | null
      provenance: string | null
      sourceStructureId: string | null
      sourceStructureName: string | null
      totalDebit: number
      totalCredit: number
      balanced: boolean
      willPublishToQb: boolean
      lineItems: Array<{
        lineItemId: string
        elementId: string
        elementCode: string | null
        elementName: string
        debitAmount: number
        creditAmount: number
        description: string | null
      }>
    }>
  } | null
}

export type GetLedgerPublishListQueryVariables = Exact<{
  listId: string
}>

export type GetLedgerPublishListQuery = {
  publishList: {
    id: string
    name: string
    description: string | null
    memberCount: number
    createdBy: string
    createdAt: string
    updatedAt: string
    members: Array<{
      id: string
      targetGraphId: string
      targetGraphName: string | null
      targetOrgName: string | null
      addedBy: string
      addedAt: string
    }>
  } | null
}

export type ListLedgerPublishListsQueryVariables = Exact<{
  limit?: number
  offset?: number
}>

export type ListLedgerPublishListsQuery = {
  publishLists: {
    publishLists: Array<{
      id: string
      name: string
      description: string | null
      memberCount: number
      createdBy: string
      createdAt: string
      updatedAt: string
    }>
    pagination: { total: number; limit: number; offset: number; hasMore: boolean }
  } | null
}

export type GetLedgerReportQueryVariables = Exact<{
  reportId: string
}>

export type GetLedgerReportQuery = {
  report: {
    id: string
    name: string
    taxonomyId: string
    generationStatus: string
    periodType: string
    periodStart: string | null
    periodEnd: string | null
    comparative: boolean
    mappingId: string | null
    aiGenerated: boolean
    createdAt: string
    lastGenerated: string | null
    entityName: string | null
    sourceGraphId: string | null
    sourceReportId: string | null
    sharedAt: string | null
    periods: Array<{ start: string; end: string; label: string }> | null
    structures: Array<{ id: string; name: string; blockType: string }>
  } | null
}

export type GetLedgerReportDownloadUrlQueryVariables = Exact<{
  reportId: string
  format?: ReportDownloadFormat | null | undefined
  expiresIn?: number | null | undefined
}>

export type GetLedgerReportDownloadUrlQuery = {
  reportDownloadUrl: {
    downloadUrl: string
    expiresAt: string
    contentType: string
    format: string
    generationCount: number
  } | null
}

export type GetLedgerReportPackageQueryVariables = Exact<{
  reportId: string
}>

export type GetLedgerReportPackageQuery = {
  reportPackage: {
    id: string
    name: string
    description: string | null
    taxonomyId: string
    periodType: string
    periodStart: string | null
    periodEnd: string | null
    generationStatus: string
    lastGenerated: string | null
    filingStatus: string
    filedAt: string | null
    filedBy: string | null
    supersedesId: string | null
    supersededById: string | null
    sourceGraphId: string | null
    sourceReportId: string | null
    sharedAt: string | null
    entityName: string | null
    aiGenerated: boolean
    createdAt: string
    createdBy: string
    items: Array<{
      factSetId: string
      structureId: string | null
      displayOrder: number
      block: {
        id: string
        blockType: string
        name: string
        displayName: string
        category: string
        taxonomyId: string | null
        taxonomyName: string | null
        informationModel: { conceptArrangement: string | null; memberArrangement: string | null }
        artifact: {
          topic: string | null
          rendererNote: string | null
          template: unknown
          mechanics: unknown
        }
        elements: Array<{
          id: string
          qname: string | null
          name: string
          code: string | null
          elementType: string
          isAbstract: boolean
          isMonetary: boolean
          balanceType: string | null
          periodType: string | null
        }>
        connections: Array<{
          id: string
          fromElementId: string
          toElementId: string
          associationType: string
          arcrole: string | null
          orderValue: number | null
          weight: number | null
        }>
        facts: Array<{
          id: string
          elementId: string
          value: number | null
          textValue: string | null
          factType: string
          contentType: string | null
          periodStart: string | null
          periodEnd: string
          periodType: string
          unit: string
          factScope: string
          factSetId: string | null
        }>
        rules: Array<{
          id: string
          ruleCategory: string
          rulePattern: string | null
          ruleCheckKind: string | null
          ruleExpression: string
          ruleMessage: string | null
          ruleSeverity: string
          ruleOrigin: string
          ruleTarget: { targetKind: string; targetRefId: string } | null
          ruleVariables: Array<{ variableName: string; variableQname: string | null }>
        }>
        factSet: {
          id: string
          structureId: string | null
          periodStart: string | null
          periodEnd: string
          factsetType: string
          entityId: string
          reportId: string | null
          scenarioId: string | null
          provenance: unknown
        } | null
        verificationResults: Array<{
          id: string
          ruleId: string
          structureId: string | null
          factSetId: string | null
          status: string
          message: string | null
          periodStart: string | null
          periodEnd: string | null
          evaluatedAt: string | null
        }>
        verificationSummary: {
          total: number
          passed: number
          failed: number
          errored: number
          skipped: number
          byCategory: Array<{
            category: string
            total: number
            passed: number
            failed: number
            errored: number
            skipped: number
          }>
        } | null
        view: {
          rendering: {
            unmappedCount: number
            rows: Array<{
              elementId: string
              elementQname: string | null
              elementName: string
              classification: string | null
              balanceType: string | null
              itemType: string | null
              values: Array<number | null>
              textValue: string | null
              isSubtotal: boolean
              depth: number
            }>
            periods: Array<{
              start: string
              end: string
              label: string | null
              forecast: boolean | null
            }>
            validation: {
              passed: boolean
              checks: Array<string>
              failures: Array<string>
              warnings: Array<string>
            } | null
          } | null
          chart: {
            panels: Array<{
              label: string | null
              itemType: string | null
              kind: string
              series: Array<{ key: string; elementId: string; label: string }>
            }>
          } | null
        }
      }
    }>
  } | null
}

export type GetLedgerReportingTaxonomyQueryVariables = Exact<{ [key: string]: never }>

export type GetLedgerReportingTaxonomyQuery = {
  reportingTaxonomy: {
    id: string
    name: string
    description: string | null
    taxonomyType: string
    version: string | null
    standard: string | null
    namespaceUri: string | null
    isShared: boolean
    isActive: boolean
    isLocked: boolean
    sourceTaxonomyId: string | null
    targetTaxonomyId: string | null
  } | null
}

export type ListLedgerReportsQueryVariables = Exact<{ [key: string]: never }>

export type ListLedgerReportsQuery = {
  reports: {
    reports: Array<{
      id: string
      name: string
      taxonomyId: string
      generationStatus: string
      periodType: string
      periodStart: string | null
      periodEnd: string | null
      comparative: boolean
      mappingId: string | null
      aiGenerated: boolean
      createdAt: string
      lastGenerated: string | null
      entityName: string | null
      sourceGraphId: string | null
      sourceReportId: string | null
      sharedAt: string | null
      periods: Array<{ start: string; end: string; label: string }> | null
      structures: Array<{ id: string; name: string; blockType: string }>
    }>
  } | null
}

export type GetLedgerStatementQueryVariables = Exact<{
  reportId: string
  blockType: string
}>

export type GetLedgerStatementQuery = {
  statement: {
    reportId: string
    structureId: string
    structureName: string
    blockType: string
    unmappedCount: number
    periods: Array<{ start: string; end: string; label: string }>
    rows: Array<{
      elementId: string
      elementQname: string
      elementName: string
      trait: string | null
      values: Array<number | null>
      isSubtotal: boolean
      depth: number
    }>
    validation: {
      passed: boolean
      checks: Array<string>
      failures: Array<string>
      warnings: Array<string>
    } | null
  } | null
}

export type ListLedgerStructuresQueryVariables = Exact<{
  taxonomyId: string | null | undefined
  blockType: string | null | undefined
}>

export type ListLedgerStructuresQuery = {
  structures: {
    structures: Array<{
      id: string
      name: string
      description: string | null
      blockType: string
      taxonomyId: string
      isActive: boolean
    }>
  } | null
}

export type GetLedgerSummaryQueryVariables = Exact<{ [key: string]: never }>

export type GetLedgerSummaryQuery = {
  summary: {
    graphId: string
    accountCount: number
    transactionCount: number
    entryCount: number
    lineItemCount: number
    earliestTransactionDate: string | null
    latestTransactionDate: string | null
    connectionCount: number
    lastSyncAt: string | null
  } | null
}

export type ListLedgerTaxonomiesQueryVariables = Exact<{
  taxonomyType: string | null | undefined
}>

export type ListLedgerTaxonomiesQuery = {
  taxonomies: {
    taxonomies: Array<{
      id: string
      name: string
      description: string | null
      taxonomyType: string
      version: string | null
      standard: string | null
      namespaceUri: string | null
      isShared: boolean
      isActive: boolean
      isLocked: boolean
      sourceTaxonomyId: string | null
      targetTaxonomyId: string | null
    }>
  } | null
}

export type GetLedgerTransactionQueryVariables = Exact<{
  transactionId: string
}>

export type GetLedgerTransactionQuery = {
  transaction: {
    id: string
    number: string | null
    type: string
    category: string | null
    amount: number
    currency: string
    date: string
    dueDate: string | null
    merchantName: string | null
    referenceNumber: string | null
    description: string | null
    source: string
    sourceId: string | null
    status: string
    postedAt: string | null
    entries: Array<{
      id: string
      number: string | null
      type: string
      postingDate: string
      memo: string | null
      status: string
      postedAt: string | null
      lineItems: Array<{
        id: string
        accountId: string
        accountName: string | null
        accountCode: string | null
        debitAmount: number
        creditAmount: number
        description: string | null
        lineOrder: number
      }>
    }>
  } | null
}

export type ListLedgerTransactionsQueryVariables = Exact<{
  type: string | null | undefined
  startDate: string | null | undefined
  endDate: string | null | undefined
  limit?: number
  offset?: number
}>

export type ListLedgerTransactionsQuery = {
  transactions: {
    transactions: Array<{
      id: string
      number: string | null
      type: string
      category: string | null
      amount: number
      currency: string
      date: string
      dueDate: string | null
      merchantName: string | null
      referenceNumber: string | null
      description: string | null
      source: string
      status: string
    }>
    pagination: { total: number; limit: number; offset: number; hasMore: boolean }
  } | null
}

export type GetLedgerTrialBalanceQueryVariables = Exact<{
  startDate: string | null | undefined
  endDate: string | null | undefined
}>

export type GetLedgerTrialBalanceQuery = {
  trialBalance: {
    totalDebits: number
    totalCredits: number
    rows: Array<{
      accountId: string
      accountCode: string
      accountName: string
      trait: string | null
      accountType: string | null
      totalDebits: number
      totalCredits: number
      netBalance: number
    }>
  } | null
}

export type ListLedgerUnmappedElementsQueryVariables = Exact<{
  mappingId: string | null | undefined
}>

export type ListLedgerUnmappedElementsQuery = {
  unmappedElements: Array<{
    id: string
    code: string | null
    name: string
    trait: string | null
    balanceType: string
    externalSource: string | null
    suggestedTargets: Array<{
      elementId: string
      qname: string
      name: string
      confidence: number | null
    }>
  }>
}

export type ListLibraryTaxonomyArcsQueryVariables = Exact<{
  taxonomyId: string | number
  associationType: string | null | undefined
  structureId: string | number | null | undefined
  limit?: number
  offset?: number
}>

export type ListLibraryTaxonomyArcsQuery = {
  libraryTaxonomyArcCount: number
  libraryTaxonomyArcs: Array<{
    id: string
    structureId: string
    structureName: string | null
    fromElementId: string
    fromElementQname: string | null
    fromElementName: string | null
    fromElementTrait: string | null
    fromElementIsAbstract: boolean | null
    toElementId: string
    toElementQname: string | null
    toElementName: string | null
    toElementTrait: string | null
    toElementIsAbstract: boolean | null
    associationType: string
    arcrole: string | null
    orderValue: number | null
    weight: number | null
  }>
}

export type GetLibraryElementArcsQueryVariables = Exact<{
  id: string | number
}>

export type GetLibraryElementArcsQuery = {
  libraryElementArcs: Array<{
    id: string
    direction: string
    associationType: string
    arcrole: string | null
    taxonomyId: string | null
    taxonomyStandard: string | null
    taxonomyName: string | null
    structureId: string | null
    structureName: string | null
    peer: { id: string; qname: string; name: string; trait: string | null; source: string }
  }>
}

export type GetLibraryElementClassificationsQueryVariables = Exact<{
  id: string | number
}>

export type GetLibraryElementClassificationsQuery = {
  libraryElementClassifications: Array<{
    category: string
    identifier: string
    name: string | null
    isPrimary: boolean
  }>
}

export type GetLibraryElementEquivalentsQueryVariables = Exact<{
  id: string | number
}>

export type GetLibraryElementEquivalentsQuery = {
  libraryElementEquivalents: {
    element: { id: string; qname: string; name: string; trait: string | null; source: string }
    equivalents: Array<{
      id: string
      qname: string
      name: string
      trait: string | null
      source: string
    }>
  } | null
}

export type ListLibraryElementsQueryVariables = Exact<{
  taxonomyId: string | number | null | undefined
  source: string | null | undefined
  classification: string | null | undefined
  activityType: string | null | undefined
  elementType: string | null | undefined
  isAbstract: boolean | null | undefined
  limit?: number
  offset?: number
  includeLabels?: boolean
  includeReferences?: boolean
}>

export type ListLibraryElementsQuery = {
  libraryElements: Array<{
    id: string
    qname: string
    namespace: string | null
    name: string
    trait: string | null
    balanceType: string
    periodType: string
    isAbstract: boolean
    isMonetary: boolean
    elementType: string
    source: string
    taxonomyId: string | null
    parentId: string | null
    labels?: Array<{ role: string; language: string; text: string }>
    references?: Array<{ refType: string | null; citation: string; uri: string | null }>
  }>
}

export type SearchLibraryElementsQueryVariables = Exact<{
  query: string
  source: string | null | undefined
  limit?: number
}>

export type SearchLibraryElementsQuery = {
  searchLibraryElements: Array<{
    id: string
    qname: string
    namespace: string | null
    name: string
    trait: string | null
    balanceType: string
    periodType: string
    isAbstract: boolean
    isMonetary: boolean
    elementType: string
    source: string
    taxonomyId: string | null
    parentId: string | null
    labels: Array<{ role: string; language: string; text: string }>
    references: Array<{ refType: string | null; citation: string; uri: string | null }>
  }>
}

export type GetLibraryElementQueryVariables = Exact<{
  id: string | number | null | undefined
  qname: string | null | undefined
}>

export type GetLibraryElementQuery = {
  libraryElement: {
    id: string
    qname: string
    namespace: string | null
    name: string
    trait: string | null
    balanceType: string
    periodType: string
    isAbstract: boolean
    isMonetary: boolean
    elementType: string
    source: string
    taxonomyId: string | null
    parentId: string | null
    labels: Array<{ role: string; language: string; text: string }>
    references: Array<{ refType: string | null; citation: string; uri: string | null }>
  } | null
}

export type ListLibraryStructuresQueryVariables = Exact<{
  taxonomyId: string | number | null | undefined
  blockType: string | null | undefined
}>

export type ListLibraryStructuresQuery = {
  libraryStructures: Array<{
    id: string
    name: string
    blockType: string
    taxonomyId: string
    roleUri: string | null
    isActive: boolean
  }>
}

export type GetLibraryStructureQueryVariables = Exact<{
  id: string | number
}>

export type GetLibraryStructureQuery = {
  libraryStructure: {
    id: string
    name: string
    blockType: string
    taxonomyId: string
    roleUri: string | null
    isActive: boolean
  } | null
}

export type ListLibraryTaxonomiesQueryVariables = Exact<{
  standard: string | null | undefined
  includeElementCount?: boolean
}>

export type ListLibraryTaxonomiesQuery = {
  libraryTaxonomies: Array<{
    id: string
    name: string
    description: string | null
    standard: string | null
    version: string | null
    namespaceUri: string | null
    taxonomyType: string
    isShared: boolean
    isActive: boolean
    isLocked: boolean
    elementCount: number | null
  }>
}

export type GetLibraryTaxonomyQueryVariables = Exact<{
  id: string | number | null | undefined
  standard: string | null | undefined
  version: string | null | undefined
  includeElementCount?: boolean
}>

export type GetLibraryTaxonomyQuery = {
  libraryTaxonomy: {
    id: string
    name: string
    description: string | null
    standard: string | null
    version: string | null
    namespaceUri: string | null
    taxonomyType: string
    isShared: boolean
    isActive: boolean
    isLocked: boolean
    elementCount: number | null
  } | null
}

export const GetInvestorHoldingsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetInvestorHoldings' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'portfolioId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'holdings' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'portfolioId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'portfolioId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'totalEntities' } },
                { kind: 'Field', name: { kind: 'Name', value: 'totalPositions' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'holdings' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'entityId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'entityName' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'sourceGraphId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'totalCostBasisDollars' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'totalCurrentValueDollars' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'positionCount' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'securities' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'securityId' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'securityName' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'securityType' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'quantity' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'quantityType' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'costBasisDollars' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'currentValueDollars' } },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetInvestorHoldingsQuery, GetInvestorHoldingsQueryVariables>
export const GetInvestorPortfolioBlockDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetInvestorPortfolioBlock' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'portfolioId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'portfolioBlock' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'portfolioId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'portfolioId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                { kind: 'Field', name: { kind: 'Name', value: 'strategy' } },
                { kind: 'Field', name: { kind: 'Name', value: 'inceptionDate' } },
                { kind: 'Field', name: { kind: 'Name', value: 'baseCurrency' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'owner' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'sourceGraphId' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'positions' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'quantity' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'quantityType' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'costBasisDollars' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'currentValueDollars' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'valuationDate' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'valuationSource' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'acquisitionDate' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'notes' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'security' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'securityType' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'securitySubtype' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'sourceGraphId' } },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'issuer' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'sourceGraphId' } },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'totalCostBasisDollars' } },
                { kind: 'Field', name: { kind: 'Name', value: 'totalCurrentValueDollars' } },
                { kind: 'Field', name: { kind: 'Name', value: 'activePositionCount' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  GetInvestorPortfolioBlockQuery,
  GetInvestorPortfolioBlockQueryVariables
>
export const ListInvestorPortfoliosDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ListInvestorPortfolios' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'limit' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          },
          defaultValue: { kind: 'IntValue', value: '100' },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'offset' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          },
          defaultValue: { kind: 'IntValue', value: '0' },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'portfolios' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'limit' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'limit' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'offset' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'offset' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'portfolios' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'strategy' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'inceptionDate' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'baseCurrency' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'pagination' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'total' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'limit' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'offset' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'hasMore' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ListInvestorPortfoliosQuery, ListInvestorPortfoliosQueryVariables>
export const GetInvestorPositionDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetInvestorPosition' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'positionId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'position' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'positionId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'positionId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'portfolioId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'securityId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'securityName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'entityName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'quantity' } },
                { kind: 'Field', name: { kind: 'Name', value: 'quantityType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'costBasis' } },
                { kind: 'Field', name: { kind: 'Name', value: 'costBasisDollars' } },
                { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
                { kind: 'Field', name: { kind: 'Name', value: 'currentValue' } },
                { kind: 'Field', name: { kind: 'Name', value: 'currentValueDollars' } },
                { kind: 'Field', name: { kind: 'Name', value: 'valuationDate' } },
                { kind: 'Field', name: { kind: 'Name', value: 'valuationSource' } },
                { kind: 'Field', name: { kind: 'Name', value: 'acquisitionDate' } },
                { kind: 'Field', name: { kind: 'Name', value: 'dispositionDate' } },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'notes' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetInvestorPositionQuery, GetInvestorPositionQueryVariables>
export const ListInvestorPositionsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ListInvestorPositions' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'portfolioId' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'securityId' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'status' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'limit' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          },
          defaultValue: { kind: 'IntValue', value: '100' },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'offset' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          },
          defaultValue: { kind: 'IntValue', value: '0' },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'positions' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'portfolioId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'portfolioId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'securityId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'securityId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'status' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'status' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'limit' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'limit' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'offset' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'offset' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'positions' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'portfolioId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'securityId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'securityName' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'entityName' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'quantity' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'quantityType' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'costBasis' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'costBasisDollars' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'currentValue' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'currentValueDollars' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'valuationDate' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'valuationSource' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'acquisitionDate' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'dispositionDate' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'notes' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'pagination' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'total' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'limit' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'offset' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'hasMore' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ListInvestorPositionsQuery, ListInvestorPositionsQueryVariables>
export const ListInvestorSecuritiesDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ListInvestorSecurities' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'entityId' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'securityType' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'isActive' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Boolean' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'limit' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          },
          defaultValue: { kind: 'IntValue', value: '100' },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'offset' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          },
          defaultValue: { kind: 'IntValue', value: '0' },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'securities' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'entityId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'entityId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'securityType' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'securityType' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'isActive' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'isActive' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'limit' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'limit' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'offset' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'offset' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'securities' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'entityId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'entityName' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'sourceGraphId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'securityType' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'securitySubtype' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'terms' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'authorizedShares' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'outstandingShares' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'pagination' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'total' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'limit' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'offset' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'hasMore' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ListInvestorSecuritiesQuery, ListInvestorSecuritiesQueryVariables>
export const GetInvestorSecurityDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetInvestorSecurity' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'securityId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'security' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'securityId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'securityId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'entityId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'entityName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'sourceGraphId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'securityType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'securitySubtype' } },
                { kind: 'Field', name: { kind: 'Name', value: 'terms' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                { kind: 'Field', name: { kind: 'Name', value: 'authorizedShares' } },
                { kind: 'Field', name: { kind: 'Name', value: 'outstandingShares' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetInvestorSecurityQuery, GetInvestorSecurityQueryVariables>
export const GetLedgerAccountRollupsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetLedgerAccountRollups' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'mappingId' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'startDate' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Date' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'endDate' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Date' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'accountRollups' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'mappingId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'mappingId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'startDate' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'startDate' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'endDate' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'endDate' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'mappingId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'mappingName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'totalMapped' } },
                { kind: 'Field', name: { kind: 'Name', value: 'totalUnmapped' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'groups' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'reportingElementId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'reportingName' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'reportingQname' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'trait' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'balanceType' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'total' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'accounts' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'elementId' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'accountName' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'accountCode' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'totalDebits' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'totalCredits' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'netBalance' } },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetLedgerAccountRollupsQuery, GetLedgerAccountRollupsQueryVariables>
export const GetLedgerAccountTreeDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetLedgerAccountTree' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'accountTree' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'totalAccounts' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'roots' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'trait' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'accountType' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'balanceType' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'depth' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'children' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'trait' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'accountType' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'balanceType' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'depth' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'children' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'trait' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'accountType' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'balanceType' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'depth' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'children' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [
                                        { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'trait' } },
                                        {
                                          kind: 'Field',
                                          name: { kind: 'Name', value: 'accountType' },
                                        },
                                        {
                                          kind: 'Field',
                                          name: { kind: 'Name', value: 'balanceType' },
                                        },
                                        { kind: 'Field', name: { kind: 'Name', value: 'depth' } },
                                        {
                                          kind: 'Field',
                                          name: { kind: 'Name', value: 'isActive' },
                                        },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetLedgerAccountTreeQuery, GetLedgerAccountTreeQueryVariables>
export const ListLedgerAccountsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ListLedgerAccounts' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'classification' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'isActive' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Boolean' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'limit' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          },
          defaultValue: { kind: 'IntValue', value: '100' },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'offset' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          },
          defaultValue: { kind: 'IntValue', value: '0' },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'accounts' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'classification' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'classification' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'isActive' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'isActive' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'limit' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'limit' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'offset' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'offset' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'accounts' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'subClassification' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'balanceType' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'parentId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'depth' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'isPlaceholder' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'accountType' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'externalId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'externalSource' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'pagination' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'total' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'limit' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'offset' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'hasMore' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ListLedgerAccountsQuery, ListLedgerAccountsQueryVariables>
export const GetLedgerAgentDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetLedgerAgent' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'agent' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'agentType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'legalName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'taxId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'registrationNumber' } },
                { kind: 'Field', name: { kind: 'Name', value: 'duns' } },
                { kind: 'Field', name: { kind: 'Name', value: 'lei' } },
                { kind: 'Field', name: { kind: 'Name', value: 'email' } },
                { kind: 'Field', name: { kind: 'Name', value: 'phone' } },
                { kind: 'Field', name: { kind: 'Name', value: 'address' } },
                { kind: 'Field', name: { kind: 'Name', value: 'source' } },
                { kind: 'Field', name: { kind: 'Name', value: 'externalId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                { kind: 'Field', name: { kind: 'Name', value: 'is1099Recipient' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdBy' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetLedgerAgentQuery, GetLedgerAgentQueryVariables>
export const ListLedgerAgentsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ListLedgerAgents' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'agentType' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'source' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'isActive' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Boolean' } },
          defaultValue: { kind: 'BooleanValue', value: true },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'limit' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          },
          defaultValue: { kind: 'IntValue', value: '50' },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'offset' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          },
          defaultValue: { kind: 'IntValue', value: '0' },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'agents' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'agentType' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'agentType' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'source' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'source' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'isActive' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'isActive' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'limit' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'limit' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'offset' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'offset' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'agentType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'legalName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'taxId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'registrationNumber' } },
                { kind: 'Field', name: { kind: 'Name', value: 'duns' } },
                { kind: 'Field', name: { kind: 'Name', value: 'lei' } },
                { kind: 'Field', name: { kind: 'Name', value: 'email' } },
                { kind: 'Field', name: { kind: 'Name', value: 'phone' } },
                { kind: 'Field', name: { kind: 'Name', value: 'address' } },
                { kind: 'Field', name: { kind: 'Name', value: 'source' } },
                { kind: 'Field', name: { kind: 'Name', value: 'externalId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                { kind: 'Field', name: { kind: 'Name', value: 'is1099Recipient' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdBy' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ListLedgerAgentsQuery, ListLedgerAgentsQueryVariables>
export const ListLedgerBlockedSourceGraphsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ListLedgerBlockedSourceGraphs' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'limit' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          },
          defaultValue: { kind: 'IntValue', value: '100' },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'offset' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          },
          defaultValue: { kind: 'IntValue', value: '0' },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'blockedSourceGraphs' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'limit' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'limit' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'offset' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'offset' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'blockedSourceGraphs' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'sourceGraphId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'sourceGraphName' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'blockedBy' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'blockedAt' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'reason' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'pagination' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'total' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'limit' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'offset' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'hasMore' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  ListLedgerBlockedSourceGraphsQuery,
  ListLedgerBlockedSourceGraphsQueryVariables
>
export const GetLedgerClosingBookStructuresDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetLedgerClosingBookStructures' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'closingBookStructures' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'hasData' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'categories' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'label' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'items' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'itemType' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'blockType' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'reportId' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  GetLedgerClosingBookStructuresQuery,
  GetLedgerClosingBookStructuresQueryVariables
>
export const ListLedgerElementsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ListLedgerElements' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'taxonomyId' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'source' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'classification' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'isAbstract' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Boolean' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'limit' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          },
          defaultValue: { kind: 'IntValue', value: '100' },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'offset' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          },
          defaultValue: { kind: 'IntValue', value: '0' },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'elements' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'taxonomyId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'taxonomyId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'source' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'source' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'classification' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'classification' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'isAbstract' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'isAbstract' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'limit' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'limit' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'offset' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'offset' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'elements' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'qname' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'namespace' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'trait' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'subClassification' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'balanceType' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'periodType' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'isAbstract' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'elementType' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'source' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'taxonomyId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'parentId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'depth' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'externalId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'externalSource' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'pagination' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'total' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'limit' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'offset' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'hasMore' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ListLedgerElementsQuery, ListLedgerElementsQueryVariables>
export const ListLedgerEntitiesDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ListLedgerEntities' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'source' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'entities' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'source' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'source' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'legalName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'ticker' } },
                { kind: 'Field', name: { kind: 'Name', value: 'cik' } },
                { kind: 'Field', name: { kind: 'Name', value: 'industry' } },
                { kind: 'Field', name: { kind: 'Name', value: 'entityType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isParent' } },
                { kind: 'Field', name: { kind: 'Name', value: 'parentEntityId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'source' } },
                { kind: 'Field', name: { kind: 'Name', value: 'sourceGraphId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'connectionId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ListLedgerEntitiesQuery, ListLedgerEntitiesQueryVariables>
export const GetLedgerEntityDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetLedgerEntity' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'entity' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'legalName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'uri' } },
                { kind: 'Field', name: { kind: 'Name', value: 'cik' } },
                { kind: 'Field', name: { kind: 'Name', value: 'ticker' } },
                { kind: 'Field', name: { kind: 'Name', value: 'exchange' } },
                { kind: 'Field', name: { kind: 'Name', value: 'sic' } },
                { kind: 'Field', name: { kind: 'Name', value: 'sicDescription' } },
                { kind: 'Field', name: { kind: 'Name', value: 'category' } },
                { kind: 'Field', name: { kind: 'Name', value: 'stateOfIncorporation' } },
                { kind: 'Field', name: { kind: 'Name', value: 'fiscalYearEnd' } },
                { kind: 'Field', name: { kind: 'Name', value: 'taxId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'lei' } },
                { kind: 'Field', name: { kind: 'Name', value: 'industry' } },
                { kind: 'Field', name: { kind: 'Name', value: 'entityType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'phone' } },
                { kind: 'Field', name: { kind: 'Name', value: 'website' } },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isParent' } },
                { kind: 'Field', name: { kind: 'Name', value: 'parentEntityId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'source' } },
                { kind: 'Field', name: { kind: 'Name', value: 'sourceId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'sourceGraphId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'connectionId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'addressLine1' } },
                { kind: 'Field', name: { kind: 'Name', value: 'addressCity' } },
                { kind: 'Field', name: { kind: 'Name', value: 'addressState' } },
                { kind: 'Field', name: { kind: 'Name', value: 'addressPostalCode' } },
                { kind: 'Field', name: { kind: 'Name', value: 'addressCountry' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetLedgerEntityQuery, GetLedgerEntityQueryVariables>
export const GetLedgerEventBlockDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetLedgerEventBlock' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'eventBlock' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'eventType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'eventCategory' } },
                { kind: 'Field', name: { kind: 'Name', value: 'eventClass' } },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'occurredAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'effectiveAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'source' } },
                { kind: 'Field', name: { kind: 'Name', value: 'externalId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'externalUrl' } },
                { kind: 'Field', name: { kind: 'Name', value: 'amount' } },
                { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
                { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                { kind: 'Field', name: { kind: 'Name', value: 'metadata' } },
                { kind: 'Field', name: { kind: 'Name', value: 'dimensionIds' } },
                { kind: 'Field', name: { kind: 'Name', value: 'agentId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'resourceType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'resourceElementId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'replacedByEventId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'replacesEventId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'obligatedByEventId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'dischargesEventId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdBy' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetLedgerEventBlockQuery, GetLedgerEventBlockQueryVariables>
export const ListLedgerEventBlocksDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ListLedgerEventBlocks' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'eventType' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'eventCategory' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'status' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'agentId' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'source' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'limit' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          },
          defaultValue: { kind: 'IntValue', value: '50' },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'offset' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          },
          defaultValue: { kind: 'IntValue', value: '0' },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'eventBlocks' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'eventType' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'eventType' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'eventCategory' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'eventCategory' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'status' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'status' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'agentId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'agentId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'source' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'source' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'limit' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'limit' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'offset' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'offset' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'eventType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'eventCategory' } },
                { kind: 'Field', name: { kind: 'Name', value: 'eventClass' } },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'occurredAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'effectiveAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'source' } },
                { kind: 'Field', name: { kind: 'Name', value: 'externalId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'externalUrl' } },
                { kind: 'Field', name: { kind: 'Name', value: 'amount' } },
                { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
                { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                { kind: 'Field', name: { kind: 'Name', value: 'metadata' } },
                { kind: 'Field', name: { kind: 'Name', value: 'dimensionIds' } },
                { kind: 'Field', name: { kind: 'Name', value: 'agentId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'resourceType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'resourceElementId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'replacedByEventId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'replacesEventId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'obligatedByEventId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'dischargesEventId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdBy' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ListLedgerEventBlocksQuery, ListLedgerEventBlocksQueryVariables>
export const GetLedgerFiscalCalendarDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetLedgerFiscalCalendar' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'fiscalCalendar' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'graphId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'fiscalYearStartMonth' } },
                { kind: 'Field', name: { kind: 'Name', value: 'closedThrough' } },
                { kind: 'Field', name: { kind: 'Name', value: 'closeTarget' } },
                { kind: 'Field', name: { kind: 'Name', value: 'gapPeriods' } },
                { kind: 'Field', name: { kind: 'Name', value: 'catchUpSequence' } },
                { kind: 'Field', name: { kind: 'Name', value: 'closeableNow' } },
                { kind: 'Field', name: { kind: 'Name', value: 'blockers' } },
                { kind: 'Field', name: { kind: 'Name', value: 'pendingObligationCount' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'pendingObligationSample' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'eventId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'scheduleId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'scheduleName' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'period' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'earliestPendingPeriod' } },
                { kind: 'Field', name: { kind: 'Name', value: 'strandedObligationCount' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'strandedObligationSample' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'eventId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'scheduleId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'scheduleName' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'period' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'syncStaleDays' } },
                { kind: 'Field', name: { kind: 'Name', value: 'lastCloseAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'initializedAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'lastSyncAt' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'periods' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'startDate' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'endDate' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'closedAt' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetLedgerFiscalCalendarQuery, GetLedgerFiscalCalendarQueryVariables>
export const GetInformationBlockDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetInformationBlock' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'scenarioId' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'series' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Boolean' } },
          },
          defaultValue: { kind: 'BooleanValue', value: false },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'informationBlock' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'scenarioId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'scenarioId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'series' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'series' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'blockType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'category' } },
                { kind: 'Field', name: { kind: 'Name', value: 'taxonomyId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'taxonomyName' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'informationModel' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'conceptArrangement' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'memberArrangement' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'artifact' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'topic' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'rendererNote' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'template' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'mechanics' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'elements' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'qname' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'elementType' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'isAbstract' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'isMonetary' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'balanceType' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'periodType' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'connections' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'fromElementId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'toElementId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'associationType' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'arcrole' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'orderValue' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'weight' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'facts' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'elementId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'value' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'textValue' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'factType' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'contentType' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'periodStart' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'periodEnd' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'periodType' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'unit' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'factScope' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'factSetId' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'rules' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'ruleCategory' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'rulePattern' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'ruleCheckKind' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'ruleExpression' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'ruleMessage' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'ruleSeverity' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'ruleOrigin' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'ruleTarget' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'targetKind' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'targetRefId' } },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'ruleVariables' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'variableName' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'variableQname' } },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'factSet' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'structureId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'periodStart' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'periodEnd' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'factsetType' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'entityId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'reportId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'scenarioId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'provenance' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'verificationResults' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'ruleId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'structureId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'factSetId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'message' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'periodStart' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'periodEnd' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'evaluatedAt' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'verificationSummary' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'total' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'passed' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'failed' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'errored' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'skipped' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'byCategory' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'category' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'total' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'passed' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'failed' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'errored' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'skipped' } },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'view' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'rendering' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'rows' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'elementId' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'elementQname' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'elementName' } },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'classification' },
                                  },
                                  { kind: 'Field', name: { kind: 'Name', value: 'balanceType' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'itemType' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'values' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'textValue' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'isSubtotal' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'depth' } },
                                ],
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'periods' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'start' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'end' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'label' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'forecast' } },
                                ],
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'validation' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'passed' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'checks' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'failures' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'warnings' } },
                                ],
                              },
                            },
                            { kind: 'Field', name: { kind: 'Name', value: 'unmappedCount' } },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'chart' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'panels' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'label' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'itemType' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'kind' } },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'series' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [
                                        { kind: 'Field', name: { kind: 'Name', value: 'key' } },
                                        {
                                          kind: 'Field',
                                          name: { kind: 'Name', value: 'elementId' },
                                        },
                                        { kind: 'Field', name: { kind: 'Name', value: 'label' } },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetInformationBlockQuery, GetInformationBlockQueryVariables>
export const GetInformationBlockWindowedDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetInformationBlockWindowed' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'scenarioId' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'series' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Boolean' } },
          },
          defaultValue: { kind: 'BooleanValue', value: false },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'seriesHistory' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'seriesForecast' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'informationBlock' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'scenarioId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'scenarioId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'series' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'series' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'seriesHistory' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'seriesHistory' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'seriesForecast' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'seriesForecast' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'blockType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'category' } },
                { kind: 'Field', name: { kind: 'Name', value: 'taxonomyId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'taxonomyName' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'informationModel' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'conceptArrangement' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'memberArrangement' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'artifact' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'topic' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'rendererNote' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'template' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'mechanics' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'elements' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'qname' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'elementType' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'isAbstract' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'isMonetary' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'balanceType' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'periodType' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'connections' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'fromElementId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'toElementId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'associationType' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'arcrole' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'orderValue' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'weight' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'facts' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'elementId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'value' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'textValue' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'factType' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'contentType' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'periodStart' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'periodEnd' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'periodType' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'unit' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'factScope' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'factSetId' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'rules' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'ruleCategory' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'rulePattern' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'ruleCheckKind' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'ruleExpression' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'ruleMessage' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'ruleSeverity' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'ruleOrigin' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'ruleTarget' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'targetKind' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'targetRefId' } },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'ruleVariables' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'variableName' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'variableQname' } },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'factSet' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'structureId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'periodStart' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'periodEnd' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'factsetType' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'entityId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'reportId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'scenarioId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'provenance' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'verificationResults' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'ruleId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'structureId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'factSetId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'message' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'periodStart' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'periodEnd' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'evaluatedAt' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'verificationSummary' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'total' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'passed' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'failed' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'errored' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'skipped' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'byCategory' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'category' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'total' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'passed' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'failed' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'errored' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'skipped' } },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'view' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'rendering' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'rows' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'elementId' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'elementQname' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'elementName' } },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'classification' },
                                  },
                                  { kind: 'Field', name: { kind: 'Name', value: 'balanceType' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'itemType' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'values' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'textValue' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'isSubtotal' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'depth' } },
                                ],
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'periods' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'start' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'end' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'label' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'forecast' } },
                                ],
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'validation' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'passed' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'checks' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'failures' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'warnings' } },
                                ],
                              },
                            },
                            { kind: 'Field', name: { kind: 'Name', value: 'unmappedCount' } },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'chart' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'panels' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'label' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'itemType' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'kind' } },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'series' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [
                                        { kind: 'Field', name: { kind: 'Name', value: 'key' } },
                                        {
                                          kind: 'Field',
                                          name: { kind: 'Name', value: 'elementId' },
                                        },
                                        { kind: 'Field', name: { kind: 'Name', value: 'label' } },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  GetInformationBlockWindowedQuery,
  GetInformationBlockWindowedQueryVariables
>
export const ListInformationBlocksDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ListInformationBlocks' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'blockType' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'category' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'limit' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'offset' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'scenarioId' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'informationBlocks' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'blockType' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'blockType' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'category' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'category' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'limit' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'limit' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'offset' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'offset' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'scenarioId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'scenarioId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'blockType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'category' } },
                { kind: 'Field', name: { kind: 'Name', value: 'taxonomyId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'taxonomyName' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'informationModel' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'conceptArrangement' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'memberArrangement' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'artifact' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'topic' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'rendererNote' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'template' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'mechanics' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'elements' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'qname' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'elementType' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'isAbstract' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'isMonetary' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'balanceType' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'periodType' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'connections' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'fromElementId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'toElementId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'associationType' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'arcrole' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'orderValue' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'weight' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'facts' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'elementId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'value' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'textValue' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'factType' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'contentType' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'periodStart' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'periodEnd' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'periodType' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'unit' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'factScope' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'factSetId' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'rules' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'ruleCategory' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'rulePattern' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'ruleCheckKind' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'ruleExpression' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'ruleMessage' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'ruleSeverity' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'ruleOrigin' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'ruleTarget' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'targetKind' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'targetRefId' } },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'ruleVariables' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'variableName' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'variableQname' } },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'factSet' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'structureId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'periodStart' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'periodEnd' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'factsetType' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'entityId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'reportId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'scenarioId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'provenance' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'verificationResults' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'ruleId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'structureId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'factSetId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'message' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'periodStart' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'periodEnd' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'evaluatedAt' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'verificationSummary' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'total' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'passed' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'failed' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'errored' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'skipped' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'byCategory' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'category' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'total' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'passed' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'failed' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'errored' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'skipped' } },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'view' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'rendering' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'rows' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'elementId' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'elementQname' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'elementName' } },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'classification' },
                                  },
                                  { kind: 'Field', name: { kind: 'Name', value: 'balanceType' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'itemType' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'values' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'textValue' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'isSubtotal' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'depth' } },
                                ],
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'periods' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'start' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'end' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'label' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'forecast' } },
                                ],
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'validation' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'passed' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'checks' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'failures' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'warnings' } },
                                ],
                              },
                            },
                            { kind: 'Field', name: { kind: 'Name', value: 'unmappedCount' } },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'chart' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'panels' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'label' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'itemType' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'kind' } },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'series' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [
                                        { kind: 'Field', name: { kind: 'Name', value: 'key' } },
                                        {
                                          kind: 'Field',
                                          name: { kind: 'Name', value: 'elementId' },
                                        },
                                        { kind: 'Field', name: { kind: 'Name', value: 'label' } },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ListInformationBlocksQuery, ListInformationBlocksQueryVariables>
export const GetLedgerMappedTrialBalanceDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetLedgerMappedTrialBalance' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'mappingId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'startDate' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Date' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'endDate' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Date' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'mappedTrialBalance' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'mappingId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'mappingId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'startDate' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'startDate' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'endDate' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'endDate' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'mappingId' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'rows' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'reportingElementId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'qname' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'reportingName' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'trait' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'balanceType' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'totalDebits' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'totalCredits' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'netBalance' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  GetLedgerMappedTrialBalanceQuery,
  GetLedgerMappedTrialBalanceQueryVariables
>
export const GetLedgerMappingDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetLedgerMapping' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'mappingId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'mapping' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'mappingId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'mappingId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'blockType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'taxonomyId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'totalAssociations' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'associations' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'structureId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'fromElementId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'fromElementName' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'fromElementQname' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'toElementId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'toElementName' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'toElementQname' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'associationType' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'orderValue' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'weight' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'confidence' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'suggestedBy' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'approvedBy' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetLedgerMappingQuery, GetLedgerMappingQueryVariables>
export const MappingCandidatesDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'MappingCandidates' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'classification' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'mappingCandidates' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'classification' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'classification' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'qname' } },
                { kind: 'Field', name: { kind: 'Name', value: 'trait' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<MappingCandidatesQuery, MappingCandidatesQueryVariables>
export const GetLedgerMappingCoverageDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetLedgerMappingCoverage' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'mappingId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'mappingCoverage' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'mappingId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'mappingId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'mappingId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'totalCoaElements' } },
                { kind: 'Field', name: { kind: 'Name', value: 'mappedCount' } },
                { kind: 'Field', name: { kind: 'Name', value: 'unmappedCount' } },
                { kind: 'Field', name: { kind: 'Name', value: 'coveragePercent' } },
                { kind: 'Field', name: { kind: 'Name', value: 'highConfidence' } },
                { kind: 'Field', name: { kind: 'Name', value: 'mediumConfidence' } },
                { kind: 'Field', name: { kind: 'Name', value: 'lowConfidence' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetLedgerMappingCoverageQuery, GetLedgerMappingCoverageQueryVariables>
export const ListLedgerMappingsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ListLedgerMappings' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'mappings' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'structures' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'blockType' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'taxonomyId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ListLedgerMappingsQuery, ListLedgerMappingsQueryVariables>
export const GetLedgerPeriodCloseStatusDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetLedgerPeriodCloseStatus' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'periodStart' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Date' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'periodEnd' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Date' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'periodCloseStatus' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'periodStart' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'periodStart' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'periodEnd' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'periodEnd' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'fiscalPeriodStart' } },
                { kind: 'Field', name: { kind: 'Name', value: 'fiscalPeriodEnd' } },
                { kind: 'Field', name: { kind: 'Name', value: 'periodStatus' } },
                { kind: 'Field', name: { kind: 'Name', value: 'totalDraft' } },
                { kind: 'Field', name: { kind: 'Name', value: 'totalPosted' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'schedules' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'structureId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'structureName' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'amount' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'entryId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'reversalEntryId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'reversalStatus' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  GetLedgerPeriodCloseStatusQuery,
  GetLedgerPeriodCloseStatusQueryVariables
>
export const GetLedgerPeriodDraftsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetLedgerPeriodDrafts' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'period' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'periodDrafts' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'period' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'period' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'period' } },
                { kind: 'Field', name: { kind: 'Name', value: 'periodStart' } },
                { kind: 'Field', name: { kind: 'Name', value: 'periodEnd' } },
                { kind: 'Field', name: { kind: 'Name', value: 'draftCount' } },
                { kind: 'Field', name: { kind: 'Name', value: 'totalDebit' } },
                { kind: 'Field', name: { kind: 'Name', value: 'totalCredit' } },
                { kind: 'Field', name: { kind: 'Name', value: 'allBalanced' } },
                { kind: 'Field', name: { kind: 'Name', value: 'qbWritebackConnectionId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'qbWritePolicy' } },
                { kind: 'Field', name: { kind: 'Name', value: 'qbPublishCount' } },
                { kind: 'Field', name: { kind: 'Name', value: 'localOnlyCount' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'drafts' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'entryId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'postingDate' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'memo' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'provenance' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'sourceStructureId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'sourceStructureName' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'totalDebit' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'totalCredit' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'balanced' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'willPublishToQb' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'lineItems' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'lineItemId' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'elementId' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'elementCode' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'elementName' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'debitAmount' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'creditAmount' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetLedgerPeriodDraftsQuery, GetLedgerPeriodDraftsQueryVariables>
export const GetLedgerPublishListDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetLedgerPublishList' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'listId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'publishList' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'listId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'listId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                { kind: 'Field', name: { kind: 'Name', value: 'memberCount' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdBy' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'members' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'targetGraphId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'targetGraphName' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'targetOrgName' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'addedBy' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'addedAt' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetLedgerPublishListQuery, GetLedgerPublishListQueryVariables>
export const ListLedgerPublishListsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ListLedgerPublishLists' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'limit' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          },
          defaultValue: { kind: 'IntValue', value: '100' },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'offset' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          },
          defaultValue: { kind: 'IntValue', value: '0' },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'publishLists' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'limit' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'limit' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'offset' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'offset' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'publishLists' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'memberCount' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'createdBy' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'pagination' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'total' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'limit' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'offset' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'hasMore' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ListLedgerPublishListsQuery, ListLedgerPublishListsQueryVariables>
export const GetLedgerReportDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetLedgerReport' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'reportId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'report' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'reportId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'reportId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'taxonomyId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'generationStatus' } },
                { kind: 'Field', name: { kind: 'Name', value: 'periodType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'periodStart' } },
                { kind: 'Field', name: { kind: 'Name', value: 'periodEnd' } },
                { kind: 'Field', name: { kind: 'Name', value: 'comparative' } },
                { kind: 'Field', name: { kind: 'Name', value: 'mappingId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'aiGenerated' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'lastGenerated' } },
                { kind: 'Field', name: { kind: 'Name', value: 'entityName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'sourceGraphId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'sourceReportId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'sharedAt' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'periods' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'start' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'end' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'label' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'structures' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'blockType' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetLedgerReportQuery, GetLedgerReportQueryVariables>
export const GetLedgerReportDownloadUrlDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetLedgerReportDownloadUrl' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'reportId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'format' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'ReportDownloadFormat' } },
          defaultValue: { kind: 'EnumValue', value: 'JSONLD' },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'expiresIn' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          defaultValue: { kind: 'IntValue', value: '300' },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'reportDownloadUrl' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'reportId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'reportId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'format' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'format' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'expiresIn' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'expiresIn' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'downloadUrl' } },
                { kind: 'Field', name: { kind: 'Name', value: 'expiresAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'contentType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'format' } },
                { kind: 'Field', name: { kind: 'Name', value: 'generationCount' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  GetLedgerReportDownloadUrlQuery,
  GetLedgerReportDownloadUrlQueryVariables
>
export const GetLedgerReportPackageDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetLedgerReportPackage' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'reportId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'reportPackage' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'reportId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'reportId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                { kind: 'Field', name: { kind: 'Name', value: 'taxonomyId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'periodType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'periodStart' } },
                { kind: 'Field', name: { kind: 'Name', value: 'periodEnd' } },
                { kind: 'Field', name: { kind: 'Name', value: 'generationStatus' } },
                { kind: 'Field', name: { kind: 'Name', value: 'lastGenerated' } },
                { kind: 'Field', name: { kind: 'Name', value: 'filingStatus' } },
                { kind: 'Field', name: { kind: 'Name', value: 'filedAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'filedBy' } },
                { kind: 'Field', name: { kind: 'Name', value: 'supersedesId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'supersededById' } },
                { kind: 'Field', name: { kind: 'Name', value: 'sourceGraphId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'sourceReportId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'sharedAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'entityName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'aiGenerated' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdBy' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'items' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'factSetId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'structureId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'displayOrder' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'block' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'blockType' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'category' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'taxonomyId' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'taxonomyName' } },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'informationModel' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'conceptArrangement' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'memberArrangement' },
                                  },
                                ],
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'artifact' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'topic' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'rendererNote' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'template' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'mechanics' } },
                                ],
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'elements' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'qname' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'elementType' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'isAbstract' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'isMonetary' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'balanceType' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'periodType' } },
                                ],
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'connections' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'fromElementId' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'toElementId' } },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'associationType' },
                                  },
                                  { kind: 'Field', name: { kind: 'Name', value: 'arcrole' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'orderValue' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'weight' } },
                                ],
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'facts' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'elementId' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'value' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'textValue' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'factType' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'contentType' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'periodStart' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'periodEnd' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'periodType' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'unit' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'factScope' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'factSetId' } },
                                ],
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'rules' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'ruleCategory' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'rulePattern' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'ruleCheckKind' } },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'ruleExpression' },
                                  },
                                  { kind: 'Field', name: { kind: 'Name', value: 'ruleMessage' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'ruleSeverity' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'ruleOrigin' } },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'ruleTarget' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [
                                        {
                                          kind: 'Field',
                                          name: { kind: 'Name', value: 'targetKind' },
                                        },
                                        {
                                          kind: 'Field',
                                          name: { kind: 'Name', value: 'targetRefId' },
                                        },
                                      ],
                                    },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'ruleVariables' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [
                                        {
                                          kind: 'Field',
                                          name: { kind: 'Name', value: 'variableName' },
                                        },
                                        {
                                          kind: 'Field',
                                          name: { kind: 'Name', value: 'variableQname' },
                                        },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'factSet' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'structureId' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'periodStart' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'periodEnd' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'factsetType' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'entityId' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'reportId' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'scenarioId' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'provenance' } },
                                ],
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'verificationResults' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'ruleId' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'structureId' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'factSetId' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'message' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'periodStart' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'periodEnd' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'evaluatedAt' } },
                                ],
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'verificationSummary' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'total' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'passed' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'failed' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'errored' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'skipped' } },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'byCategory' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [
                                        {
                                          kind: 'Field',
                                          name: { kind: 'Name', value: 'category' },
                                        },
                                        { kind: 'Field', name: { kind: 'Name', value: 'total' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'passed' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'failed' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'errored' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'skipped' } },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'view' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'rendering' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [
                                        {
                                          kind: 'Field',
                                          name: { kind: 'Name', value: 'rows' },
                                          selectionSet: {
                                            kind: 'SelectionSet',
                                            selections: [
                                              {
                                                kind: 'Field',
                                                name: { kind: 'Name', value: 'elementId' },
                                              },
                                              {
                                                kind: 'Field',
                                                name: { kind: 'Name', value: 'elementQname' },
                                              },
                                              {
                                                kind: 'Field',
                                                name: { kind: 'Name', value: 'elementName' },
                                              },
                                              {
                                                kind: 'Field',
                                                name: { kind: 'Name', value: 'classification' },
                                              },
                                              {
                                                kind: 'Field',
                                                name: { kind: 'Name', value: 'balanceType' },
                                              },
                                              {
                                                kind: 'Field',
                                                name: { kind: 'Name', value: 'itemType' },
                                              },
                                              {
                                                kind: 'Field',
                                                name: { kind: 'Name', value: 'values' },
                                              },
                                              {
                                                kind: 'Field',
                                                name: { kind: 'Name', value: 'textValue' },
                                              },
                                              {
                                                kind: 'Field',
                                                name: { kind: 'Name', value: 'isSubtotal' },
                                              },
                                              {
                                                kind: 'Field',
                                                name: { kind: 'Name', value: 'depth' },
                                              },
                                            ],
                                          },
                                        },
                                        {
                                          kind: 'Field',
                                          name: { kind: 'Name', value: 'periods' },
                                          selectionSet: {
                                            kind: 'SelectionSet',
                                            selections: [
                                              {
                                                kind: 'Field',
                                                name: { kind: 'Name', value: 'start' },
                                              },
                                              {
                                                kind: 'Field',
                                                name: { kind: 'Name', value: 'end' },
                                              },
                                              {
                                                kind: 'Field',
                                                name: { kind: 'Name', value: 'label' },
                                              },
                                              {
                                                kind: 'Field',
                                                name: { kind: 'Name', value: 'forecast' },
                                              },
                                            ],
                                          },
                                        },
                                        {
                                          kind: 'Field',
                                          name: { kind: 'Name', value: 'validation' },
                                          selectionSet: {
                                            kind: 'SelectionSet',
                                            selections: [
                                              {
                                                kind: 'Field',
                                                name: { kind: 'Name', value: 'passed' },
                                              },
                                              {
                                                kind: 'Field',
                                                name: { kind: 'Name', value: 'checks' },
                                              },
                                              {
                                                kind: 'Field',
                                                name: { kind: 'Name', value: 'failures' },
                                              },
                                              {
                                                kind: 'Field',
                                                name: { kind: 'Name', value: 'warnings' },
                                              },
                                            ],
                                          },
                                        },
                                        {
                                          kind: 'Field',
                                          name: { kind: 'Name', value: 'unmappedCount' },
                                        },
                                      ],
                                    },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'chart' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [
                                        {
                                          kind: 'Field',
                                          name: { kind: 'Name', value: 'panels' },
                                          selectionSet: {
                                            kind: 'SelectionSet',
                                            selections: [
                                              {
                                                kind: 'Field',
                                                name: { kind: 'Name', value: 'label' },
                                              },
                                              {
                                                kind: 'Field',
                                                name: { kind: 'Name', value: 'itemType' },
                                              },
                                              {
                                                kind: 'Field',
                                                name: { kind: 'Name', value: 'kind' },
                                              },
                                              {
                                                kind: 'Field',
                                                name: { kind: 'Name', value: 'series' },
                                                selectionSet: {
                                                  kind: 'SelectionSet',
                                                  selections: [
                                                    {
                                                      kind: 'Field',
                                                      name: { kind: 'Name', value: 'key' },
                                                    },
                                                    {
                                                      kind: 'Field',
                                                      name: { kind: 'Name', value: 'elementId' },
                                                    },
                                                    {
                                                      kind: 'Field',
                                                      name: { kind: 'Name', value: 'label' },
                                                    },
                                                  ],
                                                },
                                              },
                                            ],
                                          },
                                        },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetLedgerReportPackageQuery, GetLedgerReportPackageQueryVariables>
export const GetLedgerReportingTaxonomyDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetLedgerReportingTaxonomy' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'reportingTaxonomy' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                { kind: 'Field', name: { kind: 'Name', value: 'taxonomyType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'version' } },
                { kind: 'Field', name: { kind: 'Name', value: 'standard' } },
                { kind: 'Field', name: { kind: 'Name', value: 'namespaceUri' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isShared' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isLocked' } },
                { kind: 'Field', name: { kind: 'Name', value: 'sourceTaxonomyId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'targetTaxonomyId' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  GetLedgerReportingTaxonomyQuery,
  GetLedgerReportingTaxonomyQueryVariables
>
export const ListLedgerReportsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ListLedgerReports' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'reports' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'reports' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'taxonomyId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'generationStatus' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'periodType' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'periodStart' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'periodEnd' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'comparative' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'mappingId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'aiGenerated' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'lastGenerated' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'entityName' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'sourceGraphId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'sourceReportId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'sharedAt' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'periods' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'start' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'end' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'label' } },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'structures' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'blockType' } },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ListLedgerReportsQuery, ListLedgerReportsQueryVariables>
export const GetLedgerStatementDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetLedgerStatement' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'reportId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'blockType' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'statement' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'reportId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'reportId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'blockType' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'blockType' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'reportId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'structureId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'structureName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'blockType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'unmappedCount' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'periods' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'start' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'end' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'label' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'rows' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'elementId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'elementQname' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'elementName' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'trait' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'values' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'isSubtotal' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'depth' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'validation' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'passed' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'checks' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'failures' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'warnings' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetLedgerStatementQuery, GetLedgerStatementQueryVariables>
export const ListLedgerStructuresDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ListLedgerStructures' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'taxonomyId' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'blockType' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'structures' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'taxonomyId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'taxonomyId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'blockType' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'blockType' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'structures' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'blockType' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'taxonomyId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ListLedgerStructuresQuery, ListLedgerStructuresQueryVariables>
export const GetLedgerSummaryDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetLedgerSummary' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'summary' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'graphId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'accountCount' } },
                { kind: 'Field', name: { kind: 'Name', value: 'transactionCount' } },
                { kind: 'Field', name: { kind: 'Name', value: 'entryCount' } },
                { kind: 'Field', name: { kind: 'Name', value: 'lineItemCount' } },
                { kind: 'Field', name: { kind: 'Name', value: 'earliestTransactionDate' } },
                { kind: 'Field', name: { kind: 'Name', value: 'latestTransactionDate' } },
                { kind: 'Field', name: { kind: 'Name', value: 'connectionCount' } },
                { kind: 'Field', name: { kind: 'Name', value: 'lastSyncAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetLedgerSummaryQuery, GetLedgerSummaryQueryVariables>
export const ListLedgerTaxonomiesDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ListLedgerTaxonomies' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'taxonomyType' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'taxonomies' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'taxonomyType' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'taxonomyType' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'taxonomies' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'taxonomyType' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'version' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'standard' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'namespaceUri' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'isShared' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'isLocked' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'sourceTaxonomyId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'targetTaxonomyId' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ListLedgerTaxonomiesQuery, ListLedgerTaxonomiesQueryVariables>
export const GetLedgerTransactionDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetLedgerTransaction' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'transactionId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'transaction' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'transactionId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'transactionId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'number' } },
                { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                { kind: 'Field', name: { kind: 'Name', value: 'category' } },
                { kind: 'Field', name: { kind: 'Name', value: 'amount' } },
                { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
                { kind: 'Field', name: { kind: 'Name', value: 'date' } },
                { kind: 'Field', name: { kind: 'Name', value: 'dueDate' } },
                { kind: 'Field', name: { kind: 'Name', value: 'merchantName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'referenceNumber' } },
                { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                { kind: 'Field', name: { kind: 'Name', value: 'source' } },
                { kind: 'Field', name: { kind: 'Name', value: 'sourceId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'postedAt' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'entries' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'number' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'postingDate' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'memo' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'postedAt' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'lineItems' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'accountId' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'accountName' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'accountCode' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'debitAmount' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'creditAmount' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'lineOrder' } },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetLedgerTransactionQuery, GetLedgerTransactionQueryVariables>
export const ListLedgerTransactionsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ListLedgerTransactions' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'type' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'startDate' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Date' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'endDate' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Date' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'limit' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          },
          defaultValue: { kind: 'IntValue', value: '100' },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'offset' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          },
          defaultValue: { kind: 'IntValue', value: '0' },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'transactions' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'type' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'type' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'startDate' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'startDate' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'endDate' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'endDate' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'limit' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'limit' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'offset' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'offset' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'transactions' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'number' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'category' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'amount' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'date' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'dueDate' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'merchantName' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'referenceNumber' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'source' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'pagination' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'total' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'limit' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'offset' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'hasMore' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ListLedgerTransactionsQuery, ListLedgerTransactionsQueryVariables>
export const GetLedgerTrialBalanceDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetLedgerTrialBalance' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'startDate' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Date' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'endDate' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Date' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'trialBalance' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'startDate' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'startDate' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'endDate' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'endDate' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'totalDebits' } },
                { kind: 'Field', name: { kind: 'Name', value: 'totalCredits' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'rows' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'accountId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'accountCode' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'accountName' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'trait' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'accountType' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'totalDebits' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'totalCredits' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'netBalance' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetLedgerTrialBalanceQuery, GetLedgerTrialBalanceQueryVariables>
export const ListLedgerUnmappedElementsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ListLedgerUnmappedElements' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'mappingId' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'unmappedElements' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'mappingId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'mappingId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'trait' } },
                { kind: 'Field', name: { kind: 'Name', value: 'balanceType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'externalSource' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'suggestedTargets' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'elementId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'qname' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'confidence' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  ListLedgerUnmappedElementsQuery,
  ListLedgerUnmappedElementsQueryVariables
>
export const ListLibraryTaxonomyArcsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ListLibraryTaxonomyArcs' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'taxonomyId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'associationType' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'structureId' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'limit' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          },
          defaultValue: { kind: 'IntValue', value: '200' },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'offset' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          },
          defaultValue: { kind: 'IntValue', value: '0' },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'libraryTaxonomyArcCount' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'taxonomyId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'taxonomyId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'associationType' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'associationType' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'structureId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'structureId' } },
              },
            ],
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'libraryTaxonomyArcs' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'taxonomyId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'taxonomyId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'associationType' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'associationType' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'structureId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'structureId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'limit' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'limit' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'offset' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'offset' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'structureId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'structureName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'fromElementId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'fromElementQname' } },
                { kind: 'Field', name: { kind: 'Name', value: 'fromElementName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'fromElementTrait' } },
                { kind: 'Field', name: { kind: 'Name', value: 'fromElementIsAbstract' } },
                { kind: 'Field', name: { kind: 'Name', value: 'toElementId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'toElementQname' } },
                { kind: 'Field', name: { kind: 'Name', value: 'toElementName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'toElementTrait' } },
                { kind: 'Field', name: { kind: 'Name', value: 'toElementIsAbstract' } },
                { kind: 'Field', name: { kind: 'Name', value: 'associationType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'arcrole' } },
                { kind: 'Field', name: { kind: 'Name', value: 'orderValue' } },
                { kind: 'Field', name: { kind: 'Name', value: 'weight' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ListLibraryTaxonomyArcsQuery, ListLibraryTaxonomyArcsQueryVariables>
export const GetLibraryElementArcsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetLibraryElementArcs' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'libraryElementArcs' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'direction' } },
                { kind: 'Field', name: { kind: 'Name', value: 'associationType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'arcrole' } },
                { kind: 'Field', name: { kind: 'Name', value: 'taxonomyId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'taxonomyStandard' } },
                { kind: 'Field', name: { kind: 'Name', value: 'taxonomyName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'structureId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'structureName' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'peer' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'qname' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'trait' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'source' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetLibraryElementArcsQuery, GetLibraryElementArcsQueryVariables>
export const GetLibraryElementClassificationsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetLibraryElementClassifications' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'libraryElementClassifications' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'category' } },
                { kind: 'Field', name: { kind: 'Name', value: 'identifier' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isPrimary' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  GetLibraryElementClassificationsQuery,
  GetLibraryElementClassificationsQueryVariables
>
export const GetLibraryElementEquivalentsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetLibraryElementEquivalents' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'libraryElementEquivalents' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'element' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'qname' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'trait' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'source' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'equivalents' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'qname' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'trait' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'source' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  GetLibraryElementEquivalentsQuery,
  GetLibraryElementEquivalentsQueryVariables
>
export const ListLibraryElementsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ListLibraryElements' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'taxonomyId' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'source' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'classification' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'activityType' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'elementType' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'isAbstract' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Boolean' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'limit' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          },
          defaultValue: { kind: 'IntValue', value: '50' },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'offset' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          },
          defaultValue: { kind: 'IntValue', value: '0' },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'includeLabels' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Boolean' } },
          },
          defaultValue: { kind: 'BooleanValue', value: false },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'includeReferences' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Boolean' } },
          },
          defaultValue: { kind: 'BooleanValue', value: false },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'libraryElements' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'taxonomyId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'taxonomyId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'source' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'source' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'classification' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'classification' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'activityType' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'activityType' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'elementType' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'elementType' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'isAbstract' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'isAbstract' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'limit' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'limit' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'offset' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'offset' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'includeLabels' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'includeLabels' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'includeReferences' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'includeReferences' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'qname' } },
                { kind: 'Field', name: { kind: 'Name', value: 'namespace' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'trait' } },
                { kind: 'Field', name: { kind: 'Name', value: 'balanceType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'periodType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isAbstract' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isMonetary' } },
                { kind: 'Field', name: { kind: 'Name', value: 'elementType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'source' } },
                { kind: 'Field', name: { kind: 'Name', value: 'taxonomyId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'parentId' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'labels' },
                  directives: [
                    {
                      kind: 'Directive',
                      name: { kind: 'Name', value: 'include' },
                      arguments: [
                        {
                          kind: 'Argument',
                          name: { kind: 'Name', value: 'if' },
                          value: {
                            kind: 'Variable',
                            name: { kind: 'Name', value: 'includeLabels' },
                          },
                        },
                      ],
                    },
                  ],
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'role' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'language' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'text' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'references' },
                  directives: [
                    {
                      kind: 'Directive',
                      name: { kind: 'Name', value: 'include' },
                      arguments: [
                        {
                          kind: 'Argument',
                          name: { kind: 'Name', value: 'if' },
                          value: {
                            kind: 'Variable',
                            name: { kind: 'Name', value: 'includeReferences' },
                          },
                        },
                      ],
                    },
                  ],
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'refType' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'citation' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'uri' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ListLibraryElementsQuery, ListLibraryElementsQueryVariables>
export const SearchLibraryElementsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'SearchLibraryElements' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'query' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'source' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'limit' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          },
          defaultValue: { kind: 'IntValue', value: '50' },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'searchLibraryElements' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'query' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'query' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'source' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'source' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'limit' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'limit' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'qname' } },
                { kind: 'Field', name: { kind: 'Name', value: 'namespace' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'trait' } },
                { kind: 'Field', name: { kind: 'Name', value: 'balanceType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'periodType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isAbstract' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isMonetary' } },
                { kind: 'Field', name: { kind: 'Name', value: 'elementType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'source' } },
                { kind: 'Field', name: { kind: 'Name', value: 'taxonomyId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'parentId' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'labels' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'role' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'language' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'text' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'references' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'refType' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'citation' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'uri' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<SearchLibraryElementsQuery, SearchLibraryElementsQueryVariables>
export const GetLibraryElementDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetLibraryElement' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'qname' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'libraryElement' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'qname' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'qname' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'qname' } },
                { kind: 'Field', name: { kind: 'Name', value: 'namespace' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'trait' } },
                { kind: 'Field', name: { kind: 'Name', value: 'balanceType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'periodType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isAbstract' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isMonetary' } },
                { kind: 'Field', name: { kind: 'Name', value: 'elementType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'source' } },
                { kind: 'Field', name: { kind: 'Name', value: 'taxonomyId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'parentId' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'labels' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'role' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'language' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'text' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'references' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'refType' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'citation' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'uri' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetLibraryElementQuery, GetLibraryElementQueryVariables>
export const ListLibraryStructuresDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ListLibraryStructures' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'taxonomyId' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'blockType' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'libraryStructures' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'taxonomyId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'taxonomyId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'blockType' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'blockType' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'blockType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'taxonomyId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'roleUri' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ListLibraryStructuresQuery, ListLibraryStructuresQueryVariables>
export const GetLibraryStructureDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetLibraryStructure' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'libraryStructure' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'blockType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'taxonomyId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'roleUri' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetLibraryStructureQuery, GetLibraryStructureQueryVariables>
export const ListLibraryTaxonomiesDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ListLibraryTaxonomies' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'standard' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'includeElementCount' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Boolean' } },
          },
          defaultValue: { kind: 'BooleanValue', value: false },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'libraryTaxonomies' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'standard' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'standard' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'includeElementCount' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'includeElementCount' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                { kind: 'Field', name: { kind: 'Name', value: 'standard' } },
                { kind: 'Field', name: { kind: 'Name', value: 'version' } },
                { kind: 'Field', name: { kind: 'Name', value: 'namespaceUri' } },
                { kind: 'Field', name: { kind: 'Name', value: 'taxonomyType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isShared' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isLocked' } },
                { kind: 'Field', name: { kind: 'Name', value: 'elementCount' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ListLibraryTaxonomiesQuery, ListLibraryTaxonomiesQueryVariables>
export const GetLibraryTaxonomyDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetLibraryTaxonomy' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'standard' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'version' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'includeElementCount' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Boolean' } },
          },
          defaultValue: { kind: 'BooleanValue', value: false },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'libraryTaxonomy' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'standard' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'standard' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'version' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'version' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'includeElementCount' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'includeElementCount' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                { kind: 'Field', name: { kind: 'Name', value: 'standard' } },
                { kind: 'Field', name: { kind: 'Name', value: 'version' } },
                { kind: 'Field', name: { kind: 'Name', value: 'namespaceUri' } },
                { kind: 'Field', name: { kind: 'Name', value: 'taxonomyType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isShared' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isLocked' } },
                { kind: 'Field', name: { kind: 'Name', value: 'elementCount' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetLibraryTaxonomyQuery, GetLibraryTaxonomyQueryVariables>
