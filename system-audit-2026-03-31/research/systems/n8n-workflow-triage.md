# n8n Workflow Triage

Date: 2026-04-03 07:17 UTC

Evidence base:
- Live n8n Cloud REST API on 2026-04-03 for workflow metadata, workflow definitions, and execution history.
- Prior inventory and workflow context from `n8n-workflow-audit.md` dated 2026-04-02.
- Architecture and ownership context from `systems-architecture.md`, `data_flows.md`, and `/home/ricky/kb/` process notes.

## Section 1: Summary

- Total workflows: `52`
- Active vs inactive: `12` active, `40` inactive
- Active health: `10` active and healthy, `2` active and broken
- Classification breakdown: `Active & Broken` 2, `Active & Healthy` 10, `Duplicate` 4, `Inactive & Experimental` 8, `Inactive & Needed` 2, `Inactive & Redundant` 24, `Inactive & Unknown` 2
- Execution health summary: active workflows produced `1654` executions in the last 30 days, including `64` error runs.
- Highest-volume workflows (30d): `Intercom - Consumer Contact Swap (Webhook)` (775), `Intercom → Monday (Create Repair)` (396), `Shopify Contact Form` (147), `Monday Stock Checker - Part Required` (68), `Walk-In Typeform → Intercom + Monday` (66)

## Section 2: Active Workflows

| ID | Name | Trigger | Services | Last Execution | Executions (30d) | Status | Notes |
|---|---|---|---|---|---:|---|---|
| `e1puojhc35tFJML5` | Intercom - Consumer Contact Swap (Webhook) | Webhook `intercom-contact-swap` | Intercom, HTTP | 2026-04-03 02:37 UTC (success) | 775 | Active & Healthy | Mostly healthy with 6 intermittent error run(s) in 30d. |
| `kP5yCz6ufc23xE6v` | Intercom → Monday (Create Repair) | Webhook `intercom-create-repair` | Intercom, HTTP, Monday | 2026-04-03 02:37 UTC (success) | 396 | Active & Healthy | Live and currently executing cleanly. |
| `tNQphRiUo0L8SdBn` | Shopify Contact Form | Webhook `shopify-contact-form` | Shopify, Intercom, Email, HTTP, Slack | 2026-04-02 01:13 UTC (success) | 147 | Active & Healthy | Mostly healthy with 9 intermittent error run(s) in 30d. |
| `I5epbCTbRsafI4Fr` | Monday Stock Checker - Part Required | Webhook `monday-stock-check` | Monday, HTTP | 2026-04-02 18:44 UTC (success) | 68 | Active & Healthy | Live and currently executing cleanly. |
| `kDfU2wWWv207T24J` | Walk-In Typeform → Intercom + Monday | Typeform `LtNyVqVN` | Typeform, Monday, Intercom, HTTP, Slack | 2026-04-02 13:42 UTC (success) | 66 | Active & Healthy | Mostly healthy with 3 intermittent error run(s) in 30d. |
| `fuVSFQvvJ1GRPkPe` | Shopify Order to Monday.com + Intercom - iCorrect | Shopify `orders/create` | Shopify, Monday, HTTP, Intercom, Slack | 2026-04-02 12:26 UTC (success) | 63 | Active & Healthy | Live and currently executing cleanly. |
| `AubY0Rvhhvgp4GJ1` | Typeform To Monday Pre-Repair Form Responses (v2) | Typeform `sDieaFMs` | Typeform, Monday, Intercom, HTTP, Slack | 2026-04-02 19:06 UTC (success) | 52 | Active & Healthy | Mostly healthy with 1 intermittent error run(s) in 30d. |
| `FB83t0dN0PNlEOpd` | Collection Form → Enriched Slack Notification | Webhook `collection-form-webhook` | Monday, Typeform, Slack, HTTP, Intercom | 2026-04-02 15:46 UTC (success) | 46 | Active & Broken | Recent errors are material (7/46 in 30d). 7 error run(s) in 30d. |
| `lTHrOPUnD6naN28p` | Drop-Off Appointment → Enriched Slack Notification | Webhook `dropoff-form-webhook` | Monday, Typeform, Slack, HTTP, Intercom, Shopify | 2026-04-02 15:32 UTC (error) | 40 | Active & Broken | Recent run ended in error. 38 error run(s) in 30d. |
| `LjNBWaDz9f5Rj8g5` | Warranty Claim Form | Webhook `warranty-claim` | Intercom, Email, HTTP | 2026-03-07 15:38 UTC (success) | 1 | Active & Healthy | Live and currently executing cleanly. |
| `8GLlfo3GJudXCJp0` | Shopify Product Lookup | Manual + Webhook `998c8488-9a2f-42c0-84f4-d1ec48acc024` | Shopify | Never | 0 | Active & Healthy | Low-volume manual/utility workflow. |
| `9jD6J2X3yCPk8Rjp` | Xero Invoice Creator | Webhook `xero-invoice-create` | Xero, Monday, HTTP | Never | 0 | Active & Healthy | Documented live invoice path; API history is absent. |

