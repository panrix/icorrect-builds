# C09 Memory Archive Report

Date: 2026-04-06

## Archive Outcome

- Reviewed all 17 agent memory workspaces under `~/.openclaw/agents/*/workspace/memory/`.
- Identified 140 stale files older than 7 days across 10 workspaces.
- Moved all 140 stale files into each workspace's `memory/archive/` directory.
- Created archive directories where needed.
- Deleted nothing.
- Verified post-move state: `0` stale files remain in live `memory/` directories.
- Total archived this run: 1,126,344 bytes.

## Workspaces With No Stale Files

- `alex-cs`
- `arlo-website`
- `build-orchestrator`
- `codex-builder`
- `codex-reviewer`
- `main`
- `pm`

## Durable Facts And KB Promotion Candidates

### backmarket

- Durable facts found:
- BM listing reconciliation broke when Monday stored numeric listing IDs while API-side reconciliation expected UUIDs; later memory also confirms n8n Flow 6 depends on numeric listing IDs for order matching. This is a real dual-ID rule that needs one canonical doc.
- Apple spec checker and exact colour verification became mandatory before listing or repricing; wrong-colour and wrong-model listings were causing returns and seller-score damage.
- `Champagne` and `Starlight` are treated as the same colour on BM.
- `product_id` is colour-specific and distinct from seller `listing_id`; grade is not encoded in `product_id`.
- `dispatch.js` should be run once for normal batching, not per-order with `--order` except reruns.
- Acquisition policy changed materially: stop bidding on fully functional grades `GOLD/PLATINUM/DIAMOND`; only bid `SILVER` with full screen cost baked in; `BRONZE` and `STALLONE` remain acceptable when priced correctly.
- SOP/output enforcement became explicit: when a script produces product cards, present them verbatim rather than summarising.
- KB promotion candidates:
- Update [product-id-resolution.md](/home/ricky/kb/backmarket/product-id-resolution.md) with the colour-specific `product_id` rule, exact-colour matching, `Champagne=Starlight`, and spec-check-first rule.
- Add a new KB page for reconciliation and identifiers covering numeric listing IDs vs UUIDs, n8n dependency, ghost/orphan logic, and report-only vs auto-action policy conflict.
- Add a short dispatch note to [sop-bm-sale.md](/home/ricky/kb/operations/sop-bm-sale.md) or a BM dispatch SOP covering single-run batching.
- Add a buyback bidding policy note to [README.md](/home/ricky/kb/backmarket/README.md) or a new acquisition-policy page.
- Conflicts to resolve before promotion:
- Memory contains both "report first, no auto-action until proven" and "ghost listings should be set qty=0 immediately" rules. KB should only keep the current approved policy.
- Memory contains both UUID-based reconciliation logic and numeric-ID storage rules. KB should document both fields explicitly and state which system uses which.

### customer-service

- Durable facts found:
- Fin underperformance was severe enough that Ricky chose to disable Fin and move to manual/Jarvis handling until the VPS webhook/agent system was ready.
- Reply standards were explicitly confirmed: no em dashes, sign replies as `Jarvis`, do not assume gender, do not include the address when the footer already handles it, and never send customer replies without explicit Ricky approval.
- Monday handling rules were documented: main board ID `349212843`; search by email `text5`; VCCP and Inditex items needed both device and requested-repair links populated.
- The 80/20 KB gap list was clear: turnaround times, invoice/payment status, repair pricing, warranty policy, and repair status/appointment booking.
- Alex's live CS metrics are durable business facts: 431 conversations in 30 days, 63.8% unanswered, 21.3h average first response time, 62 ready-to-collect devices not notified, 100 leads needing classification.
- The working model became Alex drafts/briefs, Ferrari approves/sends.
- KB promotion candidates:
- Confirm [reply-standards.md](/home/ricky/kb/customer-service/reply-standards.md) with the no-em-dash, sign-off, gender, and approval rules.
- Expand [triage-rules.md](/home/ricky/kb/customer-service/triage-rules.md) with the 80/20 gap categories and the "status updates are automatable first; pricing remains deferred until pricing audit" rule.
- Expand [intercom-setup.md](/home/ricky/kb/customer-service/intercom-setup.md) with the Fin-disabled/current Alex+Ferrari workflow and the board-linking requirements for created Monday items.
- Add the triage-mapping output paths to [README.md](/home/ricky/kb/customer-service/README.md).

