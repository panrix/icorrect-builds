# Build Status — agents/ (v2 agent system)

> Live tracker for the Chief of Staff / Lucian build. Updated after every Codex delivery + every Claude commit. Check this file, or `git log --oneline feat/agents`, or the branch on GitHub, to see where we are without scrollback-diving.

**Last updated:** 2026-04-21 (after commit `502ec44`)
**Branch:** `feat/agents`
**GitHub:** https://github.com/panrix/icorrect-builds/tree/feat/agents

## Legend

- ✅ done + committed
- 🟡 on disk, pending QA + commit
- 🔨 Codex actively writing
- ⏳ pending
- ⚠️ blocked / has bug
- 📝 stub by design (fills at Phase N — not a placeholder bug)
- ❌ abandoned

## Phases

| # | Phase | Status | Commits |
|---|-------|--------|---------|
| 1a | Scaffold (dirs, canon, templates, README, gitignore, CONVENTIONS) | ✅ | `1701b68`, `de75fa7` |
| 1b | Foundation code (bridge, bin helpers, schemas, systemd, runbooks) | 🔨 | `6b31fd8` schemas, `502ec44` validator + 10 bin helpers — batches 3–5 pending |
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
| Monday queue schemas v1 (6 JSON Schema files) | ✅ | `6b31fd8` — round-5 enum additions included |
| `monday/queue-validator.js` | ✅ | `502ec44` — patched to try standard resolution first, fallback to bridge-local; test passes all 3 cases |
| `monday/queue-validator.test.mjs` | ✅ | `502ec44` — known-good PASS, missing-field FAIL, extra-field FAIL |
| `bridge/package.json` + `package-lock.json` | ✅ | `502ec44` — ajv@^8.17.1 + ajv-formats@^3.0.1 pinned |
| `bridge/node_modules/` | ✅ | `502ec44` — installed (gitignored) |
| `bin/backoff.sh` (45 LOC) | ✅ | `502ec44` — POSIX sourceable exponential backoff |
| `bin/write-state` (148 LOC) | ✅ | `502ec44` — 2-phase commit with `.bak-<id>` rollback, per-target flock |
| `bin/log-tool-use` (80 LOC) | ✅ | `502ec44` — stateless PostToolUse hook handler |
| `bin/verify-load-proof` (318 LOC) | ✅ | `502ec44` — `--dry-run` + `--live` with `claude -p`, normalized compare |
| `bin/sweep-runtime` (205 LOC) | ✅ | `502ec44` — 7 responsibilities: stale-handoff, logrotate, queue integrity, disk-full, skill-invocations prune |
| `bin/install-agent` (48 LOC) | ✅ | `502ec44` — idempotent settings.json template renderer |
| `bin/bridge-unlock` (46 LOC, chmod 0700) | ✅ | `502ec44` — root-only LOCKED flag clearer |
| `bin/export-openclaw-agents` (61 LOC) | ✅ | `502ec44` — migration-only read-only sweep |
| `bin/delegate` (94 LOC) | ✅ | `502ec44` — tmux send-keys + pane-idle detect + capture |
| `bin/spawn-worker` (78 LOC) | ✅ | `502ec44` — tmux window + workers.json update |
| `bridge/bot.js` | ⏳ | The big piece — tick loop, idle detector, kill-switch, backoff, silent-mode. **Codex stalled mid-run; fresh call being spawned.** |
| `bridge/systemd/claude-bridge@.service` | ⏳ | — |
| `bridge/systemd/claude-backup@.{service,timer}` | ⏳ | — |
| `hooks/settings.json.tmpl` | ⏳ | — |
| `logrotate/claude-agents.conf` | ⏳ | — |
| `versions.lock` | ⏳ | — |
| `bridge/envs/chief-of-staff.env.example` | ⏳ | — |
| `runbooks/disaster-recovery.md` | ⏳ | — |
| `runbooks/credential-rotation.md` | ⏳ | — |
| `runbooks/README.md` | ⏳ | — |

## Stub-by-design (not a bug, intentional placeholder that fills later)

These are in the tree but deliberately empty / minimal — content fills at the phase listed:

| File | Stub status | Fills at |
|------|-------------|----------|
| `_shared/canon/USER.md` | 📝 5-line stub with facts only | Phase 2 `/intake you` with Ricky |
| `_shared/canon/COMPANY.md` | 📝 stub pointer | Phase 2 `/intake business` |
| `_shared/canon/GOALS.md` | 📝 stub pointer | Phase 2 `/intake business` |
| `_shared/canon/PRINCIPLES.md` | 📝 partial (system principles filled, business stub) | Grows via `/capture` over time |
| `_shared/canon/VISION.md` | 📝 stub pointer | Phase 2 `/intake business` |
| `_shared/canon/PROBLEMS.md` | 📝 one initial entry (OpenClaw retirement) | Grows via `/capture` over time |
| `_shared/canon/TEAM.md` | 📝 stub + initial London names | Phase 2 `/intake people` |
| `_shared/canon/agent-delegation-protocol.md` | 📝 stub with correct schema refs | Phase 1b batch 3+ (once bot.js references settle) |
| `_shared/templates/*/*.tmpl` | 📝 templates with `{{AGENT_NAME}}` tokens | Rendered per agent by `install-agent` (Phase 2 for Lucian) |

## Known bugs / flags

- **Codex Phase 1b batch 3-5 stalled** — first Codex call stopped after batch 2 (~1 hour ago). Fresh call being spawned.
- **Branch auto-switches to `feat/enquiry-rich-card`** — unclear cause. Manual `git checkout feat/agents` fixes it each time; investigating separately.
- **Plan's "Existing code to reuse" table has stale paths** — `customer-service/modules/enquiry/lib/` doesn't exist. Will audit via focused Codex call after Phase 1b lands.

## Process

- **Codex writes, Claude QAs via `git diff`, Claude commits.** Ricky flipped this pattern because Codex consistently catches bugs Claude ships.
- **Commit per logical chunk** — not one mega-commit per phase.
- **Push to GitHub** per commit for remote visibility.
