# Search, Don’t Load — Research

Date: 2026-04-04
Scope: `~/.openclaw/agents/*/workspace/SOUL.md`, `CLAUDE.md`, `~/.openclaw/openclaw.json`, `~/.openclaw/shared/*.md`, `~/kb/`, and `/home/ricky/builds/agents/research.md`
Method: read-only research only; no existing files modified

---

## Executive answer

The system should move to a stronger **search-first, don’t preload shared knowledge** pattern.

But the correct version is **not** “load nothing.” It is:

1. **Auto-load a tiny local operating core**
   - identity
   - user preferences
   - current working state
   - one short role-critical control doc if necessary
2. **Search shared knowledge first**
   - KB
   - large docs trees
   - build-local research
   - older memories
3. **Read exact files/snippets before making claims**
4. **If the answer is not verified, say so explicitly instead of guessing**

This matches both the technical shape of OpenClaw and the anti-hallucination principles already present across much of the agent fleet.

---

## 1. Current state per agent

## 1.1 SOUL.md audit — search / verification behaviour

The table below reflects the current SOUL.md posture as directly checked from `~/.openclaw/agents/*/workspace/SOUL.md`.

| Agent | Has search / verify rules? | Has source / evidence language? | Has explicit “I don’t know” rule? | Mentions specific paths / knowledge locations? | Has anti-hallucination rule? | Notes |
|---|---|---:|---:|---:|---:|---|
| `alex-cs` | No clear search language | No | No | Yes | No | Relies more on CLAUDE.md evidence sources than SOUL.md. |
| `arlo-website` | Yes | Yes | No | Yes | No | Stronger evidence/search posture than most. |
| `backmarket` | Yes | Yes | No | Yes | Yes | One of the clearest anti-guessing SOULs. |
| `build-orchestrator` | Yes | Yes | No | No | No | Emphasises verification/orchestration more than file-path lookup. |
| `codex-builder` | Yes | No explicit citing | No | No | Yes | Strong “real repo, not memory” / “do not invent” posture. |
| `codex-reviewer` | No clear search language | No | No | No | No | Needs strengthening. |
| `customer-service` | Yes | No explicit citing | No | No | No | Verification present but not as explicit as it should be. |
| `diagnostics` | Yes | Yes | No | Yes | Yes | Strong evidence-based posture. |
| `main` | Yes | Yes | No | No | No | Search/evidence posture exists, but “say I don’t know” should be explicit. |
| `marketing` | Yes | Yes | No | No | No | Good direction, but still missing explicit uncertainty rule. |
| `operations` | Yes | Yes | No | Yes | Yes | Stronger than average. |
| `parts` | Yes | No explicit citing | No | No | No | Depends heavily on CLAUDE evidence sources. |
| `pm` | Yes | Yes | No | Yes | No | Good source posture. |
| `slack-jarvis` | No clear search language | No | No | No | No | Weakest posture; should be fixed. |
| `systems` | Yes | Yes | No | No | No | Verification language present. |
| `team` | No clear search language | No | No | No | No | Also needs strengthening. |
| `website` | Yes | No explicit citing | No | No | No | Search posture present but incomplete. |

### Main finding from SOULs
Across the fleet:
- **search / verification language is common but inconsistent**
- **explicit source citing is only present in some SOULs**
- **explicit “I don’t know / I’m not sure” behaviour is basically missing**
- **anti-hallucination wording exists in some of the stronger agents, but not fleet-wide**

So the current problem is not “agents have no verification instinct.”
It is that the system does **not standardise it strongly enough**.

---

## 1.2 CLAUDE.md audit — reference and read-on-demand patterns

The current CLAUDE.md files are actually stronger than most SOULs at telling agents where to look.