### diagnostics

- Durable facts found:
- All 20 schematic PDFs were converted to 2,501 PNG pages at 300 DPI for instant visual reference.
- All 17 board models then received `page_index.md` files plus a master `INDEX.md`.
- Board viewer V2 worked for placement, side detection, markers, and session reuse, but close-up quality, schematic coverage, and BRD net extraction were still blocked.
- The long-term plan shifted toward building an in-house diagnostics-first board renderer using OpenBoardView's BRD parser rather than relying on FlexBV alone.
- KB promotion candidates:
- No current diagnostics section exists in `/home/ricky/kb`. Promote the PDF-to-image and board-viewer architecture notes into a new system/knowledge page, likely under `/home/ricky/kb/system/knowledge/`.
- Promote the "schematics are pre-rendered to PNG and indexed" fact so future agents do not repeat the conversion work.

### marketing

- Durable facts found:
- The social baseline was explicit: TikTok was the strongest channel, Instagram and YouTube meaningful, Facebook neglected, X dead, LinkedIn absent.
- Marketing intelligence platform work established an internal product standard: build React/TypeScript/Tailwind, multi-tenant-ready, product-grade applications rather than internal-only quick dashboards.
- SEO root causes were repeatedly consistent: staging site indexed, keyword cannibalisation between `/pages/` and `/collections/`, weak London service titles, missing H1s, and no Tier-2 MacBook landing pages.
- Priority keyword strategy was clearly ordered: MacBook first, then iPhone, then iPad.
- MacBook landing-page gap was narrowed to a defined set of London/service pages.
- Meta pixel and campaign setup matured into a concrete runbook: pixel double-firing fixed, cold campaigns launched, retargeting held until data volume improves.
- Ricky confirmed Shopify/theme access is not read-only; agents can make edits directly.
- KB promotion candidates:
- Update [seo-baseline.md](/home/ricky/kb/marketing/seo-baseline.md) with the staging/cannibalisation findings, MacBook-first priority order, and Tier-2 landing-page plan.
- Update [meta-ads-setup.md](/home/ricky/kb/marketing/meta-ads-setup.md) with the pixel double-fire fix, current campaign structure, audience seeding limits, and retargeting hold criteria.
- Update [conversion-analysis.md](/home/ricky/kb/marketing/conversion-analysis.md) with the "one page can serve both SEO and ads if built conversion-first" decision and the now-confirmed direct theme edit capability.
- Consider a new content-production page for the center-weighted shooting system that makes long-form footage reusable for short-form.

### operations

- Durable facts found:
- Intake-system design decisions were strong and consistent: the form is the primary record; background recording is a safety net; consent must come first; optional end-of-intake voice summary is useful.
- Intake photos are non-negotiable and should live in Supabase Storage with signed links written back to Monday.
- The portable monitor for customer password/user setup already exists; the missing piece is an add-user SOP.
- BM intake rules changed materially: move flows off n8n to own server; keep iCloud activation checks, but model/spec/colour must always be manually confirmed; mismatches should flag for counter-offer rather than auto-update.
- Finance cleanup produced durable numbers: 343 ghost invoices identified, 71 voided for £19,882, 244 blocked by the Xero period lock, and 28 invoices (£9,456) left for Ricky review.
- Weekly operating thresholds were documented: 65 devices/week target and £12,500/week minimum revenue.
- KB promotion candidates:
- Update [intake-flow.md](/home/ricky/kb/operations/intake-flow.md) with consent-first recording, Supabase photo storage, manual spec/colour confirmation, and the counter-offer rule for BM mismatches.
- Add or extend an ops SOP for MacBook password/user setup using the portable monitor.
- Update [xero-structure.md](/home/ricky/kb/finance/xero-structure.md) and [payment-truth.md](/home/ricky/kb/finance/payment-truth.md) with the ghost-invoice cleanup state, period-lock dependency, and reconciliation-fix requirement.
- Consider a dedicated finance cleanup/receivables page if this work will continue.

### parts

