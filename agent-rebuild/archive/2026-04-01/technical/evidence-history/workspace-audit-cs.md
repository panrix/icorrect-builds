# Workspace Audit: Customer Service Agent

**Path:** `/home/ricky/.openclaw/agents/customer-service/workspace/`
**Audit Date:** 2026-02-26
**Total Files (excl .git):** 31
**Total Size (excl .git):** ~180 KB

---

## File Inventory

### Core Agent Files

| File | Size | Type | Verdict | v3 Destination | Tokens (est) |
|------|------|------|---------|----------------|---------------|
| SOUL.md | 2,188 | Agent identity (CS + former Finn scope) | KEEP | SOUL.md (root) | ~547 |
| MEMORY.md | 1,540 | Auto-generated Supabase memory | KEEP | MEMORY.md (root) | ~385 |
| AGENTS.md | 7,869 | Workspace bootstrap/session rules | KEEP | AGENTS.md (root) | ~1,967 |
| TOOLS.md | 1,358 | Monday.com board IDs, key columns | KEEP | TOOLS.md (root) | ~340 |
| USER.md | 247 | Ricky profile | KEEP | USER.md (root) | ~62 |
| IDENTITY.md | 636 | BLANK template -- never filled in | KEEP (fill in at v3 bootstrap) | IDENTITY.md (root) | ~159 |
| HEARTBEAT.md | 168 | Empty heartbeat (no tasks) | KEEP | HEARTBEAT.md (root) | ~42 |
| .gitignore | 349 | Git config | KEEP | .gitignore (root) | ~87 |
| .openclaw/workspace-state.json | 74 | OpenClaw state | KEEP | .openclaw/ | ~19 |

### Docs -- Knowledge Base & Reference

| File | Size | Type | Verdict | v3 Destination | Tokens (est) |
|------|------|------|---------|----------------|---------------|
| docs/KNOWLEDGE-BASE.md | 5,383 | Finn performance analysis, problems, fixes | KEEP | research/reference/KNOWLEDGE-BASE.md | ~1,346 |
| docs/conversation-history.md | 11,320 | Raw Telegram transcript from Feb 9 | DELETE | n/a (raw transcript, context extracted to KB) | ~2,830 |
| docs/finn-improvement-guide.md | 6,609 | Guide for Ferrari to improve Finn | KEEP | research/reference/finn-improvement-guide.md | ~1,652 |
| docs/review-2026-02-09.md | 3,497 | Finn performance review (5/10 grade) | KEEP | research/reference/finn-review-feb-09.md | ~874 |
| docs/subagent-context.md | 1,435 | Sub-agent context brief | MOVE | archive/ (references main workspace path) | ~359 |
| docs/CS_JARVIS_INTERCOM_AUDIT_TASK.md | 6,429 | Task spec for Ferrari activity audit | KEEP | data/intercom-audit-task.md | ~1,607 |
| docs/intercom-audit-feb2026.md | 8,387 | Intercom audit results (60% unanswered) | KEEP | data/intercom-audit-results-feb2026.md | ~2,097 |
| docs/intercom-agent-build/SPEC.md | 29,494 | Full spec for Intercom agent replacement | KEEP | research/reference/intercom-agent-spec.md | ~7,374 |

### SOPs

| File | Size | Type | Verdict | v3 Destination | Tokens (est) |
|------|------|------|---------|----------------|---------------|
| docs/SOPs/intercom-handling.md | 6,889 | Intercom conversation handling SOP | KEEP | sops/intercom-handling.md | ~1,722 |

**SOP Assessment:** Only 1 SOP. This agent needs more SOPs covering: Intercom triage rules, escalation protocol, warranty claim handling, follow-up cadence, spam/bot filtering, Monday.com sync procedures.

### Finn Audit Docs (docs/finn-audit/)

