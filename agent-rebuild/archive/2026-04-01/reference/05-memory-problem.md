# 05 — The Memory Problem

> Historical note: this file captures pre-rebuild memory framing and research. It is retained as background, not as the current live memory contract. Use `/home/ricky/builds/agent-rebuild/technical/control/documentation-state-summary-2026-04-01.md` and `/home/ricky/kb/system/` for current state.

> This is the core blocker. Without solving memory, nothing else matters.
> But the solution is simpler than we thought. It's not an engineering problem. It's a file structure problem.

## What We're Actually Building

Three-layer agent system for iCorrect:

1. **Think** — Agents that understand their domain, remember conversations, research, grow in knowledge, and partner with Ricky on strategy
2. **Act** — When decisions are made, something executes (scripts, sub-agents, automations)
3. **Build** — Creating tools and systems for the team (intake forms, dashboards, workflows)

Layer 1 must work before Layers 2 and 3 matter.

---

## Why Memory Is the Core Problem

Ricky's vision: agents who deeply understand their part of the business, learn from every conversation, and can context-switch between sub-topics without losing the thread.

**What that requires:**
- Talk to Operations about the team -> switch to SOPs -> come back to team -> agent remembers the team conversation
- Agent builds up a mental model of BM pricing through dozens of conversations
- Agent notices patterns across its domain and proactively suggests process improvements
- Agent retains and recalls context selectively based on what is being discussed

**What currently happens:**
- Every session starts from zero
- Memory is a raw Supabase dump injected wholesale at bootstrap
- No way to selectively recall "everything we discussed about team" when team comes up again
- Context window fills up when you inject all SOPs + all memory + all foundation docs
- Workspaces are cluttered with transcripts, JSON dumps, deprecated scripts, broken symlinks

---

## Memory Approaches Tried (v1, v2, v2.5) — All Failed

### Attempt 1: File-based memory
- Agents write to `memory/YYYY-MM-DD.md` daily files
- **Problem:** Files accumulate, no retrieval mechanism, no structure

### Attempt 2: CLI tool (save-fact.py)
- CLAUDE.md mandated agents call `save-fact.py` to save atomic facts to Supabase
- **Problem:** Agents ignore bash CLI instructions. Tested 3 times. Never worked.

### Attempt 3: Supabase bridge (current)
- Agents write markdown -> cron syncs to Supabase -> bootstrap injects 20 recent facts
- **What works:** Write side. Agents write markdown naturally. Sync picks it up.
- **What fails:** Read side. "20 most recent" != "20 most relevant". No structure. No filtering.

### The Pattern
Each attempt focused on making the WRITE or RETRIEVE side smarter. None of them addressed the real problem: **the data itself has no structure.**

---

## The Breakthrough: It's Not a Search Problem, It's a Structure Problem

### What we almost built (wrong again)

Our first instinct was to solve retrieval with engineering:
- Custom OpenClaw plugin with embedding pipeline
- Vector search via memory-core's hybrid BM25 + cosine similarity
- Auto-injection via `before_agent_start` hook (fires every message, confirmed)
- Semantic retrieval to find the "right" memories

This would have been v2's mistake #7 again: **building infrastructure before proving value.**

### What Felix Krause does (and it works)

Felix (one of the first OpenClaw users) doesn't use vector search at all. His pattern:

1. **Cron jobs pre-process raw data into structured markdown files** — email confirmations become structured travel files, conversations become archived learnings
2. **Each bot gets a specific folder** — "Mr. Travel Bot" reads from the travel folder. That's its entire world.
3. **Readonly by default** — agents read pre-processed data, they don't manage their own data pipeline
4. **Heartbeat for proactivity** — the bot checks its folder at intervals and pushes relevant info at the right time
5. **Nightly cron archives learnings** — no agent judgment on what to save, cron does it automatically

His "retrieval" is just file paths. The travel bot reads the travel folder. No embeddings. No vector search. Just **the right files in the right place.**

### Why this works

- 333 facts across 6 agents is not a database problem. It's a handful of well-organised files.
- Vector search finds needles in haystacks. We don't have a haystack — we have a messy desk.
- The agent doesn't need to "search" for the BM pricing strategy. It needs the pricing strategy to BE in its workspace, structured and current.
- OpenClaw already injects workspace files at bootstrap. If the files are right, the injection is right.

---

## The Actual Solution: Structured Workspaces + Crons

### Workspace Template (per agent)

```
~/.openclaw/agents/{agent_id}/workspace/
  SOUL.md              <- Identity and purpose (max 40 lines)
  CLAUDE.md            <- Operating rules (max 80 lines)
  USER.md              <- Who Ricky is, how he works

  sops/                <- Domain-specific SOPs
    index.md           <- SOP list with trigger conditions
    SOP-{name}.md      <- Individual SOPs (standalone, injectable)

  data/                <- Cron-refreshed, agent reads only
    {feed-name}.md     <- Pre-processed data feeds (structured markdown)

  decisions/           <- Structured decision log
    {topic}.md         <- What was decided, when, why, alternatives considered

  memory/              <- Agent writes here naturally + session-memory hook
    YYYY-MM-DD-*.md    <- Daily session logs (auto-generated)

  foundation/          <- Symlink to ~/.openclaw/shared/ (readonly)

  Nothing else at root. No scripts, no JSON dumps, no transcripts, no deprecated files.
```

