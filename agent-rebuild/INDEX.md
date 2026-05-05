# agent-rebuild

**State:** active
**Owner:** main (fleet-meta — Jarvis maintains; all C-suite agents read)
**Purpose:** Central workspace for the OpenClaw agent rebuild program. Phase specs, inventories, audits, and the canonical record of what's been decided and why during the rebuild.
**Last updated:** 2026-05-02 07:30 UTC (post-QA fixes)

## Current state

### In flight
- **Phase 6.9e** — Ricky's manual review of `folder-inventory.md` + `idea-inventory.md` + `ownership-orphans-and-conflicts.md`. Active review surface, all at root level until 6.9e signoff. Then they relocate to `docs/inventories/`.
- **Folder standard rollout** — `briefs/folder-standard.md` approved 2026-05-02 with revisions. `agent-rebuild/` itself is the proof-of-concept (this reorganization). Phase 7 propagates to remaining 49 `~/builds/` folders.

### Blocked
- None.

### Recently shipped (last 7 days)
- **Phase 6.9a-d** (2026-05-01) — full folder + idea inventory of 50 `~/builds/` folders + agent docs/memory + KB. Outputs in `docs/inventories/` + 5 inventory files at root for review.
- **Anti-fabrication protocol** (2026-04-30 → 2026-05-01) — SOUL "cite or decline" + AGENTS §7.5 cross-domain redirect + §7.6 data-from-actual-data. Empirically validated across all 5 C-suite agents.
- **FerrariBot split** (2026-04-30) — Phase 6.8 created the ferrari sub-agent with `accountId: "ferrari"` binding. Migration of INV-3700 corporate-invoice batch from main's workspace.
- **Phase 6.7** (2026-04-29) — Elek/diagnostics promoted to C-suite (5th).
- **Phase 6** (2026-04-29) — USER-CORE + per-agent USER-APPENDIX rolled out to main, marketing, team, operations, diagnostics.

