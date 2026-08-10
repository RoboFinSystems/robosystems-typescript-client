# RoboSystems TypeScript Client

[![npm version](https://badge.fury.io/js/@robosystems%2Fclient.svg)](https://www.npmjs.com/package/@robosystems/client)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Official TypeScript client for the RoboSystems financial intelligence platform — accounting, financial reporting, and investment management over a knowledge graph API. Type-safe and modern, generated from the OpenAPI spec, with GraphQL reads and idempotent operation writes.

## Features

- **Type-safe API client** with full TypeScript types
- **Browser & Node.js support** with different auth strategies
- **React hooks** for seamless UI integration
- **High-level domain clients** for RoboLedger, RoboInvestor, and the element library
- **Streaming support** for memory-efficient processing of large result sets
- **AI Operator** integration for natural language financial analysis
- **Comprehensive error handling** with typed errors

## Installation

```bash
npm install @robosystems/client
```

## Versioning

This client is `1.x` and follows semantic versioning, with one distinction worth knowing before you pin.

The **stable surface** is the facade clients and their subpath exports (`/clients`, `/ledger`, `/investor`, `/library`, `/query`, `/operations`, `/client`), the React hooks, the error classes, the auth configuration, and the types those signatures expose through `/types`. It is frozen for the life of `1.x`; breaking any of it costs a major version.

The **generated surface** — `/sdk`, which publishes the code generated from the platform's OpenAPI spec — tracks that spec. Operations there can be added, renamed, or removed on a minor release, and every such removal is named in that release's notes. `/sdk` is exported for convenience, not promised; anything that earns a compatibility promise is surfaced through a facade first.

So `^1` is the right pin if you build on the facades. If you import from `/sdk`, either pin a minor range (`~1.7`) and read the release notes when you widen, or open an issue to have the operation surfaced through a facade.

## Resources

- [RoboSystems Platform](https://robosystems.ai)
- [GitHub Repository](https://github.com/RoboFinSystems/robosystems)
- [API Documentation](https://api.robosystems.ai/docs)
- [OpenAPI Specification](https://api.robosystems.ai/openapi.json)

## Support

- [Issues](https://github.com/RoboFinSystems/robosystems-typescript-client/issues)
- [Wiki](https://github.com/RoboFinSystems/robosystems/wiki)
- [Projects](https://github.com/orgs/RoboFinSystems/projects)
- [Discussions](https://github.com/orgs/RoboFinSystems/discussions)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

MIT © 2026 RFS LLC
