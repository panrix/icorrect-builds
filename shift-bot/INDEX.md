# shift-bot

**State:** active
**Owner:** team
**Purpose:** Slack Socket Mode bot that collects technician shifts via a `/shift` modal, syncs them to a shared Google Calendar, and posts the week's rota to Slack. Pure script-and-cron — no LLM in the loop.
**Last updated:** 2026-05-02 08:30 UTC

## Current state

### In flight
- Live behind `shift-bot.service` systemd user unit (WorkingDirectory `/home/ricky/builds/shift-bot`, ExecStart `/usr/bin/node /home/ricky/builds/shift-bot/index.js`). Last touched 2026-04-29.

### Recently shipped
- 2026-04-29 — initial bot deploy (modal flow + DB + Calendar sync + Monday-morning post).

### Next up
- Captured ideas in `idea-inventory.md` (P3): `/shift cancel` admin command, `/shift status` self-check, Slack home-tab rota view. All currently in `docs/COMPROMISES.md`.

## Structure

- `briefs/` — `spec.md` (the original build spec).
- `decisions/` — empty.
- `docs/` — `DEPLOY.md` (deploy/restart/health runbook) + `COMPROMISES.md` (build trade-offs and deferred features).
- `archive/` — empty.
- `scratch/` — empty.
- `lib/`, `scripts/`, `slack/`, `calendar/`, `summary/`, `db/`, `systemd/` — existing code/data dirs, untouched per Phase 7a top-level-only rule.
- `node_modules/` — excluded from classification; lives at root for the runtime.

Root-level operational files retained per folder-standard rules: `README.md`, `package.json`, `package-lock.json`, `index.js`, `config.json`, `slack-manifest.yaml`, `.gitignore`.

## Key documents

- [`README.md`](README.md) — short entry point for operators
- [`briefs/spec.md`](briefs/spec.md) — full build spec (problem, scope, phases)
- [`docs/DEPLOY.md`](docs/DEPLOY.md) — deploy/restart/health runbook
- [`docs/COMPROMISES.md`](docs/COMPROMISES.md) — what was simplified vs the original spec; source for deferred-feature ideas in `idea-inventory.md`

## Open questions

- The 3 captured P3 ideas (`/shift cancel`, `/shift status`, home-tab) — escalate or leave parked?