### What goes where

| Folder | Who writes | How often | What's in it |
|--------|-----------|-----------|-------------|
| `sops/` | Ricky + Code (manual) | When SOPs change | Verified, numbered procedures |
| `data/` | Cron jobs (automated) | Per feed schedule | Pre-processed business data in markdown |
| `decisions/` | Agent (naturally) + cron (archival) | Per conversation | Structured: decision, reasoning, alternatives, date |
| `memory/` | Agent + session-memory hook | Every session | Conversation logs, observations, learnings |
| `foundation/` | Ricky + Code (manual) | Rarely | Company, team, goals, principles |

### How OpenClaw loads this

OpenClaw already handles most of this:
- **Bootstrap:** SOUL.md, CLAUDE.md, USER.md, MEMORY.md injected at session start (built-in)
- **session-memory hook:** Auto-saves last 15 conversation lines to `memory/` on `/new` (built-in, active)
- **Memory flush:** Before compaction, prompts agent to save durable notes (built-in, active)
- **memory-core:** Indexes all `.md` files in `memory/` into per-agent SQLite with hybrid search (built-in, needs reindexing)
- **memorySearch.extraPaths:** Can add `sops/`, `data/`, `decisions/` to the search index

### What we need to build (crons only)

Each agent needs cron jobs that keep its `data/` folder current. Examples:

**BackMarket agent:**
| Cron | Schedule | Output |
|------|----------|--------|
| `bm-orders.sh` | Every 15 min | `data/current-orders.md` — open orders with status, buyer, device |
| `bm-returns.sh` | Every hour | `data/active-returns.md` — returns needing attention |
| `bm-listings.sh` | Daily | `data/listing-summary.md` — active listings, prices, stock levels |
| `bm-metrics.sh` | Daily | `data/daily-metrics.md` — sales, returns rate, seller score |

**Operations agent:**
| Cron | Schedule | Output |
|------|----------|--------|
| `monday-queue.sh` | Every 15 min | `data/repair-queue.md` — current queue with priorities |
| `team-schedule.sh` | Daily | `data/team-today.md` — who's in, what they're working on |
| `xero-snapshot.sh` | Daily | `data/financial-snapshot.md` — cash position, invoices due |

**Customer Service agent:**
| Cron | Schedule | Output |
|------|----------|--------|
| `intercom-open.sh` | Every 30 min | `data/open-tickets.md` — unresolved conversations |
| `finn-performance.sh` | Daily | `data/finn-stats.md` — resolution rate, handoff rate |

These are simple scripts: call API, format as markdown, write to file. No LLM involved.

### Decision archival (cron)

A nightly cron processes `memory/*.md` files and extracts decisions into `decisions/`:

```
Input (from memory/2026-02-25-pricing.md):
  "Ricky decided to increase iPhone 15 Pro Max pricing by 5% across all
   conditions after reviewing competitor data showing we're 8% below market."

Output (appended to decisions/pricing.md):
  ## 2026-02-25: iPhone 15 Pro Max pricing increase
  - **Decision:** Increase pricing by 5% across all conditions
  - **Reasoning:** Competitor data shows 8% below market
  - **Decided by:** Ricky
```

This could be a simple script using Haiku for extraction (cheap, fast) or even regex-based for structured patterns.

---

## What Happens to the Research We Did

Not wasted. It's the safety net:

**memory-core (keep active, configure properly):**
- Reindex all agents so `memory_search` actually works
- Enable `extraPaths` to include `sops/`, `data/`, `decisions/`
- This gives agents the OPTION to search when they need deeper context
- Hybrid search, temporal decay, MMR all available if the volume grows

