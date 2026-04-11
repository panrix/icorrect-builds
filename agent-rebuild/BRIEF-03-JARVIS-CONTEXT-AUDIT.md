# Brief 03: Jarvis Context Audit

**For:** Codex agent (read-only research)
**Output:** `/home/ricky/builds/agent-rebuild/jarvis-context-audit.md`

---

## Context

Jarvis (main agent, Opus) loads ~600KB+ of context on every message. This makes every interaction expensive — even a simple voice note costs the same as a complex planning session. We need to identify what's essential vs what can be read on demand.

Target: reduce per-message context from ~600KB to ~50-80KB.

## Task

### 1. Measure every file that loads into Jarvis's context

Read and measure (character count + estimated token count at ~4 chars/token):

**Always loaded (system files):**
- `~/.openclaw/agents/main/workspace/SOUL.md`
- `~/.openclaw/agents/main/workspace/CLAUDE.md`
- `~/.openclaw/agents/main/workspace/MEMORY.md`
- `~/.openclaw/agents/main/workspace/AGENTS.md`
- `~/.openclaw/agents/main/workspace/TOOLS.md`
- `~/.openclaw/agents/main/workspace/USER.md`
- `~/.openclaw/agents/main/workspace/IDENTITY.md`
- `~/.openclaw/agents/main/workspace/HEARTBEAT.md`
- `~/.openclaw/agents/main/workspace/WORKING-STATE.md`

**Memory files (all loaded?):**
- `~/.openclaw/agents/main/workspace/memory/*` — list every file with size and date
- Are ALL memory files loaded on every message, or only recent ones?

**Foundation docs (symlinked shared):**
- `~/.openclaw/agents/main/workspace/foundation/*` — list every file with size

**Bootstrap injection:**
- Check `~/.openclaw/hooks/supabase-bootstrap/handler.js` — what does it inject?
- Check `~/.openclaw/hooks/agent-activity-logger/handler.js`
- Check `~/.openclaw/hooks/dependency-check/handler.js`
- Check `~/.openclaw/hooks/supabase-memory/handler.js`
- What data comes from Supabase at bootstrap? How much?

**KB and docs:**
- `~/.openclaw/agents/main/workspace/kb/` — if this symlink exists, what's in it?
- `~/.openclaw/agents/main/workspace/docs/` — any docs that auto-load?

### 2. For each file, classify

| File | Size (chars) | Est. Tokens | Loaded When | Essential? | Recommendation |
|------|-------------|-------------|-------------|------------|----------------|

Essential = needed on >50% of messages. Classifications:
- **KEEP** — needed every message (identity, core instructions, current priorities)
- **TRIM** — has useful content but too verbose, should be shortened
- **ON-DEMAND** — valuable but only needed when the topic comes up, should be read via file tool
- **ARCHIVE** — stale or redundant, move out of active context
- **DELETE** — no value

### 3. Read the OpenClaw config for context settings
From `~/.openclaw/openclaw.json`:
- `bootstrapTotalMaxChars` — what's the cap?
- `contextTokens` — what's the window?
- `memorySearch` config — does this control what loads?
- `compaction` settings — how does compaction work?
- `contextPruning` settings

### 4. Propose a slim context

Write a proposed file list for Jarvis that totals under 80KB:
- What stays in SOUL.md (trimmed)
- What stays in CLAUDE.md (trimmed)
- What goes in a lean MEMORY.md (current priorities only, no history)
- Which memory files get archived
- Which foundation docs get removed from auto-load
- What the bootstrap should inject (minimal)

### 5. Also check other active agents for comparison
Quickly check context sizes for Alex (alex-cs) and Marketing — how much do they load? Are they leaner?

## Output format

Write to `/home/ricky/builds/agent-rebuild/jarvis-context-audit.md` with:
1. Complete inventory table (every file, size, classification)
2. Total current context size
3. Bootstrap hook analysis (what gets injected)
4. Proposed slim context with target sizes
5. Archive plan for old memory files
6. Comparison with other agents

**Do NOT modify any files. Read-only research.**