| Agent | Has Reference Docs / Evidence Sources section? | Encourages read-on-demand behaviour? | Distinguishes carry vs search? | Notes |
|---|---:|---:|---:|---|
| `alex-cs` | Yes | Yes | Yes | Good evidence-source section with concrete KB/workspace paths. |
| `arlo-website` | Yes | Yes | Yes | Strong reference structure. |
| `backmarket` | Yes | Yes | Yes | Clear, concrete evidence/source routing. |
| `build-orchestrator` | No clear dedicated section | No clear read-on-demand pattern | Yes | Needs a proper reference section. |
| `codex-builder` | No clear dedicated section | No clear read-on-demand pattern | Yes | Workspace startup rules exist, but not a standard reference-doc pattern. |
| `codex-reviewer` | No clear dedicated section | No clear read-on-demand pattern | Yes | Needs explicit reference-doc pattern. |
| `customer-service` | Yes | Yes | Yes | Good evidence section. |
| `diagnostics` | Yes | Yes | Yes | Strong pattern. |
| `main` | Yes | Yes | Yes | Good structure, though it can be tightened further. |
| `marketing` | Yes | Yes | Yes | Good evidence-source routing. |
| `operations` | Yes | Yes | Yes | Good evidence-source routing. |
| `parts` | Yes | Yes | Yes | Good evidence-source routing. |
| `pm` | Yes | Yes | Yes | Good pattern. |
| `slack-jarvis` | Yes | Not clearly | Yes | Reference structure exists, but read-on-demand behaviour is weaker. |
| `systems` | Yes | Yes | Yes | Good reference posture. |
| `team` | Yes | Yes | Yes | Good reference posture despite weaker SOUL. |
| `website` | Yes | Yes | Yes | Good pattern. |

### Main finding from CLAUDE.md
Most CLAUDE.md files already follow a useful pattern:
- evidence sources are listed
- KB vs workspace vs build-local distinctions are called out
- agents are told to prefer fresher verified sources when sources disagree

So the **best current behaviour is already emerging in CLAUDE.md**, not SOUL.md.

That suggests the right move is:
- add a standard anti-hallucination/search section to **SOUL.md**
- standardise a stronger **Reference Docs / Evidence Sources** block in **CLAUDE.md**

---

## 2. OpenClaw tool capabilities available to agents

## 2.1 What the runtime config says

From `~/.openclaw/openclaw.json`:

- `agents.defaults.bootstrapTotalMaxChars = 45000`
- `agents.defaults.contextTokens = 1000000`
- `agents.defaults.memorySearch.enabled = true`
- `agents.defaults.memorySearch.extraPaths = ["knowledge/", "docs/", "data/", "kb/"]`
- `agents.defaults.contextPruning.mode = "cache-ttl"`
- `agents.defaults.contextPruning.ttl = "12h"`
- `agents.defaults.compaction.mode = "safeguard"`
- `tools.profile = "full"`
- `tools.exec.security = "full"`
- `tools.exec.ask = "off"`
- `tools.sessions.visibility = "all"`

### What that means
- Bootstraps are explicitly capped.
- Search is enabled across extra knowledge paths.
- Full tool profile is available.
- Exec is powerful enough to act as a file-search fallback.

This configuration already supports a **search-first operating model**.

## 2.2 What native file-access/search capabilities agents effectively have

From the actual tool surface available in this runtime, agents have direct access to:
- `read`
- `write`
- `edit`
- `exec`
- `memory_search`
- `memory_get`
- browser + sessions + messaging + others

### Practical answer to the brief’s tool question
- **Read:** yes, directly available
- **Grep:** not exposed here as a first-class named tool
- **Glob:** not exposed here as a first-class named tool

But agents can still do the equivalent via:
- `exec` with `find`, `grep`, `rg`, `ls`, Python helpers, etc.
- `memory_search` for semantic narrowing
- `read` for exact retrieval

So the practical workflow is already available today:

> **search structurally or semantically → identify the right file → read exact content**

## 2.3 What `tools.profile: "full"` gives in practice

In this environment, `full` includes broad operational capability:
- file reads/writes/edits
- shell execution
- browser automation
- sessions and agent-to-agent routing
- cron management
- messaging
- memory retrieval
- PDF/image analysis
- config/gateway control

For this question, the relevant conclusion is simple:
- there is **enough tooling already** to enforce “search, don’t load” behaviour
- the missing piece is **instruction standardisation**, not tool invention

---

## 3. KB current state

## 3.1 KB structure

`~/kb/` is already organised as a real shared knowledge base, not a dumping ground.
Observed top-level structure includes:

- `README.md`
- `agents/`
- `backmarket/`
- `decisions/`
- `inbox/`
- `monday/`
- `operations/`
- `pricing/`
- `system/`
- `team/`

And meaningful files like:
- `monday/main-board.md`
- `monday/bm-devices-board.md`
- `operations/intake-flow.md`
- `operations/qc-workflow.md`
- `pricing/iphone.md`
- `pricing/macbook.md`
- `system/runtime/workspace-contract.md`
- `system/runtime/live-operating-map.md`
- `decisions/2026-04-01-openclaw-kb-boundary.md`

## 3.2 Is there an index file?

**Yes.**
There are multiple index-like entry points:
- `~/kb/README.md`
- `~/kb/system/README.md`
- `~/kb/decisions/README.md`

So KB is not missing structure.
What is missing is a stronger fleet-wide convention for how agents should use it.

