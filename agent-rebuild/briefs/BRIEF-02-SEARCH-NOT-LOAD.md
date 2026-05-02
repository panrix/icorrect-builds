# Brief 02: "Search Don't Load" Research

**For:** Codex agent (read-only research)
**Output:** `/home/ricky/builds/agent-rebuild/search-not-load-research.md`

---

## Context

Our agents hallucinate when they don't have data — instead of searching for the answer or saying "I don't know", they fabricate information. We need to fix this. The principle is "Search, Don't Load" — agents carry a lean index of where to find things, and read files on demand rather than loading everything into context.

## Task

### 1. Audit every agent's SOUL.md for search/verification instructions
Read SOUL.md for every agent at `~/.openclaw/agents/*/workspace/SOUL.md`

Document for each:
- Does the SOUL mention searching files before answering?
- Does it require citing sources?
- Does it instruct the agent to say "I don't know" when unsure?
- Does it reference specific file paths or knowledge locations?
- Any anti-hallucination rules?

### 2. Audit CLAUDE.md files for reference patterns
Read CLAUDE.md for every agent at `~/.openclaw/agents/*/workspace/CLAUDE.md`

Document:
- Does it have a "Reference Docs" section pointing to file paths?
- Does it instruct read-on-demand behaviour?
- How much context does it tell the agent to carry vs search for?

### 3. Check OpenClaw's built-in capabilities
Read OpenClaw documentation and config:
- `~/.openclaw/openclaw.json` — check `memorySearch`, `tools`, `exec` settings
- What file search/read tools does OpenClaw give agents natively?
- Can agents use `Read`, `Grep`, `Glob` tools through the CLI backend?
- What tools are available via `tools.profile: "full"`?

### 4. Read the KB structure
- `~/kb/` — what's in there, how is it organised?
- How do agents currently reference KB files?
- Is there an index file?

### 5. Research best practices
Read:
- `/home/ricky/builds/agents/research.md` — section 8 (Documentation Strategy) covers the three-layer context model
- `/home/ricky/.openclaw/shared/PRINCIPLES.md` — the "Never Guess" principle
- Any other foundation docs in `~/.openclaw/shared/` that relate to accuracy

### 6. Propose a pattern
Based on findings, propose:
- A standard SOUL.md section (5-10 lines) that enforces search-before-answer
- A standard CLAUDE.md "Reference Docs" section template
- How the KB index should work (what format, what goes in it)
- Rules for when an agent MUST read a file vs when context is sufficient

## Output format

Write to `/home/ricky/builds/agent-rebuild/search-not-load-research.md` with:
1. Current state per agent (table: agent → has search rules → has source citing → has "I don't know" rule)
2. OpenClaw tool capabilities available to agents
3. KB current state
4. Proposed pattern with example SOUL.md and CLAUDE.md sections
5. Implementation plan (what to change in each agent)

**Do NOT modify any files. Read-only research.**
