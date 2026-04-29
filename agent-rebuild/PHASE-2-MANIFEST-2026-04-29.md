# Phase 2 Manifest — 2026-04-29

## File Actions

| File | Group | Action | Brief reason |
|---|---|---|---|
| `~/.openclaw/shared/TEAM.md` | 2.2 | REWRITTEN | Replaced old team-reference stub with post-rebuild 9-agent roster and build-layer note. |
| `~/.openclaw/shared/COMPANY.md` | 2.3a | REVIEWED-NO-EDIT | No retired-agent identity references in scope. |
| `~/.openclaw/shared/CREDENTIALS.md` | 2.3a | EDITED | Removed retired agent rows from the per-agent credential matrix. |
| `~/.openclaw/shared/GOALS.md` | 2.3a | NO-EDIT-FALSE-POSITIVE | `pm` hit came from `shipment`/time text, not retired agent identity. |
| `~/.openclaw/shared/LEARNINGS.md` | 2.3a | EDITED | Repointed `systems` ownership notes to `operations`. |
| `~/.openclaw/shared/PRINCIPLES.md` | 2.3a | REVIEWED-NO-EDIT | No retired-agent identity references in scope. |
| `~/.openclaw/shared/PROBLEMS.md` | 2.3a | NO-EDIT-FALSE-POSITIVE | Hits were common-word `default`/`pm` substrings, not retired agents. |
| `~/.openclaw/shared/RICKY.md` | 2.3a | NO-EDIT-FALSE-POSITIVE | Hits were timestamp/common-noun uses, not retired agents. |
| `~/.openclaw/shared/SUPABASE.md` | 2.3a | EDITED | Replaced obsolete retired-`pm` lifecycle note with active-roster guidance. |
| `~/.openclaw/shared/VISION.md` | 2.3a | NO-EDIT-FALSE-POSITIVE | `systems` appears as a common noun, not retired agent identity. |
| `~/.openclaw/scripts/chrome-reaper.sh` | 2.3b | REVIEWED-NO-EDIT | No retired-agent references. |
| `~/.openclaw/scripts/health-check.sh` | 2.3b | REVIEWED-NO-EDIT | No retired-agent references. |
| `~/.openclaw/scripts/mc-task.sh` | 2.3b | NO-EDIT-FALSE-POSITIVE | `default` appears in help text/default values, not retired agent identity. |
| `~/.openclaw/scripts/sync-token.sh` | 2.3b | NO-EDIT-FALSE-POSITIVE | `anthropic:default` is JSON key syntax/fallback logic. |
| `~/.openclaw/agents/main/workspace/SOUL.md` | 2.4 | REVIEWED-NO-EDIT | No retired-agent identity references in scope. |
| `~/.openclaw/agents/main/workspace/AGENTS.md` | 2.4 | EDITED | Replaced retired builder/roster references with active roster and ACP build-layer routing. |
| `~/.openclaw/agents/main/workspace/CLAUDE.md` | 2.4 | EDITED | Rewrote active roster section to the 9-agent state and removed retired build-agent references. |
| `~/.openclaw/agents/main/workspace/IDENTITY.md` | 2.4 | REVIEWED-NO-EDIT | No retired-agent identity references in scope. |
| `~/.openclaw/agents/main/workspace/USER.md` | 2.4 | REVIEWED-NO-EDIT | No retired-agent identity references in scope. |
| `~/.openclaw/agents/operations/workspace/SOUL.md` | 2.4 | NO-EDIT-FALSE-POSITIVE | `systems-minded` is common language, not retired agent identity. |
| `~/.openclaw/agents/operations/workspace/AGENTS.md` | 2.4 | EDITED | Removed retired `customer-service`/`systems` ownership assumptions. |
| `~/.openclaw/agents/operations/workspace/CLAUDE.md` | 2.4 | EDITED | Replaced retired adjacent-agent roster entries with live peers. |
| `~/.openclaw/agents/operations/workspace/IDENTITY.md` | 2.4 | REVIEWED-NO-EDIT | No retired-agent identity references in scope. |
| `~/.openclaw/agents/operations/workspace/USER.md` | 2.4 | REVIEWED-NO-EDIT | No retired-agent identity references in scope. |
| `~/.openclaw/agents/marketing/workspace/SOUL.md` | 2.4 | EDITED | Removed retired `website` agent handoff and routed implementation through the live build path. |
| `~/.openclaw/agents/marketing/workspace/AGENTS.md` | 2.4 | EDITED | Replaced retired `website` escalation with `main` plus `arlo-website` context. |
| `~/.openclaw/agents/marketing/workspace/CLAUDE.md` | 2.4 | EDITED | Replaced retired `website` agent references with live successors. |
| `~/.openclaw/agents/marketing/workspace/IDENTITY.md` | 2.4 | REVIEWED-NO-EDIT | No retired-agent identity references in scope. |
| `~/.openclaw/agents/marketing/workspace/USER.md` | 2.4 | REVIEWED-NO-EDIT | No retired-agent identity references in scope. |
| `~/.openclaw/agents/team/workspace/SOUL.md` | 2.4 | NO-EDIT-FALSE-POSITIVE | `website` is a common-noun role description, not retired agent identity. |
| `~/.openclaw/agents/team/workspace/AGENTS.md` | 2.4 | REVIEWED-NO-EDIT | No retired-agent identity references in scope. |
| `~/.openclaw/agents/team/workspace/CLAUDE.md` | 2.4 | NO-EDIT-FALSE-POSITIVE | `systems` appears as a common noun, not retired agent identity. |
| `~/.openclaw/agents/team/workspace/IDENTITY.md` | 2.4 | REVIEWED-NO-EDIT | No retired-agent identity references in scope. |
| `~/.openclaw/agents/team/workspace/USER.md` | 2.4 | REVIEWED-NO-EDIT | No retired-agent identity references in scope. |
| `~/.openclaw/agents/alex-cs/workspace/SOUL.md` | 2.4 | REVIEWED-NO-EDIT | No retired-agent identity references in scope. |
| `~/.openclaw/agents/alex-cs/workspace/AGENTS.md` | 2.4 | NO-EDIT-FALSE-POSITIVE | `pm` hit came from business-hours timestamps, not retired agent identity. |
| `~/.openclaw/agents/alex-cs/workspace/CLAUDE.md` | 2.4 | EDITED | Replaced retired `customer-service` escalation target with `main`. |
| `~/.openclaw/agents/alex-cs/workspace/IDENTITY.md` | 2.4 | EDITED | Removed retired `customer-service` coordinator reference. |
| `~/.openclaw/agents/alex-cs/workspace/USER.md` | 2.4 | REVIEWED-NO-EDIT | No retired-agent identity references in scope. |
| `~/.openclaw/agents/arlo-website/workspace/SOUL.md` | 2.4 | EDITED | Removed retired `website`-lead replacement language. |
| `~/.openclaw/agents/arlo-website/workspace/AGENTS.md` | 2.4 | EDITED | Replaced retired `website` lead-role reference with generic build-coordination language. |
| `~/.openclaw/agents/arlo-website/workspace/CLAUDE.md` | 2.4 | EDITED | Replaced retired `website` escalation target with `main`. |
| `~/.openclaw/agents/arlo-website/workspace/IDENTITY.md` | 2.4 | EDITED | Removed retired `website` coordinator wording. |
| `~/.openclaw/agents/arlo-website/workspace/USER.md` | 2.4 | REVIEWED-NO-EDIT | No retired-agent identity references in scope. |
| `~/.openclaw/agents/backmarket/workspace/SOUL.md` | 2.4 | REVIEWED-NO-EDIT | No retired-agent identity references in scope. |
| `~/.openclaw/agents/backmarket/workspace/AGENTS.md` | 2.4 | REVIEWED-NO-EDIT | No retired-agent identity references in scope. |
| `~/.openclaw/agents/backmarket/workspace/CLAUDE.md` | 2.4 | NO-EDIT-FALSE-POSITIVE | `default` appears in ordinary prose, not retired agent identity. |
| `~/.openclaw/agents/backmarket/workspace/IDENTITY.md` | 2.4 | REVIEWED-NO-EDIT | No retired-agent identity references in scope. |
| `~/.openclaw/agents/backmarket/workspace/USER.md` | 2.4 | REVIEWED-NO-EDIT | No retired-agent identity references in scope. |
| `~/.openclaw/agents/diagnostics/workspace/SOUL.md` | 2.4 | REVIEWED-NO-EDIT | `customer-service` is generic domain language here, not a retired agent identity. |
| `~/.openclaw/agents/diagnostics/workspace/AGENTS.md` | 2.4 | REVIEWED-NO-EDIT | No retired-agent identity references in scope. |
| `~/.openclaw/agents/diagnostics/workspace/CLAUDE.md` | 2.4 | EDITED | Folded retired `systems` escalation into `operations`. |
| `~/.openclaw/agents/diagnostics/workspace/IDENTITY.md` | 2.4 | REVIEWED-NO-EDIT | No retired-agent identity references in scope. |
| `~/.openclaw/agents/diagnostics/workspace/USER.md` | 2.4 | REVIEWED-NO-EDIT | No retired-agent identity references in scope. |
| `~/.openclaw/agents/parts/workspace/SOUL.md` | 2.4 | EDITED | Removed retired `website` coordination reference. |
| `~/.openclaw/agents/parts/workspace/AGENTS.md` | 2.4 | REVIEWED-NO-EDIT | No retired-agent identity references in scope. |
| `~/.openclaw/agents/parts/workspace/CLAUDE.md` | 2.4 | NO-EDIT-FALSE-POSITIVE | `default` appears in ordinary prose, not retired agent identity. |
| `~/.openclaw/agents/parts/workspace/IDENTITY.md` | 2.4 | REVIEWED-NO-EDIT | No retired-agent identity references in scope. |
| `~/.openclaw/agents/parts/workspace/USER.md` | 2.4 | REVIEWED-NO-EDIT | No retired-agent identity references in scope. |
| `~/.openclaw/hooks/dependency-check/handler.js` | 2.6 | EDITED | Changed Telegram alert target from the retired systems group to operations group `-1003336872091`. |
| `~/.openclaw/hooks/supabase-bootstrap/handler.js` | 2.6 | NO-EDIT-FALSE-POSITIVE | `export default` is JS syntax, not retired-agent identity. |
| `~/.openclaw/hooks/supabase-memory/handler.js` | 2.6 | NO-EDIT-FALSE-POSITIVE | `export default` is JS syntax, not retired-agent identity. |
| `~/.openclaw/hooks/agent-activity-logger/handler.js` | 2.6 | NO-EDIT-FALSE-POSITIVE | `export default` is JS syntax, not retired-agent identity. |
| `/home/ricky/builds/HANDOFF-PROTOCOL.md` | 2.5 | EDITED | Replaced retired `systems`/`customer-service` ownership references with live maintainers. |
| `/home/ricky/CLAUDE.md` | project-doc review | REVIEWED-NO-EDIT | Already reflects the 9-agent rebuild state; no retired-agent identity references remained. |

## Final Audit Grep

```text
build-orchestrator: 5 files still referencing
codex-builder: 11 files still referencing
codex-reviewer: 6 files still referencing
customer-service: 56 files still referencing
default: 213 files still referencing
pm: 204 files still referencing
slack-jarvis: 6 files still referencing
website: 200 files still referencing
systems: 111 files still referencing
chief-of-staff: 2 files still referencing
```

## Remaining-Hit Notes

- The final grep command is intentionally broader than the Phase 2 edit scope: it walks full workspace roots, not just the bootstrap files listed in Group 2.4.
- Remaining `build-orchestrator`, `codex-builder`, `codex-reviewer`, `slack-jarvis`, and `chief-of-staff` counts are from out-of-scope history/state/session or other workspace files not listed for Phase 2 edits.
- Remaining `customer-service` hits in the scoped files are generic domain/path references, not retired-agent identity references.
- Remaining `website` hits are dominated by active `arlo-website` references plus common-noun website usage.
- Remaining `systems`, `pm`, and `default` hits are dominated by common-noun prose, timestamps/substring matches, or literal code syntax such as `export default` and `anthropic:default`.
