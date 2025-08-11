# RoboSystems TypeScript Client

[![npm version](https://badge.fury.io/js/@robosystems%2Fclient.svg)](https://www.npmjs.com/package/@robosystems/client)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Official TypeScript Client for the RoboSystems Financial Knowledge Graph API. Access comprehensive financial data including accounting records, SEC filings, and advanced graph analytics through a type-safe, modern TypeScript interface.

## Features

- **Type-safe API client** with full TypeScript types
- **Auto-generated from OpenAPI** for always up-to-date types
- **Browser & Node.js support** with different auth strategies
- **React hooks** for seamless UI integration
- **Queue handling** for long-running operations
- **Streaming support** for large datasets
- **Financial AI Agent** integration
- **Comprehensive error handling** with typed errors

## Installation

```bash
npm install @robosystems/client
# or
yarn add @robosystems/client
# or
pnpm add @robosystems/client
```

## Quick Start

### Browser Usage (with cookies)

```typescript
import { client, getUserMe, listCompanies, executeCypherQuery } from '@robosystems/client'

// Configure the client
client.setConfig({
  baseUrl: 'https://api.robosystems.ai',
  credentials: 'include',
})

// Use with cookie-based authentication (browser)
const { data: user, error } = await getCurrentUser()
if (user) {
  console.log('Logged in as:', user.email)
}

// List companies in a graph
const { data: companies } = await listCompanies({
  path: { graph_id: 'your-graph-id' },
  query: { limit: 10 },
})

// Execute a Cypher query
const { data: result } = await executeCypherQuery({
  path: { graph_id: 'your-graph-id' },
  body: {
    query: 'MATCH (c:Company)-[:HAS_FILING]->(f:Filing) RETURN c.name, f.form_type LIMIT 5',
  },
})
```

### Server Usage (with API key)

```typescript
import { client, getUserGraphs, listCompanies } from '@robosystems/client'

// Configure with API key for server-side usage
client.setConfig({
  baseUrl: 'https://api.robosystems.ai',
  headers: {
    'X-API-Key': process.env.ROBOSYSTEMS_API_KEY!,
  },
})

// Fetch user's graphs
const { data: graphs, error } = await getUserGraphs()

// Work with financial data
if (graphs?.graphs.length) {
  const graphId = graphs.graphs[0].graph_id
  const { data: companies } = await listCompanies({
    path: { graph_id: graphId },
  })
}
```

## Key API Endpoints

### Authentication & User Management

```typescript
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  createUserApiKey,
} from '@robosystems/client'

// Register a new user
const { data, error } = await registerUser({
  body: {
    email: 'user@example.com',
    password: 'secure-password',
    name: 'John Doe',
  },
})

// Sign in
const { data: session } = await loginUser({
  body: {
    username: 'user@example.com',
    password: 'secure-password',
  },
})

// Get current user
const { data: user } = await getCurrentUser()

// Create API key for programmatic access
const { data: apiKey } = await createUserApiKey({
  body: {
    key_name: 'Production Server',
    key_type: 'user',
  },
})
console.log('Save this key securely:', apiKey.key)

// Sign out
await logoutUser()
```

### Company & Financial Data

```typescript
import {
  listCompanies,
  getCompany,
  createCompany,
  createConnection,
  syncConnection,
} from '@robosystems/client'

// List companies with pagination
const { data: companies } = await listCompanies({
  path: { graph_id: 'your-graph-id' },
  query: { limit: 20, offset: 0 },
})
console.log(`Found ${companies.total} companies`)

// Get specific company details
const { data: company } = await getCompany({
  path: {
    graph_id: 'your-graph-id',
    company_id: 'AAPL',
  },
})

// Create new company
const { data: newCompany } = await createCompany({
  path: { graph_id: 'your-graph-id' },
  body: {
    identifier: 'MSFT',
    name: 'Microsoft Corporation',
    metadata: { industry: 'Technology' },
  },
})

// Create data connection (QuickBooks, etc.)
const { data: connection } = await createConnection({
  path: { graph_id: 'your-graph-id' },
  body: {
    name: 'QuickBooks Integration',
    connection_type: 'quickbooks',
    config: { company_id: '123456' },
  },
})

// Sync data from connection
const { data: syncResult } = await syncConnection({
  path: {
    graph_id: 'your-graph-id',
    connection_id: connection.id,
  },
})
```

### Graph Queries & Analytics

```typescript
import {
  executeCypherQuery,
  executeReadOnlyCypherQuery,
  getGraphMetrics,
} from '@robosystems/client'

// Execute parameterized Cypher queries
const { data: results } = await executeCypherQuery({
  path: { graph_id: 'your-graph-id' },
  body: {
    query: `
      MATCH (c:Company {ticker: $ticker})-[:HAS_METRIC]->(m:Metric)
      WHERE m.fiscal_year >= $start_year
      RETURN m.name, m.value, m.fiscal_year
      ORDER BY m.fiscal_year DESC
    `,
    parameters: { ticker: 'AAPL', start_year: 2020 },
  },
})

// Read-only queries for better performance
const { data: readOnlyResult } = await executeReadOnlyCypherQuery({
  path: { graph_id: 'your-graph-id' },
  body: { query: 'MATCH (n) RETURN count(n) as total' },
})

// Get graph analytics
const { data: metrics } = await getGraphMetrics({
  path: { graph_id: 'your-graph-id' },
})
console.log(`Total nodes: ${metrics.total_nodes}`)
console.log(`Total relationships: ${metrics.total_relationships}`)
```

### Financial AI Agent

```typescript
import { queryFinancialAgent } from '@robosystems/client'

// Natural language financial queries
const { data: agentResponse } = await queryFinancialAgent({
  path: { graph_id: 'your-graph-id' },
  body: {
    query: "What was Apple's revenue growth over the last 3 years?",
    include_reasoning: true,
    max_tokens: 1000,
  },
})

console.log('Answer:', agentResponse.answer)
if (agentResponse.reasoning) {
  console.log('Reasoning:', agentResponse.reasoning)
}
```

## Advanced Features

### Billing & Credit Management

```typescript
import { getCreditSummary, checkCreditBalance, getCurrentGraphBill } from '@robosystems/client'

// Monitor credits and usage for a specific graph
const { data: creditSummary } = await getCreditSummary({
  path: { graph_id: 'your-graph-id' },
})
console.log(`Available credits: ${creditSummary.available_credits.toLocaleString()}`)
console.log(
  `Monthly usage: ${creditSummary.used_credits.toLocaleString()}/${creditSummary.total_credits.toLocaleString()}`
)

// Check credit requirements before operations
const { data: creditCheck } = await checkCreditBalance({
  path: { graph_id: 'your-graph-id' },
  body: {
    operation_type: 'query',
    estimated_credits: 100,
  },
})

if (creditCheck.has_sufficient_credits) {
  // Proceed with operation
}

// Get billing information
const { data: currentBill } = await getCurrentGraphBill({
  path: { graph_id: 'your-graph-id' },
})
```

### MCP Tools Integration

```typescript
import { listMcpTools, callMcpTool } from '@robosystems/client'

// List available MCP tools
const { data: tools } = await listMcpTools({
  path: { graph_id: 'your-graph-id' },
})
tools.tools.forEach((tool) => {
  console.log(`${tool.name}: ${tool.description}`)
})

// Call an MCP tool
const { data: toolResult } = await callMcpTool({
  path: { graph_id: 'your-graph-id' },
  body: {
    name: 'analyze_financial_statement',
    arguments: {
      company_id: 'AAPL',
      statement_type: 'income',
      fiscal_year: 2023,
    },
  },
})
console.log('Analysis result:', toolResult.content)
```

## Advanced Features

### Error Handling

```typescript
import { listCompanies } from '@robosystems/client'
import type { ErrorResponse } from '@robosystems/client'

try {
  const { data, error } = await listCompanies({
    path: { graph_id: 'your-graph-id' },
  })

  if (error) {
    const apiError = error as ErrorResponse

    switch (apiError.status) {
      case 400:
        console.error('Validation error:', apiError.detail)
        break
      case 401:
        console.error('Authentication failed - check your API key')
        break
      case 403:
        console.error('Permission denied - check graph access')
        break
      case 429:
        console.error('Rate limit exceeded - retry later')
        break
      case 503:
        console.error('Service temporarily unavailable')
        break
      default:
        console.error('API Error:', apiError.detail || apiError.message)
    }
  } else if (data) {
    console.log(`Found ${data.total} companies`)
  }
} catch (err) {
  // Network errors
  console.error('Network Error:', err)
}
```

### TypeScript Types

All API responses and requests are fully typed:

```typescript
import type {
  User,
  Graph,
  Company,
  CompanyCreate,
  CypherQueryRequest,
  CypherQueryResponse,
  AgentQueryRequest,
  AgentQueryResponse,
  ErrorResponse,
  PaginatedResponse,
} from '@robosystems/client'

// Type-safe function example
function processCompany(company: Company): void {
  console.log(`Company: ${company.name} (${company.identifier})`)
  if (company.metadata) {
    console.log('Industry:', company.metadata.industry)
  }
}

// Type-safe query builder
function buildMetricQuery(ticker: string, startYear: number): CypherQueryRequest {
  return {
    query: `
      MATCH (c:Company {ticker: $ticker})-[:HAS_METRIC]->(m:Metric)
      WHERE m.fiscal_year >= $start_year
      RETURN m
    `,
    parameters: { ticker, start_year: startYear },
  }
}
```

## Environment Configuration

### Next.js App Router

```typescript
// app/api/robosystems/route.ts
import { client } from '@robosystems/client'

// Configure for server-side API routes
client.setConfig({
  baseUrl: process.env.ROBOSYSTEMS_API_URL || 'https://api.robosystems.ai',
  headers: {
    'X-API-Key': process.env.ROBOSYSTEMS_API_KEY!,
  },
})
```

### React SPA

```typescript
// src/lib/robosystems.ts
import { client } from '@robosystems/client'

// Configure for browser with cookies
client.setConfig({
  baseUrl: import.meta.env.VITE_ROBOSYSTEMS_API_URL || 'https://api.robosystems.ai',
  credentials: 'include',
})
```

### Node.js Script

```typescript
// scripts/analyze.ts
import { client } from '@robosystems/client'
import dotenv from 'dotenv'

dotenv.config()

client.setConfig({
  baseUrl: process.env.ROBOSYSTEMS_API_URL || 'https://api.robosystems.ai',
  headers: {
    'X-API-Key': process.env.ROBOSYSTEMS_API_KEY!,
  },
})
```

## API Reference

- Full API documentation: [https://api.robosystems.ai/docs](https://api.robosystems.ai/docs)
- OpenAPI specification: [https://api.robosystems.ai/openapi.json](https://api.robosystems.ai/openapi.json)

## Support

- Documentation: [https://docs.robosystems.ai](https://docs.robosystems.ai)
- Issues: [GitHub Issues](https://github.com/HarbingerFinLab/robosystems-typescript-client/issues)
- Email: support@robosystems.ai

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

MIT © 2024 Harbinger FinLab
