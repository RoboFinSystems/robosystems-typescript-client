import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core'
export type Maybe<T> = T | null
export type InputMaybe<T> = Maybe<T>
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] }
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> }
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> }
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = {
  [_ in K]?: never
}
export type Incremental<T> =
  | T
  | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never }
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string }
  String: { input: string; output: string }
  Boolean: { input: boolean; output: boolean }
  Int: { input: number; output: number }
  Float: { input: number; output: number }
  Date: { input: any; output: any }
  DateTime: { input: any; output: any }
  JSON: { input: any; output: any }
}

export type Account = {
  accountType: Maybe<Scalars['String']['output']>
  balanceType: Scalars['String']['output']
  code: Maybe<Scalars['String']['output']>
  currency: Scalars['String']['output']
  depth: Scalars['Int']['output']
  description: Maybe<Scalars['String']['output']>
  externalId: Maybe<Scalars['String']['output']>
  externalSource: Maybe<Scalars['String']['output']>
  id: Scalars['String']['output']
  isActive: Scalars['Boolean']['output']
  isPlaceholder: Scalars['Boolean']['output']
  name: Scalars['String']['output']
  parentId: Maybe<Scalars['String']['output']>
  subClassification: Maybe<Scalars['String']['output']>
  trait: Maybe<Scalars['String']['output']>
}

export type AccountList = {
  accounts: Array<Account>
  pagination: PaginationInfo
}

export type AccountRollupGroup = {
  accounts: Array<AccountRollupRow>
  balanceType: Scalars['String']['output']
  reportingElementId: Scalars['String']['output']
  reportingName: Scalars['String']['output']
  reportingQname: Scalars['String']['output']
  total: Scalars['Float']['output']
  trait: Scalars['String']['output']
}

export type AccountRollupRow = {
  accountCode: Maybe<Scalars['String']['output']>
  accountName: Scalars['String']['output']
  elementId: Scalars['String']['output']
  netBalance: Scalars['Float']['output']
  totalCredits: Scalars['Float']['output']
  totalDebits: Scalars['Float']['output']
}

export type AccountRollups = {
  groups: Array<AccountRollupGroup>
  mappingId: Scalars['String']['output']
  mappingName: Scalars['String']['output']
  totalMapped: Scalars['Int']['output']
  totalUnmapped: Scalars['Int']['output']
}

export type AccountTree = {
  roots: Array<AccountTreeNode>
  totalAccounts: Scalars['Int']['output']
}

export type AccountTreeNode = {
  accountType: Maybe<Scalars['String']['output']>
  balanceType: Scalars['String']['output']
  children: Array<AccountTreeNode>
  code: Maybe<Scalars['String']['output']>
  depth: Scalars['Int']['output']
  id: Scalars['ID']['output']
  isActive: Scalars['Boolean']['output']
  name: Scalars['String']['output']
  trait: Maybe<Scalars['String']['output']>
}

export type Agent = {
  address: Maybe<Scalars['JSON']['output']>
  agentType: Scalars['String']['output']
  createdAt: Maybe<Scalars['DateTime']['output']>
  createdBy: Maybe<Scalars['String']['output']>
  duns: Maybe<Scalars['String']['output']>
  email: Maybe<Scalars['String']['output']>
  externalId: Maybe<Scalars['String']['output']>
  id: Scalars['String']['output']
  is1099Recipient: Scalars['Boolean']['output']
  isActive: Scalars['Boolean']['output']
  legalName: Maybe<Scalars['String']['output']>
  lei: Maybe<Scalars['String']['output']>
  name: Scalars['String']['output']
  phone: Maybe<Scalars['String']['output']>
  registrationNumber: Maybe<Scalars['String']['output']>
  source: Scalars['String']['output']
  taxId: Maybe<Scalars['String']['output']>
  updatedAt: Maybe<Scalars['DateTime']['output']>
}

export type Artifact = {
  mechanics: Scalars['JSON']['output']
  parentheticalNote: Maybe<Scalars['String']['output']>
  template: Maybe<Scalars['JSON']['output']>
  topic: Maybe<Scalars['String']['output']>
}

export type Association = {
  approvedBy: Maybe<Scalars['String']['output']>
  associationType: Scalars['String']['output']
  confidence: Maybe<Scalars['Float']['output']>
  fromElementId: Scalars['String']['output']
  fromElementName: Maybe<Scalars['String']['output']>
  fromElementQname: Maybe<Scalars['String']['output']>
  id: Scalars['String']['output']
  orderValue: Maybe<Scalars['Float']['output']>
  structureId: Scalars['String']['output']
  suggestedBy: Maybe<Scalars['String']['output']>
  toElementId: Scalars['String']['output']
  toElementName: Maybe<Scalars['String']['output']>
  toElementQname: Maybe<Scalars['String']['output']>
  weight: Maybe<Scalars['Float']['output']>
}

export type ClosingBookCategory = {
  items: Array<ClosingBookItem>
  label: Scalars['String']['output']
}

export type ClosingBookItem = {
  id: Scalars['String']['output']
  itemType: Scalars['String']['output']
  name: Scalars['String']['output']
  reportId: Maybe<Scalars['String']['output']>
  status: Maybe<Scalars['String']['output']>
  structureType: Maybe<Scalars['String']['output']>
}

export type ClosingBookStructures = {
  categories: Array<ClosingBookCategory>
  hasData: Scalars['Boolean']['output']
}

export type DraftEntry = {
  /** True if total_debit == total_credit */
  balanced: Scalars['Boolean']['output']
  entryId: Scalars['String']['output']
  lineItems: Array<DraftLineItem>
  memo: Maybe<Scalars['String']['output']>
  postingDate: Scalars['Date']['output']
  /** Where the entry came from: 'ai_generated', 'manual_entry', etc. */
  provenance: Maybe<Scalars['String']['output']>
  /** Schedule structure that generated this entry (if any) */
  sourceStructureId: Maybe<Scalars['String']['output']>
  /** Human-readable name of the source schedule */
  sourceStructureName: Maybe<Scalars['String']['output']>
  /** Sum of credit amounts in cents */
  totalCredit: Scalars['Int']['output']
  /** Sum of debit amounts in cents */
  totalDebit: Scalars['Int']['output']
  /** Entry type (e.g., 'closing', 'adjusting') */
  type: Scalars['String']['output']
}

export type DraftLineItem = {
  /** Credit amount in cents */
  creditAmount: Scalars['Int']['output']
  /** Debit amount in cents */
  debitAmount: Scalars['Int']['output']
  description: Maybe<Scalars['String']['output']>
  elementCode: Maybe<Scalars['String']['output']>
  elementId: Scalars['String']['output']
  elementName: Scalars['String']['output']
  lineItemId: Scalars['String']['output']
}

export type Element = {
  balanceType: Scalars['String']['output']
  code: Maybe<Scalars['String']['output']>
  depth: Scalars['Int']['output']
  description: Maybe<Scalars['String']['output']>
  elementType: Scalars['String']['output']
  externalId: Maybe<Scalars['String']['output']>
  externalSource: Maybe<Scalars['String']['output']>
  id: Scalars['String']['output']
  isAbstract: Scalars['Boolean']['output']
  isActive: Scalars['Boolean']['output']
  name: Scalars['String']['output']
  namespace: Maybe<Scalars['String']['output']>
  parentId: Maybe<Scalars['String']['output']>
  periodType: Scalars['String']['output']
  qname: Maybe<Scalars['String']['output']>
  source: Scalars['String']['output']
  subClassification: Maybe<Scalars['String']['output']>
  taxonomyId: Maybe<Scalars['String']['output']>
  trait: Maybe<Scalars['String']['output']>
}

export type ElementList = {
  elements: Array<Element>
  pagination: PaginationInfo
}

export type FactRow = {
  depth: Scalars['Int']['output']
  elementId: Scalars['String']['output']
  elementName: Scalars['String']['output']
  elementQname: Scalars['String']['output']
  isSubtotal: Scalars['Boolean']['output']
  trait: Maybe<Scalars['String']['output']>
  values: Array<Maybe<Scalars['Float']['output']>>
}

export type FiscalCalendar = {
  /** Structured blocker codes when closeable_now is False: 'sequence_violation', 'period_incomplete', 'sync_stale', 'calendar_not_initialized', 'period_already_closed' */
  blockers: Array<Scalars['String']['output']>
  /** Ordered list of periods that a close run would process */
  catchUpSequence: Array<Scalars['String']['output']>
  /** Target period the user wants closed through (YYYY-MM) */
  closeTarget: Maybe<Scalars['String']['output']>
  /** Whether the next period in the catch-up sequence passes all closeable gates */
  closeableNow: Scalars['Boolean']['output']
  /** Latest closed period (YYYY-MM), or null if nothing closed */
  closedThrough: Maybe<Scalars['String']['output']>
  fiscalYearStartMonth: Scalars['Int']['output']
  /** Number of periods between closed_through and close_target (inclusive of close_target). 0 means caught up. */
  gapPeriods: Scalars['Int']['output']
  graphId: Scalars['String']['output']
  initializedAt: Maybe<Scalars['DateTime']['output']>
  lastCloseAt: Maybe<Scalars['DateTime']['output']>
  /** Most recent QB sync timestamp (if connected) */
  lastSyncAt: Maybe<Scalars['DateTime']['output']>
  /** Fiscal period rows for this graph */
  periods: Array<FiscalPeriodSummary>
}

