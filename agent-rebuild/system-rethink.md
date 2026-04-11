# System Rethink — Agents, Scripts & the OAuth Wake-Up Call

**Created:** 2026-04-04
**Status:** Active research
**Owner:** Code + Ricky

---

## The Problem

As of 2026-04-04, Anthropic no longer allows third-party harnesses (like OpenClaw) to use Claude subscription OAuth tokens to call their API directly. Our current setup takes the OAuth token from Claude CLI (`~/.claude/.credentials.json`) and injects it into OpenClaw's `auth-profiles.json`, where OpenClaw uses it to make API calls on behalf of all agents. This is now blocked.

**Symptoms observed:**
- Token sync cron was already removed (possibly related to early enforcement)
- Stale tokens causing agents to go unresponsive (fixed 2026-04-03)
- Ricky reports poor response quality from agents — under investigation (likely context bloat / session age, not model degradation)

---

## The Fix — Option B: Claude CLI as Message Provider

**Source:** https://docs.openclaw.ai/providers/anthropic#option-b-claude-cli-as-the-message-provider

Instead of OpenClaw calling the Anthropic API with a token, OpenClaw shells out to the local `claude` CLI binary. The CLI makes the API call itself. From Anthropic's perspective, this looks like Claude Code usage — which is explicitly allowed under their terms.

**How it works:**
- OpenClaw runs `claude -p --output-format json` on the gateway machine
- First interaction uses `--session-id <uuid>`
- Subsequent turns use `--resume <sessionId>`
- Messages route through OpenClaw's normal pipeline; Claude CLI generates responses

**What's allowed (Anthropic's position):**
> "Subs can still be used for personal local tools that use or wrap the Claude harness like Claude Code and Claude Code headless and Agent SDK"

The CLI binary is Anthropic's own tool — OpenClaw wrapping it is within bounds.

---

## What We Keep

- Agents responding to Telegram messages
- Agent-to-agent messaging via separate bot tokens
- Supabase reads/writes (handled by hooks, not tools)
- Cron jobs triggering agents
- Session memory, compaction, OpenClaw lifecycle
- Bash/curl/scripts for API calls (Monday, Intercom, Xero, etc.)
- All existing agent identity, routing, bindings

## What We Lose

| Capability | Impact | Affected Agents |
|-----------|--------|-----------------|
| MCP tools (browser, searchable, pdf) | Low — not actively used | All Anthropic agents |
| Image input | Low — agents don't process images currently | All Anthropic agents |
| Streaming responses | Low — messages arrive complete instead of word-by-word | All Anthropic agents |
| OpenClaw native tool calling | Medium — agents can't use OpenClaw's tool framework | All Anthropic agents |

**Unaffected:** codex-reviewer and codex-builder (use OpenAI Codex auth, not Anthropic).

---

## Config Changes Required

### Before (current — broken)
```json
"model": {
  "primary": "anthropic/claude-opus-4-6",
  "fallbacks": ["openai-codex/gpt-5.4"]
}
```

### After (CLI backend) — IMPLEMENTED 2026-04-04
```json
"model": {
  "primary": "claude-cli/claude-opus-4-6",
  "fallbacks": ["openai-codex/gpt-5.4"]
}
```

### Additional config — IMPLEMENTED 2026-04-04
```json5
// In agents.defaults:
{
  "models": { "claude-cli/claude-opus-4-6": {}, "claude-cli/claude-sonnet-4-6": {} },
  "sandbox": { "mode": "off" }  // Required for CLI backend
}
```

### Remaining Cleanup
- Remove `anthropic` from `models.providers` (no longer calling API directly)
- Remove `anthropic:default` from `auth-profiles.json` (no token needed)
- Remove token sync cron (`*/15 * * * * sync-token.sh`) — no longer needed

---

## Migration Plan

1. ~~Test with one agent~~ — **DONE** 2026-04-04
2. ~~Migrate remaining Sonnet agents~~ — **DONE** 2026-04-04
3. ~~Migrate main (Jarvis)~~ — **DONE** 2026-04-04 — confirmed working: `claude-cli/claude-opus-4-6`
4. **Verify** — delegation chain, cron triggers, agent-to-agent messaging — pending
5. **Clean up** — remove old auth config, kill sync cron — pending

