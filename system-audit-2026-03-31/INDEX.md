# system-audit-2026-03-31

**State:** dormant (frozen audit pack — last activity 2026-04-06)
**Owner:** operations
**Purpose:** Frozen, evidence-backed audit pack covering operations, finance, marketing, parts, customer service, systems, team, and cross-domain — produced late March / early April 2026 by Jarvis + Codex research agents. Heavily referenced by `~/kb/` (finance, parts, marketing, customer-service KB pages cite this pack as source).
**Last updated:** 2026-05-02 08:30 UTC

## Current state

Dormant by design — this is a point-in-time audit, not a living project. Findings still drive active work (payment-truth rebuild, BM SOPs, parts cost analysis) but the pack itself is frozen.

**Phase 7c review candidate:** keep as historical evidence (current state); promote individual findings into KB pages as they're verified; do not edit the audit content itself.

Per `~/kb/SCHEMA.md` line 17: KB lists `research/` here as a canonical source path. Many `~/kb/{finance,parts,marketing,customer-service}/*.md` pages cite specific files under `research/<domain>/`. **Phase 7a left `research/` untouched** to avoid breaking those references.

## Structure

- `briefs/` — 17 `BRIEF-*.md` Codex task briefs (the work that produced the audit). Has its own INDEX.
- `decisions/` — empty.
- `docs/audits/` — 9 finalized audit / analysis outputs moved from root (gsc, parts-cost, product-cards, repair-profitability v1+v2, shopify-health, xero-revenue, diagnostics-deep-dive). Has its own INDEX.
- `archive/` — empty.
- `scratch/` — empty.
- `research/` — 8 domain subfolders (cross-domain, customer-service, finance, marketing, operations, parts, systems, team). **Heavy KB inbound refs — do not move.**
- `scripts/` — 14 Python scripts (near-production, need testing per inventory ideas).
- `client_journeys/`, `examples/`, `outputs/`, `platform_inventory/` — existing audit subdirs, untouched.

Root file retained: `README.md` (the human entry point describing the audit pack — references the digest at `agent-rebuild/system-audit-digest.md`).

## Key documents

- [`README.md`](README.md) — pack entry point, digest pointer, per-domain index
- [`briefs/INDEX.md`](briefs/INDEX.md) — 17 Codex briefs that drove the audit
- [`docs/audits/INDEX.md`](docs/audits/INDEX.md) — 9 finalized audit outputs (the headline reports)
- `research/<domain>/` — primary evidence files; cited by `~/kb/`
- `scripts/` — Python audit scripts; some flagged in `idea-inventory.md` (P2) for verification testing before treating as production-ready

## Open questions

- Promote the 14 `scripts/` to production (after verification) per `idea-inventory.md` `d0114f4b`?
- `research/` paths are deep-referenced by `~/kb/`; if Phase 7c wants to migrate this whole folder somewhere, it must update all KB front-matter `source:` lists.