export type FiscalPeriodSummary = {
  closedAt: Maybe<Scalars['DateTime']['output']>
  endDate: Scalars['Date']['output']
  /** Period name (YYYY-MM) */
  name: Scalars['String']['output']
  startDate: Scalars['Date']['output']
  /** 'open' | 'closing' | 'closed' */
  status: Scalars['String']['output']
}

export type Holding = {
  entityId: Scalars['String']['output']
  entityName: Scalars['String']['output']
  positionCount: Scalars['Int']['output']
  securities: Array<HoldingSecuritySummary>
  sourceGraphId: Maybe<Scalars['String']['output']>
  totalCostBasisDollars: Scalars['Float']['output']
  totalCurrentValueDollars: Maybe<Scalars['Float']['output']>
}

export type HoldingSecuritySummary = {
  costBasisDollars: Scalars['Float']['output']
  currentValueDollars: Maybe<Scalars['Float']['output']>
  quantity: Scalars['Float']['output']
  quantityType: Scalars['String']['output']
  securityId: Scalars['String']['output']
  securityName: Scalars['String']['output']
  securityType: Scalars['String']['output']
}

export type HoldingsList = {
  holdings: Array<Holding>
  totalEntities: Scalars['Int']['output']
  totalPositions: Scalars['Int']['output']
}

export type InformationBlock = {
  artifact: Artifact
  blockType: Scalars['String']['output']
  category: Scalars['String']['output']
  connections: Array<InformationBlockConnection>
  dimensions: Array<Scalars['JSON']['output']>
  displayName: Scalars['String']['output']
  elements: Array<InformationBlockElement>
  factSet: Maybe<InformationBlockFactSet>
  facts: Array<InformationBlockFact>
  id: Scalars['ID']['output']
  informationModel: InformationModel
  name: Scalars['String']['output']
  rules: Array<InformationBlockRule>
  taxonomyId: Maybe<Scalars['String']['output']>
  taxonomyName: Maybe<Scalars['String']['output']>
  verificationResults: Array<InformationBlockVerificationResult>
  view: InformationBlockViewProjections
}

export type InformationBlockClassification = {
  /** One of the 3 association-level categories in the `public.classifications` CHECK constraint: 'concept_arrangement', 'member_arrangement', or 'named_disclosure'. */
  category: Scalars['String']['output']
  /** AI/adapter-supplied confidence (0.0-1.0). Null for deterministic library-seeded rows. */
  confidence: Maybe<Scalars['Float']['output']>
  /** Classification vocabulary row id. */
  id: Scalars['String']['output']
  /** Vocabulary identifier within the category — e.g. 'RollUp', 'aggregation', 'AssetsRollUp'. */
  identifier: Scalars['String']['output']
  /** Whether this is the canonical classification for the (association|element, category) pair. Non-primary rows capture alternates / AI suggestions alongside the chosen primary. */
  isPrimary: Scalars['Boolean']['output']
  /** Provenance — 'arcrole_analysis', 'disclosure_mechanics', 'us-gaap-metamodel', adapter name, etc. */
  source: Maybe<Scalars['String']['output']>
}

export type InformationBlockConnection = {
  arcrole: Maybe<Scalars['String']['output']>
  /** presentation | calculation | mapping | equivalence | general-special | essence-alias */
  associationType: Scalars['String']['output']
  /** Association-level classifications — concept_arrangement, member_arrangement, named_disclosure rows from the junction. Empty for library-seeded associations that haven't been classified yet. */
  classifications: Array<InformationBlockClassification>
  fromElementId: Scalars['String']['output']
  id: Scalars['String']['output']
  orderValue: Maybe<Scalars['Float']['output']>
  toElementId: Scalars['String']['output']
  weight: Maybe<Scalars['Float']['output']>
}

export type InformationBlockElement = {
  balanceType: Maybe<Scalars['String']['output']>
  code: Maybe<Scalars['String']['output']>
  /** concept | abstract | axis | member | hypercube */
  elementType: Scalars['String']['output']
  id: Scalars['String']['output']
  isAbstract: Scalars['Boolean']['output']
  isMonetary: Scalars['Boolean']['output']
  name: Scalars['String']['output']
  periodType: Maybe<Scalars['String']['output']>
  qname: Maybe<Scalars['String']['output']>
}

export type InformationBlockFact = {
  elementId: Scalars['String']['output']
  /** historical | in_scope */
  factScope: Scalars['String']['output']
  factSetId: Maybe<Scalars['String']['output']>
  id: Scalars['String']['output']
  periodEnd: Scalars['Date']['output']
  periodStart: Maybe<Scalars['Date']['output']>
  periodType: Scalars['String']['output']
  unit: Scalars['String']['output']
  value: Scalars['Float']['output']
}

export type InformationBlockFactSet = {
  entityId: Scalars['String']['output']
  /** 'report' | 'schedule' | 'custom'. Enum closure enforced by the ``public.fact_sets`` CHECK constraint. */
  factsetType: Scalars['String']['output']
  id: Scalars['String']['output']
  periodEnd: Scalars['Date']['output']
  periodStart: Maybe<Scalars['Date']['output']>
  /** Back-pointer to the ``reports`` table while ``report_id`` still lives on facts. Drops out once the retirement migration lands. */
  reportId: Maybe<Scalars['String']['output']>
  structureId: Maybe<Scalars['String']['output']>
}

export type InformationBlockRendering = {
  periods: Array<InformationBlockRenderingPeriod>
  rows: Array<InformationBlockRenderingRow>
  unmappedCount: Scalars['Int']['output']
  validation: Maybe<InformationBlockValidation>
}

export type InformationBlockRenderingPeriod = {
  end: Scalars['Date']['output']
  label: Maybe<Scalars['String']['output']>
  start: Scalars['Date']['output']
}

export type InformationBlockRenderingRow = {
  balanceType: Maybe<Scalars['String']['output']>
  /** FASB elementsOfFinancialStatements trait identifier — 'asset', 'liability', 'equity', 'revenue', 'expense'. Surfaced so the viewer can color-code or group rows without a follow-up trait lookup. */
  classification: Maybe<Scalars['String']['output']>
  depth: Scalars['Int']['output']
  elementId: Scalars['String']['output']
  elementName: Scalars['String']['output']
  elementQname: Maybe<Scalars['String']['output']>
  isSubtotal: Scalars['Boolean']['output']
  values: Array<Maybe<Scalars['Float']['output']>>
}

export type InformationBlockRule = {
  id: Scalars['String']['output']
  /** One of 8 cm:VerificationRule subclasses — AutomatedAccountingAndReportingChecks, FundamentalAccountingConceptRelation, PeerConsistencyRule, PriorPeriodConsistencyRule, ReportLevelModelStructureRule, ReportingSystemSpecificRule, ToDoManualTask, XBRLTechnicalSyntaxRule. */
  ruleCategory: Scalars['String']['output']
  ruleExpression: Scalars['String']['output']
  ruleMessage: Maybe<Scalars['String']['output']>
  /** Provenance — 'forked' (from an upstream artifact, e.g. Seattle Method) or 'native' (authored in this seed or by a tenant). Enum closure enforced by the ``public.rules`` CHECK constraint. */
  ruleOrigin: Scalars['String']['output']
  /** One of 10 cm:BusinessRulePattern mechanisms — Adjustment, CoExists, EqualTo, Exists, GreaterThan, GreaterThanOrEqualToZero, LessThan, RollForward, RollUp, Variance. */
  rulePattern: Scalars['String']['output']
  /** Failure severity — 'info' | 'warning' | 'error'. Enum closure enforced by the ``public.rules`` CHECK constraint. */
  ruleSeverity: Scalars['String']['output']
  ruleTarget: Maybe<InformationBlockRuleTarget>
  ruleVariables: Array<InformationBlockRuleVariable>
}

export type InformationBlockRuleTarget = {
  /** Which atom type the rule targets — 'structure' | 'element' | 'association' | 'taxonomy'. Enum closure enforced by the ``public.rules`` CHECK constraint. */
  targetKind: Scalars['String']['output']
  /** UUID of the target atom — structure_id, element_id, association_id, or taxonomy_id depending on ``target_kind``. */
  targetRefId: Scalars['String']['output']
}

export type InformationBlockRuleVariable = {
  /** Local name in the rule expression, e.g. 'Assets'. */
  variableName: Scalars['String']['output']
  /** Concept qname the variable resolves to, e.g. 'fac:Assets'. */
  variableQname: Scalars['String']['output']
}

export type InformationBlockValidation = {
  checks: Array<Scalars['String']['output']>
  failures: Array<Scalars['String']['output']>
  passed: Scalars['Boolean']['output']
  warnings: Array<Scalars['String']['output']>
}

