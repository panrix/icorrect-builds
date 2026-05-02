# alex-triage-rebuild

**State:** active
**Owner:** alex-cs
**Purpose:** Node-based Intercom triage and drafting workflow for Alex. Pulls conversations, enriches them with Monday and repair-history context, drafts replies, and ships triage cards to Telegram. Canonical service code.
**Last updated:** 2026-05-02

## Current state

### In flight
- No live state captured at this layer — owner agent (alex-cs) tracks WIP via TODO.md (now in `scratch/`) and active changelog entries in `docs/`.

### Recently shipped
- Multiple changelogs from 2026-04-13: em-dash rule, Intercom send-route ban, new-activity flag (see `docs/`).
- Pricing-sync cron broken: missing `generate-pricing-kb.js` dependency — see `data/cron-pricing-sync.log`.

### Next up
- See `briefs/PHASE2-QUOTE-BUILDING-BRIEF.md` for the next phase plan.

## Structure

- `briefs/` — 4 build/codex/phase briefs covering quote-building, device-value, remediation
- `decisions/` — empty (backfill in Phase 7c if useful)
- `docs/` — 14 files: deployment runbook, card format, changelogs, spam audits + QA, cleanup proposals/summaries (has own INDEX)
- `archive/` — empty
- `scratch/` — `TODO.md` (working list of deferred fixes)
- `lib/` — service modules (db, intercom, monday, supabase, telegram, triage, draft, etc.)
- `scripts/` — runnable scripts (inbox-triage, monday-enrich, validators, cleanup, learning-run, pricing)
- `services/` — `telegram-bot.js`
- `deploy/` — nginx config, systemd unit (`alex-triage-rebuild.service`), cron file
- `data/` — runtime data: triage.db (sqlite), triage-YYYY-MM-DD.json snapshots, intercom logs, ferrari edits, cron logs
- `web/` — edit UI (edit.html / edit.js / edit.css)
- `sql/` — schema files
- `research/` — Intercom KB mapping research

## Key documents

### Briefs
- [`briefs/BUILD-BRIEF.md`](briefs/BUILD-BRIEF.md) — original build spec for the triage service
- [`briefs/PHASE2-QUOTE-BUILDING-BRIEF.md`](briefs/PHASE2-QUOTE-BUILDING-BRIEF.md) — Phase 2 quote-building plan
- [`briefs/CODEX-DEVICE-VALUE-BRIEF.md`](briefs/CODEX-DEVICE-VALUE-BRIEF.md) — Codex brief on device-value computation
- [`briefs/CODEX-REMEDIATION-BRIEF-2026-04-11.md`](briefs/CODEX-REMEDIATION-BRIEF-2026-04-11.md) — Codex remediation brief

### Docs (see [`docs/INDEX.md`](docs/INDEX.md) for full list)
- `docs/deployment.md` — deployment / restart / health
- `docs/card-format.md` — triage card format reference
- Changelog and spam-audit entries from 2026-04-11/13

### Scratch
- [`scratch/TODO.md`](scratch/TODO.md) — deferred fixes and work-in-progress notes

## Open questions

- Should the deferred TODOs in `scratch/TODO.md` be promoted into individual briefs or decision logs?
- `alex-triage-classifier-rebuild/` lives separately as a refactor brief — fold it in as a sibling brief here?
