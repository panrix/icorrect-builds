# Intake System Documentation Triage

Date: 2026-03-31
Scope: `/home/ricky/builds/intake-system`
Purpose: classify intake-system docs as local build docs, KB promotion candidates, or archive-later material

## Triage Rule

Use the rule from [builds-documentation-policy.md](/home/ricky/kb/system/builds-documentation-policy.md):

- keep repo-local implementation docs in `/builds/intake-system`
- promote durable operational knowledge into `/home/ricky/kb`
- archive historical or superseded material later, not during active build work

## Classification

### Keep Local To The Build

These should stay in `/home/ricky/builds/intake-system` because they are implementation-facing build docs:

- `SPEC.md`
- `DESIGN-SPEC.md`
- `FORM-FLOW.md`
- `integrations.md`
- `react-form/INTAKE-SPEC.md`
- `react-form/DESIGN-SPEC.md`
- `react-form/TASK.md`
- `reference/SOURCE-MAP.md`
- `reference/intake-audit-2026-02-18.md`

Reason:

- these are build specs, implementation docs, UI/flow design docs, or source-mapping material for the intake system project itself

### Keep Local For Now, Promote A Cleaned Canonical Version Later

These are valuable, but the canonical business/process truth should live in KB as cleaned summaries rather than direct copies:

- `flows/standard-repair-flow.md`
- `flows/diagnostic-intake-flow.md`
- `flows/bm-tradein-flow.md`
- `flows/client-ipad-flow.md`
- `device-flows/iphone-flows.md`
- `device-flows/ipad-flows.md`
- `device-flows/macbook-flows.md`
- `device-flows/apple-watch-flows.md`

Target KB destinations once verified:

- operational intake rules -> `/home/ricky/kb/operations/`
- future Back Market process docs -> `/home/ricky/kb/backmarket/` or equivalent domain home

Reason:

- these are still implementation-side flow documents
- the verified operational conclusions belong in KB, not the raw build flows themselves

### Promote Concepts, Not Raw Files

The following concepts should become canonical KB docs after verification:

- intake hard gates
- universal intake questions
- service-type branching rules
- passcode verification policy
- handoff package requirements
- intake role responsibilities

Current likely KB homes:

- `/home/ricky/kb/operations/intake-flow.md`
- future SOP index under `/home/ricky/kb/operations/`

### Archive Later

No immediate archive candidates were identified inside `/home/ricky/builds/intake-system`.

Reason:

- the project still appears active as a build/design workspace
- the problem is not obsolete files, it is boundary confusion between build docs and canonical ops docs

## Decision Summary

- `/builds/intake-system` stays the build home for intake implementation docs
- KB should hold the cleaned and verified operational version of intake truth
- do not move the raw flow/spec files into KB wholesale
- promote verified conclusions, not working design artifacts

## Follow-Up Actions

1. keep `SPEC.md` and `FORM-FLOW.md` as primary local evidence for intake verification
2. continue treating `/home/ricky/kb/operations/intake-flow.md` as the canonical intake summary doc
3. only upgrade the KB intake doc after operator confirmation of the real workshop process