export type InformationBlockVerificationResult = {
  evaluatedAt: Maybe<Scalars['DateTime']['output']>
  factSetId: Maybe<Scalars['String']['output']>
  id: Scalars['String']['output']
  message: Maybe<Scalars['String']['output']>
  periodEnd: Maybe<Scalars['Date']['output']>
  periodStart: Maybe<Scalars['Date']['output']>
  ruleId: Scalars['String']['output']
  /** 'pass' | 'fail' | 'error' | 'skipped'. Enum closure enforced by the ``public.verification_results`` CHECK constraint. */
  status: Scalars['String']['output']
  structureId: Maybe<Scalars['String']['output']>
}

export type InformationBlockViewProjections = {
  rendering: Maybe<InformationBlockRendering>
}

export type InformationModel = {
  /** roll_up | roll_forward | variance | adjustment | set | arithmetic | textblock. Null for block types where the concept arrangement is implicit in their mechanics. */
  conceptArrangement: Maybe<Scalars['String']['output']>
  /** aggregation | nonaggregation, or null if non-hypercube. */
  memberArrangement: Maybe<Scalars['String']['output']>
}

export type LedgerEntity = {
  addressCity: Maybe<Scalars['String']['output']>
  addressCountry: Maybe<Scalars['String']['output']>
  addressLine1: Maybe<Scalars['String']['output']>
  addressPostalCode: Maybe<Scalars['String']['output']>
  addressState: Maybe<Scalars['String']['output']>
  category: Maybe<Scalars['String']['output']>
  cik: Maybe<Scalars['String']['output']>
  connectionId: Maybe<Scalars['String']['output']>
  createdAt: Maybe<Scalars['String']['output']>
  entityType: Maybe<Scalars['String']['output']>
  exchange: Maybe<Scalars['String']['output']>
  fiscalYearEnd: Maybe<Scalars['String']['output']>
  id: Scalars['String']['output']
  industry: Maybe<Scalars['String']['output']>
  isParent: Scalars['Boolean']['output']
  legalName: Maybe<Scalars['String']['output']>
  lei: Maybe<Scalars['String']['output']>
  name: Scalars['String']['output']
  parentEntityId: Maybe<Scalars['String']['output']>
  phone: Maybe<Scalars['String']['output']>
  sic: Maybe<Scalars['String']['output']>
  sicDescription: Maybe<Scalars['String']['output']>
  source: Scalars['String']['output']
  sourceGraphId: Maybe<Scalars['String']['output']>
  sourceId: Maybe<Scalars['String']['output']>
  stateOfIncorporation: Maybe<Scalars['String']['output']>
  status: Scalars['String']['output']
  taxId: Maybe<Scalars['String']['output']>
  ticker: Maybe<Scalars['String']['output']>
  updatedAt: Maybe<Scalars['String']['output']>
  uri: Maybe<Scalars['String']['output']>
  website: Maybe<Scalars['String']['output']>
}

export type LedgerEntry = {
  id: Scalars['String']['output']
  lineItems: Array<LedgerLineItem>
  memo: Maybe<Scalars['String']['output']>
  number: Maybe<Scalars['String']['output']>
  postedAt: Maybe<Scalars['DateTime']['output']>
  postingDate: Scalars['Date']['output']
  status: Scalars['String']['output']
  type: Scalars['String']['output']
}

export type LedgerLineItem = {
  accountCode: Maybe<Scalars['String']['output']>
  accountId: Scalars['String']['output']
  accountName: Maybe<Scalars['String']['output']>
  creditAmount: Scalars['Float']['output']
  debitAmount: Scalars['Float']['output']
  description: Maybe<Scalars['String']['output']>
  id: Scalars['String']['output']
  lineOrder: Scalars['Int']['output']
}

export type LedgerSummary = {
  accountCount: Scalars['Int']['output']
  connectionCount: Scalars['Int']['output']
  earliestTransactionDate: Maybe<Scalars['Date']['output']>
  entryCount: Scalars['Int']['output']
  graphId: Scalars['String']['output']
  lastSyncAt: Maybe<Scalars['DateTime']['output']>
  latestTransactionDate: Maybe<Scalars['Date']['output']>
  lineItemCount: Scalars['Int']['output']
  transactionCount: Scalars['Int']['output']
}

export type LedgerTransactionDetail = {
  amount: Scalars['Float']['output']
  category: Maybe<Scalars['String']['output']>
  currency: Scalars['String']['output']
  date: Scalars['Date']['output']
  description: Maybe<Scalars['String']['output']>
  dueDate: Maybe<Scalars['Date']['output']>
  entries: Array<LedgerEntry>
  id: Scalars['String']['output']
  merchantName: Maybe<Scalars['String']['output']>
  number: Maybe<Scalars['String']['output']>
  postedAt: Maybe<Scalars['DateTime']['output']>
  referenceNumber: Maybe<Scalars['String']['output']>
  source: Scalars['String']['output']
  sourceId: Maybe<Scalars['String']['output']>
  status: Scalars['String']['output']
  type: Scalars['String']['output']
}

export type LedgerTransactionList = {
  pagination: PaginationInfo
  transactions: Array<LedgerTransactionSummary>
}

export type LedgerTransactionSummary = {
  amount: Scalars['Float']['output']
  category: Maybe<Scalars['String']['output']>
  currency: Scalars['String']['output']
  date: Scalars['Date']['output']
  description: Maybe<Scalars['String']['output']>
  dueDate: Maybe<Scalars['Date']['output']>
  id: Scalars['String']['output']
  merchantName: Maybe<Scalars['String']['output']>
  number: Maybe<Scalars['String']['output']>
  referenceNumber: Maybe<Scalars['String']['output']>
  source: Scalars['String']['output']
  status: Scalars['String']['output']
  type: Scalars['String']['output']
}

export type LibraryAssociation = {
  arcrole: Maybe<Scalars['String']['output']>
  /** presentation | calculation | mapping | equivalence | general-special | essence-alias */
  associationType: Scalars['String']['output']
  fromElementId: Scalars['String']['output']
  fromElementName: Maybe<Scalars['String']['output']>
  fromElementQname: Maybe<Scalars['String']['output']>
  id: Scalars['String']['output']
  orderValue: Maybe<Scalars['Float']['output']>
  structureId: Scalars['String']['output']
  structureName: Maybe<Scalars['String']['output']>
  toElementId: Scalars['String']['output']
  toElementName: Maybe<Scalars['String']['output']>
  toElementQname: Maybe<Scalars['String']['output']>
  weight: Maybe<Scalars['Float']['output']>
}

export type LibraryElement = {
  /** debit | credit */
  balanceType: Scalars['String']['output']
  /** concept | abstract | axis | member | hypercube */
  elementType: Scalars['String']['output']
  id: Scalars['String']['output']
  isAbstract: Scalars['Boolean']['output']
  isMonetary: Scalars['Boolean']['output']
  labels: Array<LibraryLabel>
  name: Scalars['String']['output']
  namespace: Maybe<Scalars['String']['output']>
  parentId: Maybe<Scalars['String']['output']>
  /** instant | duration */
  periodType: Scalars['String']['output']
  /** Qualified name, e.g. 'fac:Assets' */
  qname: Scalars['String']['output']
  references: Array<LibraryReference>
  /** fac | us-gaap | rs-gaap | … */
  source: Scalars['String']['output']
  taxonomyId: Maybe<Scalars['String']['output']>
  /** FASB elementsOfFinancialStatements axis: asset | contraAsset | liability | contraLiability | equity | contraEquity | temporaryEquity | revenue | expense | expenseReversal | gain | loss | comprehensiveIncome | investmentByOwners | distributionToOwners | metric (derived subtotals, not SFAC 6 primary elements). Null for structural rows. */
  trait: Maybe<Scalars['String']['output']>
}

export type LibraryElementArc = {
  arcrole: Maybe<Scalars['String']['output']>
  associationType: Scalars['String']['output']
  /** 'outgoing' (this element is source) | 'incoming' (target) */
  direction: Scalars['String']['output']
  id: Scalars['String']['output']
  peer: LibraryElement
  structureId: Maybe<Scalars['String']['output']>
  structureName: Maybe<Scalars['String']['output']>
  taxonomyId: Maybe<Scalars['String']['output']>
  taxonomyName: Maybe<Scalars['String']['output']>
  taxonomyStandard: Maybe<Scalars['String']['output']>
}

export type LibraryElementClassification = {
  /** Trait axis (e.g. elementsOfFinancialStatements) */
  category: Scalars['String']['output']
  /** Value within the axis (e.g. expense) */
  identifier: Scalars['String']['output']
  /** True for the element's primary EFS trait assignment */
  isPrimary: Scalars['Boolean']['output']
  /** Human-readable name */
  name: Maybe<Scalars['String']['output']>
}

export type LibraryElementTreeNode = {
  children: Array<LibraryElementTreeNode>
  element: LibraryElement
}

export type LibraryEquivalence = {
  element: LibraryElement
  equivalents: Array<LibraryElement>
}

