---
description: Review a pull request — gather metadata, diff, and existing feedback, then give a verdict.
argument-hint: '[pr-number-or-url]'
---

Review a pull request by gathering all PR metadata, diff, and review comments, then provide a comprehensive review summary.

## Instructions

### 1. Identify the PR

The user may provide a PR URL, number, or nothing:

- **URL provided** (e.g., `https://github.com/RoboFinSystems/robosystems-typescript-client/pull/42`): Extract the repo and PR number
- **Number provided** (e.g., `42`): Use the current repository
- **Nothing provided**: Detect from the current branch using `gh pr view --json number,url` — if no open PR exists for the current branch, ask the user which PR to review

### 2. Gather PR Data

Run these `gh` commands to collect all context:

```bash
# PR metadata + conversation comments in one call
gh pr view <NUMBER> --json number,url,title,body,author,state,isDraft,labels,comments,reviews,reviewDecision,latestReviews,reviewRequests,statusCheckRollup,mergeStateStatus,headRefName,headRefOid,baseRefName,additions,deletions,changedFiles,files,closingIssuesReferences,createdAt,updatedAt

# PR diff (the actual code changes)
gh pr diff <NUMBER>

# Inline review comments — no --json equivalent exists, so this call is still required
gh api repos/$(gh repo view --json nameWithOwner -q .nameWithOwner)/pulls/<NUMBER>/comments --paginate
```

**Field notes:**

- `reviews` not `reviewers` — `reviewers` is not a valid field and errors.
- `reviewDecision` is the single field that answers "has this been approved."
- `comments` covers the top-level conversation, so no separate `issues/<n>/comments` call is needed.
- `files` is essential here: a regeneration PR is mostly generated churn, and per-file add/delete counts are how you find the few hand-written files worth reading closely.
- Keep `--paginate` **bare**. Adding `-q`/`--jq` makes gh emit one JSON document _per page_ instead of a merged array, and `--slurp` can't be combined with `--jq`. Pipe to `jq` after the call, not through it.

### 3. Categorize Review Feedback

Organize all comments and checks into categories:

- **Human Reviews**: Comments from human reviewers (approve, request changes, general feedback)
- **AI Reviews**: Comments from Claude, Copilot, or other AI review bots
- **Code Quality**: Comments from linters, formatters, type checkers
- **Security**: Findings from security scanners (Dependabot, CodeQL)
- **CI/CD**: Build status, test results

**How feedback actually arrives in this repo** — don't read the categories too literally:

- Formal `reviews` and inline `pulls/<n>/comments` are typically **empty**, and `reviewDecision` is usually blank. That's the norm here, not a signal that review was skipped. Don't report "no review feedback" on the strength of an empty `reviews` array.
- **AI review is opt-in.** `claude.yml` only fires on an explicit `@claude` mention from an `OWNER`/`MEMBER`/`COLLABORATOR` — there is no automatic review on PR open. When it has run, the findings are a **bot comment in the conversation `comments`**, not a formal review.
- In `statusCheckRollup`, checks expose `.name` while legacy statuses expose `.context`, and a `conclusion` of `NEUTRAL` or `SKIPPED` is not a failure. Read the conclusion, don't pattern-match on non-`SUCCESS`.
- Note what CI does **not** cover: it cannot regenerate against a live API, so a stale SDK passes every check. Green CI means "this code is internally consistent," not "this matches the API."

### 4. Review the Diff

With the full PR diff in hand, perform your own review focusing on:

- **Compatibility first.** This is a published post-1.0 package with external integrators. Does the diff remove or rename an export, change a signature or return type, narrow an input type, or change runtime semantics? That's a **major** and needs coordination with the API and every consuming app — an uncoordinated break is a blocking issue, not a note. Additive fields and new endpoints are free. Check the emitted `.d.ts` surface, not just the source: a regeneration can narrow a type without a single hand-written line changing.
- **Generated vs. hand-written.** Is anything under `sdk/`, `clients/graphql/generated`, or `*.gen.*` edited by hand? That's always wrong — the next `npm run generate` erases it. The fix belongs in `scripts/fix-sdk-types.js`, in the generator config (`openapi-ts.config.js`, `codegen.ts`), or in the API's schema. Flag it as blocking.
- **Does the regeneration match a real API state?** A regeneration PR should say what API version or build it was generated against. Types that don't correspond to any deployed API are worse than stale ones.
- **Correctness**: does the code do what the PR description says?
- **Auth and secrets**: token handling, header construction, and anything that could log a credential. A `console.log` of a request object is a credential leak in a consumer's terminal.
- **Error handling**: are API errors mapped to something a consumer can branch on, or swallowed into a generic throw?
- **Exports**: is new surface actually exported from `index.ts`, and are types exported alongside their values? An unexported type is invisible to consumers regardless of how well it's written.
- **Packaging**: changes to `prepare.js`, `package.json` `files`/`exports`, or the build output affect what ships. A wrong `exports` map breaks consumers in ways no test here catches — cross-check against how the apps import.
- **Tests**: are changes covered? Read the test, don't trust that it's green — a test that asserts the buggy behavior passes just as happily as a correct one.
- **Disclosure hygiene** (this repo is public): does the PR _text_ over-disclose? A security-fix description should name the area hardened, never the mechanism. Note also that the vulnerable version stays installable on npm after the fix merges — flag whether a patch release is needed.
- **Missing changes**: a new endpoint without an export, a new option without a type, a behavior change without a README update.

### 5. Output Format

Provide a structured review:

```
## PR Summary
**Title**: ...
**Author**: ... | **Branch**: ... → ...
**Status**: ... | **Changes**: +X / -Y across Z files (generated: A / hand-written: B)

<Brief summary of what the PR does>

## Compatibility
<BREAKING / ADDITIVE / INTERNAL — and for breaking, exactly what a consumer must change>

## Existing Review Feedback

### Human Reviews
<Summarize human reviewer comments and their status>

### AI Reviews
<Summarize AI review comments — highlight unresolved items>

### Code Quality
<Summarize code quality bot findings>

### Security
<Summarize security scanner findings — flag anything critical>

### CI/CD Status
<Pass/fail status of all checks>

## My Review

### Issues (should fix before merge)
<Numbered list of problems found>

### Suggestions (non-blocking improvements)
<Numbered list of suggestions>

### Questions
<Anything unclear that needs clarification>

## Verdict
<APPROVE / REQUEST_CHANGES / NEEDS_DISCUSSION — with brief rationale>
```

### Notes

- For a large regeneration diff, use the `files` array to separate generated paths from hand-written ones and review the latter line by line; summarize the former by net effect on the public surface
- For security findings, always err on the side of flagging — false positives are better than missed vulnerabilities
- Cross-reference the PR description with the actual diff to catch scope creep or an unstated break
- If the PR references an issue (`closingIssuesReferences`), check that the issue requirements are met

$ARGUMENTS
