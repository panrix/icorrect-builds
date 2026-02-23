# Research: The Memory Problem

**Owner:** Jarvis (research) → Code (build)
**Created:** 2026-02-23
**Status:** Open — gathering approaches

---

## The Problem (Simple)

AI agents forget everything between sessions. They need to remember. This is unsolved at scale across the entire industry — not just us.

---

## Our Current Setup

- **MEMORY.md** — long-term curated file, loaded on main session startup
- **memory/YYYY-MM-DD.md** — daily log files, agent reads today + yesterday
- **SOUL.md / AGENTS.md** — static identity and instructions
- **memory-core plugin** — file-backed search (memory_search tool), agent must choose to call it
- **memory-lancedb plugin** — disabled. Vector search with auto-recall/capture. See below.

### What works
- Files persist between sessions ✅
- Agent can read files on startup ✅
- Manual memory writes work ✅

### What fails
- Agent forgets to save important things (judgment-dependent)
- Agent forgets to read relevant files (judgment-dependent)
- Compaction can wipe context before saving
- No enforcement — all memory operations are optional
- Daily files pile up, long-term memory rarely curated
- 21 agents × memory maintenance = unmanageable

---

## Approaches to Evaluate

### 1. What we have (file-based, agent-driven)
- Agent reads/writes markdown files
- Pros: simple, local, no dependencies
- Cons: relies on agent judgment, no auto-capture, no auto-recall

### 2. LanceDB plugin (built into OpenClaw, disabled)
- Vector DB with auto-recall (inject before turn) and auto-capture (after turn)
- Pros: automatic injection, local, already built
- Cons: narrow capture triggers, manual SOP seeding, no versioning
- Full gap analysis: see memory/2026-02-23-architecture-session.md

### 3. Kybernesis (cloud service)
- External memory platform with OpenClaw plugin
- Auto-capture every turn, hybrid search, auto-organisation ("sleep agent")
- Pros: most complete solution, polished, MCP integration
- Cons: data leaves VPS, external dependency, cost unknown, trust

### 4. Supabase-backed memory (custom build)
- We already use Supabase for facts. Extend it as the memory layer.
- pgvector for embeddings, structured tables for facts/decisions/SOPs
- Pros: we control it, already have infrastructure, queryable
- Cons: needs building, needs embedding pipeline

### 5. Simple append-only log
- One file per agent. Append after every session. Read on startup. Trim when too long.
- Pros: dead simple, no dependencies, no judgment needed
- Cons: grows fast, no search, loads everything or nothing

### 6. Hybrid: auto-inject from files (no vector DB)
- Before each turn, keyword/regex match user message against SOP filenames
- "payout" → load SOP-T5. "listing" → load SOP-L1. "suspended" → load SOP-T6.
- Pros: deterministic routing, no embeddings, no external service
- Cons: brittle, needs maintained keyword map, misses novel queries

### 7. OpenClaw plugin (custom)
- Write our own plugin using OpenClaw's plugin API
- Hook into before_agent_start and agent_end lifecycle events
- Full control over what gets injected, what gets captured, and how
- Pros: exactly what we need, no compromises
- Cons: development effort, maintenance

---

## Key Questions to Answer

1. **What must be remembered?** SOPs, decisions, lessons learned, customer context, errors made — or everything?
2. **What must be injected?** Only relevant SOPs for the current task? Or broader context?
3. **How much context per turn is acceptable?** Each injected memory costs tokens. 21 agents × every message adds up.
4. **Who maintains it?** If maintenance depends on agent judgment, it will fail. What's the zero-maintenance option?
5. **Local vs cloud?** Business data leaving the VPS is a security decision.
6. **Build vs buy?** Code's time building memory infra vs enabling something that exists.
7. **Is vector search necessary?** Or is deterministic keyword routing good enough for SOP injection?

---

## What the Community is Doing

### @SimonHoiberg (X post, Feb 2026)
**Approach:** PostgreSQL + pgvector + n8n as a RAG layer for OpenClaw.
1. Install PostgreSQL + pgvector on same server as OpenClaw
2. Create a search tool — agent labels memories, embeds them, stores label + vector + raw text
3. Cron/heartbeat flushes short-term memory (daily file) into the database
4. New sessions start lean — agent searches DB when it needs context

**His results:** Claims "much better memory, much smarter, much less token-greedy"

**What he got right:**
- Context bloat is the #1 problem — loading everything makes agents dumber
- Search-on-demand keeps context lean
- Cron flush from short-term → long-term is solid pattern

**What he didn't solve (our harder problem):**
- Still relies on agent CHOOSING to use the search tool — same compliance gap we identified
- No auto-injection before turn — agent must decide to search first
- Solves "remember what I said" not "follow this SOP every time"
- Single agent use case — no mention of scaling to multi-agent

**Relevance to us:** Validates pgvector/Supabase as the storage layer (we already have both). His approach + auto-injection (like LanceDB's before_agent_start hook) could be the combined solution.

### "Dear Sir, You Have Written a Database" (dx.tips/oops-database)
**Author:** swyx (dx.tips)
**Core argument:** Every team that avoids using a proper database ends up rebuilding one badly — schema, transactions, caching, indexing, query planning, security, audit logs — all in application code.

**Direct parallel to our memory problem:**
- "Just use markdown files" = "just use a basic KV store"
- We're already building: versioning (SOP updates), search (memory_search), caching (auto-inject), triggers (lifecycle hooks), consistency checks (agent judgment to save), access control (per-agent memory)
- We are building a database in SOUL.md rules and agent judgment

**The lesson:** Stop building memory infrastructure in application code. Use a proper memory backend from the start — pgvector/Supabase, LanceDB, or a purpose-built service. The "simple" approach already got complex; accept it and use the right tool.

---

## Decision Criteria

When comparing options, score on:
- **Reliability** — does it work without agent judgment?
- **Simplicity** — how many moving parts?
- **Cost** — tokens per turn, API costs, maintenance time
- **Security** — does data stay local?
- **Scalability** — works for 1 agent AND 21 agents?
- **Maintenance** — who keeps it working? Human, agent, or nobody needed?

---

## Next Steps

- [ ] Ricky + Code to review approaches
- [ ] Research community solutions (OpenClaw Discord, GitHub)
- [ ] Pick 1-2 approaches to prototype
- [ ] Test on BackMarket agent first (has SOPs ready)
- [ ] Measure: does it actually improve SOP compliance?
