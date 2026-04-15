# iCorrect Executive Build Plan

**The single living roadmap.** Every build, every phase, every idea — one place.

**Owner:** Ricky
**Primary maintainer:** Jarvis
**Co-maintainer:** Claude Code
**Last updated:** 2026-04-13

---

## 1. North Star

Split Monday into data-layer-only, build purpose-built React frontends for every team interaction (iPad + desktop), move deterministic logic into scripts/cron, and keep LLMs only where genuine reasoning or writing is needed (intake categorisation, CS drafting, market analysis).

Full vision: [`agent-rebuild/ricky-systems-dump.md`](agent-rebuild/ricky-systems-dump.md) · deep mapping: [`agent-rebuild/systems-deep-map.md`](agent-rebuild/systems-deep-map.md) · automation target: [`agent-rebuild/automation-blueprint.md`](agent-rebuild/automation-blueprint.md)

---

## 2. How to use this doc

- **Ricky** → dump any new idea, voice note, or thought into §8 **Inbox**. Never worry about where it goes — Jarvis triages from there.
- **Jarvis** → daily (or on-demand): drain Inbox into §5 Initiative table, refresh §3 RIGHT NOW, append to §9 Change log. Primary maintainer.
- **Claude Code** → when starting or finishing a build session, update the affected Initiative row, RIGHT NOW, and Change log. Never edit §4 Phase map or §7 Research library without Ricky's say-so.
- **Codex sub-agents** → do not edit this doc. They produce detail docs inside their build folders; the Initiative row links to those.
- **Structural edits** (phase map, research library, enabling work) → require Ricky's approval.

`INDEX.md` remains the directory map. `TRACKER.md` remains the short-horizon scratchpad. **This doc is the strategic roadmap.**

---

## 3. RIGHT NOW — Active work

Max 5 items. Each: owner, blocker, next action, folder.

| # | Initiative | Owner | State | Blocker | Next action | Folder |
|---|-----------|-------|-------|---------|-------------|--------|
| 1 | **Alex Triage recovery** | Claude Code + Jarvis | live-degraded | Crons disabled; blocked on Telegram gateway outbound fix | Fix Telegram gateway outbound → re-enable crons → verify live posting | [`alex-triage-rebuild/`](alex-triage-rebuild/) |
| 2 | **Alex Classifier rebuild** | Claude Code | spec | — | Ship 5-way classification + repairType extraction; wire into triage recovery | [`alex-triage-classifier-rebuild/`](alex-triage-classifier-rebuild/) |
| 3 | **BackMarket listing-bot / audit** | Claude Code (Hugo retired to strategy) | building | — | `listing-bot.js` landed (Apr 13); verify against `listings-audit.js` output, schedule cron | [`backmarket/scripts/`](backmarket/scripts/) |
| 4 | **Intake System — Phase 0 backend** | Claude Code | spec (ready to build) | Waiting on #1–3 capacity | Scaffold Node backend, wire Supabase intake tables, mirror Typeform contract | [`intake-system/`](intake-system/) |
| 5 | **Elek Board Viewer** | Elek (diagnostics) | building | — | Schema audit + remediation pass complete (Apr 11); continue schematics | [`elek-board-viewer/`](elek-board-viewer/) |

---

## 4. Phase map

### Phase 0 — Foundations
**Must land before any React UI is worth building.** Source: [`systems-deep-map.md`](agent-rebuild/systems-deep-map.md) closing "Cross-System Dependency Order".

- **F1** Queue cleanup / zombie triage (separate live WIP from debt) — [`system-audit-2026-03-31/research/operations/monday-zombie-triage.md`](system-audit-2026-03-31/research/operations/monday-zombie-triage.md)
- **F2** Intake data contract (one canonical intake package feeding Systems 1–5)
- **F3** Parts reservation model (beyond deduction-only; extend [`icorrect-parts-service/`](icorrect-parts-service/))
- **F4** Split overloaded `status4` into repair / comms / QC / shipping state models
- **F5** Finance / payment truth rebuild — **#1 blocker per audit**; [`system-audit-2026-03-31/research/finance/payment-truth-target-state.md`](system-audit-2026-03-31/research/finance/payment-truth-target-state.md)
- **F6** Minimal Supabase operational mirror tables (intake_sessions, intake_responses, intake_checks, intake_photos, queue state)

### Phase 1 — Per-system MVPs
The 11 systems, in dependency order. Each system's Phase 1 definition is already specced in [`systems-deep-map.md`](agent-rebuild/systems-deep-map.md).

