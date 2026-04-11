# Raw Imports Documentation Triage

Date: 2026-03-31
Owner: Codex
Scope: `/home/ricky/builds/documentation/raw-imports`
Purpose: classify imported historical notes so they stop looking like canonical documentation

## Classification Key

- `Keep local` = keep as a working source file for the rebuild
- `Promote selected rules to KB` = use as evidence/source material only; extract verified conclusions into KB
- `Archive after verification` = imported historical material that should not remain in the active doc surface once its useful conclusions are captured

## Core Rule

Every file in `raw-imports/` is imported material, not canonical truth.

Nothing in this folder should be promoted wholesale into KB.

## File Triage

| File | Classification | Reason | Action |
|------|----------------|--------|--------|
| `backmarket-trade-in-operations.md` | Promote selected rules to KB | useful domain synthesis, but explicitly compiled from Claude conversation history | mine verified BM workflow truths only |
| `finance-cashflow.md` | Archive after verification | highly time-sensitive financial snapshot | preserve as historical context only after useful conclusions are extracted |
| `hr-team.md` | Archive after verification | highly time-sensitive people/history material | use only as background evidence; do not treat as current truth |
| `intercom-finn.md` | Promote selected rules to KB | may contain durable CS/channel strategy, but still imported and dated | extract verified current strategy only |
| `inventory-parts.md` | Promote selected rules to KB | contains useful parts/inventory principles and supplier strategy | extract verified rules only |
| `monday-schema.md` | Promote selected rules to KB | useful schema lead, but already marked as needing verification | use as evidence source, not canonical doc |
| `n8n-automations.md` | Archive after verification | integration snapshot mixing live and planned workflows | preserve as evidence, not active source of truth |
| `shopify-website.md` | Archive after verification | project snapshot and launch blocker list, not canonical operations doc | preserve as historical website context |
| `sops-operational-procedures.md` | Promote selected rules to KB | strongest imported source for operations SOP material, but still partial and inherited | extract verified SOP content into KB operations only |
| `strategic-planning.md` | Promote selected rules to KB | contains strategic framework and planning language that may still matter | extract only durable governance/planning principles after operator confirmation |

## Highest-Value Source Files

These are the best raw-import candidates for selective KB extraction:

- `backmarket-trade-in-operations.md`
- `inventory-parts.md`
- `monday-schema.md`
- `sops-operational-procedures.md`
- `strategic-planning.md`

## Strong Archive Candidates

These should not remain active-facing docs after their useful conclusions are captured:

- `finance-cashflow.md`
- `hr-team.md`
- `n8n-automations.md`
- `shopify-website.md`

## QA Notes

- every file in this folder is explicitly imported from historical conversation material
- this folder should be treated as evidence storage, not an active knowledge base
- promotion from this folder must always be selective and re-verified
