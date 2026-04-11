# Raw Imports Documentation Triage

Date: 2026-03-31
Scope: `/home/ricky/builds/documentation/raw-imports`
Purpose: classify raw-import documents as temporary evidence, concept-extraction sources, or archive-later material

## Core Rule

These files are imported conversation summaries.

They are not canonical documentation.

They are only useful as:

- discovery material
- evidence leads
- concept extraction sources

After useful concepts are extracted and verified, the raw imports should be archived rather than left looking authoritative.

## File-by-File Classification

### Keep As Temporary Evidence Sources During Rebuild

These should remain available during the current verification phase, but not be treated as canonical:

- `sops-operational-procedures.md`
- `monday-schema.md`
- `intercom-finn.md`
- `inventory-parts.md`
- `backmarket-trade-in-operations.md`

Reason:

- these files still contain source material actively feeding KB verification and `/builds` triage

Likely destinations for extracted verified concepts:

- operations -> `/home/ricky/kb/operations/`
- Monday -> `/home/ricky/kb/monday/`
- customer service/intercom -> future KB domain or repo-local Intercom docs
- parts/inventory -> future parts domain or `/home/ricky/kb/operations/`
- Back Market -> future `/home/ricky/kb/backmarket/`

### Extract Concepts, Then Archive

These should not become canonical by direct promotion. Extract the useful concepts first, then archive the raw import:

- `finance-cashflow.md`
- `hr-team.md`
- `shopify-website.md`
- `strategic-planning.md`
- `n8n-automations.md`

Reason:

- they contain mixed strategy/history/assumption material
- many claims are people-, timing-, or system-sensitive
- they need verification or operator confirmation before any KB promotion

Likely extracted destinations:

- finance concepts -> future finance KB or local finance automation docs
- team concepts -> `/home/ricky/kb/team/` after operator confirmation
- website concepts -> repo-local website docs and selected KB summaries if cross-domain
- strategy concepts -> `/home/ricky/kb/system/` only if still current and operator-approved
- automation concepts -> `/home/ricky/kb/system/` or `/home/ricky/kb/monday/` only after current runtime verification

## What Not To Do

- do not copy raw imports straight into KB
- do not leave raw imports as the only source of truth for active systems
- do not delete them yet while they are still feeding verification work

## Decision Summary

- raw imports remain temporary evidence during the rebuild
- verified conclusions go into KB
- repo-local build docs stay in their project homes
- raw imports should be archived once their useful concepts have been extracted and verified

## Follow-Up Actions

1. keep `sops-operational-procedures.md` and `monday-schema.md` available until the current ops/Monday verification wave is complete
2. use `hr-team.md` and `finance-cashflow.md` only as supporting context, not as current truth
3. once the KB and `/builds` triage pass is complete, move the whole `raw-imports` folder to an archive/reference location or clearly mark it historical
