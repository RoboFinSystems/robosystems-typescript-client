import type { CodegenConfig } from '@graphql-codegen/cli'

/**
 * GraphQL Code Generator config.
 *
 * Introspects the running backend (default: local dev at port 8000) and
 * produces typed DocumentNodes from gql template literals in
 * clients/graphql/queries/**.
 *
 * The GraphQL endpoint is **graph-scoped at the URL level** —
 * `/extensions/{graph_id}/graphql` — so we need SOME graph_id in the
 * URL to match the FastAPI route. Introspection queries don't touch
 * any resolvers (they only ask for the schema), so any valid graph_id
 * pattern works. We use a zero-filled placeholder (`kg00000000...`)
 * that matches `GRAPH_OR_SUBGRAPH_ID_PATTERN` on the backend.
 *
 * The backend allows unauthenticated introspection queries (see
 * robosystems/graphql/context.py:get_context), so no API key is
 * required at build time. Real data queries still require auth.
 *
 * Output lives in clients/graphql/generated/graphql.ts and is
 * committed to the repo (matches the existing sdk/ convention).
 *
 * Usage:
 *   npm run generate:graphql                            # local backend
 *   GRAPHQL_SCHEMA_URL=<url> npm run generate:graphql   # override target
 *
 * The local backend must be running with ROBOLEDGER_ENABLED=true or
 * ROBOINVESTOR_ENABLED=true (so the schema mounts at all) AND
 * EXTENSIONS_GRAPHQL_ENABLED=true (the kill switch is on by default).
 */
const config: CodegenConfig = {
  schema:
    process.env.GRAPHQL_SCHEMA_URL ||
    'http://localhost:8000/extensions/kg00000000000000000000/graphql',
  documents: ['clients/graphql/queries/**/*.ts'],
  generates: {
    'clients/graphql/generated/graphql.ts': {
      plugins: ['typescript', 'typescript-operations', 'typed-document-node'],
      config: {
        useTypeImports: true,
        enumsAsTypes: true,
        avoidOptionals: true,
        skipTypename: true,
      },
    },
  },
}

export default config
