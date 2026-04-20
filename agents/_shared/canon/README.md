# `_shared/canon/` — Shared knowledge base for every agent

This is the fresh, git-tracked source of truth that every top-level agent references. It replaces `~/.openclaw/shared/` with zero runtime dependency on OpenClaw.

## Files

| File | What goes here |
|------|---------------|
| `USER.md` | Ricky's profile — role, timezone, communication style, preferences. Symlinked as `USER.md` in every agent directory. |
| `COMPANY.md` | iCorrect / Panrix business identity, mission, scale. |
| `GOALS.md` | Current strategic goals. Rerun quarterly via `/intake business`. |
| `PRINCIPLES.md` | Operating principles for the whole system. |
| `VISION.md` | Where we're going — multi-year vision. |
| `PROBLEMS.md` | Known issues, constraints, things that bite. |
| `TEAM.md` | Team roster, roles, who-does-what. |
| `agent-delegation-protocol.md` | How agents hand work to each other and to Codex. |

## How it's consumed

- `USER.md` is symlinked into every agent's workspace (auto-loaded at session start).
- The other canon files are **read on demand** via `/capture`, `/intake`, or when an agent needs a fact. They are NOT auto-loaded — the agent reads them when relevant to the current task.
- This keeps every agent's auto-loaded context lean while shared facts stay authoritative in one place.

## Growing the canon

- Files start as stubs (Phase 1a).
- Ricky seeds them during the first `/intake` ceremony.
- `/capture` can promote important captures here when Ricky confirms they're canonical.
- All canon files are git-tracked; every change is a commit with human review.

## Hard rule

**No runtime dependency on `~/.openclaw/`.** OpenClaw must be retirable without breaking this system. If a canon file references an OpenClaw path, that's a bug — file it as an incident.
