import type { CodegenConfig } from '@graphql-codegen/cli'
import { DirectiveLocation } from 'graphql'

/**
 * Sanitize the introspection response before codegen builds the schema.
 *
 * The backend runs graphql-core (Python), which tracks newer GraphQL spec
 * drafts than our graphql-js (16.x). graphql-core advertises `@deprecated`
 * on the `DIRECTIVE_DEFINITION` location, but graphql-js 16's parser doesn't
 * recognize that location keyword. graphql-codegen serializes the introspected
 * schema back to SDL (`directive @deprecated(...) on ... | DIRECTIVE_DEFINITION`)
 * and re-parses it, which blows up with:
 *   Syntax Error: Unexpected Name "DIRECTIVE_DEFINITION".
 *
 * We strip any directive location our graphql-js doesn't know about from the
 * introspection result so the SDL round-trip stays valid. Filtering against the
 * full known set (rather than just DIRECTIVE_DEFINITION) keeps us resilient to
 * future graphql-core/spec additions.
 */
const KNOWN_DIRECTIVE_LOCATIONS = new Set<string>(Object.values(DirectiveLocation))

const sanitizingFetch: typeof fetch = async (input, init) => {
  const response = await fetch(input, init)
  const body = await response.json()
  const directives = body?.data?.__schema?.directives
  if (Array.isArray(directives)) {
    for (const directive of directives) {
      if (!Array.isArray(directive?.locations)) continue
      const dropped = directive.locations.filter(
        (loc: string) => !KNOWN_DIRECTIVE_LOCATIONS.has(loc)
      )
      if (dropped.length > 0) {
        directive.locations = directive.locations.filter((loc: string) =>
          KNOWN_DIRECTIVE_LOCATIONS.has(loc)
        )
        console.warn(
          `[codegen] Stripped unknown directive location(s) from @${directive.name}: ${dropped.join(', ')}`
        )
      }
    }
  }
  return new Response(JSON.stringify(body), {
    status: response.status,
    statusText: response.statusText,
    headers: { 'content-type': 'application/json' },
  })
}

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
const schemaUrl =
  process.env.GRAPHQL_SCHEMA_URL ||
  'http://localhost:8000/extensions/kg00000000000000000000/graphql'

const config: CodegenConfig = {
  schema: {
    [schemaUrl]: {
      customFetch: sanitizingFetch,
    },
  },
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