export type LibraryLabel = {
  /** Language code */
  language: Scalars['String']['output']
  /** Label role: standard/documentation/verbose/… */
  role: Scalars['String']['output']
  /** Label text */
  text: Scalars['String']['output']
}

export type LibraryReference = {
  /** Full citation text */
  citation: Scalars['String']['output']
  /** 'ASC' | 'SEC' | 'SFAC' | 'IFRS' | 'Other' */
  refType: Maybe<Scalars['String']['output']>
  /** Dereferenceable URL if available */
  uri: Maybe<Scalars['String']['output']>
}

export type LibraryStructure = {
  id: Scalars['String']['output']
  isActive: Scalars['Boolean']['output']
  name: Scalars['String']['output']
  /** Original XBRL role URI if any */
  roleUri: Maybe<Scalars['String']['output']>
  /** balance_sheet | income_statement | cash_flow_statement | custom | … */
  structureType: Scalars['String']['output']
  taxonomyId: Scalars['String']['output']
}

export type LibraryTaxonomy = {
  description: Maybe<Scalars['String']['output']>
  /** Total elements in this taxonomy (computed on demand) */
  elementCount: Maybe<Scalars['Int']['output']>
  id: Scalars['String']['output']
  isActive: Scalars['Boolean']['output']
  isLocked: Scalars['Boolean']['output']
  isShared: Scalars['Boolean']['output']
  name: Scalars['String']['output']
  namespaceUri: Maybe<Scalars['String']['output']>
  /** fac | us-gaap | rs-gaap | ifrs */
  standard: Maybe<Scalars['String']['output']>
  /** chart_of_accounts | reporting | mapping | schedule */
  taxonomyType: Scalars['String']['output']
  version: Maybe<Scalars['String']['output']>
}

export type MappedTrialBalance = {
  mappingId: Scalars['String']['output']
  rows: Array<MappedTrialBalanceRow>
}

export type MappedTrialBalanceRow = {
  balanceType: Maybe<Scalars['String']['output']>
  netBalance: Scalars['Float']['output']
  qname: Scalars['String']['output']
  reportingElementId: Scalars['String']['output']
  reportingName: Scalars['String']['output']
  totalCredits: Scalars['Float']['output']
  totalDebits: Scalars['Float']['output']
  trait: Maybe<Scalars['String']['output']>
}

export type MappingCoverage = {
  coveragePercent: Scalars['Float']['output']
  highConfidence: Scalars['Int']['output']
  lowConfidence: Scalars['Int']['output']
  mappedCount: Scalars['Int']['output']
  mappingId: Scalars['String']['output']
  mediumConfidence: Scalars['Int']['output']
  totalCoaElements: Scalars['Int']['output']
  unmappedCount: Scalars['Int']['output']
}

export type MappingDetail = {
  associations: Array<Association>
  id: Scalars['String']['output']
  name: Scalars['String']['output']
  structureType: Scalars['String']['output']
  taxonomyId: Scalars['String']['output']
  totalAssociations: Scalars['Int']['output']
}

export type PaginationInfo = {
  /** Whether more items are available */
  hasMore: Scalars['Boolean']['output']
  /** Maximum number of items returned in this response */
  limit: Scalars['Int']['output']
  /** Number of items skipped */
  offset: Scalars['Int']['output']
  /** Total number of items available */
  total: Scalars['Int']['output']
}

export type PeriodCloseItem = {
  amount: Scalars['Float']['output']
  entryId: Maybe<Scalars['String']['output']>
  reversalEntryId: Maybe<Scalars['String']['output']>
  reversalStatus: Maybe<Scalars['String']['output']>
  status: Scalars['String']['output']
  structureId: Scalars['String']['output']
  structureName: Scalars['String']['output']
}

export type PeriodCloseStatus = {
  fiscalPeriodEnd: Scalars['Date']['output']
  fiscalPeriodStart: Scalars['Date']['output']
  periodStatus: Scalars['String']['output']
  schedules: Array<PeriodCloseItem>
  totalDraft: Scalars['Int']['output']
  totalPosted: Scalars['Int']['output']
}

export type PeriodDrafts = {
  /** True if every draft entry has debit == credit */
  allBalanced: Scalars['Boolean']['output']
  draftCount: Scalars['Int']['output']
  drafts: Array<DraftEntry>
  /** YYYY-MM period name */
  period: Scalars['String']['output']
  periodEnd: Scalars['Date']['output']
  periodStart: Scalars['Date']['output']
  /** Sum across all drafts, in cents */
  totalCredit: Scalars['Int']['output']
  /** Sum across all drafts, in cents */
  totalDebit: Scalars['Int']['output']
}

export type PeriodSpec = {
  end: Scalars['Date']['output']
  label: Scalars['String']['output']
  start: Scalars['Date']['output']
}

export type Portfolio = {
  baseCurrency: Scalars['String']['output']
  createdAt: Scalars['DateTime']['output']
  description: Maybe<Scalars['String']['output']>
  id: Scalars['String']['output']
  inceptionDate: Maybe<Scalars['Date']['output']>
  name: Scalars['String']['output']
  strategy: Maybe<Scalars['String']['output']>
  updatedAt: Scalars['DateTime']['output']
}

export type PortfolioList = {
  pagination: PaginationInfo
  portfolios: Array<Portfolio>
}

export type Position = {
  acquisitionDate: Maybe<Scalars['Date']['output']>
  costBasis: Scalars['Int']['output']
  costBasisDollars: Scalars['Float']['output']
  createdAt: Scalars['DateTime']['output']
  currency: Scalars['String']['output']
  currentValue: Maybe<Scalars['Int']['output']>
  currentValueDollars: Maybe<Scalars['Float']['output']>
  dispositionDate: Maybe<Scalars['Date']['output']>
  entityName: Maybe<Scalars['String']['output']>
  id: Scalars['String']['output']
  notes: Maybe<Scalars['String']['output']>
  portfolioId: Scalars['String']['output']
  quantity: Scalars['Float']['output']
  quantityType: Scalars['String']['output']
  securityId: Scalars['String']['output']
  securityName: Maybe<Scalars['String']['output']>
  status: Scalars['String']['output']
  updatedAt: Scalars['DateTime']['output']
  valuationDate: Maybe<Scalars['Date']['output']>
  valuationSource: Maybe<Scalars['String']['output']>
}

export type PositionList = {
  pagination: PaginationInfo
  positions: Array<Position>
}

export type PublishList = {
  createdAt: Scalars['DateTime']['output']
  createdBy: Scalars['String']['output']
  description: Maybe<Scalars['String']['output']>
  id: Scalars['String']['output']
  memberCount: Scalars['Int']['output']
  name: Scalars['String']['output']
  updatedAt: Scalars['DateTime']['output']
}

export type PublishListDetail = {
  createdAt: Scalars['DateTime']['output']
  createdBy: Scalars['String']['output']
  description: Maybe<Scalars['String']['output']>
  id: Scalars['String']['output']
  memberCount: Scalars['Int']['output']
  members: Array<PublishListMember>
  name: Scalars['String']['output']
  updatedAt: Scalars['DateTime']['output']
}

export type PublishListList = {
  pagination: PaginationInfo
  publishLists: Array<PublishList>
}

export type PublishListMember = {
  addedAt: Scalars['DateTime']['output']
  addedBy: Scalars['String']['output']
  id: Scalars['String']['output']
  targetGraphId: Scalars['String']['output']
  targetGraphName: Maybe<Scalars['String']['output']>
  targetOrgName: Maybe<Scalars['String']['output']>
}

export type Query = {
  accountRollups: Maybe<AccountRollups>
  accountTree: Maybe<AccountTree>
  accounts: Maybe<AccountList>
  agent: Maybe<Agent>
  agents: Array<Agent>
  closingBookStructures: Maybe<ClosingBookStructures>
  elements: Maybe<ElementList>
  entities: Array<LedgerEntity>
  entity: Maybe<LedgerEntity>
  fiscalCalendar: Maybe<FiscalCalendar>
  hello: Scalars['String']['output']
  holdings: Maybe<HoldingsList>
  informationBlock: Maybe<InformationBlock>
  informationBlocks: Array<InformationBlock>
  libraryElement: Maybe<LibraryElement>
  libraryElementArcs: Array<LibraryElementArc>
  libraryElementClassifications: Array<LibraryElementClassification>
  libraryElementEquivalents: Maybe<LibraryEquivalence>
  libraryElementTree: Maybe<LibraryElementTreeNode>
  libraryElements: Array<LibraryElement>
  libraryStructure: Maybe<LibraryStructure>
  libraryStructures: Array<LibraryStructure>
  libraryTaxonomies: Array<LibraryTaxonomy>
  libraryTaxonomy: Maybe<LibraryTaxonomy>
  libraryTaxonomyArcCount: Scalars['Int']['output']
  libraryTaxonomyArcs: Array<LibraryAssociation>
  mappedTrialBalance: Maybe<MappedTrialBalance>
  mapping: Maybe<MappingDetail>
  mappingCoverage: Maybe<MappingCoverage>
  mappings: Maybe<StructureList>
  periodCloseStatus: Maybe<PeriodCloseStatus>
  periodDrafts: Maybe<PeriodDrafts>
  portfolio: Maybe<Portfolio>
  portfolios: Maybe<PortfolioList>
  position: Maybe<Position>
  positions: Maybe<PositionList>
  publishList: Maybe<PublishListDetail>
  publishLists: Maybe<PublishListList>
  report: Maybe<Report>
  reportPackage: Maybe<ReportPackage>
  reportingTaxonomy: Maybe<Taxonomy>
  reports: Maybe<ReportList>
  searchLibraryElements: Array<LibraryElement>
  securities: Maybe<SecurityList>
  security: Maybe<Security>
  statement: Maybe<Statement>
  structures: Maybe<StructureList>
  summary: Maybe<LedgerSummary>
  taxonomies: Maybe<TaxonomyList>
  taxonomyBlock: Maybe<TaxonomyBlock>
  taxonomyBlocks: Array<TaxonomyBlock>
  transaction: Maybe<LedgerTransactionDetail>
  transactions: Maybe<LedgerTransactionList>
  trialBalance: Maybe<TrialBalance>
  unmappedElements: Array<UnmappedElement>
}

