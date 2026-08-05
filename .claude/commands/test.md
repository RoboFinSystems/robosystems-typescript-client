---
description: Run the full test and code-quality gate, fixing failures to green.
argument-hint: '[test-file-or-path]'
---

Run `npm run test:all` and systematically fix all failures to achieve 100% completion.

## Timeouts

Use `timeout: 300000` (5 minutes) on Bash calls for `npm run test:all`. The default 2-minute Bash timeout can be too short — prettier walks the tree, tsc runs on the full project, and `build` emits declarations.

## Strategy

1. **Run full suite first**: use the grep pattern below to extract the signal. Prettier's file-by-file output buries earlier vitest results.
2. **Fix in the order `test:all` runs**: prettier (auto-write) → eslint (auto-fix) → eslint check → tsc (typecheck) → vitest → build. The script short-circuits on the first failure.
3. **Iterate on the failing layer only** before re-running the full suite (see Key Commands below).
4. **Stop when done**: once `npm run test:all` passes, stop immediately. Do NOT re-run to "confirm."

## Output Handling

`npm run test:all` prints many "unchanged" lines from prettier, then vitest, tsc, and build output. Filter for the signal:

```
npm run test:all 2>&1 | grep -E "Test Files|Tests |FAIL|✗|×|error TS|✖|Error:" | tail -30
```

Captures: vitest summary (`Test Files`, `Tests`), failing files/tests (`FAIL`, `✗`, `×`), TypeScript errors (`error TS`), ESLint errors (`✖`), and generic `Error:` lines. Absence of any failure marker plus presence of "passed" means success — stop there.

For single-layer commands (below), output is short enough that `| tail -30` alone works.

## Key Commands

**Full suite:**

- `npm run test:all` — validate (format + lint:fix + lint + typecheck) + test + build

**Iteration (one layer at a time):**

- `npx vitest run <path>` — run a single test file (fastest feedback)
- `npm run test` — vitest only
- `npm run typecheck` — `tsc --noEmit` only
- `npm run lint` — eslint check (no `--fix`)
- `npm run lint:fix` — eslint auto-fix
- `npm run format:check` — prettier check (no write)
- `npm run format` — prettier auto-write
- `npm run build` — `tsc` build only

## Notes

- Vitest uses `✓` for pass and `✗`/`×` for fail, plus a `FAIL` prefix for files containing failures.
- **`test:all` mutates the working tree.** `validate` starts with `validate:fix` (`prettier --write` then `eslint --fix`), so a green run can still leave modified files. Check `git status` afterwards and stage what it rewrote — the pre-commit hook runs check-only commands (`format:check`, `lint`, `typecheck`, `test`) and fails on exactly those files.
- **Never hand-fix a failure inside generated code.** If `tsc` fails on something under `sdk/` or `clients/graphql/generated`, the fix belongs in `scripts/fix-sdk-types.js` (that's what it exists for — stripping unused `@ts-expect-error`, simplifying `(string & {})`, collapsing redundant unions), in the generator config, or in the API's schema. An edit to the generated file is erased by the next `npm run generate`.
- **Regeneration needs a reachable API.** `npm run generate` reads `ROBOSYSTEMS_API_URL` and fetches `/openapi.json` from it, so it can't run without a local or deployed API. After API changes, regenerate before expecting tests to reflect new endpoints — and treat a regeneration as a change to the public type surface, not a formatting pass.

## Goal

100% pass on `npm run test:all` with no errors of any kind.
