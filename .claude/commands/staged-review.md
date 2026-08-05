---
description: Review the staged diff against this SDK's compatibility, generation, and packaging rules.
---

Review all staged changes (`git diff --cached`) with focus on the contexts below. Read the diff first — if nothing is staged, say so rather than reviewing the working tree.

This is `@robosystems/client`: a **published, post-1.0 TypeScript SDK**, largely generated from the RoboSystems API's OpenAPI document and GraphQL schema, consumed by the RoboSystems apps, `@robosystems/core`, and external integrators. It is a **public repository**.

## Before anything else: is this file generated?

```bash
git diff --cached --name-only
```

`sdk/`, `clients/graphql/generated`, and `*.gen.*` are **generation output**. A hand edit there is erased by the next `npm run generate` — that's a blocking finding regardless of how correct the edit is. The fix belongs in one of:

- `scripts/fix-sdk-types.js` — post-generation fix-ups (unused `@ts-expect-error`, `(string & {})` patterns, redundant unions)
- `openapi-ts.config.js` / `codegen.ts` — generator configuration
- the API's OpenAPI or GraphQL schema, in `RoboFinSystems/robosystems` — where wrong types actually originate

If the staged diff mixes regenerated output with hand-written change, say which files are which; that distinction drives the rest of the review.

## Compatibility (the section that decides the verdict)

Post-1.0, the emitted type surface **is** the contract. For anything staged here:

- Is an export removed or renamed? A signature or return type changed? An input type narrowed? Runtime semantics altered? Each is a **major**, requires coordination with the API and every consuming app, and must be stated explicitly rather than discovered by an integrator.
- Is it additive — new endpoints, new optional fields, new exports? Free, but name it.
- **A regeneration is not automatically safe.** An API schema change can narrow a type or drop a field, so the diff reaches consumers as a break with no hand-written line involved. Compare the emitted `.d.ts` surface, not the source.
- Does new surface appear in `index.ts`, with its types exported alongside its values? Unexported surface may as well not exist.

## SDK implementation

- Are new methods properly typed, with no `any` used to silence `tsc`?
- Do extensions follow the existing patterns rather than inventing a second style?
- Is error handling consistent — are API errors mapped to something a consumer can branch on, not swallowed into a generic throw?
- Are request/response types the generated ones rather than hand-redeclared shapes that will drift?

## Auth and secrets

- Token and header handling: is anything logged, stringified into an error message, or attached where it could surface in a consumer's terminal? A `console.log` of a request object is a credential leak downstream.
- Are credentials read from configuration rather than defaulted to anything real?
- No API keys, JWTs, real graph IDs, or customer payloads in tests, fixtures, or comments. Fixtures should be invented.

## Packaging

- Changes to `prepare.js`, `package.json` `files`/`exports`/`types`, or the build output change **what ships**. A wrong `exports` map breaks consumers in ways nothing in this repo tests — cross-check against how the apps actually import.
- Never stage a `package.json` version bump in a feature branch: `create-release.yml` owns the bump on `main`, and pushing `release/**` is what triggers `publish.yml`.

## Testing

- Do new methods have tests, including the error paths?
- Do tests exercise the public surface as a consumer would import it, rather than reaching into internals?
- Is the test asserting correct behavior, or just asserting what the code currently does?

## Documentation

- Is the README updated for new or changed surface? For a published package this is the primary integrator documentation.
- Are JSDoc comments present on new public methods, and accurate on changed ones? They surface in consumers' editors.
- Does a breaking change come with the migration line an integrator needs?

## Public-repo hygiene

- No customer names, graph IDs, internal cost/pricing detail, or real financial payloads in code, comments, or fixtures.
- If the change fixes a security issue, keep commit messages and comments terse and non-actionable — the area hardened, never the mechanism. Remember the vulnerable version stays installable on npm until a patch is published.

## Output

Provide a summary with:

1. **Compatibility**: BREAKING / ADDITIVE / INTERNAL, with what a consumer must change if breaking
2. **Issues**: Problems that should be fixed before commit
3. **Suggestions**: Improvements that aren't blocking
4. **Questions**: Anything unclear that needs clarification

Anchor each finding to `file:line`. If the staged diff is clean, say so plainly rather than manufacturing findings.
