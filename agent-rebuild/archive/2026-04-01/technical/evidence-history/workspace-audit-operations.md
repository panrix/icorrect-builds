# Workspace Audit: Operations Agent

**Path:** `/home/ricky/.openclaw/agents/operations/workspace/`
**Audit Date:** 2026-02-26
**Total Files (excl .git):** 58 (including 39 source-images JPGs)
**Total Size (excl .git):** ~2.6 MB

---

## File Inventory

### Core Agent Files

| File | Size | Type | Verdict | v3 Destination | Tokens (est) |
|------|------|------|---------|----------------|---------------|
| SOUL.md | 3,557 | Agent identity (operations + finance scope) | KEEP | SOUL.md (root) | ~889 |
| MEMORY.md | 2,911 | Auto-generated Supabase memory | KEEP | MEMORY.md (root) | ~728 |
| AGENTS.md | 7,869 | Workspace bootstrap/session rules | KEEP | AGENTS.md (root) | ~1,967 |
| TOOLS.md | 1,271 | Monday.com API reference, mirror column tips | KEEP | TOOLS.md (root) | ~318 |
| USER.md | 247 | Ricky profile | KEEP | USER.md (root) | ~62 |
| IDENTITY.md | 636 | BLANK template -- never filled in | KEEP (fill in at v3 bootstrap) | IDENTITY.md (root) | ~159 |
| HEARTBEAT.md | 168 | Empty heartbeat (no tasks) | KEEP | HEARTBEAT.md (root) | ~42 |
| .gitignore | 349 | Git config | KEEP | .gitignore (root) | ~87 |
| .openclaw/workspace-state.json | 74 | OpenClaw state | KEEP | .openclaw/ | ~19 |

### Docs -- Knowledge Base & Shared Context

| File | Size | Type | Verdict | v3 Destination | Tokens (est) |
|------|------|------|---------|----------------|---------------|
| docs/KNOWLEDGE-BASE.md | 10,682 | Agent knowledge base (still says "Processes" agent) | KEEP (update header) | research/reference/KNOWLEDGE-BASE.md | ~2,671 |
| docs/subagent-context.md | 1,435 | Sub-agent context brief (references main workspace path) | MOVE | archive/ | ~359 |
| docs/e2e-step10-test.md | 60 | Test artifact from e2e pipeline testing | DELETE | n/a (test artifact) | ~15 |

### Shared Context (docs/shared-context/) -- DUPLICATES OF FOUNDATION DOCS

| File | Size | Type | Verdict | v3 Destination | Tokens (est) |
|------|------|------|---------|----------------|---------------|
| ricky-qa-answers.md | 8,229 | Q&A questions (NOT answers) | DELETE | n/a (duplicate, should be in foundation/) | ~2,057 |
| strategy-context.md | 4,517 | Corporate strategy excerpts | DELETE | n/a (duplicate) | ~1,129 |
| team-context.md | 12,901 | Team dynamics from transcripts | DELETE | n/a (duplicate) | ~3,225 |
| otter-transcript-insights.md | 7,027 | Process insights from transcripts | DELETE | n/a (duplicate) | ~1,757 |

### Finance Docs (docs/finance/) -- Inherited from Merged Finance Agent

| File | Size | Type | Verdict | v3 Destination | Tokens (est) |
|------|------|------|---------|----------------|---------------|
| KNOWLEDGE-BASE.md | 6,329 | Finance agent KB (KPI tracker structure, Xero, HMRC) | KEEP | research/reference/finance-knowledge-base.md | ~1,582 |
| ricky-qa-answers.md | 8,229 | DUPLICATE of shared-context version | DELETE | n/a | ~2,057 |
| strategy-insights.md | 4,517 | DUPLICATE of shared-context/strategy-context.md | DELETE | n/a | ~1,129 |
| otter-transcript-insights.md | 4,331 | Finance-focused Otter extracts | KEEP | research/reference/finance-otter-insights.md | ~1,083 |
| warm_leads_jan.md | 82 | Empty -- "Total: 0 leads" | DELETE | n/a (empty placeholder) | ~21 |

### Intake System Docs (docs/intake-system/)

| File | Size | Type | Verdict | v3 Destination | Tokens (est) |
|------|------|------|---------|----------------|---------------|
| INTAKE-SYNTHESIS.md | 11,729 | Full intake system synthesis (7 transcripts) | KEEP | research/reference/intake-synthesis.md | ~2,932 |
| REQUIREMENTS.md | 8,751 | Intake system requirements | KEEP | research/reference/intake-requirements.md | ~2,188 |
| DEV-BRIEF.md | 15,034 | Developer brief for custom React intake | KEEP | research/reference/intake-dev-brief.md | ~3,759 |
| macbook-flows.md | 11,068 | MacBook intake decision trees | KEEP | sops/intake-macbook-flows.md | ~2,767 |
| iphone-flows.md | 14,086 | iPhone intake decision trees | KEEP | sops/intake-iphone-flows.md | ~3,522 |
| ipad-flows.md | 5,534 | iPad intake decision trees | KEEP | sops/intake-ipad-flows.md | ~1,384 |
| apple-watch-flows.md | 3,505 | Apple Watch intake decision trees | KEEP | sops/intake-apple-watch-flows.md | ~876 |
| source-images/ (39 JPGs) | ~2.3 MB | Meesha handwritten flow photos | MOVE | archive/intake-source-images/ | n/a (binary) |