export type QueryAccountRollupsArgs = {
  endDate?: InputMaybe<Scalars['Date']['input']>
  mappingId?: InputMaybe<Scalars['String']['input']>
  startDate?: InputMaybe<Scalars['Date']['input']>
}

export type QueryAccountsArgs = {
  classification?: InputMaybe<Scalars['String']['input']>
  isActive?: InputMaybe<Scalars['Boolean']['input']>
  limit?: Scalars['Int']['input']
  offset?: Scalars['Int']['input']
}

export type QueryAgentArgs = {
  id: Scalars['String']['input']
}

export type QueryAgentsArgs = {
  agentType?: InputMaybe<Scalars['String']['input']>
  isActive?: InputMaybe<Scalars['Boolean']['input']>
  limit?: Scalars['Int']['input']
  offset?: Scalars['Int']['input']
  source?: InputMaybe<Scalars['String']['input']>
}

export type QueryElementsArgs = {
  classification?: InputMaybe<Scalars['String']['input']>
  isAbstract?: InputMaybe<Scalars['Boolean']['input']>
  limit?: Scalars['Int']['input']
  offset?: Scalars['Int']['input']
  source?: InputMaybe<Scalars['String']['input']>
  taxonomyId?: InputMaybe<Scalars['String']['input']>
}

export type QueryEntitiesArgs = {
  source?: InputMaybe<Scalars['String']['input']>
}

export type QueryHoldingsArgs = {
  portfolioId: Scalars['String']['input']
}

export type QueryInformationBlockArgs = {
  id: Scalars['ID']['input']
}

export type QueryInformationBlocksArgs = {
  blockType?: InputMaybe<Scalars['String']['input']>
  category?: InputMaybe<Scalars['String']['input']>
  limit?: Scalars['Int']['input']
  offset?: Scalars['Int']['input']
}

export type QueryLibraryElementArgs = {
  id?: InputMaybe<Scalars['ID']['input']>
  qname?: InputMaybe<Scalars['String']['input']>
}

export type QueryLibraryElementArcsArgs = {
  id: Scalars['ID']['input']
}

export type QueryLibraryElementClassificationsArgs = {
  id: Scalars['ID']['input']
}

export type QueryLibraryElementEquivalentsArgs = {
  id: Scalars['ID']['input']
}

export type QueryLibraryElementTreeArgs = {
  id: Scalars['ID']['input']
  maxDepth?: Scalars['Int']['input']
  structureId?: InputMaybe<Scalars['ID']['input']>
}

export type QueryLibraryElementsArgs = {
  activityType?: InputMaybe<Scalars['String']['input']>
  classification?: InputMaybe<Scalars['String']['input']>
  elementType?: InputMaybe<Scalars['String']['input']>
  includeLabels?: Scalars['Boolean']['input']
  includeReferences?: Scalars['Boolean']['input']
  isAbstract?: InputMaybe<Scalars['Boolean']['input']>
  limit?: Scalars['Int']['input']
  offset?: Scalars['Int']['input']
  source?: InputMaybe<Scalars['String']['input']>
  taxonomyId?: InputMaybe<Scalars['ID']['input']>
}

export type QueryLibraryStructureArgs = {
  id: Scalars['ID']['input']
}

export type QueryLibraryStructuresArgs = {
  structureType?: InputMaybe<Scalars['String']['input']>
  taxonomyId?: InputMaybe<Scalars['ID']['input']>
}

export type QueryLibraryTaxonomiesArgs = {
  includeElementCount?: Scalars['Boolean']['input']
  standard?: InputMaybe<Scalars['String']['input']>
}

export type QueryLibraryTaxonomyArgs = {
  id?: InputMaybe<Scalars['ID']['input']>
  includeElementCount?: Scalars['Boolean']['input']
  standard?: InputMaybe<Scalars['String']['input']>
  version?: InputMaybe<Scalars['String']['input']>
}

export type QueryLibraryTaxonomyArcCountArgs = {
  taxonomyId: Scalars['ID']['input']
}

export type QueryLibraryTaxonomyArcsArgs = {
  associationType?: InputMaybe<Scalars['String']['input']>
  limit?: Scalars['Int']['input']
  offset?: Scalars['Int']['input']
  taxonomyId: Scalars['ID']['input']
}

export type QueryMappedTrialBalanceArgs = {
  endDate?: InputMaybe<Scalars['Date']['input']>
  mappingId: Scalars['String']['input']
  startDate?: InputMaybe<Scalars['Date']['input']>
}

export type QueryMappingArgs = {
  mappingId: Scalars['String']['input']
}

export type QueryMappingCoverageArgs = {
  mappingId: Scalars['String']['input']
}

export type QueryPeriodCloseStatusArgs = {
  periodEnd: Scalars['Date']['input']
  periodStart: Scalars['Date']['input']
}

export type QueryPeriodDraftsArgs = {
  period: Scalars['String']['input']
}

export type QueryPortfolioArgs = {
  portfolioId: Scalars['String']['input']
}

export type QueryPortfoliosArgs = {
  limit?: Scalars['Int']['input']
  offset?: Scalars['Int']['input']
}

export type QueryPositionArgs = {
  positionId: Scalars['String']['input']
}

export type QueryPositionsArgs = {
  limit?: Scalars['Int']['input']
  offset?: Scalars['Int']['input']
  portfolioId?: InputMaybe<Scalars['String']['input']>
  securityId?: InputMaybe<Scalars['String']['input']>
  status?: InputMaybe<Scalars['String']['input']>
}

export type QueryPublishListArgs = {
  listId: Scalars['String']['input']
}

export type QueryPublishListsArgs = {
  limit?: Scalars['Int']['input']
  offset?: Scalars['Int']['input']
}

export type QueryReportArgs = {
  reportId: Scalars['String']['input']
}

export type QueryReportPackageArgs = {
  reportId: Scalars['String']['input']
}

export type QuerySearchLibraryElementsArgs = {
  limit?: Scalars['Int']['input']
  query: Scalars['String']['input']
  source?: InputMaybe<Scalars['String']['input']>
}

export type QuerySecuritiesArgs = {
  entityId?: InputMaybe<Scalars['String']['input']>
  isActive?: InputMaybe<Scalars['Boolean']['input']>
  limit?: Scalars['Int']['input']
  offset?: Scalars['Int']['input']
  securityType?: InputMaybe<Scalars['String']['input']>
}

export type QuerySecurityArgs = {
  securityId: Scalars['String']['input']
}

export type QueryStatementArgs = {
  reportId: Scalars['String']['input']
  structureType: Scalars['String']['input']
}

export type QueryStructuresArgs = {
  structureType?: InputMaybe<Scalars['String']['input']>
  taxonomyId?: InputMaybe<Scalars['String']['input']>
}

export type QueryTaxonomiesArgs = {
  taxonomyType?: InputMaybe<Scalars['String']['input']>
}

export type QueryTaxonomyBlockArgs = {
  id: Scalars['ID']['input']
}

export type QueryTaxonomyBlocksArgs = {
  category?: InputMaybe<Scalars['String']['input']>
  limit?: Scalars['Int']['input']
  offset?: Scalars['Int']['input']
  parentTaxonomyId?: InputMaybe<Scalars['ID']['input']>
  taxonomyType?: InputMaybe<Scalars['String']['input']>
}

export type QueryTransactionArgs = {
  transactionId: Scalars['String']['input']
}

export type QueryTransactionsArgs = {
  endDate?: InputMaybe<Scalars['Date']['input']>
  limit?: Scalars['Int']['input']
  offset?: Scalars['Int']['input']
  startDate?: InputMaybe<Scalars['Date']['input']>
  type?: InputMaybe<Scalars['String']['input']>
}

export type QueryTrialBalanceArgs = {
  endDate?: InputMaybe<Scalars['Date']['input']>
  startDate?: InputMaybe<Scalars['Date']['input']>
}

