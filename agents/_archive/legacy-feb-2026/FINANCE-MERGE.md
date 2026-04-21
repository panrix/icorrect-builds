# Finance → Operations Agent Merge

**Date:** 18 February 2026
**Commits:** 53ef2b6, 08f293b, 259091d
**Tag:** `pre-finance-merge` (state before changes)
**Status:** COMPLETE

---

## What Changed

### Operations Agent (expanded scope)
- **SOUL.md** — Added finance scope (Xero, cash flow, HMRC, KPIs, financial reporting). Sub-agents increased from 6 to 8 (added fin-cashflow, fin-kpis). Added finance personality traits and 4 new success metrics.
- **CLAUDE.md** — Added 4 new sections: Xero API Reference (§6), HMRC Payment Plan (§7), KPI Definitions (§8), Cash Flow Reporting Format (§9). Extended Supabase taxonomy with `operations/finance/*` namespaces. Extended memory write rules for financial data. Updated sub-agent roster to include fin-cashflow and fin-kpis.

### Finance Sub-Agents (reparented)
- **fin-cashflow/SOUL.md** — Parent changed from finance to operations
- **fin-cashflow/CLAUDE.md** — Parent: operations. Namespace: operations/finance. Routing table updated.
- **fin-kpis/SOUL.md** — Parent changed from finance to operations
- **fin-kpis/CLAUDE.md** — Parent: operations. Namespace: operations/finance. Routing table updated.

### Agent Routing Tables (16 files)
Removed `| finance | domain_lead | sonnet | -1003363899186 |` from:
- jarvis, pm, qa-plan, qa-code, qa-data, systems, backmarket, customer-service, marketing

Updated fin-cashflow/fin-kpis parent from `finance` to `operations` in:
- mkt-content, mkt-adwords, mkt-seo, mkt-website, cs-escalation, cs-intercom

Updated prose references:
- backmarket: "coordinate with finance" → "coordinate with operations"
- marketing: "request revenue attribution from finance" → "from operations"
- ops-parts: "finance domains" → "operations finance scope"

### OpenClaw Config
- **openclaw.json** — Removed finance from `agents.list` (15→14 agents) and `bindings` (11→10 bindings). Gateway restarted clean.

### Scripts (3 files)
- **agent-trigger.py** — Removed `"finance": "-1003363899186"` from AGENT_CHAT_IDS
- **telegram-alert.py** — Removed `"finance": "-1003363899186"` from CHAT_IDS
- **rebuild-memory-md.py** — Removed finance from AGENT_WORKSPACES

### Supabase
- **Seed SQL** — Finance marked as `disabled`. fin-cashflow and fin-kpis parent changed to `operations`.
- **Live DB** — finance status: `disabled`. fin-cashflow parent: `operations`. fin-kpis parent: `operations`. No memory_facts rows existed to migrate.

### BUILD.md
- Architecture diagram: finance removed from domain leads column
- Agent count: 12 → 11 active top-level agents
- Finance moved from Active to Inactive section (4 retired agents)
- fin-cashflow/fin-kpis listed under operations in dormant sub-agents table

### Memory + Archive
- Finance MEMORY.md preserved at `~/.openclaw/agents/operations/workspace/memory/finance-legacy.md`
- 5 finance docs copied to `~/.openclaw/agents/operations/workspace/docs/finance/`
- Finance workspace archived to `~/.openclaw/agents/finance-archived/`

### Telegram
- Finance Jarvis group deleted by Ricky (18 Feb 2026)

### Legacy v1 Agents
- Verified: finn, team, website, processes CLAUDE.md files had no finance references. No changes needed.

---

## Remaining follow-ups (non-blocking)

| # | Item | Priority |
|---|------|----------|
| 1 | Test fin-cashflow/fin-kpis delegation from operations | Medium — verify when next financial task arises |
| 2 | Audit n8n workflows for finance references | Low — only if n8n is still in active use |

---

## Rollback

```bash
# Revert repo to pre-merge state
cd /home/ricky/mission-control-v2
git revert 53ef2b6

# Restore finance agent workspace
mv ~/.openclaw/agents/finance-archived ~/.openclaw/agents/finance

# Restore openclaw.json (re-add finance agent + binding)
# Manually re-add or restore from git

# Re-enable in Supabase
# UPDATE agent_registry SET status = active WHERE agent_id = finance;
# UPDATE agent_registry SET parent_agent = finance WHERE agent_id IN (fin-cashflow, fin-kpis);

# Restart gateway
systemctl --user restart openclaw-gateway
```

---

## Verification Commands

```bash
# Operations has finance scope
grep -c "Xero\|HMRC\|KPI" /home/ricky/mission-control-v2/agents/operations/CLAUDE.md

# No stale finance domain_lead in routing tables
grep -r "finance.*domain_lead" /home/ricky/mission-control-v2/agents/*/CLAUDE.md | grep -v /finance/

# No finance in openclaw.json
grep "finance" ~/.openclaw/openclaw.json

# Finance archived
ls -d ~/.openclaw/agents/finance-archived/

# Memory preserved
cat ~/.openclaw/agents/operations/workspace/memory/finance-legacy.md | head -5

# Gateway running clean
systemctl --user status openclaw-gateway

# Supabase live state
# finance: disabled, fin-cashflow parent: operations, fin-kpis parent: operations
```