## 3.3 How agents currently reference KB files

Most current agents reference KB in one of these ways:
- “Shared operational truth belongs in `/home/ricky/kb`”
- “Check `/home/ricky/kb/<area>/` before making claims”
- “If sources disagree, default to the freshest verified source”

That is directionally good.
But it is still broad enough that agents can:
- forget to actually read the file
- rely on memory instead of retrieval
- cite the KB namespace without checking the specific file

So the current KB usage pattern is **promising but too soft**.

---

## 4. Best-practice findings from foundation docs

## 4.1 From `builds/agents/research.md`

The most relevant takeaway is the **three-layer context model**:

1. Supabase facts / compact bootstrap context
2. CLAUDE.md index of where docs live
3. Full Git documentation files read on demand

That is already the right conceptual model.
It should now be applied more consistently across the fleet.

## 4.2 From `shared/PRINCIPLES.md`

The strongest relevant rule is explicit:
- **No hallucinations. No fabrication. Ever.**
- **If you don’t know, say you don’t know.**
- **Every conclusion must have a breadcrumb trail**

This should be turned from a general principle into a standard, visible per-agent operating rule.

## 4.3 From other shared docs

The shared docs folder contains:
- `COMPANY.md`
- `CREDENTIALS.md`
- `GOALS.md`
- `LEARNINGS.md`
- `PRINCIPLES.md`
- `PROBLEMS.md`
- `RICKY.md`
- `SUPABASE.md`
- `TEAM.md`
- `VISION.md`

These are valuable shared references, but they are exactly the kind of corpus that should be:
- **available to search/read**
- **not blindly preloaded into every agent session**

So the shared docs structure itself supports “search, don’t load.”

---

## 5. Proposed standard pattern

## 5.1 Standard SOUL.md section (5–10 lines)

This should be added near the top of every SOUL.md, with only minor domain-specific edits.

### Proposed SOUL.md block

```md
## Verification Rule

- Do not guess. Do not invent missing facts.
- If the answer depends on a file, system state, or prior documented decision, search for it first.
- Read the relevant source before making a factual claim.
- If sources disagree, say so and prefer the freshest verified source.
- If you cannot verify the answer, say "I don’t know" or "I’m not sure" and explain what needs checking.
- When useful, cite the file or path you used so the reasoning trail is visible.
```

### Why this works
It is short enough to live in every SOUL.
It explicitly covers:
- anti-hallucination
- search-before-answer
- source conflict handling
- uncertainty behaviour
- traceability

## 5.2 Standard CLAUDE.md “Reference Docs” section template

This should appear in every CLAUDE.md and be customised to the domain.

### Proposed CLAUDE.md block

```md
## Reference Docs

Use these sources in this order:

1. Current task evidence (live system state, active thread, current board/item, current logs)
2. Domain KB files under `/home/ricky/kb/<domain>/`
3. Current runtime/system docs under `/home/ricky/kb/system/`
4. Workspace-local docs under `/home/ricky/.openclaw/agents/<agent>/workspace/docs/`
5. Build-local implementation docs under `/home/ricky/builds/<project>/`

Rules:
- Do not rely on memory when a current file can be checked.
- Search/list first when the exact file is unclear.
- Read the exact file before making policy, process, or status claims.
- If sources disagree, state the conflict and default to the freshest verified source.
```

### Why this works
It gives agents:
- a clear precedence order
- explicit search/list-first instruction
- explicit rule about when memory is insufficient

## 5.3 KB index pattern

The KB already has top-level READMEs, so the right move is not to reinvent the KB.
It is to formalise a lightweight index rule:

### Proposed KB index model
Every KB directory should ideally contain:
- `README.md` with:
  - what the section covers
  - which files are canonical
  - what is historical/reference-only
  - related sibling sections

### Suggested format

```md
# <Section Name>

## Purpose
What truth lives here.

## Canonical Files
- `file-a.md` — what it is
- `file-b.md` — what it is

## Related Sections
- `../system/...`
- `../operations/...`

## Notes
- What should not be stored here
- What is still provisional or incomplete
```

This gives agents a predictable index surface without requiring them to preload full trees.

## 5.4 Rules for when an agent MUST read a file

An agent must read the source file when:
- answering about **current policy**
- answering about **prior decisions**
- answering about **specific dates, commitments, or TODOs**
- answering about **current workflow or SOP steps**
- answering about **board schemas / field meanings / config values**
- making claims that affect **customer, finance, or operational actions**
- the question depends on a **named document, report, or path**