## Section 3: Recommended Reactivations

| ID | Name | Purpose | Why Reactivate | Dependencies |
|---|---|---|---|---|
| `jFO6pZajYehztkBr` | Flow 1: Device Received Movement. Future to Todays Group | Move Back Market received devices from Incoming Future to Today's Repairs. | The intake-flow and previous audit both say this handoff is still manual and remains a documented gap. | Validate BM received-state logic, confirm schedule guard, and re-check Monday group IDs before reactivation or rebuild. |
| `qFL8bw5M3dO7dudw` | Monday Item Created → Intercom Ticket | Create Intercom ticket/context when a Monday item is created manually. | Manual Monday-created repairs still fragment customer context and lack automatic Intercom linkage. | Confirm the live Monday item-created webhook owner and whether telephone/manual intake should use this path or a VPS replacement. |

## Section 4: Safe to Delete/Archive

| ID | Name | Classification | Reason | Last Execution |
|---|---|---|---|---|
| `jejshaqrAcySKch8` | Flow 1: Device Received Movement. Future to Todays Group | Duplicate | Older duplicate of the BM device received movement flow. | Never |
| `2T9SaIUzDWxGSTzp` | Shopify Contact Form → Email to Intercom | Duplicate | Older Shopify contact-form path is superseded by the active Shopify Contact Form workflow. | Never |
| `HiBBMCmPveasFgoS` | Shopify Contact Form → Intercom (Ticket + Reply for Fin) | Duplicate | Older Shopify contact-form variant overlaps the active Shopify Contact Form workflow. | Never |
| `zbiPD6yMzbQ6vIob` | Shopify Order to Monday.com + Intercom - iCorrect | Duplicate | Older Shopify order ingestion overlaps the active Shopify order workflow. | Never |
| `lM6YhEIGVCi8SoXE` | Archive Intercom Ticket Attributes | Inactive & Redundant | Manual Intercom admin cleanup utility, not a runtime owner. | Never |
| `naQD6GDgP5PsKFOU` | BM Price Scraper Test - ScrapingBee | Inactive & Experimental | Price-scraper test workflow. | Never |
| `gUhXDHKwNDfjDD43` | Extracting Monday Board Data | Inactive & Redundant | Manual Monday extraction utility, not a production owner. | Never |
| `1Y8l1EzfEq3Vknnf` | Flow 0: Sent Trade-in Orders Added to Monday Boards (OLD) | Inactive & Redundant | Old Back Market SENT ingestion replaced by sent-orders.js. | Never |
| `GJbVeldhpWU1KEG3` | Flow 0: Sent Trade-in Orders Added to Monday Boards - Fixed | Inactive & Redundant | Back Market SENT ingestion ownership moved to sent-orders.js. | 2026-03-20 00:00 UTC |
| `z3PnTbW5i1lIOeYI` | Flow 2: BM iCloud Checker | Inactive & Redundant | Back Market iCloud checker replaced by icloud-checker. | Never |
| `pSkBxoea5B40lyJt` | Flow 2: iCloud & Spec Checker (bmcheck) | Inactive & Redundant | Back Market iCloud/spec logic moved to icloud-checker. | Never |
| `gU8alMqvddNjebf6` | Flow 2: iCloud & Spec Checker (bmcheck) - Updated! | Inactive & Redundant | Back Market iCloud/spec logic moved to icloud-checker. | Never |
| `P63LxzYz1fQVljAk` | Flow 2: iCloud Lock Suspension | Inactive & Experimental | Empty placeholder workflow. | Never |
| `vSWGYBWw0KEXcG2i` | Flow 2: Sickw iCloud & Spec Checker (OLD INACTIVE) | Inactive & Redundant | Old iCloud/spec checker replaced by icloud-checker. | Never |
| `KRNukgA2aqIbuNNL` | Flow 3: iCloud Recheck | Inactive & Redundant | iCloud recheck ownership moved to icloud-checker. | Never |
| `lGiPEDaZBfUjuA7h` | Flow 4: Payout Approval | Inactive & Redundant | Back Market payout ownership moved to bm-payout. | Never |
| `qqmQxVDyX7TRULJw` | Flow 5 & 6 - Discovery v2 | Inactive & Experimental | Discovery/prototype workflow. | Never |
| `69BCMOtdUyFWDDEV` | Flow 5: BM Device Listing (Sales) | Inactive & Redundant | Back Market listing ownership moved to list-device.js. | Never |
| `2ER8uOIFzWWdVu7s` | Flow 5: Device Listing v6 | Inactive & Redundant | Older Back Market device listing logic superseded by list-device.js. | Never |
| `HsDqOaIDwT5DEjCn` | Flow 6 - Sales Alert v2 | Inactive & Redundant | Back Market sale detection ownership moved to sale-detection.js. | 2026-03-19 18:00 UTC |
| `D4a5qbCtQmSCUIeT` | Flow 7 - Ship Confirmation | Inactive & Redundant | Back Market ship confirmation ownership moved to bm-shipping. | 2026-03-23 23:09 UTC |
| `hiD0aYgGPZNftz9R` | GCal Create Event | Inactive & Redundant | Dormant Google Calendar utility with no current documented owner. | Never |
| `bTVTAJ5bFYhKHAdO` | Get Shopify Orders | Inactive & Redundant | Manual Shopify fetch utility, not part of live automation. | Never |
| `PDX14Qhpy9ST5MMz` | iCorrect Refurbished | Inactive & Experimental | Manual refurbished-device prototype with no current owner. | Never |
| `hN3OMNQnWPYWiHrT` | Intercom Macros | Inactive & Redundant | Manual Intercom admin utility, not a production owner. | Never |
| `Rq5ExX0U2psyR0Uo` | My workflow 2 | Inactive & Unknown | Placeholder name with no durable business purpose evidenced. | Never |
| `q7yZbgEex8VTqaOf` | My workflow 2 | Inactive & Unknown | Generic name and no documented durable business owner. | Never |
| `v3UYWQyVGehMJSY9` | Ori Bm to Monday Trade-in | Inactive & Experimental | Prototype single-order BM ingestion flow. | Never |
| `265ZpcNEflZkkmQP` | Parts Deduction - Auto Checkout | Inactive & Redundant | Parts deduction now runs on icorrect-parts.service. | Never |
| `mnUM1aRlGmbweJDK` | Phase 3 - Board Setup v2 (Run Once) | Inactive & Experimental | One-time board setup workflow. | Never |
| `QumCicIBpDaYhNVH` | Sales Orders Weekly Export to Google Sheets | Inactive & Redundant | Manual reporting export, not a required live runtime. | 2026-03-30 06:36 UTC |
| `53uU6v2F5417sZCZ` | Shopify Backfill Orders to Monday.com | Inactive & Redundant | Manual Shopify backfill utility superseded by the live Shopify order ingestion workflow. | Never |
| `ljIYigT4NRnW7RrG` | SickW Model String Test - Batch Serial Checker | Inactive & Experimental | Explicitly a test workflow. | Never |
| `TDBSUDxpcW8e56y4` | Status Notifications → Intercom Email | Inactive & Redundant | Previously audited as retired or superseded. | 2026-04-01 00:22 UTC |
| `thgfHbRODtBPKSLT` | Test - Monday Webhook Receiver | Inactive & Experimental | Single-node test webhook. | Never |
| `btkrEM0CR1obglLo` | Trade-In Data Export - All Orders to CSV (Manual) | Inactive & Redundant | Manual export utility, not part of live automation. | Never |
| `bevxQRRcvNitDLnl` | Trade-In Weekly Export to Google Sheets | Inactive & Redundant | Reporting export utility, not part of live automation. | Never |
| `KDrCWzzvkcRlx05m` | Webhook 2: iCloud Check (OLD INACTIVE) | Inactive & Redundant | Old iCloud check webhook replaced by icloud-checker. | Never |