| Order | ID | System | Phase 1 minimum |
|-------|----|--------|----------------|
| 1 | S1 | Client Intake Form | Replace Typeform exactly — same questions, same Slack/Monday handoff |
| 2 | S2 | Workshop Intake (iPad) | Single iPad view of submitted intake + serial lookup + photos + notes |
| 3 | S3 | Device Intake Checklist | Hard-gated pre-queue checklist (passcode, stock check, turnaround, evidence) |
| 4 | S5 | Mail-In Intake | Shared engine with S1–3, mail-in entry point, receipt + discrepancy capture |
| 5 | S4 | BackMarket Intake UI | Custom UI over existing BM services: serial, iCloud, grading, parts, can/can't repair (parallel track) |
| 6 | S8 | Inventory Management | Stock-and-commitments surface: live qty, low-stock risk, usage, reservations |
| 7 | S6 | Interactive Diagnostics | Guided structured diagnostics for liquid damage + power-fault paths |
| 8 | S7 | Tech Repair Dashboard | Filtered active-WIP workspace: assigned jobs, detail, notes, parts-used, testing handoff |
| 9 | S11 | QC System | Structured conditional checklist with pass/fail + rejection notes |
| 10 | S10 | Shipping Interface | Checklist-first dispatch: label, serial, pack check before Shipped |
| 11 | S9 | Coordinator Dashboard | Control surface over active subset: owner, stage, blocker, age, deadline, next action + task board |

### Phase 2 — Integration & cutover
- Cross-system handoffs end-to-end verified
- Customer portal (status tracking)
- Finance / invoicing UI
- BackMarket listing management UI
- Marketing Intelligence dashboard revival
- Team KPI dashboards

### Phase 3 — Supabase cutover
- Monday retired as the interactive layer
- Monday remains as backend during migration, then deprecated

---

## 5. Initiative table

**Every build in one row.** ID | Name | Phase | Status | Owner | Blocker | Folder | Detail doc

**Status values:** `idea` · `spec` · `building` · `live-degraded` · `live` · `paused` · `archived`

### Active (≤7d since activity)
| ID | Name | Phase | Status | Owner | Blocker | Folder |
|----|------|-------|--------|-------|---------|--------|
| A-01 | Alex Triage Card System | P1-S-support | live-degraded | Claude Code | Telegram IDs, Monday 5xx, draft timeouts | [`alex-triage-rebuild/`](alex-triage-rebuild/) |
| A-02 | Alex Classifier 5-way + repairType | P1-S-support | spec | Claude Code | — | [`alex-triage-classifier-rebuild/`](alex-triage-classifier-rebuild/) |
| A-03 | Elek Board Viewer | P1-S6-adjacent | building | Elek | — | [`elek-board-viewer/`](elek-board-viewer/) |
| A-04 | Client Intake System (Typeform replacement) | P1-S1 | spec | Claude Code | Queued behind A-01/A-02 | [`intake-system/`](intake-system/) |
| A-05 | BackMarket ops estate | P1-S4 supporting | live | Claude Code | — | [`backmarket/`](backmarket/) |
| A-06 | Agent rebuild / research hub | meta | live | Ricky + Jarvis | — | [`agent-rebuild/`](agent-rebuild/) |
| A-07 | System Audit 2026-03-31 (frozen) | research | live | Codex | — | [`system-audit-2026-03-31/`](system-audit-2026-03-31/) |
| A-08 | SOPs compiled from Ricky Q&A | enabling | live | Ricky | — | [`claude-project-export/`](claude-project-export/) |
| A-09 | Intake notifications (superseded) | P1-S1 | archived-by A-04 | — | — | [`intake-notifications/`](intake-notifications/) |

