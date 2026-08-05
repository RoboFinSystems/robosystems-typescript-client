Draft curated release notes for an upcoming release, following the convention in `.github/release-notes/README.md`.

## Why this command exists

`tag-release.yml` generates release bodies from the changes since the last tag. That suits routine releases but reads poorly for a milestone, where the story is what the version _is_. For a published SDK it is worse than poor: post-1.0 the notes **are** the compatibility contract that integrators read before upgrading, and a generated changelog does not state what is additive, what is deprecated, or when a deprecation is removed. This command encodes the review and hygiene checks that keep the notes accurate and safe to publish.

## Instructions

### 1. Decide whether to curate at all

Unlike the application repos, curation here is not optional across the board. Curated notes are **mandatory for a major, and for any minor that deprecates public surface** — those notes carry the contract. A minor that is purely additive and a plain patch can keep the generated changelog; skipping is a normal outcome in those cases, not a failure. If the user invoked this command for a patch, confirm they still want curated notes.

### 2. Establish the version and the range

- The target version comes from the argument (e.g. `/release-notes 1.2.0`). If none was given, ask what version the user intends to tag — the filename must match the eventual tag exactly, and a mismatched file is silently ignored. Derive it from the current `package.json` version plus the bump type the user will dispatch (`1.1.0` + `minor` → `1.2.0`).
- **Never bump the version yourself.** `create-release.yml` bumps `package.json` on `main` as its first step and derives the tag from the result — a hand-bump collides with it.
- **The version is a promise, so sanity-check the bump type against the diff.** If the range contains a removal, a rename, or a semantic change to existing surface, a minor is the wrong bump — stop and raise it before writing a line of prose.
- **The range depends on the release kind.** A major or a surface-deprecating minor covers the span since the previous release of that significance; an ordinary curated release covers the span since the last tag:

```bash
LAST=$(git tag --sort=-creatordate | head -1)          # ordinary: last tag
# major/minor: the previous major or minor tag, e.g. v1.0.0 when cutting v1.2.0
git log "$RANGE_START"..origin/main --merges --format='%s'
gh pr list --state merged --limit 30 --json number,title,mergedAt
```

Note the generated links section will still compare against the last tag; the prose should state the span it covers explicitly.

### 3. Review the changes for real

Do not write notes from commit subjects alone. Read the PR bodies (`gh pr view <n>`) and spot-check diffs where the description is thin. Classify everything into public-surface changes, fixes, and internals, then check specifically:

- **The compatibility contract.** This is the load-bearing check. The public surface is the one defined in `CLAUDE.local.md` — the facade clients, the subpath exports, React hooks, documented types, error classes, and auth config; generated internals (`sdk/*.gen.ts`) are exempt unless they show up in a facade signature or doc. For every change to it, decide which bucket it is in and say so in the notes: **added** (free, rides a minor), **deprecated** (must name the replacement and the earliest removal major), **removed** (majors only, and only after a deprecation shipped at least one further minor and 90 days earlier), or **changed semantics** (a break, even when the type is unchanged). The integration template pins `>=1,<2` and the three frontend apps consume this package directly, so anything in the last two buckets breaks real consumers.
- **Regeneration vs. hand edits.** Much of `sdk/` is generated from the API's OpenAPI spec and the GraphQL codegen introspects a live backend — there is no hermetic drift gate yet. A regeneration that widens the surface is worth a sentence about what the API added, not a per-type enumeration. Say plainly when a release is a regeneration, and don't dress generated-internal churn up as new capability.
- **Upstream API coupling.** A regeneration tracks a specific RoboSystems API version. If the new surface only works against an API that isn't deployed yet, the notes must say so — integrators will call it the day they upgrade.
- **Packaging changes.** New or renamed subpath exports, changed module format, bundled type changes, or a raised Node floor are upgrade blockers for someone. Note them.

### 4. Security disclosure review

This repo is public and the release publishes to npm in the same run, so the notes are world-readable immediately and are read by everyone upgrading. For any security-adjacent change:

- Keep the line at PR-title neutrality: what area was hardened, never how or against what.
- No exploit mechanics, no affected-endpoint enumerations, no detection signatures or thresholds, no "previously protected only by X" tells.
- Never paste content from private analysis documents into the notes.
- Say clearly that upgrading is recommended, without describing the exposure.
- When in doubt, terser.

### 5. Write the file

Write `.github/release-notes/v<version>.md` — **body only**:

- No `# RoboSystems TypeScript SDK v<version>` heading, no release-statistics section, no links section, no generated-with footer. The workflow supplies all of those. Start at the first line of prose.
- `v1.0.0.md` is a good model for the format.
- Lead with one or two sentences saying what the version is. Then, for anything touching the public surface, a section per contract bucket — added / deprecated / removed / changed — ahead of the ordinary fixes and internals. Ground every line in a change you actually reviewed.

### 6. Hand off — sequencing matters

The file must exist **at the tagged ref**, and there is no window to add it late: `create-release.yml` bumps the version on `main`, cuts `release/<version>` from the result, and tags it in the same run. Pushing that release branch is also what triggers `publish.yml`, so by the time the package is on npm the notes are already fixed. They have to be **merged into `main` before the workflow is dispatched**.

Write the draft on a feature branch (created via `npm run feature:create`), never on `main`. Present it for review and leave the merge and the dispatch to the user.
