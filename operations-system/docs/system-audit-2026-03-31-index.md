# System Audit 2026-03-31 Index
Last updated: 2026-04-23 09:42 UTC
Source root: `/home/ricky/builds/system-audit-2026-03-31/`

## What this project is
This build appears to be a broad business system audit and discovery pack, not just one narrow report.

It contains:
- end-to-end customer journey maps
- platform-by-platform operating notes
- findings, facts, hypotheses, open questions, and next-step lists
- domain research buckets across operations, team, systems, parts, finance, customer service, and marketing
- targeted brief files for follow-on deep dives

This should be treated as one of the strongest whole-business evidence layers currently on the VPS.

---

## Top-level structure

### `client_journeys/`
Purpose: journey-level maps of how different customer/order types move through the business.

Files:
- `phone-enquiry.md`
- `walk-in-customer.md`
- `mail-in-send-in-customer.md`
- `warranty-aftercare-returns.md`
- `corporate-b2b-client.md`
- `shopify-online-purchase.md`
- `backmarket-tradein.md`
- `backmarket-resale-order.md`
- `_meta.md`
- `README.md`

Why it matters:
- strongest path to a domain-first SOP program
- gives a direct way to compare actual journeys against current documented SOP coverage
- likely reveals where ownership and handoffs break between enquiry, intake, workshop, QC, returns, and aftercare

Operational use:
- use as spine for end-to-end operations map
- use to identify missing SOPs by journey stage
- use to detect where Monday/system flows diverge by customer type

---

### `platform_inventory/`
Purpose: platform-by-platform operating map of systems the business depends on.

Files:
- `monday.md`
- `intercom.md`
- `shopify.md`
- `xero.md`
- `backmarket.md`
- `stripe.md`
- `sumup.md`
- `typeform.md`
- `google.md`
- `cloudflare.md`
- `royal-mail.md`
- `jarvis-email.md`
- `vps-webhooks.md`
- `n8n.md`
- `README.md`

Why it matters:
- gives the system boundary map required for agent design
- likely identifies source-of-truth issues by platform
- provides a base for deciding which actions should happen in Monday vs Intercom vs Shopify etc.

Operational use:
- platform ownership map
- automation boundaries
- system dependency mapping
- change-impact reference when processes are redesigned

---

### `outputs/`
Purpose: synthesized conclusions and working control documents from the audit.

Key files:
- `findings.md`
- `fact_ledger.md`
- `open_questions.md`
- `NEXT-STEPS-TODO.md`
- `MASTER-QUESTIONS-FOR-JARVIS.md`
- `hypotheses_to_verify.md`
- `discovery_log.md`
- `bootstrap_context.md`
- `loopback-verification-2026-04-01.md`
- `RESEARCH-EXPANSION-BRIEF.md`

Why it matters:
- this is probably the most important subdirectory for immediate reuse
- contains verified findings vs unresolved questions
- likely tells us what the previous research already concluded so we do not repeat work blindly

Operational use:
- reuse verified facts
- import unresolved questions into daily ops extraction sessions
- turn findings into indexed workstreams and SOP backlog

---

### `research/`
Purpose: raw or semi-structured deep-dive material by business domain.

Subdirectories:
- `operations/`
- `team/`
- `systems/`
- `parts/`
- `finance/`
- `customer-service/`
- `marketing/`
- `cross-domain/`

Why it matters:
- domain evidence bank for specific operational questions
- probably where detailed analysis lives behind the summarized findings

Operational use:
- source support for SOP drafting
- evidence for bottleneck analysis
- dependency mapping across functions

---

### `briefs/`
Purpose: queued or completed deeper investigations into specific system topics.

Examples:
- `BRIEF-MONDAY-DATA-QUALITY.md`
- `BRIEF-MONDAY-ZOMBIE-TRIAGE.md`
- `BRIEF-N8N-WORKFLOW-TRIAGE.md`
- `BRIEF-PARTS-COST-AUDIT.md`
- `BRIEF-DIAGNOSTICS-DEEP-DIVE.md`
- `BRIEF-XERO-MONDAY-RECONCILIATION.md`
- `BRIEF-INTERCOM-METRICS.md`

Why it matters:
- gives a backlog of known problem areas and investigations
- useful for shaping future agent/subagent work

Operational use:
- turn into research queue
- link findings to active workflow redesigns

---

## Important content signals from the files read

### From `outputs/findings.md`
This file is large and appears to contain many concrete audit findings. It should be mined, not skimmed.

Practical conclusion:
- we should treat `findings.md` as a verified-claims candidate source, but not as sole truth until cross-checked where needed against current systems.

### From `outputs/fact_ledger.md`
This appears to be a structured fact bank.

Practical conclusion:
- this should become a major feed into the operations evidence index because it likely separates observed facts from speculation better than chat memory.

### From `outputs/open_questions.md` and `MASTER-QUESTIONS-FOR-JARVIS.md`
These appear directly useful for the daily extraction sessions with Ricky.

Practical conclusion:
- we should not invent all session prompts from scratch
- we can take these pre-existing questions and use them as the starting interview grid

### From `platform_inventory/monday.md`
This is likely the most important single platform file for current work.

Practical conclusion:
- it should be indexed in more detail next, especially board roles, update/reply usage, ownership boundaries, and any source-of-truth notes.

### From `client_journeys/_meta.md`
This likely explains the journey set and how to interpret the journey files.

Practical conclusion:
- use the journey files as the operating backbone for SOP capture, not just platform silos.

---

## How this audit should feed the operations build
This project gives us a strong scaffold for the daily work with Ricky.

Recommended use pattern:
1. Pull facts and known gaps from `outputs/`
2. Use `client_journeys/` to choose the next operational domain
3. Use `platform_inventory/` to map system boundaries for that domain
4. Use `research/` when a question needs evidence beyond Ricky’s memory
5. Use `briefs/` to identify known deep-dive opportunities or unresolved issues

---

## Immediate follow-on indexing targets
Priority order:
1. `platform_inventory/monday.md`
2. `outputs/findings.md`
3. `outputs/fact_ledger.md`
4. `outputs/open_questions.md`
5. `client_journeys/phone-enquiry.md`
6. `client_journeys/walk-in-customer.md`
7. `client_journeys/mail-in-send-in-customer.md`

---

## Why this matters for Ricky’s request
Ricky wants the operations system built from both:
- his lived knowledge
- the extracted evidence already on the VPS

This audit project is exactly the kind of evidence layer that prevents repeated loss of context and stops the process from depending only on long chat sessions.
