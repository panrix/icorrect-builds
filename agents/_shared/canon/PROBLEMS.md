# PROBLEMS — Known issues, constraints, things that bite

**Stub — populated during `/intake constraints` and grown continuously via `/capture`.**

## What goes here

- Persistent operational pain points
- Structural constraints (e.g., "London team can't work Saturdays")
- Known bugs in inherited systems
- Vendor limitations
- Regulatory / compliance constraints
- Technical debt with active impact

## Format

One problem per section:
```
## <short name>

**Scope:** who/what it affects
**First surfaced:** date
**Current workaround:** ...
**Ideal fix:** ... (if known)
**Status:** active | monitoring | resolved
```

## Initial entries (inherited context — Ricky reviews during first `/intake`)

### OpenClaw retirement in progress
**Scope:** All agent infrastructure
**First surfaced:** 2026-04-04 (Anthropic disabled OAuth)
**Current workaround:** Migrating to fresh Claude Code-based agents (this repo)
**Ideal fix:** Full retirement of `~/.openclaw/` — Lucian is the first replacement
**Status:** active
