# v3 Agent Templates

**Created:** 2026-02-26
**Purpose:** Copy these files when setting up a new v3 agent workspace.
**Source spec:** /home/ricky/builds/agent-rebuild/reference/04-agent-architecture-spec.md

## Files in This Directory

| Template | Purpose | Copy To |
|----------|---------|---------|
| SOUL.md | Agent identity (max 40 lines) | workspace/SOUL.md |
| CLAUDE.md | Operating rules (max 80 lines) | workspace/CLAUDE.md |
| USER.md | Who Ricky is | workspace/USER.md |
| SOP-template.md | Individual SOP format | workspace/sops/SOP-{name}.md |
| sops-index.md | SOP index with triggers | workspace/sops/index.md |
| data-feed-template.md | Cron-generated data feed format | workspace/data/{feed}.md |
| decision-log-template.md | Structured decision log | workspace/decisions/{topic}.md |
| memory-conventions.md | Naming rules for memory/ | Reference only (not copied) |

## New Agent Setup Checklist

1. Create workspace directory: `~/.openclaw/agents/{agent-id}/workspace/`
2. Copy templates: SOUL.md, CLAUDE.md, USER.md
3. Create subdirectories: `sops/`, `data/`, `decisions/`, `memory/`
4. Symlink foundation: `ln -s ~/.openclaw/shared foundation`
5. Fill in SOUL.md placeholders (identity, domain, boundaries, personality)
6. Fill in CLAUDE.md placeholders (domain, data sources, tools, siblings, heartbeat)
7. Copy SOP-template.md for each verified SOP → sops/SOP-{name}.md
8. Create sops/index.md from sops-index.md template
9. Set permissions:
   - `chmod 444 SOUL.md CLAUDE.md USER.md` (root files read-only)
   - `chmod 755 sops/ data/ decisions/` (directories traversable)
   - `chmod 444 sops/*.md` (SOPs read-only after writing)
   - `chmod 755 memory/` (agent writable)
10. Add agent to openclaw.json
11. Restart gateway: `systemctl --user restart openclaw-gateway`
12. Test with a message in the Telegram group

## Line Limits
- SOUL.md: max 40 lines
- CLAUDE.md: max 80 lines
- Individual SOPs: no hard limit, but aim for < 60 lines
- Data feeds: whatever the cron produces
