# Ops Data Source Index
Last updated: 2026-04-23 09:39 UTC

## Purpose
This is the starting index for the VPS evidence layer that should ground operations capture, SOP writing, and future agent workflows.

Rule: we do not build the operations system from memory alone. We anchor it in existing extracted data, audits, reports, mappings, and live-system references already present on the VPS.

## Priority Evidence Sources

### 1) Team / Monday / role activity
**Path:** `/home/ricky/builds/team-audits/`

**Why it matters:**
- strongest existing operational evidence on who does what in Monday
- activity logs, item replies, deep-dive reports, and person-level output analysis
- key source for queue ownership, coordination patterns, bottlenecks, and repeatable work

**Key files / subareas:**
- `reports/ferrari/` — Ferrari audits, CS methodology, daily CSVs, raw Monday export, written/mentions/pattern views
- `reports/safan/`, `reports/adil/`, `reports/roni/`, `reports/andreas/`, `reports/mykhailo/` — role and workflow evidence by person
- `scripts/team_daily_csv.py` — current Monday activity extraction logic
- `scripts/audit_supplements.py` — update/reply extraction logic
- `scripts/extract_ferrari_monday_raw.py` — six-month Ferrari raw Monday dump
- `scripts/extract_ferrari_monday_views.py` — Ferrari written/mentions/pattern derivations

**Use for:**
- Monday board truth
- team coordination patterns
- identifying SOP candidates
- identifying automatable work

---

### 2) Full system audit / customer journeys / platform inventory
**Path:** `/home/ricky/builds/system-audit-2026-03-31/`

**Why it matters:**
- likely best cross-system snapshot of how the business actually runs end-to-end
- includes client journeys, platform inventory, outputs, research

**Subareas seen:**
- `client_journeys/`
- `platform_inventory/`
- `outputs/`
- `research/`
- `briefs/`

**Use for:**
- overall business flow mapping
- end-to-end operational model
- identifying platform boundaries and handoffs

**Status:**
- must be read and indexed next; Ricky explicitly called out strong Codex system research here

---

### 3) Customer service / triage / Intercom rebuild evidence
**Path:** `/home/ricky/builds/alex-triage-rebuild/`

**Why it matters:**
- evidence for inquiry handling, triage logic, customer reply patterns, wrong-sender issues, pricing references
- likely foundation for inquiry -> quote -> booking SOPs and agent workflows

**Key files / subareas:**
- `data/triage-YYYY-MM-DD.json`
- `data/historical-quote-emails.json`
- `data/ferrari-edit-analysis.json`
- `data/alex-authored-customer-comments-since-2026-04-08T13-07Z.json`
- `data/intercom-*`
- `docs/spam-audit-*.md`

**Use for:**
- inquiry handling SOPs
- triage rules
- customer comms standards
- Ferrari/Alex workflow split

---

### 4) SOP export / consolidated knowledge project
**Path:** `/home/ricky/builds/claude-project-export/sop-project/`

**Why it matters:**
- appears to be the richest consolidated SOP/KB export currently on disk
- contains operations, Monday board references, CS docs, finance docs, Back Market SOPs, KB index files

**Key files / subareas:**
- `ops-intake-flow.md`
- `ops-qc-workflow.md`
- `ops-queue-management.md`
- `ops-sop-*`
- `monday-main-board.md`
- `monday-board-relationships.md`
- `monday-parts-board.md`
- `cs-*`
- `alex-*`
- `kb-index.md`
- `ferrari-writing-library.md`

**Use for:**
- bootstrap source material
- gap analysis against current reality
- promoting build-local docs into canonical KB later

**Warning:**
- useful, but not automatically live truth; must be cross-checked against current Monday data and Ricky’s current operating model

---

### 5) Back Market operational system
**Path:** `/home/ricky/builds/backmarket/`

**Why it matters:**
- one of the most mature documented subflows in the business
- has SOP set, data outputs, listing audits, reconciliation outputs, verified column reference

**Key files / subareas:**
- `sops/00-BACK-MARKET-MASTER.md`
- `sops/01-12` range across trade-in, intake, diagnostic, refurb, listing, shipping, returns, reconciliation
- `docs/VERIFIED-COLUMN-REFERENCE.md`
- `data/listings-*`, `sale-detection-*`, `stuck-inventory-*`

**Use for:**
- high-confidence sub-process reference
- model for how other SOP trees should be structured
- operational truth around BM queue and revenue mechanics

---

### 6) Intake system builds
**Path:** `/home/ricky/builds/intake-system/`

**Why it matters:**
- likely source of intended intake workflow, forms, shared fields, reference docs, device flows

**Subareas seen:**
- `docs/`
- `flows/`
- `device-flows/`
- `reference/`
- `shared/`

**Use for:**
- intake SOPs
- form/field truth
- intake automation mapping

---

### 7) Agent rebuild / repair history / system gaps
**Path:** `/home/ricky/builds/agent-rebuild/`

**Why it matters:**
- contains repair-history extracts and high-level audits/gap analyses

**Key files:**
- `data/repair-history-full.json`
- `data/repair-history-raw.json`
- `journey-sop-gap-analysis.md`
- `diagnostic-turnaround-analysis.md`
- `repair-history-analysis.md`
- `system-audit-digest.md`
- `sop-edge-cases-and-verification.md`

**Use for:**
- historical throughput and journey evidence
- identifying undocumented edge cases
- validating where current SOPs are weak

---

## Newly Created Ferrari Monday Evidence
These are now confirmed and should be treated as active working evidence:

**Path:** `/home/ricky/builds/team-audits/reports/ferrari/`
- `ferrari_monday_raw_2025-10-25_to_2026-04-23.json`
- `ferrari_monday_written_2025-10-25_to_2026-04-23.json`
- `ferrari_monday_mentions_2025-10-25_to_2026-04-23.json`
- `ferrari_monday_patterns_2025-10-25_to_2026-04-23.json`

**What they provide:**
- 6 months of Ferrari Monday activity
- reply-thread level evidence, not just top-level updates
- isolated Ferrari-written text
- isolated inbound mentions/tags
- first-pass task pattern buckets for SOP and automation mapping

---

## Recommended Reading / Indexing Order
1. `system-audit-2026-03-31/`
2. `team-audits/reports/ferrari/` + person deep dives
3. `claude-project-export/sop-project/`
4. `alex-triage-rebuild/`
5. `intake-system/`
6. `backmarket/`
7. `agent-rebuild/`

## How this should be used going forward
For each domain we map, we should maintain four layers:
1. **Observed evidence** — files, exports, Monday data, reports
2. **Current operating reality** — what Ricky says actually happens now
3. **Target SOP** — the intended clean process
4. **Automation candidate** — what an agent/system can do once the rule is stable

## Immediate Next Step
Read and index `/home/ricky/builds/system-audit-2026-03-31/` first, because Ricky indicates there is valuable completed research there about customer journeys and the operating system as a whole.