| File | Size | Type | Verdict | v3 Destination | Tokens (est) |
|------|------|------|---------|----------------|---------------|
| BASELINE.md | 4,296 | Finn audit baseline (Feb 9) | KEEP | research/reference/finn-baseline.md | ~1,074 |
| audit-feb-9-15.md | 3,764 | Weekly audit (Feb 9-15) -- BM account at risk | KEEP | research/reference/finn-audit-feb-9-15.md | ~941 |
| conversion-analysis.md | 5,010 | Fin conversion rate analysis (2.7%) | KEEP | research/reference/finn-conversion-analysis.md | ~1,253 |
| ferrari-cta-changes.md | 21,335 | Implementation docs for Finn CTA changes | MOVE | archive/ (historical, Fin now disabled) | ~5,334 |
| guidance-fixes.md | 7,311 | Finn guidance doc fixes | MOVE | archive/ (historical, Fin now disabled) | ~1,828 |

### Shared Context (docs/shared-context/) -- DUPLICATES OF FOUNDATION DOCS

| File | Size | Type | Verdict | v3 Destination | Tokens (est) |
|------|------|------|---------|----------------|---------------|
| ricky-qa-answers.md | 8,229 | Q&A questions | DELETE | n/a (duplicate) | ~2,057 |
| strategy-context.md | 4,517 | Corporate strategy | DELETE | n/a (duplicate) | ~1,129 |
| team-context.md | 12,901 | Team dynamics | DELETE | n/a (duplicate) | ~3,225 |

### Memory Files (memory/)

| File | Size | Type | Verdict | v3 Destination | Tokens (est) |
|------|------|------|---------|----------------|---------------|
| 2026-02-10.md | 1,057 | Fin onboarding, Ferrari task check | KEEP | memory/ | ~264 |
| 2026-02-16-0628.md | 174 | Empty session header only | DELETE | n/a | ~44 |
| 2026-02-20.md | 3,693 | Key events: Intercom audit, conversations | KEEP | memory/ | ~923 |
| 2026-02-21.md | 2,326 | Open items, Fin disable decision | KEEP | memory/ | ~582 |
| 2026-02-26-intercom-sweep.md | 20,193 | Session transcript -- Intercom sweep | DELETE | n/a (session dump, not curated memory) | ~5,048 |

---

## Summary

### Token Budget

| Category | Tokens (est) |
|----------|-------------|
| Core agent files | ~3,608 |
| Knowledge base & reference docs | ~14,993 |
| SOPs | ~1,722 |
| Finn audit docs (KEEP) | ~3,268 |
| Data (audit task + results) | ~3,704 |
| Memory files (KEEP) | ~1,769 |
| **Total KEEP/MOVE** | **~29,064** |
| DELETE (duplicates, transcripts, empty files) | **~14,333** |
| MOVE (archive -- Fin implementation docs) | **~7,521** |

### What is Useful vs Clutter

**Useful (moves to v3):**
- intercom-handling.md SOP is well-structured (golden rules, conversation types, Monday sync)
- Intercom agent build SPEC.md (29KB) -- comprehensive spec for Fin replacement
- Intercom audit results (Feb 2026) -- critical finding: 60% of enquiries unanswered
- Finn audit trail -- baseline, weekly audit, conversion analysis (documents the 2.7% conversion rate problem)
- CS_JARVIS_INTERCOM_AUDIT_TASK.md -- the task that proved Ferrari underperformance

**Clutter:**
- shared-context/ folder -- 3 files, all duplicates (~26KB)
- Raw conversation history (11KB)
- ferrari-cta-changes.md (21KB) -- implementation docs for a now-disabled system
- Session transcript dumps in memory/ (20KB)
- Empty session header file (174 bytes)
- IDENTITY.md blank template

### Recommendations for v3 Migration

1. **IDENTITY.md is blank** -- complete during v3 bootstrap
2. **Only 1 SOP** -- this agent needs SOPs for: triage rules, escalation protocol, warranty claims, follow-up cadence, spam filtering. The intercom-handling.md is a good start but insufficient.
3. **Fin is disabled** -- the ferrari-cta-changes.md and guidance-fixes.md are historical. Archive, do not migrate as active docs.
4. **Intercom agent build spec is the future** -- this 29KB spec should be the reference doc for the replacement build
5. **Audit results are gold** -- the Feb 2026 audit proving 60% unanswered rate and Ferrari underperformance is critical business intelligence. Keep in data/.
6. **Remove shared-context/** -- duplicates of foundation docs
7. **Clean memory/** -- remove the session dump and empty file
8. **This workspace is the leanest** -- only 180KB excluding .git. Good starting point for v3.