---

## Response Quality Investigation

Separate from the migration, Ricky has flagged poor response quality. Potential causes:

| Possible Cause | Status | Notes |
|---------------|--------|-------|
| Context bloat (large SOUL/CLAUDE/bootstrap) | Not yet checked | Agents may have 30-40k+ tokens of system context before user message |
| Stale sessions (30-50+ days old, high context %) | Confirmed | Several sessions at 80-100% capacity |
| Model misconfiguration | Fixed 2026-04-03 | Agents were on Codex, now on Anthropic |
| Token issues causing silent failures/fallbacks | Fixed 2026-04-03 | Stale OAuth token synced |

**Next step:** Audit context size of busiest agents.

---

## Decision Log

| Date | Decision | Who |
|------|----------|-----|
| 2026-04-03 | Models switched back to Anthropic (main=Opus, rest=Sonnet, codex agents=Codex) | Ricky + Code |
| 2026-04-03 | Token sync restored, stale token fixed | Code |
| 2026-04-04 | Anthropic OAuth no longer viable — CLI backend migration needed | Ricky |
| | | |

---

## Token Waste — Identified Drains

| Drain | Frequency | Model | Cost Impact | Status |
|-------|-----------|-------|-------------|--------|
| Session keepalive | Every 5 min (288/day) | Opus | **HUGE** — biggest single drain | Disabled 2026-04-04 |
| Elek diagnostics heartbeat | Every 5 min (288/day) | Sonnet | High | Disabled 2026-04-04 |
| Buyback buy-box-monitor cron | Daily | Opus (isolated session) | Medium | Active — should move to plain crontab |
| BM scripts run via agents | Various | Sonnet | Medium | Active — need rebuilding as plain crontab entries |

### Scripts That Should Be Plain Crontab (Not Agent-Triggered)

Scripts that just run and produce output don't need an LLM. They should run as direct crontab entries like `sent-orders.js`, `sale-detection.js`, and `dispatch.js` already do.

**TODO:** Audit all OpenClaw cron jobs and BM scripts to identify which ones are unnecessarily routed through agents. Move them to plain crontab entries with Telegram alerts via `telegram-alert.py` for notifications.

---

## Architecture Problem: LLMs as Script Runners

This is a bigger issue than the OAuth change. Multiple agents are being used as middlemen to run deterministic scripts — paying full LLM session costs for work that needs zero intelligence.

### The Cost of "Hugo, run SOP 08"

Every time someone asks Hugo to run a script:

| Step | Token Cost |
|------|-----------|
| Load SOUL, CLAUDE, MEMORY, TOOLS, AGENTS, etc. (~18KB) | ~5K tokens |
| Load 34 memory files (~364KB) | ~90K tokens |
| Load foundation docs (~76KB) | ~20K tokens |
| Bootstrap hooks (Supabase, activity logger) | ~5-10K tokens |
| Read the SOP to figure out what to do | ~5-10K tokens |
| Read script output, format response | ~5-10K tokens |
| **Total input per request** | **~130-150K tokens** |
| Output (response to user) | ~2-5K tokens |
| **Estimated cost per interaction (Sonnet)** | **~$0.45-0.60** |

And the script itself runs in milliseconds for free. The LLM adds no value — it's just a $0.50 copy-paste machine that sometimes formats the output wrong, requiring another $0.50 retry.

### What Should Be a Script vs What Should Be an Agent

**Script (no LLM):**
- Monday.com lookups (single column, item status, internal notes)
- Running SOPs with connected scripts (sale detection, dispatch, housekeeping)
- Data pulls from APIs (BM listings, Intercom stats, Xero balances)
- Moving items between Monday groups/statuses
- Checking stock levels, prices, order status
- Anything where the input and output are structured and predictable