- Durable facts found:
- The Inventory Movements board is legacy; the Parts board activity log is the real source for 30-day and 90-day usage.
- `30d Usage` and `90d Usage` columns were built and populated from activity log data, with a weekly Monday 06:00 UTC refresh job.
- Supplier model was clarified: Nancy China (~14 days), UK websites (2-3 days), and individual sellers like Naz (ad hoc); Nancy credit was documented at ~$30k total and ~$5k/week.
- The missing Orders board is now a real stock-accuracy risk, not a theory, because Naz orders can arrive with no intake tracking.
- Parts-to-Monday writeback is designed but blocked on Ricky's note-format approval.
- Telegram deduction alerts currently trigger too late; negative stock is already happening before the warning becomes useful.
- KB promotion candidates:
- Update [inventory-model.md](/home/ricky/kb/parts/inventory-model.md) with "activity log is source of truth", usage-column automation, legacy-board warning, and the missing-orders-board risk.
- Update [suppliers.md](/home/ricky/kb/parts/suppliers.md) with the three supplier lanes and Nancy credit context.
- Update [reorder-rules.md](/home/ricky/kb/parts/reorder-rules.md) with the low-stock threshold problem and the recommendation to alert at 3-5 units rather than negative.
- Add a note to [parts-board.md](/home/ricky/kb/monday/parts-board.md) about writeback status and the `See Notes` negative-stock incident as evidence of the current gap.

### slack-jarvis

- Durable facts found:
- The Xero invoice automation Phase 1 exists as an n8n workflow, with Monday invoice-status columns already added and a clear webhook integration point.
- The saved meeting agenda surfaced recurring operational issues rather than one-offs: tester MacBook instability during LCD testing, stock discrepancy handling, storage-room door discipline, device-model selection discipline, and unclear Case/Charger workflow.
- KB promotion candidates:
- Update finance/operations docs with the invoice-automation webhook and Monday-column references if that workflow remains live.
- Promote the recurring workflow clarifications into team/operations docs rather than keeping them as meeting agenda bullets.

### systems

- Durable facts found:
- The old n8n parts-deduction workflow was replaced by a live Node/Express/PM2 service; key Monday webhook quirks are durable and should be documented.
- The systems workspace captured canonical main-board group IDs.
- Monday automation mapping found a real gap: no Ferrari notification on `Diagnostic Complete`, and Mike McAdam's automation was disabled.
- The Monday AI automation builder is not reliable for programmatic editing; the classic template builder is the workable path.
- Intake documentation was consolidated into one canonical `docs/intake-system/` location.
- KB promotion candidates:
- Update [main-board.md](/home/ricky/kb/monday/main-board.md) with the referenced group IDs and the diagnostic/quote automation findings.
- Add a systems/runtime note under `/home/ricky/kb/system/` covering the parts-deduction service, webhook quirks (`update_column_value`, `pulseId`), and n8n deactivation.
- Add a short Monday-automation build note capturing "use classic builder, not AI builder" if browser automation remains part of the workflow.

### team

- Durable facts found:
- The tech-hiring decision was explicit: add another technician to take BM diagnostics and simple repairs, reducing pressure on Safan and freeing Adil/Andres from mixed-role chaos.
- QC rules were tightened hard: bottom screws off for QC, photo documentation before close, no arguing at Roni's desk, evidence-only appeals in meetings, and cleanliness can fail QC.
- Liquid damage policy tightened: remove fabric shields on liquid-damage devices, document liquid immediately, and intake photos/cosmetic notes are essential for warranty protection.
- Warranty rule was explicit: old cracked/bezel-damaged devices near the two-year mark are not warranty.
- Use Apple's exact colour names, not approximations.
- Chronic operational gaps surfaced repeatedly: huge Safan backlog, `awaiting collection` backlog, hidden `Repair Paused` backlog, no sustained hiring follow-through.
- Annual leave board ID `18403244828` was created and shared.
- KB promotion candidates:
- Update [qc-workflow.md](/home/ricky/kb/operations/qc-workflow.md) with the bottom-screws-off rule, mandatory photos, no-discussion QC fail loop, and cleanliness/photo evidence requirements.
- Update [intake-flow.md](/home/ricky/kb/operations/intake-flow.md) with mandatory cosmetic photos, liquid documentation, and exact-colour naming.
- Update [escalation-paths.md](/home/ricky/kb/team/escalation-paths.md) with backlog visibility issues, Ferrari approval bottlenecks, and the explicit QC-appeal path.
- Add annual leave board metadata to team docs if it is now the canonical leave system.