**before_agent_start hook (defer, don't delete):**
- Confirmed it fires every message with the current user prompt
- When memory volume outgrows file-based organisation (hundreds of decisions, thousands of facts), we build auto-injection using this hook
- The plugin architecture is understood and ready
- This is Phase 2, not Phase 1

**memory-lancedb (skip for now):**
- Weaker search than memory-core, narrow capture triggers
- Not needed if workspace structure is right
- Revisit only if memory-core + auto-injection proves insufficient

---

## Recommended Path

### Phase 1: Clean and structure workspaces (1-2 sessions)

For each active agent (start with BackMarket):
1. Audit current workspace — what's there, what's clutter
2. Create the folder structure: `sops/`, `data/`, `decisions/`, `memory/`
3. Move existing SOPs into `sops/` with `index.md`
4. Remove clutter: transcripts, JSON dumps, scraped HTML, deprecated scripts, broken symlinks
5. Trim SOUL.md (max 40 lines), CLAUDE.md (max 80 lines)
6. Write CLAUDE.md instructions: where to find things, where to write things

**Done when:** Agent boots with a clean workspace. Every file has a purpose. No clutter.

### Phase 2: Build data feed crons (1-2 sessions)

For each active agent:
1. Identify what data the agent needs to do its job
2. Write simple scripts: call API -> format markdown -> write to `data/`
3. Set up cron schedules
4. Verify: data files are current, readable, and useful

**Done when:** Agent's `data/` folder always has current, structured business data without the agent doing anything.

### Phase 3: Configure memory-core properly (1 session)

1. Reindex all agents (`openclaw memory index`)
2. Add `extraPaths` for `sops/`, `data/`, `decisions/`
3. Enable temporal decay (30-day half-life for dated files)
4. Enable hybrid search (vector 0.7 + text 0.3)
5. Test with real queries: "what did we decide about pricing?" should return relevant chunks

**Done when:** `openclaw memory search "pricing strategy" --agent backmarket` returns useful results.

### Phase 4: Decision archival cron (1 session)

1. Build a nightly cron that processes `memory/*.md` files
2. Extracts decisions, action items, key context into `decisions/{topic}.md`
3. Uses Haiku for extraction (cheap, fast) or regex for structured patterns

**Done when:** After a week of conversations, `decisions/` has structured, browsable decision history.

### Phase 5: Test and iterate (ongoing)

1. Use BackMarket agent for 1-2 weeks with the new structure
2. Does it recall relevant context? Does it follow SOPs? Does it know current data?
3. Identify gaps: what's missing from the workspace? What's being loaded that shouldn't be?
4. Only THEN consider auto-injection (before_agent_start plugin) if the volume requires it

---

## Technical Reference (from research, preserved for future phases)

### OpenClaw Hook Lifecycle (per message)

```
Message arrives
  1. message_received        (fire-and-forget)
  2. before_model_resolve    (can override model)
  3. before_agent_start      (can inject context via prependContext)
  4. before_prompt_build     (can modify system prompt, receives full session messages)
  5. llm_input               (observe)
  6. before_tool_call        (per tool, can block)
  7. after_tool_call         (per tool)
  8. llm_output              (observe)
  9. agent_end               (capture/process)
```

All of 2-9 fire on EVERY user message, not once per session. `before_prompt_build` also receives the full `messages` array. This means auto-injection can adapt to topic changes mid-conversation when we need it.

### memory-core Configuration Reference

```json
{
  "agents": {
    "defaults": {
      "memorySearch": {
        "provider": "openai",
        "model": "text-embedding-3-small",
        "extraPaths": ["sops/", "data/", "decisions/"],
        "query": {
          "maxResults": 6,
          "minScore": 0.35,
          "hybrid": {
            "enabled": true,
            "vectorWeight": 0.7,
            "textWeight": 0.3,
            "temporalDecay": {
              "enabled": true,
              "halfLifeDays": 30
            }
          }
        },
        "sync": {
          "onSessionStart": true,
          "onSearch": true,
          "watch": true
        }
      }
    }
  }
}
```

### Bootstrap File Size Limits

- Per-file: 20,000 characters (configurable via `bootstrapMaxChars`)
- Total: 150,000 characters (configurable via `bootstrapTotalMaxChars`)
- Large files get truncated with markers. Keep files concise.

### memory-lancedb (parked, not deleted)

Config to enable if ever needed:
```json
{
  "plugins": {
    "slots": { "memory": "memory-lancedb" },
    "entries": {
      "memory-lancedb": {
        "enabled": true,
        "config": {
          "embedding": { "apiKey": "${OPENAI_API_KEY}" },
          "autoRecall": true,
          "autoCapture": true
        }
      }
    }
  }
}
```

Limitations: OpenAI-only embeddings, top 3 results only, narrow capture triggers, no hybrid search. Replaces memory-core (exclusive slot). Only consider if structured workspaces + memory-core prove insufficient.

---

## Previous Research (preserved for reference)

- **Felix Krause (OpenClaw early adopter):** Structured folders + crons + readonly access + heartbeat. No vector search. The right files in the right place. This is what changed our approach.
- **SimonHoiberg:** PostgreSQL + pgvector + n8n as RAG layer. Validates vector search for scale but still relies on agent choosing to search.
- **Koylan's Progressive Disclosure:** L1 routing -> L2 module -> L3 data. Max 2 hops. Auto-loading is the only reliable pattern. Agents skip optional tools 56% of the time.
- **"Dear Sir, You Have Written a Database":** Stop building memory in application code. Use a proper backend. But also: don't build a database when a folder structure will do.
- **Episodic memory:** Store decisions with reasoning + alternatives + outcomes, not just facts. This informs the `decisions/` folder structure.

---

*Created: 2026-02-25*
*Updated: 2026-02-25 -- Rewrote recommended path. Structure first, engineering later.*
*Status: Ready. Code does Phase 0 technical groundwork first, then research-bm is built.*