## Section 5: Broken/Failing

| ID | Name | Error | Last Success | Impact | Fix Suggestion |
|---|---|---|---|---|---|
| `lTHrOPUnD6naN28p` | Drop-Off Appointment → Enriched Slack Notification | allUpdateText is not defined [line 54] (node: Enrichment Analysis) | 2026-03-12 15:28 UTC | Customer or intake automation is failing for at least some recent executions. | Inspect failing node, patch logic or credentials, then confirm with passive monitoring. |
| `FB83t0dN0PNlEOpd` | Collection Form → Enriched Slack Notification | JSON parameter needs to be valid JSON (node: Monday: Fetch Updates) | 2026-04-02 15:46 UTC | Customer or intake automation is failing for at least some recent executions. | Inspect failing node, patch logic or credentials, then confirm with passive monitoring. |

## Section 6: Coverage Map

| Integration Need | n8n Workflow | VPS Service | Status | Gap/Overlap |
|---|---|---|---|---|
| Shopify order processing | Shopify Order to Monday.com + Intercom - iCorrect | None | Covered by active n8n workflow | No VPS overlap evidenced. |
| Monday status updates | Status Notifications → Intercom Email (inactive legacy workflow) | status-notifications | Covered by VPS service instead | The n8n sender last ran on 2026-04-01 and is now legacy residue after VPS cutover. |
| Intercom routing | Intercom → Monday (Create Repair), Intercom - Consumer Contact Swap (Webhook), Shopify Contact Form, Warranty Claim Form | telephone-inbound for phone enquiries | Covered by both | n8n covers most web/intake paths; VPS covers phone intake. |
| BackMarket notifications | None | sent-orders.js, sale-detection.js, bm-payout, bm-shipping, icloud-checker | Covered by VPS service instead | n8n inventory here is redundant migration residue. |
| Xero invoicing | Xero Invoice Creator | None | Covered by active n8n workflow | Only draft creation is automated; send/paid loop remains missing. |
| Typeform intake | Typeform To Monday Pre-Repair Form Responses (v2), Walk-In Typeform → Intercom + Monday, Collection Form → Enriched Slack Notification, Drop-Off Appointment → Enriched Slack Notification | None | Covered by active n8n workflow | Credential governance remains degraded, but runtime ownership is clear. |
| Royal Mail tracking | None | dispatch.js browser automation; bm-shipping confirms shipment after Monday release gate | Covered by VPS service instead | No stable Royal Mail API owner exists. |
| Stripe/SumUp payment processing | None | None | Not covered by anything | Paid-state write-back and reconciliation remain broken/missing. |
| Google Sheets/Docs reporting | Sales Orders Weekly Export to Google Sheets, Trade-In Weekly Export to Google Sheets (both inactive) | buy-box monitor sync_to_sheet.py for sell-side pricing only | Covered by both | n8n exports are dormant; only the BM pricing sheet path is live on VPS/Python. |

