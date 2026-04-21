# Build Status — agents/ (v2 agent system)

> Live tracker for the Chief of Staff / Lucian build. Updated after every Codex delivery + every Claude commit. Check this file, or `git log --oneline feat/agents`, or the branch on GitHub, to see where we are without scrollback-diving.

**Last updated:** 2026-04-21 (Phase 1b complete at commit `a2dfba1`)
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
| 1b | Foundation code (bridge, bin helpers, schemas, systemd, runbooks) | ✅ | `6b31fd8`, `502ec44`, `c04be02`, `f515ca2` (cleanup), `f22f7e5`, `9c7efd9`, `a2dfba1` |
| 2 | Chief of Staff identity (SOUL, CLAUDE, MEMORY, etc.) | ⏳ | — |
| 3 | Chief of Staff bridge (BotFather, systemd, allow-list, kill-switch drill) | ⏳ **Needs Ricky**: bot token, .env values | — |
| 4 | Core skills + chaos tamers (/intake, /order, /brief-me, /health, routing) | ⏳ | — |
| 5 | Delegation + workers + manual test loop | ⏳ | — |
| 6 | Project lifecycle skills | ⏳ | — |
| 7 | Monday board (mission control surface) | ⏳ | — |
| 8 | Operations agent (from proven template) | ⏳ | — |
| 9 | Meta + scale + DR rehearsal | ⏳ | — |

## Phase 1b detail (ALL DONE)

| Deliverable | Status | Commit |
|-------------|--------|--------|
| Monday queue schemas v1 (6 JSON Schema files) | ✅ | `6b31fd8` |
| `monday/queue-validator.js` + test | ✅ | `502ec44` |
| `bridge/package.json` + `node_modules/` (ajv + ajv-formats) | ✅ | `502ec44` |
| 10 bin helpers (backoff.sh, write-state, log-tool-use, verify-load-proof, sweep-runtime, install-agent, bridge-unlock, export-openclaw-agents, delegate, spawn-worker) — 1,123 LOC | ✅ | `502ec44` |
| `bridge/bot.js` — 1,432 LOC (tick loop, idle detector, kill-switch, misfire detector, silent-mode) | ✅ | `f22f7e5` |
| systemd: `claude-bridge@.service`, `claude-backup@.{service,timer}` | ✅ | `f22f7e5` |
| `hooks/settings.json.tmpl` | ✅ | `9c7efd9` |
| `logrotate/claude-agents.conf` | ✅ | `9c7efd9` |
| `versions.lock` | ✅ | `9c7efd9` |
| `bridge/envs/chief-of-staff.env.example` | ✅ | `9c7efd9` |
| `runbooks/README.md`, `disaster-recovery.md`, `credential-rotation.md` | ✅ | `a2dfba1` |
| `agents/_archive/legacy-feb-2026/` — pre-v2 planning docs archived | ✅ | `f515ca2` |

**Total Phase 1b code:** ~2,900 LOC (validator + bin + bot.js) + 11 JSON/conf/yaml/md files + 3 runbooks.

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
| `_shared/canon/agent-delegation-protocol.md` | 📝 stub with correct schema refs | Phase 1b (already committed — refs live schemas) |
| `_shared/templates/*/*.tmpl` | 📝 templates with `{{AGENT_NAME}}` tokens | Rendered per agent by `install-agent` (Phase 2 for Lucian) |

## Codex-flagged assumptions to verify at Phase 3 live-test

- `KILL_HMAC` env format — raw secret vs `hmac-sha256:<secret>:<expected_hex>`. Needs live test with real env value.
- Monday kill-switch column — matched by `/kill[-_]?switch/i` regex. Verify against real board schema when Phase 7 board is created.
- tmux reply-capture diff heuristic — not live-tested against a real Claude pane.

These aren't blockers for committing Phase 1b; they're notes for Phase 3 verification.

## Next up: Phase 2 (Claude work, ~30-60 min)

Render Lucian's identity files via `install-agent chief-of-staff`:
- `SOUL.md` — Lucian's voice (ruthless organiser, one step ahead)
- `CLAUDE.md` — routing table + behavioural rules
- `IDENTITY.md`, `AGENTS.md`, `MEMORY.md`, `TOOLS.md`, `HEARTBEAT.md`, `WORKING-STATE.md`
- `USER.md` symlink → `../_shared/canon/USER.md`
- `.claude/settings.json` via `install-agent`

Then Phase 3 needs Ricky: BotFather token, `.env` values, systemd enable + 3-path kill-switch drill.

## Process

- **Codex writes, Claude QAs via `git diff`, Claude commits.** Ricky flipped this pattern because Codex consistently catches bugs Claude ships.
- **Commit per logical chunk** — not one mega-commit per phase.
- **Push to GitHub** per commit for remote visibility.