### website

- Durable facts found:
- The earlier conversion crisis included dead CTAs that were fixed live; later review confirmed the legal pages were never actually broken, they live at Shopify `/policies/` URLs rather than `/pages/`.
- Search depth on collection pages is intentional and should be preserved for SEO.
- The agreed solution is not to flatten the structure but to add a compact Quick-Book widget at the top so impatient users can go straight to price/booking while research users keep the long-form page depth.
- By March 11, GA4 was confirmed working while PostHog checkout tracking was still blind.
- KB promotion candidates:
- Update [conversion-analysis.md](/home/ricky/kb/marketing/conversion-analysis.md) with the "preserve SEO depth, add Quick-Book widget" decision.
- Add a website/platform note somewhere under system or marketing clarifying the legal-page URL pattern (`/policies/...`) so future audits do not keep misclassifying them as 404s.
- Promote the GA4 live / PostHog blind split if analytics ownership is being documented centrally.

## Archived File Inventory

### backmarket

- `2026-03-04-bm-1456-sale.md` — 26587 B
- `2026-03-04-bm-reconciliation.md` — 24990 B
- `2026-03-04.md` — 548 B
- `2026-03-05.md` — 2352 B
- `2026-03-06-bm-heartbeats.md` — 10641 B
- `2026-03-06-bm-listings.md` — 20185 B
- `2026-03-06-pricing-review.md` — 1694 B
- `2026-03-06.md` — 2528 B
- `2026-03-07.md` — 2463 B
- `2026-03-08-bm-pricing.md` — 19886 B
- `2026-03-08.md` — 3119 B
- `2026-03-09-bm-pricedrops.md` — 1574 B
- `2026-03-09.md` — 2965 B
- `2026-03-10-bm-reconciliation.md` — 16786 B
- `2026-03-10.md` — 3569 B
- `2026-03-11.md` — 3523 B
- `2026-03-12.md` — 3748 B
- `2026-03-13.md` — 2099 B
- `2026-03-14-bm-shipping.md` — 20425 B
- `2026-03-14.md` — 8001 B
- `2026-03-16-buybox-audit.md` — 16668 B
- `2026-03-16.md` — 2109 B
- `2026-03-17.md` — 439 B
- `2026-03-28-bm-dispatch.md` — 15769 B
- `2026-03-28.md` — 4130 B
- `2026-03-30-backmarket-sop6.md` — 5402 B
- `2026-03-30-bm-labels.md` — 24050 B
- `2026-03-30-sop-reconciliation.md` — 16499 B
- `2026-03-30.md` — 1838 B
- `learnings.md` — 12957 B

### customer-service

- `2026-02-10.md` — 1057 B
- `2026-02-16-0628.md` — 174 B
- `2026-02-20.md` — 3693 B
- `2026-02-21.md` — 2326 B
- `2026-02-26-intercom-sweep.md` — 20193 B
- `2026-02-27-context-window.md` — 31517 B
- `2026-03-04-intercom-triage.md` — 24146 B
- `2026-03-06.md` — 1863 B
- `2026-03-07.md` — 1771 B
- `2026-03-08.md` — 1868 B
- `2026-03-09.md` — 1656 B
- `2026-03-10.md` — 2084 B
- `2026-03-11-cs-triage.md` — 17164 B
- `2026-03-11.md` — 2163 B
- `2026-03-12.md` — 2651 B

### diagnostics

- `2026-03-28.md` — 1223 B
- `2026-03-29-pdf-handling.md` — 10158 B
- `2026-03-29.md` — 3609 B

### marketing

