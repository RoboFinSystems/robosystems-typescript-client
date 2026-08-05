---
description: Create a GitHub issue from the repo's templates, with the right type and labels.
argument-hint: '[what the issue is about]'
---

Create a GitHub issue for the current repository based on the user's input.

## Instructions

1. **Check you're in the right repo first** - This is a **generated** SDK. Most of its surface is produced from the RoboSystems API's OpenAPI document and GraphQL schema, so a large share of apparent SDK bugs are really API bugs. Before filing here, work out which:
   - A wrong or missing **type, field, or endpoint** almost always originates in the API's OpenAPI schema — file it in `RoboFinSystems/robosystems`. Regenerating here would only reproduce the same output.
   - A bug in the **generation pipeline** — `scripts/fix-sdk-types.js` post-processing, `openapi-ts.config.js`, `codegen.ts`, `prepare.js` packaging — belongs here.
   - A bug in **hand-written surface** — the extensions, client construction, auth/token handling, error mapping, or the exports in `index.ts` — belongs here.
   - A bug in how a consuming app _uses_ the SDK belongs in that app's repo (`robosystems-app`, `roboledger-app`, `roboinvestor-app`, `robosystems-core`).

   When it's ambiguous, say which layer you think it is and why; a misfiled SDK issue costs a full round trip.

2. **Determine Issue Type** - Based on the user's description, pick one:
   - **Bug**: Defects or unexpected behavior
   - **Task**: Specific, bounded work items that can be completed in one PR
   - **Feature**: Request a new capability (no design required)
   - **RFC**: Propose a design for discussion before implementation
   - **Spec**: Approved implementation plan ready for execution

   Confirm what this repo actually offers before assuming — `ls .github/ISSUE_TEMPLATE/` for the templates and `gh issue create --help` for whether `--type` is supported.

3. **Gather Context** - If the user provides a file path or references existing code:
   - Read the relevant files to understand the current implementation
   - Check whether the file is generated (`sdk/`, `clients/graphql/generated`, `*.gen.ts`) before proposing a fix in it
   - Review any referenced documentation

4. **Draft the Issue** - Read the matching YAML template in `.github/ISSUE_TEMPLATE/` and mirror its structure. Each template declares its own `type:` in frontmatter and marks which fields are required — read the file rather than guessing the sections. Fill the optional fields too where you have the information; they're the ones that make an issue actionable later.

   Note `gh issue create --title/--body` **bypasses templates entirely** — nothing prefills and nothing validates. That's exactly why the body has to be hand-matched to the template structure.

   For an SDK bug, the reproduction needs three things a consumer report usually omits: the **installed version** (`npm ls @robosystems/client`), a **minimal call** showing the arguments passed, and the **actual vs expected** type or response. A type-level bug should include the `tsc` error verbatim.

5. **Say whether it's a compatibility break** - This package is **post-1.0 and published publicly**, and the apps plus external integrators consume it. If the issue implies changing an existing signature, return type, or export, say so explicitly — that turns the fix into a **major** and forces coordination with the API and every consumer. Issues that quietly imply a break are the expensive ones.

6. **Sanitize for Public Visibility** - This repo is public and the issue is world-readable immediately. Before creating:
   - Remove API keys and JWTs — SDK repro snippets carry credentials more often than any other kind of issue. Check pasted request/response dumps line by line.
   - Remove customer names, graph IDs, and real financial payloads; reconstruct with dummy values.
   - Remove internal pricing, margins, or cost details.
   - For anything security-adjacent, keep the text terse and non-actionable — no exploit mechanics, no endpoint enumerations, no payloads. For coordinated disclosure use a private GitHub Security Advisory, never a public issue.
   - Keep ordinary technical implementation details (these are fine to share)

7. **Create the Issue** - One command, with the type set inline:

   ```bash
   gh issue create \
     --type <Bug|Task|Feature|RFC|Spec> \
     --title "<clear, concise title>" \
     --body-file /tmp/issue-body.md \
     --label "<labels>"
   ```

   No prefixes like `[SPEC]` in the title — the type handles categorization. Write the body to a file rather than inlining it, to avoid shell-escaping problems.

   To change the type on an **existing** issue: `gh issue edit <n> --type <Type>` (or `--remove-type`).

## Labels

Issue types handle primary categorization; labels carry the metadata. Always enumerate what actually exists rather than working from memory — and raise the limit, since the default truncates at 30:

```bash
gh label list --limit 100
```

The families to expect in this repo:

- **`area:*`** — the primary routing dimension, and here it doubles as the generated-vs-handwritten signal: `generated` (regeneration output and the fix-up pipeline), `sdk` (the published client surface), `extensions`, `types`, `auth`, `errors`, `docs`, `testing`, `ci-cd`. **Always apply one.** `area:generated` in particular tells a reader not to hand-edit the file.
- **`priority:*`** — when to do it. Note the ladder is `critical` / `high` / `low` — there is **no `priority:medium`**.
- **`size:*`** — rough effort: `small` (< 1 day), `medium` (1–3 days), `large` (> 3 days).
- **Status** — `blocked`, `needs-review`.

## Questions vs issues

`.github/ISSUE_TEMPLATE/config.yml` disables blank issues and routes open-ended questions to the org's GitHub Discussions. `gh issue create` bypasses that chooser entirely, so apply the intent yourself: if the user's input is a question ("how do I authenticate?") rather than actionable work, say so and suggest a Discussion instead of filing it.

## Example Usage

User: "The graph query method returns `any` instead of the row type"

Response: Let me check whether that method is generated...

[Read the method — if it's under `sdk/`, the type comes from the API's OpenAPI schema, so the fix belongs in robosystems unless `fix-sdk-types.js` is dropping it]
[Read bug.yml and draft a body matching its structure, with version, minimal call, and the tsc error]
[Create with `gh issue create --type Bug --label area:generated,size:small`]

## Output Format

After creating the issue, provide:

1. The issue URL
2. Brief summary of what was created
3. Issue type and labels applied
4. Whether the fix implies a semver break, and any companion issue that should be filed against the API

$ARGUMENTS