export type QueryUnmappedElementsArgs = {
  mappingId?: InputMaybe<Scalars['String']['input']>
}

export type Report = {
  aiGenerated: Scalars['Boolean']['output']
  comparative: Scalars['Boolean']['output']
  createdAt: Scalars['DateTime']['output']
  entityName: Maybe<Scalars['String']['output']>
  filedAt: Maybe<Scalars['DateTime']['output']>
  filedBy: Maybe<Scalars['String']['output']>
  filingStatus: Scalars['String']['output']
  generationStatus: Scalars['String']['output']
  id: Scalars['String']['output']
  lastGenerated: Maybe<Scalars['DateTime']['output']>
  mappingId: Maybe<Scalars['String']['output']>
  name: Scalars['String']['output']
  periodEnd: Maybe<Scalars['Date']['output']>
  periodStart: Maybe<Scalars['Date']['output']>
  periodType: Scalars['String']['output']
  periods: Maybe<Array<PeriodSpec>>
  ruleSummary: Maybe<Scalars['JSON']['output']>
  sharedAt: Maybe<Scalars['DateTime']['output']>
  sourceGraphId: Maybe<Scalars['String']['output']>
  sourceReportId: Maybe<Scalars['String']['output']>
  structures: Array<StructureSummary>
  supersededById: Maybe<Scalars['String']['output']>
  supersedesId: Maybe<Scalars['String']['output']>
  taxonomyId: Scalars['String']['output']
}

export type ReportList = {
  reports: Array<Report>
}

export type ReportPackage = {
  aiGenerated: Scalars['Boolean']['output']
  createdAt: Scalars['String']['output']
  createdBy: Scalars['String']['output']
  description: Maybe<Scalars['String']['output']>
  entityName: Maybe<Scalars['String']['output']>
  filedAt: Maybe<Scalars['String']['output']>
  filedBy: Maybe<Scalars['String']['output']>
  filingStatus: Scalars['String']['output']
  generationStatus: Scalars['String']['output']
  id: Scalars['ID']['output']
  items: Array<ReportPackageItem>
  lastGenerated: Maybe<Scalars['String']['output']>
  name: Scalars['String']['output']
  periodEnd: Maybe<Scalars['String']['output']>
  periodStart: Maybe<Scalars['String']['output']>
  periodType: Scalars['String']['output']
  sharedAt: Maybe<Scalars['String']['output']>
  sourceGraphId: Maybe<Scalars['String']['output']>
  sourceReportId: Maybe<Scalars['String']['output']>
  supersededById: Maybe<Scalars['String']['output']>
  supersedesId: Maybe<Scalars['String']['output']>
  taxonomyId: Scalars['String']['output']
}

export type ReportPackageItem = {
  block: InformationBlock
  displayOrder: Scalars['Int']['output']
  factSetId: Scalars['String']['output']
  structureId: Maybe<Scalars['String']['output']>
}

export type Security = {
  authorizedShares: Maybe<Scalars['Int']['output']>
  createdAt: Scalars['DateTime']['output']
  entityId: Maybe<Scalars['String']['output']>
  entityName: Maybe<Scalars['String']['output']>
  id: Scalars['ID']['output']
  isActive: Scalars['Boolean']['output']
  name: Scalars['String']['output']
  outstandingShares: Maybe<Scalars['Int']['output']>
  securitySubtype: Maybe<Scalars['String']['output']>
  securityType: Scalars['String']['output']
  sourceGraphId: Maybe<Scalars['String']['output']>
  terms: Scalars['JSON']['output']
  updatedAt: Scalars['DateTime']['output']
}

export type SecurityList = {
  pagination: PaginationInfo
  securities: Array<Security>
}

export type Statement = {
  periods: Array<PeriodSpec>
  reportId: Scalars['String']['output']
  rows: Array<FactRow>
  structureId: Scalars['String']['output']
  structureName: Scalars['String']['output']
  structureType: Scalars['String']['output']
  unmappedCount: Scalars['Int']['output']
  validation: Maybe<ValidationCheck>
}

export type Structure = {
  description: Maybe<Scalars['String']['output']>
  id: Scalars['String']['output']
  isActive: Scalars['Boolean']['output']
  name: Scalars['String']['output']
  structureType: Scalars['String']['output']
  taxonomyId: Scalars['String']['output']
}

export type StructureList = {
  structures: Array<Structure>
}

export type StructureSummary = {
  id: Scalars['String']['output']
  name: Scalars['String']['output']
  structureType: Scalars['String']['output']
}

export type SuggestedTarget = {
  confidence: Maybe<Scalars['Float']['output']>
  elementId: Scalars['String']['output']
  name: Scalars['String']['output']
  qname: Scalars['String']['output']
}

export type Taxonomy = {
  description: Maybe<Scalars['String']['output']>
  id: Scalars['String']['output']
  isActive: Scalars['Boolean']['output']
  isLocked: Scalars['Boolean']['output']
  isShared: Scalars['Boolean']['output']
  name: Scalars['String']['output']
  namespaceUri: Maybe<Scalars['String']['output']>
  sourceTaxonomyId: Maybe<Scalars['String']['output']>
  standard: Maybe<Scalars['String']['output']>
  targetTaxonomyId: Maybe<Scalars['String']['output']>
  taxonomyType: Scalars['String']['output']
  version: Maybe<Scalars['String']['output']>
}

export type TaxonomyBlock = {
  associationCount: Scalars['Int']['output']
  associations: Array<TaxonomyBlockAssociation>
  category: Scalars['String']['output']
  displayName: Scalars['String']['output']
  elementCount: Scalars['Int']['output']
  elements: Array<TaxonomyBlockElement>
  id: Scalars['ID']['output']
  isLocked: Scalars['Boolean']['output']
  name: Scalars['String']['output']
  namespaceUri: Maybe<Scalars['String']['output']>
  parentTaxonomyId: Maybe<Scalars['String']['output']>
  parentTaxonomyName: Maybe<Scalars['String']['output']>
  rules: Array<TaxonomyBlockRule>
  standard: Maybe<Scalars['String']['output']>
  structureCount: Scalars['Int']['output']
  structures: Array<TaxonomyBlockStructure>
  taxonomyType: Scalars['String']['output']
  verificationResults: Array<Scalars['JSON']['output']>
  version: Maybe<Scalars['String']['output']>
}

export type TaxonomyBlockAssociation = {
  arcrole: Maybe<Scalars['String']['output']>
  associationType: Scalars['String']['output']
  fromElementQname: Scalars['String']['output']
  id: Scalars['String']['output']
  orderValue: Maybe<Scalars['Float']['output']>
  structureId: Scalars['String']['output']
  toElementQname: Scalars['String']['output']
  weight: Maybe<Scalars['Float']['output']>
}

export type TaxonomyBlockElement = {
  balanceType: Maybe<Scalars['String']['output']>
  depth: Maybe<Scalars['Int']['output']>
  elementType: Scalars['String']['output']
  id: Scalars['String']['output']
  isMonetary: Scalars['Boolean']['output']
  name: Scalars['String']['output']
  origin: Scalars['String']['output']
  parentQname: Maybe<Scalars['String']['output']>
  periodType: Maybe<Scalars['String']['output']>
  qname: Maybe<Scalars['String']['output']>
  trait: Maybe<Scalars['String']['output']>
}

export type TaxonomyBlockRule = {
  id: Scalars['String']['output']
  name: Scalars['String']['output']
  origin: Scalars['String']['output']
  ruleCategory: Scalars['String']['output']
  ruleExpression: Scalars['String']['output']
  rulePattern: Scalars['String']['output']
  severity: Scalars['String']['output']
  targetKind: Maybe<Scalars['String']['output']>
  targetRef: Maybe<Scalars['String']['output']>
}

export type TaxonomyBlockStructure = {
  description: Maybe<Scalars['String']['output']>
  id: Scalars['String']['output']
  name: Scalars['String']['output']
  roleUri: Maybe<Scalars['String']['output']>
  structureType: Scalars['String']['output']
}

export type TaxonomyList = {
  taxonomies: Array<Taxonomy>
}

export type TrialBalance = {
  rows: Array<TrialBalanceRow>
  totalCredits: Scalars['Float']['output']
  totalDebits: Scalars['Float']['output']
}

export type TrialBalanceRow = {
  accountCode: Scalars['String']['output']
  accountId: Scalars['String']['output']
  accountName: Scalars['String']['output']
  accountType: Maybe<Scalars['String']['output']>
  netBalance: Scalars['Float']['output']
  totalCredits: Scalars['Float']['output']
  totalDebits: Scalars['Float']['output']
  trait: Maybe<Scalars['String']['output']>
}

export type UnmappedElement = {
  balanceType: Scalars['String']['output']
  code: Maybe<Scalars['String']['output']>
  externalSource: Maybe<Scalars['String']['output']>
  id: Scalars['String']['output']
  name: Scalars['String']['output']
  suggestedTargets: Array<SuggestedTarget>
  trait: Maybe<Scalars['String']['output']>
}