**Agent (LLM needed):**
- Reading unstructured text and making a judgement (Alex's inbox triage)
- Drafting human responses (customer replies, team communications)
- Analysing trends or anomalies ("why did our win rate drop?")
- Answering ambiguous questions that need reasoning
- Cross-referencing multiple data sources to draw conclusions
- Strategic recommendations

### The Rebuild Pattern

Instead of: `Team member → Telegram → Agent → figures out what to do → runs script → reads output → formats response → Telegram`

It should be: `Team member → Telegram bot command or simple UI → Script runs → formatted result → Telegram`

The agent only gets involved when the task genuinely needs thinking.

### Agents to Audit

Each agent needs a breakdown of what tasks they handle and whether each task needs LLM or could be a direct script. Priority agents:

| Agent | Suspected Script-Heavy Tasks |
|-------|------------------------------|
| **Hugo (backmarket)** | 12 SOPs with connected scripts. Most are deterministic. |
| **Parts Jarvis** | Monday lookups, stock checks, internal notes — all API calls |
| **Ops Jarvis** | Queue checks, status updates — Monday API |
| **Team Jarvis** | Performance lookups — Monday/Supabase queries |

### The Slack Bot Layer

Most agent interactions from the team are simple lookups and script triggers. A Slack bot with slash commands would replace 80%+ of what agents currently do:

```
/stock iPhone 15 Pro         → Monday API lookup, instant response
/buybox summary              → reads today's summary file, returns it
/sop08                       → runs sale detection, posts results
/queue                       → Monday API, shows repair queue
/status 12345                → Monday item lookup by ID
/parts-check iPhone 14 LCD   → stock + supplier price lookup
```

Zero tokens. Instant. Consistent formatting every time.

**LLM stays for:**
- Drafting customer replies (Alex inbox triage)
- "Why did X happen?" questions that need reasoning across data
- Strategic analysis where the answer isn't a lookup
- Edge-case profitability decisions (though even here: script gathers data, LLM only judges the ambiguous cases)

**Key insight from Ricky (2026-04-04):** The profitability decisions agents make often cost more in tokens than the profit margin they're optimising. The LLM overhead needs to justify itself against the business value it produces.

**TODO:** For each agent, list every task they handle and classify as SCRIPT or AGENT. Build scripts for the SCRIPT tasks. Expose them via a Slack bot with slash commands for the team.

---

## Full Agent Audit (2026-04-04)

### Activity Summary

Only 3 of 17 agents are genuinely active. The rest are dormant, dead, or newly created.

| Agent | Model | Last Active | Memory Files | Status |
|-------|-------|-------------|-------------|--------|
| **Jarvis** (main) | Opus | Apr 4 | 49 / 488KB | Active daily — coordination, research, Codex spawns |
| **Alex** (alex-cs) | Sonnet | Apr 3 | 5 / 64KB | Active daily — customer quotes, Intercom drafts |
| **Systems** (systems) | Sonnet | Apr 3 | 18 / 96KB | Active — system audits, monitoring |
| **Elek** (diagnostics) | Sonnet | Mar 31 | 4 / 44KB | Burst — board viewer dev, deep technical work |
| **Team** (team) | Sonnet | Mar 31 | 16 / 252KB | Moderate — hiring, queue tracking |
| **Operations** (operations) | Sonnet | Mar 31 | 16 / 156KB | Low — mostly maintenance |
| **Marketing** (marketing) | Sonnet | Apr 2 | 22 / 364KB | Active — strategy, Meta ads, briefs |
| **Hugo** (backmarket) | Sonnet | Recent | 34 / 364KB | Active — BM ops, SOPs, but script-heavy |
| **Parts** (parts) | Sonnet | Mar 12 | 11 / 72KB | Dormant 3 weeks — has useful Monday scripts |
| **Website** (website) | Sonnet | Mar 12 | 13 / 96KB | Dormant 3 weeks — nightly maintenance only |
| **CS** (customer-service) | Sonnet | Mar 12 | 15 / 144KB | Dormant — work shifted to Alex |
| **Slack-Jarvis** (slack-jarvis) | Sonnet | Feb 27 | 2 / 12KB | Dormant 5 weeks |
| **Arlo** (arlo-website) | Sonnet | Never | 0 | Dead — zero activity ever |
| **PM** (pm) | Sonnet | Never | 0 | Dead — disabled, crons replace it |
| **Build Orchestrator** | Sonnet | Never | 0 | New (Apr 1) — not yet used |
| **Codex Reviewer** | Codex | Never | 0 | New (Apr 1) — not yet used |
| **Codex Builder** | Codex | Never | 0 | New (Apr 1) — not yet used |

### Per-Agent Breakdown: Script vs Agent Work

#### Jarvis (main) — KEEP AS AGENT
- Coordination across all domains (**AGENT** — needs reasoning)
- Spawning Codex research agents (**AGENT**)
- Morning briefings (**AGENT** — synthesis)
- Strategic discussions with Ricky (**AGENT**)
- Running scripts directly (**SHOULD NOT** — already being corrected, use Codex or crontab)

**CLI impact:** Minimal. Text-based coordination work.

#### Alex (alex-cs) — KEEP AS AGENT
- Morning inbox triage — read Intercom, draft replies (**AGENT** — judgement + writing)
- Quote building for Ferrari (**AGENT** — pricing knowledge + human tone)
- Customer case handling (**AGENT** — unstructured conversation analysis)
- Intercom status lookups (**SCRIPT** — API call)

**CLI impact:** Minimal. Core value is drafting and judgement. The Intercom lookup could be a slash command but it's a minor part of Alex's work.
**Note:** Morning cron is erroring — "Outbound not configured for channel: telegram" on some days, timeouts on others.

#### Hugo (backmarket) — MOSTLY SCRIPTS
- 12 SOPs with connected scripts (**SCRIPT** — deterministic, run the same way every time)
- Monday board lookups (**SCRIPT** — API call)
- BM API calls (listings, pricing, orders) (**SCRIPT**)
- Profitability analysis (**MIXED** — data gathering is script, edge-case decisions are agent)
- Strategy discussions with Ricky (**AGENT**)

**CLI impact:** Low for the agent tasks. But 80%+ of Hugo's daily work should be scripts/Slack commands, not LLM sessions.

#### Marketing — KEEP AS AGENT (fix the infrastructure)
- Strategic planning with Ricky (Meta ads, SEO, content) (**AGENT**)
- Writing briefs and audit reports (**AGENT** — 20 docs, 220KB of genuine analysis)
- Meta ads management and debugging (**AGENT** — complex troubleshooting)
- Intelligence platform scrapers (**SCRIPT** — already built as scripts, just dead)
- Rank tracking and data collection (**SCRIPT** — deterministic scraping)

**CLI impact:** Minimal. Marketing is almost entirely thinking and writing.
**Issue:** Built an entire intelligence platform (scrapers, API, dashboard at mi.icorrect.co.uk) but it's dead — empty DB, API service stopped, SEO crons erroring. The scripts exist and work, they just need to run via crontab instead of through the agent.

#### Systems — KEEP AS AGENT (lightweight)
- VPS health monitoring (**MIXED** — checks are scripts, analysis is agent)
- Service diagnostics (**AGENT** — interpreting error patterns)
- System audits (**AGENT**)
- `now.sh` status check (**SCRIPT**)

**CLI impact:** Minimal.

#### Team — MOSTLY AGENT, SOME SCRIPTS
- Monday queue lookups (**SCRIPT** — API call)
- Performance tracking / KPI checks (**SCRIPT** — Monday API)
- Hiring form building (**AGENT** — creative work)
- Team dynamics analysis (**AGENT** — judgement)
- Weekly completions (**MIXED** — data pull is script, analysis is agent)

**CLI impact:** Low.

#### Operations — MOSTLY SCRIPTS
- Queue checks and status updates (**SCRIPT** — Monday API)
- KPI updates (**SCRIPT** — Monday API)
- Process documentation (**AGENT** — writing)
- Nightly maintenance (**SCRIPT** — should be crontab)

**CLI impact:** Low.

#### Parts — MOSTLY SCRIPTS
- Stock level checks (**SCRIPT** — Monday API, already has Python scripts)
- Internal notes lookup (**SCRIPT** — Monday API)
- Supplier price checks (**SCRIPT** — API call)
- Reorder risk assessment (**MIXED** — data is script, risk judgement could be agent)
- Has 3 working Python scripts (`monday_kpi_export.py`, `populate_60d_usage.py`, `update_usage_columns.py`)

**CLI impact:** Low. Most of what people ask Parts to do is lookups.

#### Elek (diagnostics) — KEEP AS AGENT
- Board-level fault isolation (**AGENT** — deep technical reasoning)
- Board viewer development (**AGENT** — complex tooling work)
- Test path design (**AGENT** — requires electronics knowledge)
- Case tracking (active/resolved with per-model knowledge base)

**CLI impact:** Minimal. Elek's value is entirely in reasoning about board-level faults.

#### Website — DORMANT, NEEDS DECISION
- 3 weeks no activity. Had 8 consecutive nightly-only sessions before going dark.
- PostHog tracking blind spot identified but never fixed (18+ untracked orders, £4,692+)
- Arlo (sub-agent) has never been used at all.

**Decision needed:** Merge into Marketing? Fix and revive? Kill and use Arlo for team-facing Shopify lookups?

#### CS — DORMANT, WORK SHIFTED TO ALEX
- All real CS work now done by Alex
- CS Jarvis last active Mar 12
- Has good docs (Intercom audit, Finn audit, SOPs, triage mapping)

**Decision needed:** Archive CS and promote Alex as the sole CS agent? Or keep CS as the oversight/strategy layer?

#### Dead Agents
- **Arlo** — zero activity ever. Has 17 seeded doc files but no real output.
- **PM** — disabled. Crons do its job.
- **Slack-Jarvis** — dormant 5 weeks. 2 memory files total.
- **Build Orchestrator / Codex Reviewer / Codex Builder** — created Apr 1, never used.

### Key Findings

1. **You're paying for 17 agents but only 3-5 do real work.** Jarvis, Alex, Marketing, and sometimes Hugo/Systems. The rest are dormant or dead.

2. **The productive agents (Jarvis, Alex, Marketing) do genuine LLM work.** Strategy, writing, analysis, judgement. These justify their token cost.

3. **The script-heavy agents (Hugo, Parts, Operations) are expensive middlemen.** Most of what people ask them to do is API lookups and script execution — zero intelligence needed.

4. **Marketing built real infrastructure that died.** Intelligence platform with scrapers, API, dashboard — all exist as working code but nothing runs. These should be crontab jobs.

5. **PostHog is blind.** Website agent documented £4,692+ in untracked orders by Mar 12. Nobody has fixed it in 3 weeks.

6. **Alex is the hidden star.** More operationally productive than most domain leads. Writing real quotes, handling real customer cases, training on Ferrari's style.

---

## The Hallucination Problem

Agents regularly fabricate information instead of checking sources. This causes real business mistakes.

**Root cause:** Agents carry hundreds of KB of stale memory files in context. When asked a question, they pattern-match against this old context (or worse, their training data) instead of looking up the actual current state. The result looks like a confident answer but is wrong.

**Examples of the pattern:**
- Parts Jarvis reports stock levels from memory instead of querying Monday API
- Agents reference processes or team members that have changed
- Pricing or margin data that's weeks out of date gets stated as current fact

**Why it happens:**
1. Too much stale context loaded (memory files weeks/months old treated as truth)
2. No enforcement of "check source before answering"
3. Agents don't cite where their answer came from
4. No penalty or correction loop for wrong answers — they just keep guessing

**The fix (three rules for every agent):**

1. **Search before answering.** If the question involves a fact (price, status, stock level, customer info), read the source file or call the API. Never answer from memory alone.
2. **Cite the source.** Every factual claim must reference a file path, API call, or explicit "from my last conversation with Ricky on [date]".
3. **Say "I don't know."** If the data isn't in KB or accessible via API, say so. Do not fill gaps with training data. A wrong answer costs more than no answer.

**Connection to the rebuild:**
- Slimming agent context (fewer stale memory files) reduces the "confident but wrong" problem
- Moving lookups to scripts means the data is always current — no LLM in the loop to hallucinate
- The Obsidian vault / KB gives agents a single verified source of truth to search against
- CLI backend doesn't make this worse or better — it's an agent design problem, not an infrastructure one

---

## Jarvis Context Bloat

Jarvis currently loads ~600KB+ of context every message. This makes every interaction expensive, even a simple voice note or quick question.

**Current context per message:**
| Component | Size | Needed Every Message? |
|-----------|------|-----------------------|
| SOUL.md | 2.7KB | Yes |
| CLAUDE.md | 5.3KB | Yes |
| MEMORY.md | 3.5KB | Yes (but could be trimmed) |
| AGENTS.md | ~2KB | Rarely |
| TOOLS.md | ~2KB | Rarely |
| USER.md | ~2KB | Yes |
| IDENTITY.md | ~0.4KB | Yes |
| 49 memory files | 488KB | No — most are weeks old |
| Foundation docs | 76KB | Rarely |
| Bootstrap hooks (Supabase facts, messages) | ~10KB | Sometimes |
| **Total** | **~600KB+** | |

**Target: ~50-80KB per message**

Strip to essentials:
- SOUL + CLAUDE + USER + IDENTITY (~10KB)
- Trimmed MEMORY.md with only current priorities (~3KB)
- A lean index of where to find things (~2KB)
- Everything else: read on demand, not loaded by default

This makes Jarvis 8-10x cheaper per message. He's still smart — the model doesn't change. He just stops carrying a library in his pocket when he only needs a phone book.

**TODO:** Audit and slim Jarvis's context. Archive old memory files. Reduce bootstrap injection. Test that he still functions well with lean context.

---

## The KB / Obsidian Vault

Current plan: migrate from scattered workspace docs and memory files to a centralised Obsidian vault at `/home/ricky/kb/`. This becomes the single source of truth for all agents.

**What goes in KB:**
- Verified business facts (team, processes, pricing, suppliers)
- SOPs (verified and current)
- Board schemas and column references
- Customer flow documentation
- Strategic decisions and their rationale

**What does NOT go in KB:**
- Session memories (ephemeral, go stale)
- Agent routing tables (config, not knowledge)
- Build specs (stay in `builds/`)

**Agent pattern:** Lean context + KB index → agent reads specific KB files when needed → cites source in response.

---

## Research Findings (Codex agents, 2026-04-04 overnight)

Six research briefs were completed. Full outputs in `builds/agent-rebuild/`. Key findings below.

### Correction: Jarvis Context Is Not 600KB

The Jarvis context audit (Brief 03) found that **workspace files only total ~29KB at startup** (~7,355 tokens). The `bootstrapTotalMaxChars` cap is 45,000 characters. The 600KB we estimated was wrong at the file layer.

The real cost driver is likely **hidden runtime overhead**: system prompts, tool schemas, session history, and OpenClaw metadata assembled at runtime — not the workspace files themselves. The 49 memory files (364KB) exist on disk but only today + yesterday files are loaded per session.

**What this means:** Slimming SOUL/CLAUDE files helps, but the real investigation needs to target OpenClaw's runtime prompt assembly to find where tokens are actually being spent.

**Still worth doing:** Archive stale memory files (8 files over 10KB each, biggest is 33KB). Promote durable findings to KB.

### Hugo: More Automated Than We Thought

The BM estate is more mature than assumed:
- 7 of 12 SOPs already have working automated scripts
- Only 3 SOPs genuinely need human judgement (repair, payment reconciliation, returns)
- 3 scripts are ready for cron but never scheduled: listings reconciliation, buy-box check, morning briefing
- **SOP 11 (Tuesday cutoff protocol)** has no implementation at all — direct revenue risk
- `morning-briefing.js` was built for a gap that SOP 03 explicitly calls out as missing, but was never deployed

**Action:** Schedule the 3 ready scripts. Build SOP 11. Hugo becomes strategy-only.

### Search Don't Load: Halfway There, Needs Standardisation

The tools for search-before-answer already exist in OpenClaw (read, exec, memory_search). The KB at `~/kb/` is well-structured. What's missing is **standardised enforcement**:
- Fleet-wide "I don't know" behaviour is basically absent from agent SOULs
- `backmarket` and `operations` already have good anti-hallucination rules — proof the pattern works
- `slack-jarvis`, `team`, `codex-reviewer`, `alex-cs` are the weakest — essentially no verification rules

**Action:** Add a standard 6-line Verification Rule block to every SOUL.md. Standardise Reference Docs sections in CLAUDE.md.

### Marketing Intelligence: Not Dead, Just Neglected

The platform was assumed dead but actually has real data:
- SQLite DB has 1,342 local rank rows, 110 organic rank rows from 32 completed scans
- Scrapers work, just need to run via crontab instead of broken OpenClaw crons
- The OpenClaw SEO crons failed because they used `delivery.mode: "silent"` which isn't valid
- GSC-based organic scraper exists and should replace the fragile browser-based one
- TikTok scraper is blocked and fragile — skip it

**Action:** Revive, don't rebuild. Move scrapers to crontab. Fix the DB path confusion (multiple empty DB files). Revive static dashboard only after API is trustworthy.

### System Audit Digest: Scripts for Truth, Agents for Interpretation

The March 2026 system audit pack is high-value with ~10 near-production scripts. Key findings:
- **Payment truth is the #1 unresolved system problem** — money can't be reliably connected to jobs, invoices, or operating state. Contaminates all domain decisions.
- **Customer service follow-up failure is a direct revenue leak** — slow replies, paid-but-not-contacted risk
- The business has enough data for team performance measurement — it's just under-using what exists
- Profitable repairs are missing from Shopify while negative-margin repairs are left live

**Working scripts to deploy:** `repair_profitability_v2.py`, `gsc_crossref_lean.py`, `monday_zombie_triage.py`, `intercom_deep_metrics.py`

### Automation Blueprint: The Target Architecture

The blueprint defines the full target estate:
- **~58 scripts/services, ~29 cron jobs, ~37 Slack/Telegram commands**
- **~10 real agents** (down from 17 today, and from the original 21 plan)
- Agents that survive: Jarvis, Alex, Marketing, Systems, Operations, Team, Parts, Hugo, Diagnostics + build agents
- Website and CS (as separate from Alex) recommended for retirement

**Build priority order:**
1. Finance truth rebuild (contaminates all other decisions)
2. CS operating surface (revenue leak)
3. Ops queue/aging/bottleneck visibility
4. Parts stock/reorder alerts
5. BM estate rationalisation (schedule remaining scripts, build SOP 11)

**Key design rule:** Slash commands call deterministic scripts. Only escalate to agents when users ask "why" or "what should we do."

### Cross-Cutting Themes

Every research output independently converged on the same conclusions:
1. **Scripts for truth, agents for judgement** — the core architecture principle
2. **Finance/payment truth is the #1 blocker** — referenced across multiple documents
3. **More working code exists than anyone thought** — BM scripts, MI platform, audit scripts are all partially live
4. **Anti-hallucination enforcement is the weakest fleet-wide discipline**
5. **OpenClaw cron is unreliable for deterministic jobs** — plain crontab is better
6. **The sub-agent concept is effectively dead** — replaced by scripts and cron jobs

---

## Open Questions

1. Should we reset all stale agent sessions before migration?
2. Sandbox mode "off" — any security implications for our setup?
3. Should Jarvis move to Sonnet for speed? (CLI backend + Opus = 4 min responses)
4. Investigate OpenClaw runtime prompt assembly — where are the real tokens being spent?
5. What's the timeline for the finance truth rebuild?
6. Do we archive Website and CS agents now, or wait?
