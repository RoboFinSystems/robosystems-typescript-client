# RoboSystems TypeScript Client

[![npm version](https://badge.fury.io/js/@robosystems%2Fclient.svg)](https://www.npmjs.com/package/@robosystems/client)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**The TypeScript client for [RoboSystems](https://github.com/RoboFinSystems/robosystems), the open-source knowledge graph for finance.** `@robosystems/client` covers the whole API: typed facades for RoboLedger, RoboInvestor, the element library, Cypher queries, AI Operators and long-running operations, over a client generated from the OpenAPI spec. It runs in browsers and Node.

## Install

```bash
npm install @robosystems/client
```

Needs Node.js 24 or later. `react` is an optional peer dependency used only by the hooks; the package root and `/clients` load them, so without React import from `/ledger`, `/investor`, `/library`, `/query` or `/operations`.

## Authentication

Pass a `token` to a client. A value starting with `rfs` is an API key, sent as `X-API-Key`; anything else is a JWT, sent as `Authorization: Bearer`. Where a JWT rotates, pass `tokenProvider`, a callback consulted on every request, instead. See [Authentication & API Keys](https://robosystems.ai/docs/technical/authentication-and-api-keys).

## Usage

```typescript
import { LedgerClient } from '@robosystems/client/ledger'
import { QueryClient } from '@robosystems/client/query'

const baseUrl = 'https://api.robosystems.ai'
const token = process.env.ROBOSYSTEMS_API_KEY

const ledger = new LedgerClient({ baseUrl, token })
const tb = await ledger.getTrialBalance(graphId, { startDate: '2026-01-01', endDate: '2026-03-31' })

const query = new QueryClient({ baseUrl, token })
const result = await query.query('sec', 'MATCH (e:Entity {ticker: $ticker}) RETURN e.name', {
  ticker: 'NVDA',
})
```

Every API operation is also a generated function in `/sdk`, running on the shared `client` and returning `{ data, error }`:

```typescript
import { client } from '@robosystems/client/client'
import { materialize } from '@robosystems/client/sdk'

client.setConfig({ baseUrl, headers: { 'X-API-Key': token } })
const { data, error } = await materialize({ path: { graph_id: graphId }, body: {} })
```

The subpath exports, each facade, the hooks, the error classes and rate-limit handling are described in [`clients/README.md`](clients/README.md).

## Versioning

Semantic versioning in two tiers. **Stable**: the facades and their subpaths, the hooks, the error classes and the auth configuration; breaking them costs a major release, after a deprecation cycle. **Generated**: the functions in `/sdk` track the API and can change in a minor release, with every removal named in the [release notes](https://github.com/RoboFinSystems/robosystems-typescript-client/releases). See [Versioning & Compatibility](https://robosystems.ai/docs/technical/versioning-and-compatibility).

## Documentation

- **API reference**: [robosystems.ai/docs/api](https://robosystems.ai/docs/api) · [OpenAPI specification](https://api.robosystems.ai/openapi.json)
- **Technical docs**: [robosystems.ai/docs/technical](https://robosystems.ai/docs/technical)
- **Related**: [RoboSystems](https://github.com/RoboFinSystems/robosystems) · [Python client](https://github.com/RoboFinSystems/robosystems-python-client) · [MCP client](https://github.com/RoboFinSystems/robosystems-mcp-client)

## Support

- [Issues](https://github.com/RoboFinSystems/robosystems-typescript-client/issues) · [Discussions](https://github.com/orgs/RoboFinSystems/discussions) · [Projects](https://github.com/orgs/RoboFinSystems/projects)
- [CONTRIBUTING.md](.github/CONTRIBUTING.md): branch conventions, coding standards and the pull request process

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

MIT © 2026 RFS LLC