export type ValidationCheck = {
  checks: Array<Scalars['String']['output']>
  failures: Array<Scalars['String']['output']>
  passed: Scalars['Boolean']['output']
  warnings: Array<Scalars['String']['output']>
}

export type GetInvestorHoldingsQueryVariables = Exact<{
  portfolioId: Scalars['String']['input']
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

export type GetInvestorPortfolioQueryVariables = Exact<{
  portfolioId: Scalars['String']['input']
}>

export type GetInvestorPortfolioQuery = {
  portfolio: {
    id: string
    name: string
    description: string | null
    strategy: string | null
    inceptionDate: any | null
    baseCurrency: string
    createdAt: any
    updatedAt: any
  } | null
}

export type ListInvestorPortfoliosQueryVariables = Exact<{
  limit?: Scalars['Int']['input']
  offset?: Scalars['Int']['input']
}>

export type ListInvestorPortfoliosQuery = {
  portfolios: {
    portfolios: Array<{
      id: string
      name: string
      description: string | null
      strategy: string | null
      inceptionDate: any | null
      baseCurrency: string
      createdAt: any
      updatedAt: any
    }>
    pagination: { total: number; limit: number; offset: number; hasMore: boolean }
  } | null
}

export type GetInvestorPositionQueryVariables = Exact<{
  positionId: Scalars['String']['input']
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
    valuationDate: any | null
    valuationSource: string | null
    acquisitionDate: any | null
    dispositionDate: any | null
    status: string
    notes: string | null
    createdAt: any
    updatedAt: any
  } | null
}

export type ListInvestorPositionsQueryVariables = Exact<{
  portfolioId: InputMaybe<Scalars['String']['input']>
  securityId: InputMaybe<Scalars['String']['input']>
  status: InputMaybe<Scalars['String']['input']>
  limit?: Scalars['Int']['input']
  offset?: Scalars['Int']['input']
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
      valuationDate: any | null
      valuationSource: string | null
      acquisitionDate: any | null
      dispositionDate: any | null
      status: string
      notes: string | null
      createdAt: any
      updatedAt: any
    }>
    pagination: { total: number; limit: number; offset: number; hasMore: boolean }
  } | null
}

export type ListInvestorSecuritiesQueryVariables = Exact<{
  entityId: InputMaybe<Scalars['String']['input']>
  securityType: InputMaybe<Scalars['String']['input']>
  isActive: InputMaybe<Scalars['Boolean']['input']>
  limit?: Scalars['Int']['input']
  offset?: Scalars['Int']['input']
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
      terms: any
      isActive: boolean
      authorizedShares: number | null
      outstandingShares: number | null
      createdAt: any
      updatedAt: any
    }>
    pagination: { total: number; limit: number; offset: number; hasMore: boolean }
  } | null
}

export type GetInvestorSecurityQueryVariables = Exact<{
  securityId: Scalars['String']['input']
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
    terms: any
    isActive: boolean
    authorizedShares: number | null
    outstandingShares: number | null
    createdAt: any
    updatedAt: any
  } | null
}

export type GetLedgerAccountRollupsQueryVariables = Exact<{
  mappingId: InputMaybe<Scalars['String']['input']>
  startDate: InputMaybe<Scalars['Date']['input']>
  endDate: InputMaybe<Scalars['Date']['input']>
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
  classification: InputMaybe<Scalars['String']['input']>
  isActive: InputMaybe<Scalars['Boolean']['input']>
  limit?: Scalars['Int']['input']
  offset?: Scalars['Int']['input']
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
        structureType: string | null
        reportId: string | null
        status: string | null
      }>
    }>
  } | null
}

export type ListLedgerElementsQueryVariables = Exact<{
  taxonomyId: InputMaybe<Scalars['String']['input']>
  source: InputMaybe<Scalars['String']['input']>
  classification: InputMaybe<Scalars['String']['input']>
  isAbstract: InputMaybe<Scalars['Boolean']['input']>
  limit?: Scalars['Int']['input']
  offset?: Scalars['Int']['input']
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
  source: InputMaybe<Scalars['String']['input']>
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
    lastCloseAt: any | null
    initializedAt: any | null
    lastSyncAt: any | null
    periods: Array<{
      name: string
      startDate: any
      endDate: any
      status: string
      closedAt: any | null
    }>
  } | null
}

export type GetInformationBlockQueryVariables = Exact<{
  id: Scalars['ID']['input']
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
      parentheticalNote: string | null
      template: any | null
      mechanics: any
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
      value: number
      periodStart: any | null
      periodEnd: any
      periodType: string
      unit: string
      factScope: string
      factSetId: string | null
    }>
    rules: Array<{
      id: string
      ruleCategory: string
      rulePattern: string
      ruleExpression: string
      ruleMessage: string | null
      ruleSeverity: string
      ruleOrigin: string
    }>
    factSet: {
      id: string
      structureId: string | null
      periodStart: any | null
      periodEnd: any
      factsetType: string
      entityId: string
      reportId: string | null
    } | null
    verificationResults: Array<{
      id: string
      ruleId: string
      structureId: string | null
      factSetId: string | null
      status: string
      message: string | null
      periodStart: any | null
      periodEnd: any | null
      evaluatedAt: any | null
    }>
    view: {
      rendering: {
        unmappedCount: number
        rows: Array<{
          elementId: string
          elementQname: string | null
          elementName: string
          classification: string | null
          balanceType: string | null
          values: Array<number | null>
          isSubtotal: boolean
          depth: number
        }>
        periods: Array<{ start: any; end: any; label: string | null }>
        validation: {
          passed: boolean
          checks: Array<string>
          failures: Array<string>
          warnings: Array<string>
        } | null
      } | null
    }
  } | null
}

export type ListInformationBlocksQueryVariables = Exact<{
  blockType: InputMaybe<Scalars['String']['input']>
  category: InputMaybe<Scalars['String']['input']>
  limit: InputMaybe<Scalars['Int']['input']>
  offset: InputMaybe<Scalars['Int']['input']>
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
      parentheticalNote: string | null
      template: any | null
      mechanics: any
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
      value: number
      periodStart: any | null
      periodEnd: any
      periodType: string
      unit: string
      factScope: string
      factSetId: string | null
    }>
    rules: Array<{
      id: string
      ruleCategory: string
      rulePattern: string
      ruleExpression: string
      ruleMessage: string | null
      ruleSeverity: string
      ruleOrigin: string
    }>
    factSet: {
      id: string
      structureId: string | null
      periodStart: any | null
      periodEnd: any
      factsetType: string
      entityId: string
      reportId: string | null
    } | null
    verificationResults: Array<{
      id: string
      ruleId: string
      structureId: string | null
      factSetId: string | null
      status: string
      message: string | null
      periodStart: any | null
      periodEnd: any | null
      evaluatedAt: any | null
    }>
    view: {
      rendering: {
        unmappedCount: number
        rows: Array<{
          elementId: string
          elementQname: string | null
          elementName: string
          classification: string | null
          balanceType: string | null
          values: Array<number | null>
          isSubtotal: boolean
          depth: number
        }>
        periods: Array<{ start: any; end: any; label: string | null }>
        validation: {
          passed: boolean
          checks: Array<string>
          failures: Array<string>
          warnings: Array<string>
        } | null
      } | null
    }
  }>
}

export type GetLedgerMappedTrialBalanceQueryVariables = Exact<{
  mappingId: Scalars['String']['input']
  startDate: InputMaybe<Scalars['Date']['input']>
  endDate: InputMaybe<Scalars['Date']['input']>
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
  mappingId: Scalars['String']['input']
}>

export type GetLedgerMappingQuery = {
  mapping: {
    id: string
    name: string
    structureType: string
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

export type GetLedgerMappingCoverageQueryVariables = Exact<{
  mappingId: Scalars['String']['input']
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
      structureType: string
      taxonomyId: string
      isActive: boolean
    }>
  } | null
}

export type GetLedgerPeriodCloseStatusQueryVariables = Exact<{
  periodStart: Scalars['Date']['input']
  periodEnd: Scalars['Date']['input']
}>

