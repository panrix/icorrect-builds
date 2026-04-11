# Client Journey Meta

Status: created on 2026-04-02

## What This Pass Covers

- Rebuilt all eight journey files as customer-experience maps rather than first-pass status summaries:
  - `walk-in-customer.md`
  - `mail-in-send-in-customer.md`
  - `shopify-online-purchase.md`
  - `phone-enquiry.md`
  - `backmarket-tradein.md`
  - `backmarket-resale-order.md`
  - `corporate-b2b-client.md`
  - `warranty-aftercare-returns.md`
- For each journey, documented:
  - customer touchpoints
  - internal handoffs
  - systems involved
  - automation vs manual state
  - communication gaps
  - delay points
  - failure modes
  - improvement opportunities
- Used `MASTER-QUESTIONS-FOR-JARVIS.md` as the authority layer for disputed operating facts.
- Folded in timing evidence from `timing-mapping.md` and queue-health evidence from `findings.md`.
- Cross-checked the drafts against workflow exports, SOPs, VPS service docs, and KB files instead of relying on older journey drafts alone.

## New Or Sharpened Findings Added In This Pass

- Status notifications are now documented against the live VPS sender, not the older n8n sender. The old n8n workflow was disabled on 2026-04-01.
- The walk-in and mail-in journeys now reflect the active pre-repair Typeform enrichment workflow, including the fact that it can write internal updates, add Intercom notes, set `Received`, and move items into `Today's Repairs`.
- The corporate journey now distinguishes the verified company-linked Intercom path from the weaker evidence around Monday item creation, instead of implying a fuller corporate-specific automation layer than the audit supports.
- The warranty journey now explicitly captures the current attribution hack: SMTP email into Intercom first, then delayed contact swap.
- The phone journey now makes the operator choice (`log_only`, `intercom_only`, `intercom_monday`) a first-class failure mode because it controls whether the lead ever becomes actionable.
- The BM journeys now separate:
  - seller-side trade-in acquisition
  - buyer-side resale fulfilment
  - manual aftercare / returns
  instead of blending them into one partial operational summary.

## High-Confidence Cross-Journey Themes

- Monday is the canonical ops record, but its stale non-terminal backlog makes status counts unreliable as a live queue.
- Intercom is the communications hub, but response performance is still inconsistent and too much ingress is still shaped by email/attribution hacks.
- Several customer-visible flows are only proactive at specific status checkpoints; long waits between checkpoints still rely on humans remembering to chase.
- Payment closure is weak across multiple journeys because Monday does not receive reliable paid-state write-back from the finance stack.
- Manual handoff points remain the dominant hidden-risk layer:
  - intake completeness
  - quote follow-up
  - operator-invoked BM listing
  - phone enquiry promotion out of Slack
  - BM return detection

## Still Unknown

- Exact adoption rate of the verified digital walk-in form versus manual reception handling.
- Exact current owner and SOP for non-Shopify manual mail-in creation.
- Exact downstream handlers for the Slack phone-enquiry follow-up buttons.
- Exact current operational owner for manual BM listing publication.
- Exact rate at which warranty claims are converted from Intercom into operational Monday repairs.
- Any hidden/manual tracker for open warranty, corporate, or phone-lead follow-up that sits outside the audited systems.

## Source Set Used Most Heavily

- `findings.md`
- `data_flows.md`
- `timing-mapping.md`
- `team-operations-summary.md`
- `open_questions.md`
- `MASTER-QUESTIONS-FOR-JARVIS.md`
- `/home/ricky/kb/operations/intake-flow.md`
- `/home/ricky/kb/operations/queue-management.md`
- `/home/ricky/kb/operations/qc-workflow.md`
- `/home/ricky/kb/monday/main-board.md`
- `/home/ricky/builds/backmarket/sops/*.md`
- `/home/ricky/builds/monday/services/status-notifications/templates.js`
- `/home/ricky/builds/webhook-migration/verification/status-notifications-live-cutover-2026-04-01.md`
- `/home/ricky/data/exports/system-audit-2026-03-31/n8n/active/*.json`
- `/home/ricky/builds/telephone-inbound/server.py`

## Recommended Next Pass

1. Pull a fresh Monday / Intercom exception sample and attach example item IDs or conversation IDs to each recurring gap class.
2. Build one cross-journey “handoff failure matrix” showing where ownership changes without an automatic acknowledgement.
3. Design the replacement state model for:
   - intake completeness
   - quote/approval ageing
   - payment closure
   - aftercare/returns ownership
