# iCorrect Build Tracker

**Last updated:** 2026-04-09
**Owner:** Ricky + Code

---

## Active Builds

| # | Build | Status | Location | Next Step |
|---|-------|--------|----------|-----------|
| 1 | Alex Triage Card System | Plan QA'd, ready for Codex | `builds/alex-triage-rebuild/` | Codex builds Phase 1 (1A-1G), Code QAs output |
| 2 | Alex Quotes (Phase 2) | Blocked | `builds/alex-triage-rebuild/` | Draft plan written. Blocked on Diagnostic Mini App (#8) for structured fault data |
| 8 | Diagnostic Mini App | Not started | TBD | Telegram Mini App for techs: structured fault logging. Saf for full diagnostics, other techs for additional faults during repair. Blocker for Alex Quotes (#2) |
| 3 | Intake System (Client Form + Team View) | Plan v2 written + QA'd, docs aligned | `builds/intake-system/plan.md` | Phase 0: foundation (backend scaffold, Supabase schema, API contracts). Then Phase 1: walk-in flow first. Replaces Typeform + n8n→Slack. |
| 4 | Slack Intake Notifications | Superseded | `builds/intake-notifications/` | Replaced by Intake System (#3) |
| 5 | Buyback Monitor Rebuild | Spec verified | `builds/backmarket/docs/trusted-buyback-plan-qa-compilation-2026-03-30.md` | Build Phase 1 |
| 6 | SOP Edge Cases + Verification | Codex dispatched | `builds/agent-rebuild/BRIEF-C16` | Awaiting output |
| 7 | Main Board Cleanup | Analysis done | `builds/agent-rebuild/main-board-cleanup-analysis.md` | Review + execute move |

## Research Complete (reference)

| Doc | Location |
|-----|----------|
| System Rethink (master doc) | `builds/agent-rebuild/system-rethink.md` |
| Automation Blueprint | `builds/agent-rebuild/automation-blueprint.md` |
| 11 Systems Dump | `builds/agent-rebuild/ricky-systems-dump.md` |
| 11 Systems Deep Map | `builds/agent-rebuild/systems-deep-map.md` |
| VPS Audit | `builds/agent-rebuild/vps-audit.md` |
| Cron Audit | `builds/agent-rebuild/cron-audit.md` |
| Hugo Script Audit | `builds/agent-rebuild/hugo-script-audit.md` |
| Repair History (40K replies) | `builds/agent-rebuild/data/repair-history-full.json` |
| Repair History Analysis | `builds/agent-rebuild/repair-history-analysis.md` |
| API Credentials Status | `builds/agent-rebuild/api-credentials-status.md` |
| Script Test Results | `builds/agent-rebuild/script-test-results.md` |
| Buyback Rebuild Verification | `builds/agent-rebuild/buyback-rebuild-verification.md` |
| Slack Intake Readiness | `builds/agent-rebuild/slack-intake-readiness.md` |
| Marketing Intelligence Audit | `builds/agent-rebuild/marketing-intelligence-audit.md` |
| Search Not Load Research | `builds/agent-rebuild/search-not-load-research.md` |
| Jarvis Context Audit | `builds/agent-rebuild/jarvis-context-audit.md` |

## 11 Systems (from Ricky's dump)

| # | System | Status | Priority |
|---|--------|--------|----------|
| 1 | Client Intake Form | Plan v2 QA'd, prototype exists, ready for Phase 0 | P1 |
| 2 | Workshop Intake (iPad) | Planned (Phase 3 of Build #3) | P1 |
| 3 | Device Intake Checklist | Planned (team-view hard gates in Build #3) | P1 |
| 4 | BackMarket Intake | Spec exists | P2 |
| 5 | Mail-In Intake | Spec exists | P2 |
| 6 | Interactive Diagnostic | Spec exists | P3 |
| 7 | Tech Repair Dashboard | Not started | P2 |
| 8 | Inventory Management | Not started | P2 |
| 9 | Coordinator Dashboard | Not started | P3 |
| 10 | Shipping Interface | Not started | P2 |
| 11 | QC System | Not started | P3 |

## Agents (current state)

| Agent | Model | Status | Role |
|-------|-------|--------|------|
| Jarvis | Qwen 3.6 Plus | Active | Thinking partner + KB curator |
| Alex | Qwen 3.6 Plus | Active | CS drafts (being rebuilt as triage system) |
| Hugo | Qwen 3.6 Plus | Active | BM strategy (scripts being separated) |
| Marketing | Qwen 3.6 Plus | Active | Strategy + briefs |
| Systems | Qwen 3.6 Plus | Low use | Infrastructure |
| Operations | Qwen 3.6 Plus | Low use | Process analysis |
| Team | Qwen 3.6 Plus | Low use | People analysis |
| Parts | Qwen 3.6 Plus | Low use | Inventory strategy |
| Codex Builder | Codex GPT-5.4 | Active | Research + implementation |
| Codex Reviewer | Codex GPT-5.4 | Idle | QA |

## Blocked

| Item | Blocker | Resolution |
|------|---------|------------|
| KPI Updater | Xero auth expired | Re-auth via developer.xero.com (new Jarvis app, scopes need checking) |
| Anthropic agents | OAuth blocked, CLI backend removed | Using Qwen via OpenRouter |

## Done (this week)

- CLI backend migration (then blocked by Anthropic)
- All agents moved to Qwen 3.6 Plus via OpenRouter
- Session keepalive disabled (was 288 Opus triggers/day)
- Elek heartbeat disabled
- Buyback monitor moved to crontab
- BM Board Housekeeping cron removed (duplicate)
- Bali date check disabled
- 12 SOPs written with Hermes
- KB schema + index + log created
- KB finance + customer-service sections populated
- Jarvis SOUL.md rewritten (thinking partner + KB curator)
- Jarvis TOOLS.md updated with cron capabilities
- System audit folder organised
- 16 Codex research briefs completed
- Repair history full pull (1,889 items, 40K replies, 18K activity logs)
- Claude Code Telegram bot installed (blocked by Anthropic extra usage)
- Hermes agent configured on Qwen via OpenRouter