### Stale but real (7–30d)
| ID | Name | Phase | Status | Owner | Notes | Folder |
|----|------|-------|--------|-------|-------|--------|
| S-01 | Buyback monitor | P1-S4 supporting | live | cron | Auto-bump BM buyback prices | [`buyback-monitor/`](buyback-monitor/) |
| S-02 | Webhook migration | enabling | live (BM remaining) | Claude Code | Complete except BackMarket webhooks. Monday automation block until Apr 19. | [`webhook-migration/`](webhook-migration/) |
| S-03 | Hiring docs | team ops | paused | Ricky | — | [`hiring/`](hiring/) |
| S-04 | Pricing sync | P0-F5-adjacent | paused | — | — | [`pricing-sync/`](pricing-sync/) |
| S-05 | Monday integration scripts | enabling | live | cron | — | [`monday/`](monday/) |
| S-06 | iCorrect Shopify theme | P2 | live | — | Git repo | [`icorrect-shopify-theme/`](icorrect-shopify-theme/) |
| S-07 | Shared scripts | enabling | live | — | — | [`scripts/`](scripts/) |
| S-08 | BM scripts (legacy location) | P1-S4 | paused | — | Consolidate into `backmarket/scripts/` | [`bm-scripts/`](bm-scripts/) |
| S-09 | Royal Mail automation | P1-S10 supporting | live | cron | Git repo | [`royal-mail-automation/`](royal-mail-automation/) |
| S-10 | iCloud checker | P1-S4 supporting | live | webhook | Replaces 2 n8n flows | [`icloud-checker/`](icloud-checker/) |
| S-11 | Server config | infra | live | Ricky | — | [`server-config/`](server-config/) |
| S-12 | Telephone inbound | P1-S9 adjacent | paused | — | No brief | [`telephone-inbound/`](telephone-inbound/) |
| S-13 | Quote Wizard menu builder | P2 | paused | — | Shopify nav generator | [`quote-wizard/`](quote-wizard/) |
| S-14 | Repair analysis | research | paused | — | — | [`repair-analysis/`](repair-analysis/) |
| S-15 | LLM summary endpoint | enabling | paused | — | — | [`llm-summary-endpoint/`](llm-summary-endpoint/) |

### Archive candidates (>30d inactive)
Listed for §6 Enabling Work kill-list review.

| ID | Name | Recommendation | Folder |
|----|------|----------------|--------|
| Z-01 | Voice note pipeline | Keep — folds into future client comms ingestion | [`voice-note-pipeline/`](voice-note-pipeline/) |
| Z-02 | Whisper API | Keep — used by voice notes | [`whisper-api/`](whisper-api/) |
| Z-03 | Xero invoice automation | **Revive as part of F5 finance truth** | [`xero-invoice-automation/`](xero-invoice-automation/) |
| Z-04 | iCorrect parts service | **Revive as S8 Inventory base + F3 reservation** | [`icorrect-parts-service/`](icorrect-parts-service/) |
| Z-05 | Team audits | Archive — research complete | [`team-audits/`](team-audits/) |
| Z-06 | Data architecture (stub) | Archive | [`data-architecture/`](data-architecture/) |
| Z-07 | Intercom agent | Archive — superseded by Alex Triage | [`intercom-agent/`](intercom-agent/) |
| Z-08 | Inventory system (stub) | Archive — replaced by new S8 under this plan | [`inventory-system/`](inventory-system/) |
| Z-09 | Marketing intelligence (stub) | Revive post Phase 2 (see §6) | [`marketing-intelligence/`](marketing-intelligence/) |
| Z-10 | QA system (stub) | Archive — QA will be Codex-first per system-rethink | [`qa-system/`](qa-system/) |
| Z-11 | Research files | Keep as reference | [`research/`](research/) |
| Z-12 | Templates | Keep | [`templates/`](templates/) |
| Z-13 | Voice notes (stub) | Archive | [`voice-notes/`](voice-notes/) |
| Z-14 | Website conversion | Archive or fold into Phase 2 | [`website-conversion/`](website-conversion/) |
| Z-15 | Old `agents/` configs | Archive | [`agents/`](agents/) |

### Systems not yet as folders
S1–S11 from the Phase map have no dedicated build folder yet (except S1=`intake-system/`, S4-support=`backmarket/`, S8-base=`icorrect-parts-service/`). New folders created when each Phase 1 MVP starts.

---

## 6. Enabling work

Not systems, but must happen.

