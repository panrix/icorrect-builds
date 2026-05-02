# Brief 01: Hugo SOP-to-Script Mapping

**For:** Codex agent (read-only research)
**Output:** `/home/ricky/builds/agent-rebuild/hugo-script-audit.md`

---

## Context

Hugo (BackMarket agent) has 12 SOPs with connected Node.js scripts. Most of these are deterministic automation that shouldn't need an LLM. We need a complete map of what each SOP does, what script powers it, and whether it's already automated via crontab or only runs when someone asks Hugo.

## Task

### 1. Read all SOPs
Location: `/home/ricky/builds/backmarket/sops/`
Files: `00-BACK-MARKET-MASTER.md` through `12-returns-aftercare.md`

For each SOP, extract:
- SOP number and name
- What business process it covers
- Whether it references a script
- What triggers it (manual, scheduled, event-driven)
- What data sources it needs (Monday API, BM API, etc.)

### 2. Read all scripts
Location: `/home/ricky/builds/backmarket/scripts/`

For each script, extract:
- Filename
- What it does (read the first 50 lines + any main function)
- What APIs/credentials it needs
- What it outputs (console, file, Monday update, Telegram message)
- Dependencies (package.json)

### 3. Check what's already in crontab
Run: `crontab -l`
Map which BM scripts are already scheduled as plain crontab entries.

### 4. Cross-reference
Build a table:

| SOP | Script | Crontab? | Needs LLM? | Notes |
|-----|--------|----------|------------|-------|

For "Needs LLM?" — answer YES only if the task requires reading unstructured text, making a judgement call, or drafting human-language output. Answer NO if it's moving data, calling APIs, updating boards, or checking statuses.

### 5. Read the BM README
`/home/ricky/builds/backmarket/README.md` — extract the script/SOP mapping and known bugs.

### 6. Also check
- `/home/ricky/builds/backmarket/analysis/` — what analysis scripts exist
- `/home/ricky/builds/backmarket/docs/` — any strategy docs
- `/home/ricky/builds/buyback-monitor/` — read README.md for context on the buy box pipeline

## Output format

Write to `/home/ricky/builds/agent-rebuild/hugo-script-audit.md` with:
1. Summary table (SOP → Script → Crontab → Needs LLM)
2. Per-SOP detail section
3. List of scripts with no matching SOP (orphans)
4. List of SOPs with no matching script (gaps)
5. Recommendations section: which scripts should move to crontab, which stay agent-triggered

**Do NOT modify any files. Read-only research.**
