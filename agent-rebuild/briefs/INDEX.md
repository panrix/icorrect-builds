# briefs/ — Index

**Updated:** 2026-05-05
**Owner:** main (this folder)
**Purpose:** Proposals, specs, ideas at any maturity stage. The canonical idea-capture target for `agent-rebuild/`.

## Active phase specs

| File | Phase | Status |
|---|---|---|
| [`folder-standard.md`](folder-standard.md) | meta | approved 2026-05-02; live (this is the spec being demonstrated by the agent-rebuild structure) |
| [`PHASE-6.9-SPEC.md`](PHASE-6.9-SPEC.md) | 6.9 | a-d shipped 2026-05-01; 6.9e in Ricky's review |
| [`PHASE-6.9-HANDOFF-PROMPT.md`](PHASE-6.9-HANDOFF-PROMPT.md) | 6.9 | the prompt that fired the 6.9 work |
| [`PHASE-6.9-SCAN-BRIEFING.md`](PHASE-6.9-SCAN-BRIEFING.md) | 6.9 | the scan briefing the 9 batch BUILDERs followed |
| [`PHASE-6.95-SECURITY-FOLLOWUP-SPEC.md`](PHASE-6.95-SECURITY-FOLLOWUP-SPEC.md) | 6.95 | folded into Phase 7 (decision 2026-05-02) |
| [`PHASE-7b-DESTINATION-MAP.md`](PHASE-7b-DESTINATION-MAP.md) | 7b | proposed top-level VPS destination map and migration waves |
| [`PHASE-7b-BATCH-1-REPORT.md`](PHASE-7b-BATCH-1-REPORT.md) | 7b | low-risk fleet/archive physical move batch report |
| [`PHASE-2-MANIFEST-2026-04-29.md`](PHASE-2-MANIFEST-2026-04-29.md) | 2 | shipped 2026-04-29 (retirement manifest) |

## Phase 7 cleanup briefs

| File | Topic |
|---|---|
| [`NESTED-REPO-AUDIT-2026-05-04.md`](NESTED-REPO-AUDIT-2026-05-04.md) | Read-only audit of repo-owned candidates, remotes, dirty state, and decisions needed before Phase 7b moves |

## Research briefs (rebuild research, 2026-04)

These fed the agent rebuild. Most have been absorbed into the main plan or system-rethink.md.

| File | Topic |
|---|---|
| [`BRIEF-01-HUGO-SCRIPT-AUDIT.md`](BRIEF-01-HUGO-SCRIPT-AUDIT.md) | Hugo (BM) script audit — what's in tmp/, what's live, what's automated |
| [`BRIEF-02-SEARCH-NOT-LOAD.md`](BRIEF-02-SEARCH-NOT-LOAD.md) | "Search don't load" pattern — anti-hallucination across the fleet |
| [`BRIEF-03-JARVIS-CONTEXT-AUDIT.md`](BRIEF-03-JARVIS-CONTEXT-AUDIT.md) | Jarvis bootstrap context size + content audit |
| [`BRIEF-04-MARKETING-INTELLIGENCE.md`](BRIEF-04-MARKETING-INTELLIGENCE.md) | MI platform state — scrapers, dashboard, what's running |
| [`BRIEF-05-SYSTEM-AUDIT-DIGEST.md`](BRIEF-05-SYSTEM-AUDIT-DIGEST.md) | Digest of the March 2026 system audit pack |
| [`BRIEF-06-AUTOMATION-BLUEPRINT.md`](BRIEF-06-AUTOMATION-BLUEPRINT.md) | Source brief for `automation-blueprint.md` |
| [`BRIEF-VPS-AUDIT.md`](BRIEF-VPS-AUDIT.md) | VPS-level audit (services, crons, env). Was originally `vps-audit.md` at root, renamed during reorg. |

## Codex briefs (deeper investigations)

| File | Topic |
|---|---|
| [`CODEX-BRIEFS.md`](CODEX-BRIEFS.md) | Index/meta-doc for the Codex BUILDER briefs |
| [`BRIEF-C14-REPAIR-HISTORY-MINING.md`](BRIEF-C14-REPAIR-HISTORY-MINING.md) | Repair-history mining (data + script in [`c14/`](c14/)) |
| [`BRIEF-C15-MAIN-BOARD-CLEANUP-ANALYSIS.md`](BRIEF-C15-MAIN-BOARD-CLEANUP-ANALYSIS.md) | Monday main board cleanup analysis |
| [`BRIEF-C16-SOP-EDGE-CASES-AND-VERIFICATION.md`](BRIEF-C16-SOP-EDGE-CASES-AND-VERIFICATION.md) | SOP edge-case + verification analysis |

## Reference inside this folder

| File | Status |
|---|---|
| [`automation-blueprint.md`](automation-blueprint.md) | partially superseded by `~/builds/agent-rebuild/idea-inventory.md` (root) — but still actively used for sequencing/priority of the ~58 scripts/services/crons it enumerates |

## Subdirectories

- [`c14/`](c14/) — code + brief for the repair-history-mining task (C14)