- **E1** Archive pass on Z-01 → Z-15 per recommendations above (quick win: cuts 15 stale folders)
- **E2** Consolidate `bm-scripts/` into `backmarket/scripts/` — kill duplication
- **E3** Codex + ACP orchestration pattern: document how Claude Code spawns Codex builders and reviews output (for consistent use across all Phase 1 systems)
- **E4** Jarvis context slim-down (target: <80KB/msg) — see [`agent-rebuild/system-rethink.md`](agent-rebuild/system-rethink.md#jarvis-context-bloat)
- **E5** Fleet-wide "search before answer" rules — Verification Rule block in every SOUL.md; see [`agent-rebuild/BRIEF-02-SEARCH-NOT-LOAD.md`](agent-rebuild/BRIEF-02-SEARCH-NOT-LOAD.md)
- **E6** Move script-only OpenClaw crons to plain crontab (per system-rethink §"Scripts That Should Be Plain Crontab")
- **E7** Schedule the 3 ready-but-unscheduled BM scripts (listings reconciliation, buy-box check, morning briefing) — see [`agent-rebuild/BRIEF-01-HUGO-SCRIPT-AUDIT.md`](agent-rebuild/BRIEF-01-HUGO-SCRIPT-AUDIT.md)
- **E8** Build SOP 11 (Tuesday cutoff protocol) — direct revenue risk, unimplemented

---

## 7. Research library (index only)

All deep research lives here, linked — not inlined.

### Frozen research pack
[`system-audit-2026-03-31/`](system-audit-2026-03-31/) — 2026-03-31 → 2026-04-06. Full domain coverage.

- **Finance** — [`research/finance/`](system-audit-2026-03-31/research/finance/): financial-mapping, payment-truth-target-state, xero-monday-reconciliation-gap, xero-revenue-by-repair
- **Marketing / SEO** — [`research/marketing/`](system-audit-2026-03-31/research/marketing/): gsc-repair-profit-rankings, gsc-profitability-crossref-v2, ga4-posthog-funnel-analysis, shopify-health-audit, marketing-analysis, marketing-blockers
- **Operations** — [`research/operations/`](system-audit-2026-03-31/research/operations/): monday-data-quality-audit, monday-zombie-triage, sop-coverage-audit, bench-occupancy-measurement, handoff-failure-matrix, timing-mapping, physical-capacity-analysis
- **Parts / supply** — [`research/parts/`](system-audit-2026-03-31/research/parts/): parts-cost-audit, logistics-supplier-analysis, supplier-source-of-truth
- **Customer service** — [`research/customer-service/`](system-audit-2026-03-31/research/customer-service/): intercom-full-metrics, customer-retention-analysis, customer-identity-normalisation
- **Team / HR** — [`research/team/`](system-audit-2026-03-31/research/team/): staff-performance-analysis, team-operations-summary
- **Systems / infra** — [`research/systems/`](system-audit-2026-03-31/research/systems/): n8n-workflow-audit, systems-architecture, known_systems
- **Cross-domain** — repair-profitability-v2, business-viability-analysis, channel-economics, competitor-benchmarking, product-cards
- **Executive briefs** — [`system-audit-2026-03-31/briefs/`](system-audit-2026-03-31/briefs/) (21 BRIEF-*.md files)
- **Outputs** — [`outputs/findings.md`](system-audit-2026-03-31/outputs/findings.md), [`outputs/NEXT-STEPS-TODO.md`](system-audit-2026-03-31/outputs/NEXT-STEPS-TODO.md), [`outputs/MASTER-QUESTIONS-FOR-JARVIS.md`](system-audit-2026-03-31/outputs/MASTER-QUESTIONS-FOR-JARVIS.md)

### Strategic docs
- [`agent-rebuild/ricky-systems-dump.md`](agent-rebuild/ricky-systems-dump.md) — 2026-04-05 raw vision
- [`agent-rebuild/systems-deep-map.md`](agent-rebuild/systems-deep-map.md) — 2026-04-06 11-system deep map
- [`agent-rebuild/automation-blueprint.md`](agent-rebuild/automation-blueprint.md) — script-level target estate (~58 scripts, ~29 crons, ~37 slash commands)
- [`agent-rebuild/system-rethink.md`](agent-rebuild/system-rethink.md) — OAuth migration + architecture problem
- [`agent-rebuild/BRIEF-*.md`](agent-rebuild/) — 10 topic briefs (Hugo audit, search-not-load, Jarvis context, MI, system digest, automation blueprint, repair history, main board cleanup, SOP edge cases, VPS audit)

---

## 8. Inbox

**Ricky: append here any time.** New systems, new ideas, voice-note transcripts, problems, "we should also do X". Never lost. Jarvis drains into §5 Initiative table on his next pass.

Format: `- YYYY-MM-DD — [text]`

```
- 2026-04-13 — (seed) This doc exists because weekly momentum felt flat and there was no single roadmap. Jarvis should own keeping it alive.

## Audit debt (from system-audit-2026-03-31 — unacted findings, loaded by Jarvis 2026-04-13)

### BURNING MONEY NOW
- 2026-04-13 — [AUDIT] Payment reconciliation broken. No loop between Xero/Stripe/SumUp/Monday. Business blind on what's been paid. No owner. Maps to F5.
  - **RICKY TRIAGE (2026-04-13):** Build automated system — manual not viable. Cash accounting protocol. Three channels: (1) Shopify orders → auto-create Xero entries on order, auto-reconcile when payment hits bank using payment IDs, calculate Shopify/payment fees. NOT HAPPENING TODAY. (2) SumUp walk-in → payments not attributed to device. Need SumUp API investigation. Possible match on timestamp + amount due + amount paid. Short-term: Telegram confirmation step per payment. (3) Diagnostics via Xero+Stripe → ALREADY WORKS, no action needed. First step: SumUp API data profile exploration. Nancy is China supplier, NOT staff.
- 2026-04-13 — [AUDIT] Ghost invoices: 343 rows in Xero backlog, ~£91k fake debt, 78 items still need review/decision. No owner.
  - **RICKY TRIAGE (2026-04-13):** Resolved — handled by accountants. No build needed.
- 2026-04-13 — [AUDIT] BM margins still negative: -£19.2k over 6 months, trade-in costs at 66.4% of revenue. No pricing caps implemented. Maps to A-05/S-01.
  - **RICKY TRIAGE (2026-04-13):** NOT resolved. Buyback script likely not running. Actively bidding on unprofitable items. Ricky will open a dedicated topic and rebuild immediately with Jarvis. HIGH PRIORITY.
- 2026-04-13 — [AUDIT] 900 non-terminal Monday items (440 over 366 days old). No archive rules, no cleanup. Queue is drowning real WIP. Maps to F1.
  - **RICKY TRIAGE (2026-04-13):** Three audit docs exist but need re-running. "Devices In Hole" = physical storage area, needs physical check not just data archive. Ricky wants data grouped by Monday board group (e.g. "BMs Unable to Repair" → instant archive, "Leads to Chase" → understood context). Fresh API pull needed, grouped per board group with count + status + age per group. Previous zombie triage doc not quite right for decision-making. Note: Monday automation block until Apr 19.

### SECURITY / CREDENTIAL RISK
- 2026-04-13 — [AUDIT] Two diverging .env files: `/home/ricky/config/.env` vs `/home/ricky/config/api-keys/.env`. Conflicting Typeform, SumUp, Google tokens.
- 2026-04-13 — [AUDIT] Shopify token documented as read-only but actually has write_orders, write_products, write_content, write_themes. Over-scoped.
- 2026-04-13 — [AUDIT] Xero Invoice Creator n8n workflow has hardcoded Monday API auth + Xero OAuth values. Secrets embedded in workflow JSON.

### BROKEN DATA / ATTRIBUTION
- 2026-04-13 — [AUDIT] Source attribution broken: 95%+ of Monday items have blank Source field. 0 labeled Phone despite phone orders existing. Can't measure conversion.
- 2026-04-13 — [AUDIT] Quote-to-payment lag measurement broken: 0 populated Xero Invoice IDs, all 132 items Invoice Status = Voided, many payment dates precede Quote Sent.

### OPERATIONAL GAPS
- 2026-04-13 — [AUDIT] Customer response still slow: 27/58 conversations unanswered in March sample. No owner, no protected response blocks.
- 2026-04-13 — [AUDIT] Two catch-all Monday webhooks (IDs 537444955, 530471762) firing ~4,000+ actions/day to unknown destinations. Burning automation quota.
- 2026-04-13 — [AUDIT] Monday main board overloaded: 4,443 items, 169 columns, 51 status columns. Target-state docs exist but no actual consolidation done. Maps to F4.
- 2026-04-13 — [AUDIT] n8n split-brain: cloud has 52 workflows (13 active), self-hosted has 1 inactive. No documented ownership split.

### CONFIG DRIFT
- 2026-04-13 — [AUDIT] Jarvis Google token scopes: documented as Drive/Sheets capable but actually only analytics.readonly, calendar, gmail.readonly, webmasters.readonly, youtube.readonly.
- 2026-04-13 — [AUDIT] SMTP config points at dead port 465. Ports 587 and 2525 work with STARTTLS.
```

---

## 9. Change log

| Date | Who | What | Section |
|------|-----|------|---------|
| 2026-04-13 | Claude Code | Initial creation from plan `abstract-weaving-allen.md`. Seeded from systems-deep-map, ricky-systems-dump, automation-blueprint, system-audit-2026-03-31, TRACKER.md, INDEX.md. | all |
| 2026-04-13 | Jarvis | Initial validation pass. Updated §3 RIGHT NOW: corrected Alex Triage blocker (crons disabled, gateway outbound fix needed, not message IDs/500s), noted listing-bot.js landed, noted Elek schema audit complete. Flagged 2 missing TRACKER folders, 1 stale Initiative status. | §3, §9 |
| 2026-04-13 | Jarvis | S-02 Webhook migration: complete except BackMarket webhooks. Monday automation block until 2026-04-19. | §5 |
| 2026-04-13 | Jarvis | Loaded 15 unacted audit findings into §8 Inbox, grouped by severity: burning money (4), security (3), broken data (2), operational gaps (4), config drift (2). Ready for Ricky triage. | §8 |
