---
description: Monitor a release/publish run — diagnose failures, verify the package actually landed on npm.
argument-hint: '[run-id]'
---

Monitor a release and publish run — pinpoint why it failed, and confirm the version actually landed on npm. Releases go through GitHub Actions; this command is about watching and diagnosing them, not replacing the pipeline.

## How a release actually happens here

Two workflows, and the trigger between them is the part that surprises people:

1. **`create-release.yml`** (`workflow_dispatch`, or `npm run release:create`) — reads the current version from `package.json`, computes the next one from the requested bump, commits the bump **to `main`**, cuts `release/<version>` from that commit, and tags it.
2. **`publish.yml`** — triggered by **a push to `release/**`**, not by a merge and not by the tag. It reads the version from `package.json`, checks whether that version already exists on npm, and if not, publishes with `npm publish --provenance --access public` over OIDC trusted publishing.

So: **merging a PR to `main` publishes nothing.** The release branch push is the publishing event. And because `publish.yml` short-circuits when the version already exists on npm, a re-run of a successful publish is a no-op rather than an error — useful, but it also means "the run went green" is not by itself proof that _this_ run published anything.

`tag-release.yml` writes the GitHub release body separately; see `/release-notes` for the curated-notes override.

## Scope & guardrails

- **`gh` reads are free; triggering a release is not.** Reading runs, jobs, and logs (`gh run list/view/watch`) needs no confirmation. **Dispatching `create-release.yml`** is an outward-facing, effectively irreversible action — an npm version cannot be unpublished after 72 hours, and even within that window unpublishing breaks consumers. Confirm the bump type and the ref with the user, and default to watching a run they already started.
- **Never bump `package.json` by hand.** The workflow owns the bump; a hand-bump collides with it and can produce a version that's tagged but never published, or published twice.
- **Never push `main` or `release/*`.** Those are the user's. The pre-push hook blocks them.
- **The user owns the decision to publish a major.** A major reaches every consuming app and every external integrator. If the change set implies one, say so and stop — don't dispatch.

## 1. Find the run

```bash
gh run list --workflow=publish.yml --limit 5
gh run list --workflow=create-release.yml --limit 5
gh run view <run-id>
gh run watch <run-id>            # live, if it's in flight
```

## 2. Pinpoint the failure

```bash
gh run view <run-id> --log-failed
```

Classify by stage:

- **`create-release.yml` — branch already exists.** The workflow checks for `release/<version>` before creating it. A failure here usually means a previous run got partway, and the fix is to resolve the leftover branch, not to re-dispatch blindly.
- **`create-release.yml` — push to `main` rejected.** The version bump commits directly to a protected branch and needs `ACTIONS_TOKEN`; a permissions failure here looks like an auth error at the push step.
- **`publish.yml` — "already published".** Not a failure. The version exists on npm, so every subsequent step is skipped by condition. Read it as "nothing to do," and if you expected a publish, the version wasn't bumped.
- **`publish.yml` — install or build.** `npm install` then `prepare:publish` (which runs the `tsc` build). A build failure here is a real code problem that CI on `main` should have caught — check whether the release branch carries something `main` didn't.
- **`publish.yml` — regeneration.** Only runs when dispatched manually with `regenerate: true`, and it generates against the **production API** (`https://api.robosystems.ai`). A failure means the API was unreachable or its schema changed under you; a _success_ here is more dangerous, because it can publish types nobody reviewed. Prefer regenerating in a PR.
- **`publish.yml` — `npm publish`.** OIDC trusted publishing with provenance. Failures are usually the npm-side trust configuration or a version/name mismatch, not the code.

## 3. Verify it actually landed

A green workflow is not proof. Check npm directly:

```bash
npm view @robosystems/client version              # latest published
npm view @robosystems/client versions --json      # full history
npm view @robosystems/client dist-tags
```

Then confirm the published artifact is usable, since `files`/`exports` problems don't fail the publish:

```bash
npm pack @robosystems/client@<version> --dry-run  # what actually ships
```

If the version is a major, the consuming apps (`robosystems-app`, `roboledger-app`, `roboinvestor-app`) and `@robosystems/core` need coordinated adoption — say so rather than treating the publish as the end of the task. Note `@robosystems/core` declares a peer range on this package; a major that falls outside it produces `ERESOLVE` failures in every app until core widens the range.

## Output

A short status: which workflow, what failed and at which step, the root cause, the re-run link if any, and the verified published version from `npm view`. If nothing failed, say so — don't manufacture work.

$ARGUMENTS