### Next up
- **Phase 7b destination map** — proposed map drafted at [`briefs/PHASE-7b-DESTINATION-MAP.md`](briefs/PHASE-7b-DESTINATION-MAP.md). Physical moves wait for GitHub pointer PRs #7-#10 and active-lane quiet windows.
- **Phase 6.9e signoff** (Ricky's hands)
- **Phase 7** — workspace hygiene (folder-standard rollout to remaining 49 `~/builds/` folders) + secrets rotation (folded in from 6.95) + PII log redaction (folded in from 6.95)
- **Phase 8 follow-ups** — cross-fleet topic map for sharper redirects; build Meta-spend cron so Main has a citable source

## Structure

- [`briefs/`](briefs/INDEX.md) — proposals and specs in flight or recently shipped (20 entries). **Idea-capture target.** Has its own INDEX.
- `decisions/` — append-only decision log. Empty for now; major prior decisions (rebind, FerrariBot split, anti-fab protocol) to be backfilled in Phase 7 or left in `archive/`.
- [`docs/`](docs/) — canonical reference: 4 root files + [`audits/`](docs/audits/INDEX.md) (23 historical analysis reports, has own INDEX) + [`inventories/`](docs/inventories/INDEX.md) (6.9 outputs, has own INDEX).
- `archive/` — closed work from prior cleanup passes. New 2026-05-02 subfolder: `2026-05-02-superseded-plans/` (restored `PLAN-CORE-FILES-AND-RETIREMENT.md` from git HEAD; v1 of the rebuild plan, superseded by `~/claude-audit-rebuild/PLAN.md` + `EXECUTION-PLAN.md`).
- `data/` — runtime data.
- `fixtures/` — Phase 0 test fixtures (capture-to-ship, hygiene, dispatch).
- `technical/` — pre-existing structured subfolder (Apr 1 cleanup pass); has its own README + control/evidence/triage subdirs. Left as-is.

## Key documents

### Standards + active phase work
- [`briefs/folder-standard.md`](briefs/folder-standard.md) — the standard this folder demonstrates
- [`briefs/PHASE-6.9-SPEC.md`](briefs/PHASE-6.9-SPEC.md) — Phase 6.9 inventory spec (sub-phases a-f, scan template, hard rules)
- [`briefs/PHASE-6.9-HANDOFF-PROMPT.md`](briefs/PHASE-6.9-HANDOFF-PROMPT.md) — handoff prompt that fired the 6.9 work
- [`briefs/PHASE-6.95-SECURITY-FOLLOWUP-SPEC.md`](briefs/PHASE-6.95-SECURITY-FOLLOWUP-SPEC.md) — security follow-up (folded into Phase 7)

### 6.9e active review surface (kept at root)
- [`folder-inventory.md`](folder-inventory.md) — 50 folders mapped
- [`idea-inventory.md`](idea-inventory.md) — 277 deduped ideas
- [`ownership-orphans-and-conflicts.md`](ownership-orphans-and-conflicts.md) — 6 conflicts need Ricky's call
- [`QA-6.9-report.md`](QA-6.9-report.md) — 107 P1s patched (Phase 6.9 QA, distinct from the folder-standard rollout QA below)
- [`RICKY-OVERRIDES-6.9.md`](RICKY-OVERRIDES-6.9.md) — Ricky's tag corrections
- [`QA-folder-standard-rollout.md`](QA-folder-standard-rollout.md) — 2026-05-02 independent QA on this reorganization. 4 FAILs found, all patched in same session. Worth scanning for context.

### Canonical reference
- [`docs/system-rethink.md`](docs/system-rethink.md) — master rebuild doc (also referenced from `~/CLAUDE.md`)
- [`docs/RECOVERY-RUNBOOK.md`](docs/RECOVERY-RUNBOOK.md) — restore procedures for openclaw / cron / agents
- [`docs/MUTAGEN-VPS-CORE-RUNBOOK.md`](docs/MUTAGEN-VPS-CORE-RUNBOOK.md) — safe Mac/VPS core-file mirror rules and health checks
- [`docs/telegram-channels.md`](docs/telegram-channels.md) — canonical Telegram supergroup + topic IDs
- [`docs/audits/`](docs/audits/) — 23 point-in-time analysis reports (audits, gap analyses, deep dives)
- [`docs/inventories/scans/`](docs/inventories/scans/) — 6.9 raw scan output
- [`docs/inventories/ownership-manifests/`](docs/inventories/ownership-manifests/) — per-agent ownership manifests

### Earlier briefs
- [`briefs/automation-blueprint.md`](briefs/automation-blueprint.md) — fleet-wide automation target (~58 scripts/services/crons; partially superseded by `idea-inventory.md` but still referenced for sequencing)
- [`briefs/CODEX-BRIEFS.md`](briefs/CODEX-BRIEFS.md) — index of Codex BUILDER briefs
- `briefs/BRIEF-01` through `briefs/BRIEF-06` + `briefs/BRIEF-C14/C15/C16` + `briefs/BRIEF-VPS-AUDIT.md` — research briefs that fed the rebuild (BRIEF-VPS-AUDIT.md was originally `vps-audit.md` at root, renamed before this reorg)
- [`briefs/PHASE-2-MANIFEST-2026-04-29.md`](briefs/PHASE-2-MANIFEST-2026-04-29.md) — Phase 2 retirement manifest
- [`briefs/c14/`](briefs/c14/) — code + brief for repair-history-mining (C14)

## Hard rules followed by this folder

- `INDEX.md` is the entry point. Every canonical file links from here.
- Nothing canonical at root except `INDEX.md`, `README.md`, and the 5 active 6.9e review files (which are temporarily-canonical until 6.9e signoff).
- New ideas → `briefs/`. Not memory, not root, not scratch.
- Decisions → `decisions/` going forward. Backfill of historical decisions deferred to Phase 7.
- Closed work → `archive/` with date + reason. Never deleted.

## Open questions

- **`decisions/` backfill scope** — backfill the major decisions retroactively (rebind main, FerrariBot split, anti-fab protocol, etc.), or leave history in `archive/` and start `decisions/` clean from Phase 7 onwards? Lean: leave history, start clean.
- **`technical/` integration** — keep as standalone or fold into `docs/technical/`? Has its own internal structure, low priority to disturb.
- **Cross-fleet topic map** — after 6.9e signoff, build the agent-to-agent topic-ID reference so cross-domain redirects can include thread IDs (sharper handoffs). Captured in `idea-inventory.md`.
