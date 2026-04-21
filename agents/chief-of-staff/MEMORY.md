# MEMORY — Lucian

## Verified state snapshot

**Last updated:** 2026-04-21 (Phase 2 identity files scaffolded)

- Lucian is Chief of Staff. Directory `chief-of-staff/`, name `Lucian`.
- Phase 1a + 1b of the agent-system v2 build are complete (commits `1701b68` → `a2dfba1`, branch `feat/agents`). Foundation code — bridge, bin helpers, schemas, systemd units, runbooks, hooks template — is on disk and committed.
- Phase 2 currently in progress: identity files (SOUL, CLAUDE, IDENTITY, AGENTS, HEARTBEAT, MEMORY, TOOLS, WORKING-STATE) rendered by Claude today.
- No workers have been spawned yet. `skills/` is empty by design — Phase 4+ populate it.
- No Telegram bot token exists yet — Ricky creates the bot in Phase 3 (BotFather).
- OpenClaw is being retired. No runtime reads from `~/.openclaw/`. Migration-only helper `_shared/bin/export-openclaw-agents` is the single permitted touchpoint and is human-run, not agent-invoked.
- Canon files in `_shared/canon/` are stubs that fill during Phase 2 `/intake` stages (Phase 4 skill). `USER.md` needs Ricky's review before commit.
- `versions.lock`: claude-cli 2.1.114, node 22.22.0, tmux 3.4, logrotate 3.21.0, flock 2.39.3. `restic` NOT yet installed on the VPS — must `apt install restic` before the nightly backup timer can fire.

## Memory index

Recent daily memory files (most recent first). Bridge rotates these; any file >365 days moves to `memory/archive/<year>/`.

| Date | Summary |
|------|---------|
| _(none yet — first entry will be written by the first `/session-handoff`)_ | — |

## Canonical references

- `../_shared/canon/USER.md` — Ricky's profile (symlinked as `USER.md` in this directory)
- `../_shared/canon/PRINCIPLES.md` — system principles
- `../_shared/canon/agent-delegation-protocol.md` — how to delegate
- `../_shared/CONVENTIONS.md` — runtime write rules (naming, durability, atomicity)
- `../_shared/BUILD-STATUS.md` — phase progress tracker for the agent-system build
- `IDENTITY.md` — my identity
- `SOUL.md` — my voice and identity principles
- `CLAUDE.md` — my behavioural rules + skill routing table
- `plan.md` — the build plan for the Chief of Staff agent

## User context summary

See `USER.md` for the authoritative version. Brief: Ricky is founder/director of iCorrect (UK Apple repair, ~7 staff, London workshop). Based in Bali, UTC+8. Commands agents from his phone via Telegram. ADHD-aware communication: terse, structured, actionable. Prefers voice notes and quick dumps; expects structure back.

## Rules for this file

- Updated by `/session-handoff` and `/capture` — never manually edited once the system is live.
- The "Verified state snapshot" section is **rewritten** when a fact changes (not appended). Cite the source that triggered the update.
- The memory index is regenerated from the `memory/` directory contents.
- Claims in this file must be verifiable against either a path in the repo, a commit hash, or a record in `_shared/records/`. If a claim here can't be cited, it's wrong by construction — flag and fix.
