---
description: Open a pull request for the current branch, writing the description from the work actually done.
argument-hint: '[target-branch] [review]'
---

Create a GitHub pull request for the current branch, writing the title and description from the actual work done in this session — not reconstructed from the diff.

## Why this command exists

The previous flow outsourced PR-description authoring to a GitHub Action that only saw the diff and commit messages. It could not know _why_ the changes were made, so it frequently described things that weren't true. Those inaccurate descriptions then fed `@claude` reviews, compounding the bad information. This command fixes that at the root: **you author the description here, where the full context of what was done and why is available.**

This is `@robosystems/client` — a **published, post-1.0 TypeScript SDK**, largely generated from the RoboSystems API's OpenAPI document and GraphQL schema. Its description is read by integrators deciding whether an upgrade is safe, so precision about the public surface matters more here than in an application repo.

**This repository is public.** The PR title and body are world-readable the moment they're pushed — and, because publishing is triggered by a push to `release/**` rather than by a merge, the text is often public well before the version that carries it. Treat the description as a publication.

## Instructions

### 1. Preflight

Run these checks before touching anything:

```bash
# Current and target branches
CURRENT=$(git branch --show-current)
TARGET=${1:-main}            # override target via the first argument
```

- **Never PR from the default branch.** If `CURRENT` is `main` (or `master`/`staging`), stop and tell the user to switch to a feature branch first. New branches are created via `npm run feature:create`, not by hand.
- **Never target a release branch.** `release/**` is what `publish.yml` watches; a PR into one is a publish trigger, not a code review. Target `main`.
- **Source ≠ target.** If `CURRENT == TARGET`, stop.
- **Uncommitted changes.** Run `git status --porcelain`. If there are uncommitted/staged changes, surface them and ask whether to commit them (respecting the repo's commit rules — never on `main`, stage files by name, no `git add -A`) or proceed without them. The PR description must reflect committed state.
- **Existing PR.** Check `gh pr list --head "$CURRENT" --base "$TARGET" --json url,number`. If a PR already exists, do **not** create a duplicate — offer to update its title/body with `gh pr edit` instead.
- **Security fixes — check what's published.** A security-fix commit discloses the bug through its diff the moment it's pushed, and the vulnerable version stays installable on npm regardless. If this branch carries one, say which published versions are affected so the user can sequence a patch release with the disclosure.
- **Push the branch.** `gh pr create` requires the branch on the remote. Ensure it's pushed: `git push -u origin "$CURRENT"` (the user invoking `/create-pr` is the explicit, in-the-moment request that authorizes pushing _this feature branch_ — never push `main` or `release/*`).

### 2. Gather the real change context

This is the whole point — ground the description in what actually happened:

- **Primary source: this session.** Use what was actually changed and why from the conversation context. This is the information the old GHA workflow never had.
- **Corroborate against the branch:**
  ```bash
  git log --oneline "$TARGET".."$CURRENT"     # commits on this branch
  git diff --stat "$TARGET"..."$CURRENT"      # files + churn
  git diff "$TARGET"..."$CURRENT"             # full diff — read it, don't guess
  ```
- **Separate generated churn from real change.** A regeneration touches `sdk/` and `clients/graphql/generated` wholesale; the meaningful diff is usually a handful of lines inside it plus whatever was hand-written. Summarize the generated part ("regenerated against API build X; net effect: two new endpoints, one widened union") rather than enumerating it, and never describe generated churn as if it were authored work.
- **Hard rule — no confabulation.** Every claim must be supported by the diff. If you didn't change the public API surface, don't write "new client methods." When the session context and the diff disagree, the diff wins and you investigate the discrepancy.

### 3. Compose the PR

- **Type** — derive from the branch prefix (`feature/` → feat, `bugfix/`/`fix/` → fix, `hotfix/` → fix, `chore/` → chore, `refactor/` → refactor). Default to `feat` if unprefixed.
- **Title** — concise (~50–72 chars), conventional-commit style with a scope, matching `git log` (e.g. `feat(ledger): add report bundle download support`, `chore(sdk): regenerate against report-bundle endpoint`).
- **Body** — markdown. This repo has no `PULL_REQUEST_TEMPLATE.md`, so follow the convention in recent merged PRs (`gh pr list --state merged --limit 10 --json title,body`):
  - **Summary** — 1–3 sentences: what this PR does and why.
  - **Changes** — bullets grouped by area: regenerated SDK vs. hand-written extensions vs. tooling/packaging.
  - **Compatibility** — the section that matters most here. See below.
  - **Testing** — state truthfully what was run. The gate is `npm run test:all` (`validate` → `test` → `build`); `npm run validate`, `npm run test`, `npm run typecheck`, and `npm run build` run standalone. Regeneration needs a reachable API (`ROBOSYSTEMS_API_URL`), so it often isn't runnable in-session — if you couldn't, say so plainly. If nothing was run, say "Not run" — never claim passing tests that weren't executed.
  - **Related Issues** — `Closes #123` / `Fixes #456`, or omit.

- **Compatibility is a required judgment, not an optional section.** This package is post-1.0 with external integrators, so classify the change explicitly and say which it is:
  - **Breaking** — a removed or renamed export, a changed signature or return type, a narrowed input type, or changed runtime semantics. This forces a **major** and has to be coordinated with the API and with every consuming app. Say it plainly in the body; don't bury it in a bullet.
  - **Additive** — new endpoints, new optional fields, new exports. Free, but worth naming so consumers know what they gain.
  - **Internal** — generation tooling, tests, packaging that doesn't alter emitted types.

  A regeneration is not automatically additive: an API schema change can narrow a type or drop a field, and that reaches consumers as a break even though no hand-written line changed. Diff the emitted types before classifying.

- **Version and publish are not this PR's job.** `create-release.yml` bumps the version on `main` and cuts `release/<version>`; the push to that branch is what triggers `publish.yml`. Never bump `package.json` in a feature PR and never imply the PR publishes anything.

- **Security-fix disclosure.** If the PR fixes a security issue, the prose is often _more_ actionable than the diff — keep it terse and non-actionable. Name the area hardened, never the mechanism. No exploit mechanics, attack scenarios, endpoint enumerations, or payloads. For coordinated disclosure use a private GitHub Security Advisory, never a public issue.

- **Attribution** — attribute to the user only. Do **not** add a "🤖 Generated with Claude Code" footer or a `Co-Authored-By: Claude` trailer. Include such a line only if the user explicitly asks.

### 4. Create the PR

Write the body to a temp file to avoid shell-escaping problems, then:

```bash
gh pr create \
  --base "$TARGET" \
  --head "$CURRENT" \
  --title "<title>" \
  --body-file /tmp/pr-body.md
```

Print the resulting PR URL.

### 5. Optional Claude review

Only if the user explicitly asks (e.g. passes `review` / `--review` in arguments), request a review:

```bash
gh pr comment <number> --body "@claude please review this PR"
```

`claude.yml` only fires on an `@claude` mention from an `OWNER`/`MEMBER`/`COLLABORATOR`, so nothing happens automatically. Leave it off by default.

## Output

After creating the PR, report:

1. The PR URL.
2. A one-line summary of the title.
3. Target ← source branches.
4. The compatibility classification (breaking / additive / internal), and if breaking, what a consumer has to change.
5. Whether a Claude review was requested.

## Arguments

`$ARGUMENTS` may contain:

- A target branch (default `main`).
- `review` / `--review` to auto-request a `@claude` review.
- Freeform guidance on what to emphasize in the description.

$ARGUMENTS