### Workflow Docs (docs/workflows/)

| File | Size | Type | Verdict | v3 Destination | Tokens (est) |
|------|------|------|---------|----------------|---------------|
| xero-generate-invoice.json | 18,932 | n8n flow: Monday -> Xero invoice | KEEP | research/reference/workflows/ | ~4,733 |
| xero-send-invoice.json | 11,294 | n8n flow: Send Xero invoice | KEEP | research/reference/workflows/ | ~2,824 |
| xero-payment-received.json | 13,653 | n8n flow: Payment received webhook | KEEP | research/reference/workflows/ | ~3,413 |

### Reports

| File | Size | Type | Verdict | v3 Destination | Tokens (est) |
|------|------|------|---------|----------------|---------------|
| reports/BM1460-profitability-analysis.md | 4,252 | BM trade-in profitability case study | KEEP | data/reports/BM1460-profitability.md | ~1,063 |

### QA E2E Test Artifacts

| File | Size | Type | Verdict | v3 Destination | Tokens (est) |
|------|------|------|---------|----------------|---------------|
| qa-e2e/c13e0d3d...txt | 46 | E2E test marker file | DELETE | n/a (test artifact) | ~12 |

### Memory Files (memory/)

| File | Size | Type | Verdict | v3 Destination | Tokens (est) |
|------|------|------|---------|----------------|---------------|
| finance-legacy.md | 4,460 | Inherited finance agent MEMORY.md | KEEP | memory/finance-legacy.md | ~1,115 |
| 2026-02-18.md | 1,362 | Operational update (51->59 devices, team changes) | KEEP | memory/ | ~341 |
| 2026-02-20-intake-photos.md | 38,630 | Session transcript -- intake photos discussion | DELETE | n/a (session dump, not curated memory) | ~9,658 |
| 2026-02-24-0344.md | 180 | Empty session header only | DELETE | n/a | ~45 |

---

## Summary

### Token Budget

| Category | Tokens (est) |
|----------|-------------|
| Core agent files | ~4,271 |
| Knowledge bases & reference docs | ~12,225 |
| Intake system docs (text) | ~15,428 |
| Workflow JSONs | ~10,970 |
| Reports | ~1,063 |
| Memory files (KEEP) | ~1,456 |
| **Total KEEP/MOVE** | **~45,413** |
| DELETE (duplicates, test artifacts, session dumps) | **~21,155** |
| MOVE (source images, archive) | **~2.3 MB binary** |

### What is Useful vs Clutter

**Useful (moves to v3):**
- Intake system documentation is excellent -- 4 device-specific flow files, synthesis, requirements, dev brief
- Finance knowledge base and otter insights (inherited from merged finance agent)
- Xero workflow JSONs (3 n8n flows for invoicing)
- BM1460 profitability analysis (good reference case study)
- TOOLS.md with Monday.com mirror column gotcha

**Clutter:**
- shared-context/ folder -- 4 files, all duplicates of foundation docs (~32KB)
- finance/ folder has 3 duplicates (qa-answers, strategy, warm_leads)
- 2 test artifacts (e2e-step10-test.md, qa-e2e/)
- 1 session transcript dump in memory/ (38KB)
- 1 empty memory file (180 bytes, just session header)
- IDENTITY.md never completed (blank template)
- KNOWLEDGE-BASE.md header still says "Processes Agent" (old name)

### Recommendations for v3 Migration

1. **IDENTITY.md is blank** -- complete this during v3 bootstrap
2. **KNOWLEDGE-BASE.md header is stale** -- update "Processes Agent" to "Operations Agent"
3. **Remove all shared-context/ files** -- these duplicate foundation docs and waste tokens
4. **Remove finance duplicates** -- keep only finance/KNOWLEDGE-BASE.md and finance/otter-transcript-insights.md
5. **Source images (2.3 MB)** -- move to archive, not needed in daily agent context. Keep intake flow .md files.
6. **Intake device flows are SOPs** -- migrate to sops/ in v3 (they are operational decision trees)
7. **Workflow JSONs are valuable** -- keep as reference but ensure n8n is the source of truth
8. **No operational SOPs exist** -- unlike BackMarket, operations has zero SOPs for its own domain (workshop queue management, Xero invoicing, repair routing). This is a gap.
9. **memory/2026-02-20-intake-photos.md** is 38KB of session transcript, not memory. Delete it.