## Section 7: Recommendations

1. Workflows to reactivate
   - `Flow 1: Device Received Movement. Future to Todays Group` (`jFO6pZajYehztkBr`): The intake-flow and previous audit both say this handoff is still manual and remains a documented gap.
   - `Monday Item Created → Intercom Ticket` (`qFL8bw5M3dO7dudw`): Manual Monday-created repairs still fragment customer context and lack automatic Intercom linkage.
2. Workflows to delete
   - `Archive Intercom Ticket Attributes` (`lM6YhEIGVCi8SoXE`): Manual Intercom admin cleanup utility, not a runtime owner.
   - `BM Price Scraper Test - ScrapingBee` (`naQD6GDgP5PsKFOU`): Price-scraper test workflow.
   - `Extracting Monday Board Data` (`gUhXDHKwNDfjDD43`): Manual Monday extraction utility, not a production owner.
   - `Flow 0: Sent Trade-in Orders Added to Monday Boards (OLD)` (`1Y8l1EzfEq3Vknnf`): Old Back Market SENT ingestion replaced by sent-orders.js.
   - `Flow 1: Device Received Movement. Future to Todays Group` (`jejshaqrAcySKch8`): Older duplicate of the BM device received movement flow.
   - `Flow 2: BM iCloud Checker` (`z3PnTbW5i1lIOeYI`): Back Market iCloud checker replaced by icloud-checker.
   - `Flow 2: iCloud & Spec Checker (bmcheck)` (`pSkBxoea5B40lyJt`): Back Market iCloud/spec logic moved to icloud-checker.
   - `Flow 2: iCloud & Spec Checker (bmcheck) - Updated!` (`gU8alMqvddNjebf6`): Back Market iCloud/spec logic moved to icloud-checker.
   - `Flow 2: iCloud Lock Suspension` (`P63LxzYz1fQVljAk`): Empty placeholder workflow.
   - `Flow 2: Sickw iCloud & Spec Checker (OLD INACTIVE)` (`vSWGYBWw0KEXcG2i`): Old iCloud/spec checker replaced by icloud-checker.
   - `Flow 3: iCloud Recheck` (`KRNukgA2aqIbuNNL`): iCloud recheck ownership moved to icloud-checker.
   - `Flow 4: Payout Approval` (`lGiPEDaZBfUjuA7h`): Back Market payout ownership moved to bm-payout.
   - `Flow 5 & 6 - Discovery v2` (`qqmQxVDyX7TRULJw`): Discovery/prototype workflow.
   - `Flow 5: BM Device Listing (Sales)` (`69BCMOtdUyFWDDEV`): Back Market listing ownership moved to list-device.js.
   - `Flow 5: Device Listing v6` (`2ER8uOIFzWWdVu7s`): Older Back Market device listing logic superseded by list-device.js.
   - `GCal Create Event` (`hiD0aYgGPZNftz9R`): Dormant Google Calendar utility with no current documented owner.
   - `Get Shopify Orders` (`bTVTAJ5bFYhKHAdO`): Manual Shopify fetch utility, not part of live automation.
   - `iCorrect Refurbished` (`PDX14Qhpy9ST5MMz`): Manual refurbished-device prototype with no current owner.
   - `Intercom Macros` (`hN3OMNQnWPYWiHrT`): Manual Intercom admin utility, not a production owner.
   - `Ori Bm to Monday Trade-in` (`v3UYWQyVGehMJSY9`): Prototype single-order BM ingestion flow.
   - `Parts Deduction - Auto Checkout` (`265ZpcNEflZkkmQP`): Parts deduction now runs on icorrect-parts.service.
   - `Phase 3 - Board Setup v2 (Run Once)` (`mnUM1aRlGmbweJDK`): One-time board setup workflow.
   - `Shopify Backfill Orders to Monday.com` (`53uU6v2F5417sZCZ`): Manual Shopify backfill utility superseded by the live Shopify order ingestion workflow.
   - `Shopify Contact Form → Email to Intercom` (`2T9SaIUzDWxGSTzp`): Older Shopify contact-form path is superseded by the active Shopify Contact Form workflow.
   - `Shopify Contact Form → Intercom (Ticket + Reply for Fin)` (`HiBBMCmPveasFgoS`): Older Shopify contact-form variant overlaps the active Shopify Contact Form workflow.
   - `Shopify Order to Monday.com + Intercom - iCorrect` (`zbiPD6yMzbQ6vIob`): Older Shopify order ingestion overlaps the active Shopify order workflow.
   - `SickW Model String Test - Batch Serial Checker` (`ljIYigT4NRnW7RrG`): Explicitly a test workflow.
   - `Test - Monday Webhook Receiver` (`thgfHbRODtBPKSLT`): Single-node test webhook.
   - `Trade-In Data Export - All Orders to CSV (Manual)` (`btkrEM0CR1obglLo`): Manual export utility, not part of live automation.
   - `Trade-In Weekly Export to Google Sheets` (`bevxQRRcvNitDLnl`): Reporting export utility, not part of live automation.
   - `Webhook 2: iCloud Check (OLD INACTIVE)` (`KDrCWzzvkcRlx05m`): Old iCloud check webhook replaced by icloud-checker.
