# Build Status — agents/ (v2 agent system)

> Live tracker for the Chief of Staff / Lucian build. Updated after every Codex delivery + every Claude commit. Check this file, or `git log --oneline feat/agents`, or the branch on GitHub, to see where we are without scrollback-diving.

**Last updated:** 2026-04-21
**Branch:** `feat/agents`
**GitHub:** https://github.com/panrix/icorrect-builds/tree/feat/agents

## Legend

- ✅ done + committed
- 🔨 in-flight (Codex working or Claude reviewing)
- ⏳ pending
- ⚠️ blocked / has bug
- ❌ abandoned

## Phases

| # | Phase | Status | Commits |
|---|-------|--------|---------|
| 1a | Scaffold (dirs, canon, templates, README, gitignore, CONVENTIONS) | ✅ | `1701b68`, `de75fa7` |
| 1b | Foundation code (bridge, bin helpers, schemas, systemd, runbooks) | 🔨 | `<this-commit>` (schemas only so far) |
| 2 | Chief of Staff identity (SOUL, CLAUDE, MEMORY, etc.) | ⏳ | — |
| 3 | Chief of Staff bridge (BotFather, systemd, allow-list, kill-switch drill) | ⏳ | — |
| 4 | Core skills + chaos tamers (/intake, /order, /brief-me, /health, routing) | ⏳ | — |
| 5 | Delegation + workers + manual test loop | ⏳ | — |
| 6 | Project lifecycle skills | ⏳ | — |
| 7 | Monday board (mission control surface) | ⏳ | — |
| 8 | Operations agent (from proven template) | ⏳ | — |
| 9 | Meta + scale + DR rehearsal | ⏳ | — |

## Phase 1b detail

| Deliverable | Status | Notes |
|-------------|--------|-------|
| Monday queue schemas v1 (6 JSON Schema files) | ✅ | Committed; fields match plan; enum additions from round 5 included |
| `monday/queue-validator.js` | ⚠️ | Written but uses broken `require` path and no `package.json` — Codex fixing |
| `bridge/package.json` + `node_modules` | ⏳ | Codex to create with ajv + ajv-formats pinned |
| `bin/backoff.sh` | ⏳ | — |
| `bin/write-state` (2-phase commit w/ rollback) | ⏳ | — |
| `bin/log-tool-use` | ⏳ | — |
| `bin/verify-load-proof` (--dry-run + --live) | ⏳ | — |
| `bin/sweep-runtime` | ⏳ | — |
| `bin/install-agent` | ⏳ | — |
| `bin/bridge-unlock` (root-owned) | ⏳ | — |
| `bin/export-openclaw-agents` (migration-only) | ⏳ | — |
| `bin/delegate` | ⏳ | — |
| `bin/spawn-worker` | ⏳ | — |
| `bridge/bot.js` | ⏳ | The big piece — tick loop, idle detector, kill-switch, backoff, silent-mode |
| `bridge/systemd/claude-bridge@.service` | ⏳ | — |
| `bridge/systemd/claude-backup@.{service,timer}` | ⏳ | — |
| `hooks/settings.json.tmpl` | ⏳ | — |
| `logrotate/claude-agents.conf` | ⏳ | — |
| `versions.lock` | ⏳ | — |
| `bridge/envs/chief-of-staff.env.example` | ⏳ | — |
| `runbooks/disaster-recovery.md` | ⏳ | — |
| `runbooks/credential-rotation.md` | ⏳ | — |
| `runbooks/README.md` | ⏳ | — |

## Known bugs / flags

- **Validator require path broken** (`../bridge/node_modules/ajv/dist/2020`). Codex to fix by standard package require after creating `_shared/bridge/package.json`.
- **Plan's "Existing code to reuse" table has stale paths** — `customer-service/modules/enquiry/lib/` doesn't exist. Will audit and correct via a focused Codex call after Phase 1b lands.

## Process

- **Codex writes, Claude QAs via `git diff`, Claude commits.** Ricky flipped this pattern because Codex consistently catches bugs Claude ships.
- **Commit per logical chunk** — not one mega-commit per phase.
- **Push to GitHub** per commit for remote visibility.
