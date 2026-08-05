## Summary

<!-- What this PR does and why. Ground it in the actual change, not the diff mechanics. -->

## Changes

<!-- The substantive changes, grouped by area: regenerated SDK vs. hand-written extensions vs.
     tooling/packaging. Summarize generated churn by its net effect on the public surface rather
     than enumerating it — and never describe generated output as authored work. -->

-

## Compatibility

<!-- Required judgment, not an optional section. This package is post-1.0 with external integrators.
     - BREAKING: a removed or renamed export, a changed signature or return type, a narrowed input
       type, changed runtime semantics. Forces a major; must be coordinated with the API and every
       consuming app. Say what a consumer has to change.
     - ADDITIVE: new endpoints, new optional fields, new exports.
     - INTERNAL: generation tooling, tests, packaging that does not alter emitted types.
     A regeneration is NOT automatically additive — an API schema change can narrow a type with no
     hand-written line involved. Diff the emitted types before classifying. -->

ADDITIVE

## Testing

<!-- How the change was verified. Run `npm run test:all` (validate -> test -> build) before opening.
     Regeneration needs a reachable API (ROBOSYSTEMS_API_URL) and often is not runnable in-session —
     say so plainly if you could not. "Not run" is a valid answer; a claimed pass that did not
     happen is not. -->