3. Gaps to fill
   - Stripe/SumUp/Xero paid-state write-back into Monday remains ownerless.
   - Xero automation still stops at draft creation; send/paid loop is missing.
   - Monday-created manual repairs still need a durable Intercom linkage owner if qFL8bw5M3dO7dudw is not revived.
4. Duplications to consolidate
   - Legacy n8n status notifications overlap the VPS `status-notifications` service.
   - Older Shopify order/contact variants and older BM ingestion/checker variants should be archived once any unique logic is preserved.

## Workflow Appendix

| ID | Name | Active | Created | Updated | Last Execution | 30d Count | Classification |
|---|---|---|---|---|---|---:|---|
| `lM6YhEIGVCi8SoXE` | Archive Intercom Ticket Attributes | No | 2026-01-16 13:13 UTC | 2026-01-16 13:29 UTC | Never | 0 | Inactive & Redundant |
| `naQD6GDgP5PsKFOU` | BM Price Scraper Test - ScrapingBee | No | 2025-12-13 05:30 UTC | 2026-01-21 15:03 UTC | Never | 0 | Inactive & Experimental |
| `FB83t0dN0PNlEOpd` | Collection Form → Enriched Slack Notification | Yes | 2026-03-12 11:25 UTC | 2026-03-13 14:35 UTC | 2026-04-02 15:46 UTC | 46 | Active & Broken |
| `lTHrOPUnD6naN28p` | Drop-Off Appointment → Enriched Slack Notification | Yes | 2026-03-12 11:34 UTC | 2026-03-13 14:35 UTC | 2026-04-02 15:32 UTC | 40 | Active & Broken |
| `gUhXDHKwNDfjDD43` | Extracting Monday Board Data | No | 2025-08-25 05:02 UTC | 2026-01-21 15:03 UTC | Never | 0 | Inactive & Redundant |
| `1Y8l1EzfEq3Vknnf` | Flow 0: Sent Trade-in Orders Added to Monday Boards (OLD) | No | 2025-11-08 06:45 UTC | 2025-12-04 16:12 UTC | Never | 0 | Inactive & Redundant |
| `GJbVeldhpWU1KEG3` | Flow 0: Sent Trade-in Orders Added to Monday Boards - Fixed | No | 2025-12-04 07:17 UTC | 2026-03-20 06:08 UTC | 2026-03-20 00:00 UTC | 16 | Inactive & Redundant |
| `jFO6pZajYehztkBr` | Flow 1: Device Received Movement. Future to Todays Group | No | 2025-11-24 13:21 UTC | 2026-02-18 15:23 UTC | Never | 0 | Inactive & Needed |
| `jejshaqrAcySKch8` | Flow 1: Device Received Movement. Future to Todays Group | No | 2025-11-19 16:20 UTC | 2025-12-02 17:26 UTC | Never | 0 | Duplicate |
| `z3PnTbW5i1lIOeYI` | Flow 2: BM iCloud Checker | No | 2025-11-22 14:20 UTC | 2025-11-24 03:47 UTC | Never | 0 | Inactive & Redundant |
| `pSkBxoea5B40lyJt` | Flow 2: iCloud & Spec Checker (bmcheck) | No | 2025-11-26 07:35 UTC | 2025-12-02 17:25 UTC | Never | 0 | Inactive & Redundant |
| `gU8alMqvddNjebf6` | Flow 2: iCloud & Spec Checker (bmcheck) - Updated! | No | 2025-12-02 13:50 UTC | 2026-01-05 09:36 UTC | Never | 0 | Inactive & Redundant |
| `P63LxzYz1fQVljAk` | Flow 2: iCloud Lock Suspension | No | 2025-11-20 10:10 UTC | 2025-11-22 14:19 UTC | Never | 0 | Inactive & Experimental |
| `vSWGYBWw0KEXcG2i` | Flow 2: Sickw iCloud & Spec Checker (OLD INACTIVE) | No | 2025-11-24 00:40 UTC | 2025-12-02 17:25 UTC | Never | 0 | Inactive & Redundant |
| `KRNukgA2aqIbuNNL` | Flow 3: iCloud Recheck | No | 2025-11-24 06:21 UTC | 2026-01-05 09:36 UTC | Never | 0 | Inactive & Redundant |
| `lGiPEDaZBfUjuA7h` | Flow 4: Payout Approval | No | 2025-11-24 04:50 UTC | 2026-02-09 07:40 UTC | Never | 0 | Inactive & Redundant |
| `qqmQxVDyX7TRULJw` | Flow 5 & 6 - Discovery v2 | No | 2025-12-05 19:23 UTC | 2026-01-21 15:03 UTC | Never | 0 | Inactive & Experimental |
| `69BCMOtdUyFWDDEV` | Flow 5: BM Device Listing (Sales) | No | 2025-12-06 20:24 UTC | 2026-02-14 11:12 UTC | Never | 0 | Inactive & Redundant |
| `2ER8uOIFzWWdVu7s` | Flow 5: Device Listing v6 | No | 2025-12-06 07:48 UTC | 2026-01-05 09:37 UTC | Never | 0 | Inactive & Redundant |
| `HsDqOaIDwT5DEjCn` | Flow 6 - Sales Alert v2 | No | 2025-12-07 22:10 UTC | 2026-03-20 06:08 UTC | 2026-03-19 18:00 UTC | 180 | Inactive & Redundant |
| `D4a5qbCtQmSCUIeT` | Flow 7 - Ship Confirmation | No | 2025-12-08 23:31 UTC | 2026-03-20 06:08 UTC | 2026-03-23 23:09 UTC | 97 | Inactive & Redundant |
| `hiD0aYgGPZNftz9R` | GCal Create Event | No | 2026-01-13 13:20 UTC | 2026-01-21 15:02 UTC | Never | 0 | Inactive & Redundant |
| `bTVTAJ5bFYhKHAdO` | Get Shopify Orders | No | 2026-01-15 06:32 UTC | 2026-01-21 15:03 UTC | Never | 0 | Inactive & Redundant |
| `PDX14Qhpy9ST5MMz` | iCorrect Refurbished | No | 2025-11-15 15:28 UTC | 2026-01-21 15:03 UTC | Never | 0 | Inactive & Experimental |
| `e1puojhc35tFJML5` | Intercom - Consumer Contact Swap (Webhook) | Yes | 2026-02-18 17:55 UTC | 2026-02-18 18:01 UTC | 2026-04-03 02:37 UTC | 775 | Active & Healthy |
| `hN3OMNQnWPYWiHrT` | Intercom Macros | No | 2026-01-21 13:29 UTC | 2026-01-21 15:02 UTC | Never | 0 | Inactive & Redundant |
| `kP5yCz6ufc23xE6v` | Intercom → Monday (Create Repair) | Yes | 2026-02-04 17:53 UTC | 2026-02-09 17:33 UTC | 2026-04-03 02:37 UTC | 396 | Active & Healthy |
| `qFL8bw5M3dO7dudw` | Monday Item Created → Intercom Ticket | No | 2026-02-04 17:18 UTC | 2026-02-04 17:31 UTC | Never | 0 | Inactive & Needed |
| `I5epbCTbRsafI4Fr` | Monday Stock Checker - Part Required | Yes | 2026-01-28 17:03 UTC | 2026-01-28 17:46 UTC | 2026-04-02 18:44 UTC | 68 | Active & Healthy |
| `Rq5ExX0U2psyR0Uo` | My workflow 2 | No | 2026-02-04 17:36 UTC | 2026-02-04 17:49 UTC | Never | 0 | Inactive & Unknown |
| `q7yZbgEex8VTqaOf` | My workflow 2 | No | 2025-08-25 05:35 UTC | 2025-08-27 04:44 UTC | Never | 0 | Inactive & Unknown |
| `v3UYWQyVGehMJSY9` | Ori Bm to Monday Trade-in | No | 2025-11-17 14:31 UTC | 2026-01-21 15:04 UTC | Never | 0 | Inactive & Experimental |
| `265ZpcNEflZkkmQP` | Parts Deduction - Auto Checkout | No | 2026-01-14 15:58 UTC | 2026-02-18 13:37 UTC | Never | 0 | Inactive & Redundant |
| `mnUM1aRlGmbweJDK` | Phase 3 - Board Setup v2 (Run Once) | No | 2025-12-16 06:38 UTC | 2025-12-16 08:30 UTC | Never | 0 | Inactive & Experimental |
| `QumCicIBpDaYhNVH` | Sales Orders Weekly Export to Google Sheets | No | 2025-12-07 13:47 UTC | 2025-12-07 14:17 UTC | 2026-03-30 06:36 UTC | 1 | Inactive & Redundant |
| `53uU6v2F5417sZCZ` | Shopify Backfill Orders to Monday.com | No | 2026-01-26 13:43 UTC | 2026-01-26 15:10 UTC | Never | 0 | Inactive & Redundant |
| `tNQphRiUo0L8SdBn` | Shopify Contact Form | Yes | 2026-02-02 17:55 UTC | 2026-03-21 17:06 UTC | 2026-04-02 01:13 UTC | 147 | Active & Healthy |
| `2T9SaIUzDWxGSTzp` | Shopify Contact Form → Email to Intercom | No | 2026-02-02 17:31 UTC | 2026-02-05 13:26 UTC | Never | 0 | Duplicate |
| `HiBBMCmPveasFgoS` | Shopify Contact Form → Intercom (Ticket + Reply for Fin) | No | 2026-01-27 16:05 UTC | 2026-02-02 17:51 UTC | Never | 0 | Duplicate |
| `fuVSFQvvJ1GRPkPe` | Shopify Order to Monday.com + Intercom - iCorrect | Yes | 2026-02-06 13:08 UTC | 2026-02-23 13:54 UTC | 2026-04-02 12:26 UTC | 63 | Active & Healthy |
| `zbiPD6yMzbQ6vIob` | Shopify Order to Monday.com + Intercom - iCorrect | No | 2026-01-26 13:26 UTC | 2026-02-06 13:13 UTC | Never | 0 | Duplicate |
| `8GLlfo3GJudXCJp0` | Shopify Product Lookup | Yes | 2026-01-15 11:42 UTC | 2026-01-21 15:02 UTC | Never | 0 | Active & Healthy |
| `ljIYigT4NRnW7RrG` | SickW Model String Test - Batch Serial Checker | No | 2025-11-21 14:51 UTC | 2025-12-06 07:47 UTC | Never | 0 | Inactive & Experimental |
| `TDBSUDxpcW8e56y4` | Status Notifications → Intercom Email | No | 2026-02-04 17:12 UTC | 2026-03-30 16:59 UTC | 2026-04-01 00:22 UTC | 403 | Inactive & Redundant |
| `thgfHbRODtBPKSLT` | Test - Monday Webhook Receiver | No | 2025-12-16 08:31 UTC | 2026-01-21 15:03 UTC | Never | 0 | Inactive & Experimental |
| `btkrEM0CR1obglLo` | Trade-In Data Export - All Orders to CSV (Manual) | No | 2025-11-29 06:07 UTC | 2026-01-21 15:03 UTC | Never | 0 | Inactive & Redundant |
| `bevxQRRcvNitDLnl` | Trade-In Weekly Export to Google Sheets | No | 2025-12-07 11:44 UTC | 2026-01-06 05:25 UTC | Never | 0 | Inactive & Redundant |
| `AubY0Rvhhvgp4GJ1` | Typeform To Monday Pre-Repair Form Responses (v2) | Yes | 2026-01-08 12:14 UTC | 2026-03-16 09:01 UTC | 2026-04-02 19:06 UTC | 52 | Active & Healthy |
| `kDfU2wWWv207T24J` | Walk-In Typeform → Intercom + Monday | Yes | 2026-02-05 10:18 UTC | 2026-02-11 16:39 UTC | 2026-04-02 13:42 UTC | 66 | Active & Healthy |
| `LjNBWaDz9f5Rj8g5` | Warranty Claim Form | Yes | 2026-02-09 09:53 UTC | 2026-02-09 10:01 UTC | 2026-03-07 15:38 UTC | 1 | Active & Healthy |
| `KDrCWzzvkcRlx05m` | Webhook 2: iCloud Check (OLD INACTIVE) | No | 2025-11-24 08:41 UTC | 2025-12-02 17:25 UTC | Never | 0 | Inactive & Redundant |
| `9jD6J2X3yCPk8Rjp` | Xero Invoice Creator | Yes | 2026-02-18 18:33 UTC | 2026-02-18 21:12 UTC | Never | 0 | Active & Healthy |
