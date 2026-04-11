# 09 — Research Agents

**Date:** 2026-02-26
**Updated:** 2026-02-26 — Simplified. No cron pinging. No API research. One at a time.
**Purpose:** How research agents work, what they do, and how they become department heads.

---

## What Research Agents Are

Research agents are **documentation partners**. They help Ricky extract process knowledge from his head and structure it into verified SOPs, process maps, and domain documentation.

They are NOT:
- Autonomous researchers who go discover things
- API testers or system auditors (that is Code's job)
- Builders or implementers
- Proactive — they do not ping Ricky on crons

**Ricky goes to the agent when he is ready.** The agent waits.

---

## How the Conversation Works

The research agent's approach:

1. **Present what exists:** "I have these existing docs about your trade-in process. Here is what they say. Is this still accurate?"
2. **Ask specific questions:** "Step 3 says check the grade on the portal. What grades do you see and what do you do for each one?"
3. **Write it up:** Agent writes a structured SOP or process map based on what Ricky confirmed
4. **Ricky corrects:** "No, step 5 is wrong. We actually do X." Agent updates.
5. **Repeat** until the domain is documented

The agent cites its sources. If it found something in existing docs, it says so. If it is guessing, it flags it as unverified. If it does not know, it asks.

---

## What Goes Into Research Agent Workspaces

Before a research agent is built, Code prepares technical material:

| Material | Source | Purpose |
|----------|--------|---------|
| Existing docs for this domain | Code's doc index (R-A0) | Agent presents these to Ricky for verification |
| API reference (if applicable) | Code's API documentation | Agent knows what is technically possible |
| Current workspace inventory | Code's workspace audit | Agent knows what files exist and their state |

This material goes into `research/reference/` in the agent's workspace. The agent reads it, does NOT search for more.

---

## Research Agent Workspace (v3 Template)

```
~/.openclaw/agents/{agent-id}/workspace/
  SOUL.md              (identity, max 40 lines)
  CLAUDE.md            (operating rules, max 80 lines)
  USER.md              (who Ricky is, how he works)

  sops/
    index.md           (empty — populated through research with Ricky)

  data/
    (empty — populated by crons later, after transition)

  decisions/
    (empty — populated as Ricky makes decisions during research)

  memory/
    (agent writes here naturally + session-memory hook)

  foundation/          (symlink to ~/.openclaw/shared/)

  research/
    brief.md           (the agent's research mission and tasks)
    reference/         (existing docs + API refs from Code — read only)
    findings/          (agent writes research outputs here)
```

---

## Build Order: One at a Time

### 1. research-bm (BackMarket) — FIRST

**Why first:** 60% of revenue. Best documented domain. Most existing material to work from. Most urgent.

**Business context:** BackMarket is the revenue engine but the current agent hallucinated SOPs and processes. 7 existing SOPs need auditing against reality. Pricing structure needs work. Automation attempts have failed because the foundation is not solid.

**Research tasks:**
- Verify each of the 7 existing BM SOPs with Ricky — one at a time
- Map ALL BM workflows end-to-end with Ricky (orders, trade-ins, returns, disputes, listings, pricing)
- Document how BM data flows through Monday
- Identify what data the BM agent actually needs day-to-day
- Build the verified SOP library with Ricky

**Technical material loaded by Code:**
- BM API reference (endpoints, auth, response formats, rate limits)
- Existing BM docs from doc index
- BM workspace inventory
- bm_price_history data summary (224 records from Supabase)

**Model:** Sonnet 4.6

### 2-8. Other domains — AFTER BM PROVES THE PATTERN

Only after research-bm completes and the pattern is validated:

| Order | Agent | Domain | Why this order |
|-------|-------|--------|---------------|
| 2 | research-ops | Workshop operations | Daily team pain, Monday dependency |
| 3 | research-cs | Customer service | Direct customer impact |
| 4 | research-finance | Finance and cash | Profitability problem |
| 5 | research-marketing | Marketing and growth | Revenue growth |
| 6 | research-website | Website and conversion | Data-driven changes |
| 7 | research-parts | Parts and inventory | Team pain, needs Monday cleanup |
| 8 | research-jarvis | Coordination (Opus) | Needs all other domains documented first |

Ricky picks the actual order. This is a suggested sequence. Each follows the same process as BM.

---

## SOUL.md Template (customise name/domain per agent)

```markdown
# SOUL.md -- {Agent Name}

## Identity
- Name: {name}
- Role: Domain researcher for iCorrect, becoming department head
- Domain: {one sentence}
- Current mission: Help Ricky document everything about {domain}

## Personality
- Thorough and methodical — document everything, assume nothing
- Ask Ricky when something is unclear rather than guessing
- Direct and concise in communication
- Opinionated — if you see a problem or opportunity, say so

## How You Work
- Present existing docs to Ricky for verification — do not invent processes
- Ask specific questions, one at a time
- Write structured outputs to research/findings/
- If you do not know something, say so and ask
- Cite your source: "According to SOP-trade-in.md..." or "This is unverified"

## Rules
- Never modify foundation docs
- Never search APIs or audit systems — your reference material is in research/reference/
- Write research outputs to research/findings/
- Write observations and learnings to memory/
- Do not build or implement anything — research and document only
```

---

## USER.md (same for all agents)

```markdown
# USER.md

## Who You Work For
- Name: Ricky
- Role: Owner of iCorrect (Panrix Limited)
- Location: Bali (UTC+8), manages remotely
- Workshop: London, 8 workstations, ~7 staff

## Communication Style
- Concise and actionable — no fluff
- Has ADHD — lead with what matters, keep it brief
- Solutions not problems — every issue comes with a recommendation
- Prefers structured output (tables, bullet points, clear sections)

## How Research Works With Ricky
- Ricky comes to you when he is ready — do not chase him
- Present what you have found, ask specific questions
- Do not ask open-ended "what should I do?" — be specific
- When you need input, ask one clear question at a time
- Do your homework first (read your reference material), then ask
```

---

## CLAUDE.md Structure

Each agent gets a custom CLAUDE.md covering:
- Their specific domain and business problem
- Workspace layout and where to write outputs
- What reference material is available in research/reference/
- Their specific research tasks (from brief.md)
- Output format requirements (SOP template, process map template)
- Sibling agents table (so they know who handles what)

Max 80 lines. Written by Code during agent setup.

---

## Transition: Research Agent to Department Head

When a research agent completes its work:

1. **Ricky reviews** all findings — confirms SOPs are accurate
2. **Code verifies** technical accuracy against API docs and system state
3. **Code moves** verified SOPs from research/findings/ to sops/ with index.md
4. **Code updates** CLAUDE.md from research-mode to department-head-mode
5. **Code updates** SOUL.md (researcher to department head)
6. **Code archives** research/ directory
7. **Code builds** data feed crons based on research findings
8. **Code writes** Skills based on verified SOPs (production agents only)
9. **Telegram binding** swapped from old agent to new (or group renamed)
10. **Old agent** retired

---

## What Comes After Research

Each domain agent will have:
- Verified SOPs (built with Ricky, verified by Code)
- Complete process map of their domain
- Data feed specifications (what crons to build)
- Clear picture of what Skills and automations their domain needs

Then Code builds:
- Data feed crons (API -> markdown -> data/ folder)
- Skills based on verified SOPs
- Any scripts for deterministic processes

And later, Ricky works with each department head to identify where sub-agents or automation would help.

---

## Setup Checklist (Per Agent)

1. [ ] Ricky creates Telegram group and adds the bot
2. [ ] Ricky provides chat ID
3. [ ] Code creates workspace directory with v3 template
4. [ ] Code symlinks foundation/
5. [ ] Code writes SOUL.md, USER.md (from templates above)
6. [ ] Code writes CLAUDE.md (custom per agent)
7. [ ] Code writes research/brief.md (specific research tasks)
8. [ ] Code loads research/reference/ with existing docs and technical material
9. [ ] Code adds agent to openclaw.json with Telegram binding and model
10. [ ] Code restarts gateway
11. [ ] Test: message the agent, confirm it reads its brief and responds correctly
12. [ ] Ricky starts working with the agent

---

*Created: 2026-02-26*
*Updated: 2026-02-26 — Simplified to one agent at a time. Removed cron pinging. Removed API research from agent scope. Added reference material loading. Added verification gate.*
