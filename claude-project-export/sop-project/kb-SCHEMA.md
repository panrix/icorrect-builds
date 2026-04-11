# KB Schema — LLM Wiki Pattern

This document defines how the iCorrect knowledge base is maintained by LLMs. It is the rulebook for any agent or tool that writes to this KB.

Based on Karpathy's LLM Wiki pattern: raw sources are ingested, compiled into a structured wiki, and maintained through ongoing operations.

---

## Three Layers

### 1. Raw Sources (immutable, never edited)
Where original information lives. These are inputs to the wiki, not the wiki itself.

| Source Type | Location |
|-------------|----------|
| Voice note transcripts | `/home/ricky/voice-notes/transcripts/` |
| System audit research | `/home/ricky/builds/system-audit-2026-03-31/research/` |
| Agent rebuild research | `/home/ricky/builds/agent-rebuild/` |
| Ricky's systems dump | `/home/ricky/builds/agent-rebuild/ricky-systems-dump.md` |
| Build project specs | `/home/ricky/builds/*/` |
| Agent memory files | `~/.openclaw/agents/*/workspace/memory/` |
| Conversation exports | `/home/ricky/data/exports/` (when created) |

Raw sources are never modified after creation. They are timestamped records.

### 2. The Wiki (LLM-maintained, structured, linked)
The KB itself at `/home/ricky/kb/`. This is what agents and humans read for business truth.

Every wiki page is a markdown file that:
- Has a clear title as H1
- Has frontmatter with `status`, `last_verified`, `sources`
- Links to related pages using relative paths
- Is categorised into a section

### 3. This Schema (how the wiki is organised and maintained)
This document. Defines categories, rules, and operations.

---

## Categories

| Section | What Goes Here | Examples |
|---------|---------------|---------|
| `operations/` | Workshop processes, SOPs, intake flows, QC, shipping | `sop-walk-in-simple-repair.md` |
| `backmarket/` | BM trade-in flows, grading, fees, listing rules | `product-id-resolution.md` |
| `monday/` | Board schemas, column references, group structures | `main-board.md` |
| `pricing/` | Repair and service pricing by device | `macbook.md` |
| `team/` | Roster, roles, KPIs, escalation paths | `roster.md` |
| `finance/` | Xero structure, payment flows, HMRC, cashflow | *(to be created)* |
| `customer-service/` | Intercom setup, reply standards, triage rules | *(to be created)* |
| `marketing/` | SEO baseline, ad strategy, content plan | *(to be created)* |
| `parts/` | Inventory rules, suppliers, reorder thresholds | *(to be created)* |
| `systems/` | Renamed from `system/`. VPS, Supabase, agent config, integrations | existing files |
| `decisions/` | Durable decision records with date and rationale | `2026-04-01-openclaw-kb-boundary.md` |
| `inbox/` | Staging area for unverified or uncategorised content | temporary holding |

---

## Page Format

Every wiki page should follow this structure:

```markdown
---
status: verified | partial | unverified | provisional
last_verified: YYYY-MM-DD
sources:
  - /path/to/raw/source.md
  - conversation with Ricky, YYYY-MM-DD
related:
  - ../section/related-page.md
---

# Page Title

Brief description of what this page covers.

## Content

The actual knowledge, organised with clear headings.

## Open Questions

Anything unresolved or needing verification.
```

**Status definitions:**
- `verified` — checked against live system or confirmed by Ricky
- `partial` — some content verified, some not
- `unverified` — compiled from sources but not checked
- `provisional` — Ricky's stated intent, not yet implemented

---

## Operations

### Ingest (adding new knowledge)

When new information arrives (voice note, conversation, research output):

1. **Read the raw source** in full
2. **Identify what's new** — facts, decisions, processes, corrections
3. **Check existing wiki pages** — does this update an existing page or need a new one?
4. **If updating:** edit the existing page, update `last_verified`, add the new source to `sources`
5. **If new topic:** create a new page in the right section, following the page format
6. **Update index.md** if a new page was created
7. **Update related pages** — add cross-references, fix any contradictions
8. **Log the change** in `log.md`

**Critical rule:** If new information contradicts existing wiki content, resolve the conflict. Don't leave both versions. The newer verified source wins, but note what changed and why.

### Query (answering questions from the wiki)

When asked a question:

1. **Search the wiki first** — check index.md, then relevant section
2. **Read the source pages** — don't answer from memory or training data
3. **Cite the page** — "According to operations/intake-flow.md..."
4. **If the answer isn't in the wiki:** say so. Suggest what raw sources to check or what research is needed.
5. **If the answer leads to a useful new page:** write it and file it

### Lint (periodic health checks)

Run these checks periodically (weekly or when starting a major work session):

1. **Stale content** — pages with `last_verified` older than 30 days
2. **Contradictions** — two pages claiming different things about the same topic
3. **Orphaned pages** — pages not linked from any other page or index
4. **Missing cross-references** — pages that should link to each other but don't
5. **Incomplete pages** — pages with "Open Questions" that could now be answered
6. **Index gaps** — pages that exist but aren't in index.md
7. **Empty sections** — categories with no pages (finance, customer-service, marketing, parts)

Output lint results to `/home/ricky/kb/inbox/lint-YYYY-MM-DD.md`.

---

## Navigation Files

### index.md
Master catalogue of all wiki pages, organised by section. One line per page with a brief description. Updated whenever a page is added or removed.

### log.md
Chronological, append-only record of changes. Format:

```
YYYY-MM-DD HH:MM | INGEST | operations/sop-walk-in-repair.md | Added from voice note transcript
YYYY-MM-DD HH:MM | UPDATE | pricing/macbook.md | Updated MacBook Neo pricing after market drop
YYYY-MM-DD HH:MM | CREATE | finance/xero-structure.md | New page from system audit research
YYYY-MM-DD HH:MM | LINT   | Found 3 stale pages, 2 contradictions
```

---

## Who Writes

| Actor | Can Write | Rules |
|-------|-----------|-------|
| Jarvis (thinking partner) | Yes | Primary KB curator. Ingests, updates, maintains. |
| Code (Claude Code CLI) | Yes | Creates pages during builds. Updates system docs. |
| Other agents | No | Read only. Propose changes via Jarvis. |
| Ricky | Rarely | Voices raw sources. Reviews and approves. Doesn't edit wiki directly. |

---

## Principles

1. **The wiki is the source of truth.** If it's not in the wiki, it doesn't exist for agents.
2. **Raw sources are immutable.** Never edit a transcript, research doc, or export.
3. **Every page has a source.** No knowledge appears from nowhere.
4. **Contradictions are resolved, not accumulated.** Don't leave two conflicting pages.
5. **Ricky's exact words on decisions are preserved as quotes.** Don't paraphrase important decisions.
6. **The wiki grows from use.** Good queries become pages. Good pages get linked. The KB compounds over time.
7. **Empty is better than wrong.** A missing page is better than a fabricated one.