Context alone is sufficient only when:
- the answer comes from the agent’s stable identity/role rules
- the user asks for general reasoning or brainstorming, not factual recall
- the fact is already explicitly present in the immediate conversation and does not need external verification

### Practical shorthand
- **If it matters and can drift, read it.**
- **If it is role identity or immediate chat context, bootstrap/context is enough.**

---

## 6. Implementation plan

## 6.1 Fleet-wide changes

### Change 1 — Add standard SOUL verification block to every agent
Apply to all agents, especially weaker ones:
- `alex-cs`
- `codex-reviewer`
- `slack-jarvis`
- `team`
- `parts`
- `website`
- `customer-service`

### Change 2 — Standardise CLAUDE reference-doc block
Strong candidates already exist for:
- `main`
- `operations`
- `marketing`
- `parts`
- `customer-service`
- `backmarket`

So this is mostly:
- normalise wording
- add explicit source order
- add explicit search/list-first instruction

### Change 3 — Add explicit uncertainty rule fleet-wide
Every agent should be told explicitly:
- if unverified, say so
- if unknown, say so
- do not “round off” uncertainty into confidence

This is the biggest missing behaviour from the current fleet.

## 6.2 Per-agent recommendations

| Agent | What to change |
|---|---|
| `main` | Keep current evidence posture, add explicit “I don’t know / I’m not sure” rule and sharper source-order rule. |
| `operations` | Already strong; add standard SOUL verification block for consistency. |
| `backmarket` | Already strong; minor normalisation only. |
| `marketing` | Keep evidence sources, add stronger anti-guessing and explicit uncertainty behaviour. |
| `website` | Add stronger source-citing and explicit file-read requirements. |
| `parts` | Add stronger SOUL anti-hallucination block; keep current CLAUDE evidence paths. |
| `team` | Biggest upgrade needed in SOUL; CLAUDE is already better than SOUL. |
| `customer-service` | Add explicit no-guess / uncertainty rule in SOUL. |
| `alex-cs` | Add stronger SOUL verification posture; current CLAUDE evidence section is better than SOUL. |
| `systems` | Mostly fine; add standard uncertainty wording. |
| `pm` | Mostly fine; standardise around source order. |
| `slack-jarvis` | Needs the strongest rewrite: search rules, anti-hallucination rules, source order, uncertainty behaviour. |
| `build-orchestrator` | Add formal reference-doc section in CLAUDE; keep orchestration rules. |
| `codex-builder` | Keep “real repo, not memory”; add explicit reference-doc section and explicit uncertainty rule. |
| `codex-reviewer` | Needs stronger verification/search posture in both SOUL and CLAUDE. |
| `arlo-website` | Already relatively strong; standardise only. |
| `diagnostics` | Already relatively strong; standardise only. |

## 6.3 KB changes

### Minimal KB work needed
The KB itself is already usable.
So the implementation work is mostly:
- ensure each major KB section has a good `README.md`
- mark canonical vs provisional files clearly
- keep KB as the durable shared layer, not a prompt dump

### No need to do
- no need to flatten the KB
- no need to auto-load KB docs at startup
- no need to duplicate KB into every workspace

---

## 7. Final conclusion

The current system is already halfway to “search, don’t load”:
- OpenClaw config supports it
- KB structure supports it
- many CLAUDE.md files already hint at it
- the shared principles explicitly demand non-fabrication

What is missing is a **standard enforced retrieval posture**.

### Best version of the rule

> **Load only a tiny local operating core. Search shared knowledge first. Read exact sources before making claims. If you cannot verify, say so.**

That is the cleanest answer to the hallucination problem.
It is also the best fit for the current OpenClaw architecture.

---

## Sources checked

### Agent files
- `~/.openclaw/agents/*/workspace/SOUL.md`
- `~/.openclaw/agents/*/workspace/CLAUDE.md`

### Runtime config
- `/home/ricky/.openclaw/openclaw.json`

### KB
- `/home/ricky/kb/README.md`
- `/home/ricky/kb/system/README.md`
- `/home/ricky/kb/decisions/README.md`
- sampled KB file tree under `/home/ricky/kb/`

### Foundation docs
- `/home/ricky/builds/agents/research.md`
- `/home/ricky/.openclaw/shared/PRINCIPLES.md`
- file inventory of `/home/ricky/.openclaw/shared/*.md`

### Supporting evidence on current direction
- `/home/ricky/kb/decisions/2026-04-01-openclaw-kb-boundary.md`
- `/home/ricky/kb/system/runtime/workspace-contract.md`
- `/home/ricky/kb/system/runtime/live-operating-map.md`