- `2026-02-10.md` — 3242 B
- `2026-02-11.md` — 2749 B
- `2026-02-23.md` — 1300 B
- `2026-02-24.md` — 1073 B
- `2026-03-02.md` — 1890 B
- `2026-03-03.md` — 646 B
- `2026-03-04-port-fix.md` — 46793 B
- `2026-03-06.md` — 2348 B
- `2026-03-07.md` — 2536 B
- `2026-03-08.md` — 2951 B
- `2026-03-09.md` — 1450 B
- `2026-03-10.md` — 1959 B
- `2026-03-11-march-reaudit.md` — 49075 B
- `2026-03-11.md` — 2781 B
- `2026-03-12.md` — 2605 B
- `2026-03-15-macbook-seo.md` — 25630 B
- `2026-03-16-marketing-priorities.md` — 89019 B
- `2026-03-21.md` — 2869 B
- `2026-03-24-landing-pages.md` — 8346 B
- `2026-03-25.md` — 3052 B

### operations

- `2026-02-18.md` — 1362 B
- `2026-02-20-intake-photos.md` — 38630 B
- `2026-02-24-0344.md` — 180 B
- `2026-03-03.md` — 1306 B
- `2026-03-04-ops-finance.md` — 38477 B
- `2026-03-04.md` — 4106 B
- `2026-03-05.md` — 990 B
- `2026-03-06.md` — 1483 B
- `2026-03-07.md` — 1684 B
- `2026-03-08.md` — 1933 B
- `2026-03-09.md` — 2255 B
- `2026-03-10.md` — 1433 B
- `2026-03-11.md` — 1318 B
- `2026-03-12.md` — 1801 B
- `finance-legacy.md` — 4460 B

### parts

- `2026-02-10.md` — 707 B
- `2026-03-05-parts-usage.md` — 21892 B
- `2026-03-05.md` — 2320 B
- `2026-03-06.md` — 2258 B
- `2026-03-07.md` — 2433 B
- `2026-03-08.md` — 2450 B
- `2026-03-09.md` — 2294 B
- `2026-03-10.md` — 2324 B
- `2026-03-11.md` — 1909 B
- `2026-03-12-parts-stock.md` — 4530 B
- `2026-03-12.md` — 2617 B

### slack-jarvis

- `2026-02-18.md` — 1483 B
- `meeting-agenda.md` — 3027 B

### systems

- `2026-02-10.md` — 3113 B
- `2026-02-16-1206.md` — 177 B
- `2026-02-16-1209.md` — 177 B
- `2026-02-16-1211.md` — 177 B
- `2026-02-18-sop-search.md` — 2455 B
- `2026-02-18.md` — 2353 B
- `2026-02-19.md` — 4001 B
- `2026-02-20-monday-automations.md` — 11790 B
- `2026-03-05.md` — 1231 B
- `2026-03-06.md` — 1378 B
- `2026-03-07.md` — 2187 B
- `2026-03-08.md` — 1794 B
- `2026-03-09.md` — 1959 B
- `2026-03-10.md` — 1723 B
- `2026-03-11.md` — 1701 B
- `2026-03-12.md` — 2186 B

### team

- `2026-02-10.md` — 2077 B
- `2026-02-11.md` — 3531 B
- `2026-02-16-meeting2.md` — 5757 B
- `2026-02-16.md` — 14990 B
- `2026-03-04-team-meeting.md` — 132106 B
- `2026-03-05.md` — 2741 B
- `2026-03-06.md` — 2072 B
- `2026-03-07.md` — 2676 B
- `2026-03-08.md` — 3319 B
- `2026-03-09.md` — 1724 B
- `2026-03-10.md` — 2328 B
- `2026-03-11.md` — 3123 B
- `2026-03-12.md` — 3271 B
- `2026-03-21-1441.md` — 174 B
- `2026-03-23-hiring-form.md` — 36856 B

### website

- `2026-02-10.md` — 4783 B
- `2026-02-11.md` — 4710 B
- `2026-02-12.md` — 320 B
- `2026-02-16.md` — 3060 B
- `2026-03-04-website-audit.md` — 34550 B
- `2026-03-05.md` — 922 B
- `2026-03-06.md` — 1461 B
- `2026-03-07.md` — 1877 B
- `2026-03-08.md` — 1896 B
- `2026-03-09.md` — 1502 B
- `2026-03-10.md` — 2056 B
- `2026-03-11.md` — 1673 B
- `2026-03-12.md` — 1551 B