export type GetLedgerPeriodCloseStatusQuery = {
  periodCloseStatus: {
    fiscalPeriodStart: any
    fiscalPeriodEnd: any
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
  period: Scalars['String']['input']
}>

export type GetLedgerPeriodDraftsQuery = {
  periodDrafts: {
    period: string
    periodStart: any
    periodEnd: any
    draftCount: number
    totalDebit: number
    totalCredit: number
    allBalanced: boolean
    drafts: Array<{
      entryId: string
      postingDate: any
      type: string
      memo: string | null
      provenance: string | null
      sourceStructureId: string | null
      sourceStructureName: string | null
      totalDebit: number
      totalCredit: number
      balanced: boolean
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
  listId: Scalars['String']['input']
}>

export type GetLedgerPublishListQuery = {
  publishList: {
    id: string
    name: string
    description: string | null
    memberCount: number
    createdBy: string
    createdAt: any
    updatedAt: any
    members: Array<{
      id: string
      targetGraphId: string
      targetGraphName: string | null
      targetOrgName: string | null
      addedBy: string
      addedAt: any
    }>
  } | null
}

export type ListLedgerPublishListsQueryVariables = Exact<{
  limit?: Scalars['Int']['input']
  offset?: Scalars['Int']['input']
}>

export type ListLedgerPublishListsQuery = {
  publishLists: {
    publishLists: Array<{
      id: string
      name: string
      description: string | null
      memberCount: number
      createdBy: string
      createdAt: any
      updatedAt: any
    }>
    pagination: { total: number; limit: number; offset: number; hasMore: boolean }
  } | null
}

export type GetLedgerReportQueryVariables = Exact<{
  reportId: Scalars['String']['input']
}>

export type GetLedgerReportQuery = {
  report: {
    id: string
    name: string
    taxonomyId: string
    generationStatus: string
    periodType: string
    periodStart: any | null
    periodEnd: any | null
    comparative: boolean
    mappingId: string | null
    aiGenerated: boolean
    createdAt: any
    lastGenerated: any | null
    entityName: string | null
    sourceGraphId: string | null
    sourceReportId: string | null
    sharedAt: any | null
    periods: Array<{ start: any; end: any; label: string }> | null
    structures: Array<{ id: string; name: string; structureType: string }>
  } | null
}

export type GetLedgerReportPackageQueryVariables = Exact<{
  reportId: Scalars['String']['input']
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
          parentheticalNote: string | null
          template: any | null
          mechanics: any
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
          value: number
          periodStart: any | null
          periodEnd: any
          periodType: string
          unit: string
          factScope: string
          factSetId: string | null
        }>
        rules: Array<{
          id: string
          ruleCategory: string
          rulePattern: string
          ruleExpression: string
          ruleMessage: string | null
          ruleSeverity: string
          ruleOrigin: string
        }>
        factSet: {
          id: string
          structureId: string | null
          periodStart: any | null
          periodEnd: any
          factsetType: string
          entityId: string
          reportId: string | null
        } | null
        verificationResults: Array<{
          id: string
          ruleId: string
          structureId: string | null
          factSetId: string | null
          status: string
          message: string | null
          periodStart: any | null
          periodEnd: any | null
          evaluatedAt: any | null
        }>
        view: {
          rendering: {
            unmappedCount: number
            rows: Array<{
              elementId: string
              elementQname: string | null
              elementName: string
              classification: string | null
              balanceType: string | null
              values: Array<number | null>
              isSubtotal: boolean
              depth: number
            }>
            periods: Array<{ start: any; end: any; label: string | null }>
            validation: {
              passed: boolean
              checks: Array<string>
              failures: Array<string>
              warnings: Array<string>
            } | null
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
      periodStart: any | null
      periodEnd: any | null
      comparative: boolean
      mappingId: string | null
      aiGenerated: boolean
      createdAt: any
      lastGenerated: any | null
      entityName: string | null
      sourceGraphId: string | null
      sourceReportId: string | null
      sharedAt: any | null
      periods: Array<{ start: any; end: any; label: string }> | null
      structures: Array<{ id: string; name: string; structureType: string }>
    }>
  } | null
}

export type GetLedgerStatementQueryVariables = Exact<{
  reportId: Scalars['String']['input']
  structureType: Scalars['String']['input']
}>

export type GetLedgerStatementQuery = {
  statement: {
    reportId: string
    structureId: string
    structureName: string
    structureType: string
    unmappedCount: number
    periods: Array<{ start: any; end: any; label: string }>
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
  taxonomyId: InputMaybe<Scalars['String']['input']>
  structureType: InputMaybe<Scalars['String']['input']>
}>

export type ListLedgerStructuresQuery = {
  structures: {
    structures: Array<{
      id: string
      name: string
      description: string | null
      structureType: string
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
    earliestTransactionDate: any | null
    latestTransactionDate: any | null
    connectionCount: number
    lastSyncAt: any | null
  } | null
}

export type ListLedgerTaxonomiesQueryVariables = Exact<{
  taxonomyType: InputMaybe<Scalars['String']['input']>
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
  transactionId: Scalars['String']['input']
}>

export type GetLedgerTransactionQuery = {
  transaction: {
    id: string
    number: string | null
    type: string
    category: string | null
    amount: number
    currency: string
    date: any
    dueDate: any | null
    merchantName: string | null
    referenceNumber: string | null
    description: string | null
    source: string
    sourceId: string | null
    status: string
    postedAt: any | null
    entries: Array<{
      id: string
      number: string | null
      type: string
      postingDate: any
      memo: string | null
      status: string
      postedAt: any | null
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
  type: InputMaybe<Scalars['String']['input']>
  startDate: InputMaybe<Scalars['Date']['input']>
  endDate: InputMaybe<Scalars['Date']['input']>
  limit?: Scalars['Int']['input']
  offset?: Scalars['Int']['input']
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
      date: any
      dueDate: any | null
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
  startDate: InputMaybe<Scalars['Date']['input']>
  endDate: InputMaybe<Scalars['Date']['input']>
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
  mappingId: InputMaybe<Scalars['String']['input']>
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
  taxonomyId: Scalars['ID']['input']
  associationType: InputMaybe<Scalars['String']['input']>
  limit?: Scalars['Int']['input']
  offset?: Scalars['Int']['input']
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
    toElementId: string
    toElementQname: string | null
    toElementName: string | null
    associationType: string
    arcrole: string | null
    orderValue: number | null
    weight: number | null
  }>
}

export type GetLibraryElementArcsQueryVariables = Exact<{
  id: Scalars['ID']['input']
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
  id: Scalars['ID']['input']
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
  id: Scalars['ID']['input']
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
  taxonomyId: InputMaybe<Scalars['ID']['input']>
  source: InputMaybe<Scalars['String']['input']>
  classification: InputMaybe<Scalars['String']['input']>
  activityType: InputMaybe<Scalars['String']['input']>
  elementType: InputMaybe<Scalars['String']['input']>
  isAbstract: InputMaybe<Scalars['Boolean']['input']>
  limit?: Scalars['Int']['input']
  offset?: Scalars['Int']['input']
  includeLabels?: Scalars['Boolean']['input']
  includeReferences?: Scalars['Boolean']['input']
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
  query: Scalars['String']['input']
  source: InputMaybe<Scalars['String']['input']>
  limit?: Scalars['Int']['input']
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
  id: InputMaybe<Scalars['ID']['input']>
  qname: InputMaybe<Scalars['String']['input']>
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

export type ListLibraryTaxonomiesQueryVariables = Exact<{
  standard: InputMaybe<Scalars['String']['input']>
  includeElementCount?: Scalars['Boolean']['input']
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
  id: InputMaybe<Scalars['ID']['input']>
  standard: InputMaybe<Scalars['String']['input']>
  version: InputMaybe<Scalars['String']['input']>
  includeElementCount?: Scalars['Boolean']['input']
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
export const GetInvestorPortfolioDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetInvestorPortfolio' },
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
            name: { kind: 'Name', value: 'portfolio' },
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
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetInvestorPortfolioQuery, GetInvestorPortfolioQueryVariables>
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
                            { kind: 'Field', name: { kind: 'Name', value: 'structureType' } },
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
                      { kind: 'Field', name: { kind: 'Name', value: 'parentheticalNote' } },
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
                      { kind: 'Field', name: { kind: 'Name', value: 'ruleExpression' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'ruleMessage' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'ruleSeverity' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'ruleOrigin' } },
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
                                  { kind: 'Field', name: { kind: 'Name', value: 'values' } },
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
                      { kind: 'Field', name: { kind: 'Name', value: 'parentheticalNote' } },
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
                      { kind: 'Field', name: { kind: 'Name', value: 'ruleExpression' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'ruleMessage' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'ruleSeverity' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'ruleOrigin' } },
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
                                  { kind: 'Field', name: { kind: 'Name', value: 'values' } },
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
                { kind: 'Field', name: { kind: 'Name', value: 'structureType' } },
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
                      { kind: 'Field', name: { kind: 'Name', value: 'structureType' } },
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
                      { kind: 'Field', name: { kind: 'Name', value: 'structureType' } },
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
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'parentheticalNote' },
                                  },
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
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'ruleExpression' },
                                  },
                                  { kind: 'Field', name: { kind: 'Name', value: 'ruleMessage' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'ruleSeverity' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'ruleOrigin' } },
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
                                                name: { kind: 'Name', value: 'values' },
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
                            { kind: 'Field', name: { kind: 'Name', value: 'structureType' } },
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
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'structureType' } },
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
                name: { kind: 'Name', value: 'structureType' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'structureType' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'reportId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'structureId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'structureName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'structureType' } },
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
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'structureType' } },
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
                name: { kind: 'Name', value: 'structureType' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'structureType' } },
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
                      { kind: 'Field', name: { kind: 'Name', value: 'structureType' } },
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
                { kind: 'Field', name: { kind: 'Name', value: 'toElementId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'toElementQname' } },
                { kind: 'Field', name: { kind: 'Name', value: 'toElementName' } },
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
