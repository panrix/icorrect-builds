# Gophr Courier Integration — Office Hours Scope

Date: 2026-05-02
Owner: Ops Jarvis / Logistics
Status: draft scoping pack for Office Hours

## Source evidence read

- `/home/ricky/.openclaw/agents-archive-2026-04-29/systems-live-state/workspace/memory/2026-04-25-gophr-work.md`
- `/home/ricky/.openclaw/agents-archive-2026-04-29/systems-live-state/workspace/memory/2026-04-25-gophr-architecture.md`
- `/home/ricky/.openclaw/agents-archive-2026-04-29/systems-live-state/workspace/memory/2026-04-25-gophr-api.md`
- `/home/ricky/.openclaw/agents-archive-2026-04-29/systems-live-state/workspace/docs/gophr-end-to-end-map.md`
- `/home/ricky/.openclaw/agents-archive-2026-04-29/systems-live-state/workspace/docs/gophr-architecture-note.md`
- `/home/ricky/builds/royal-mail-automation/docs/GOPHR-INTEGRATION-DISCOVERY-2026-04-24.md`

## Problem statement

iCorrect wants Gophr to become the London same-day / local courier layer, not a one-off manual courier tool.

The integration must support three business jobs:

1. Website customer self-service: collection + return delivery quote/booking from Shopify. This is fully frontend/customer-facing.
2. Manual staff booking for non-corporate customer courier needs, including walk-in return delivery and ad-hoc collections.
3. Manual staff booking for corporate courier orders, using saved corporate addresses where possible.
4. Operational control: draft-first review in Telegram, then Monday writeback once a real booking exists.

The old Systems work proved Gophr is viable, but it is not yet scoped cleanly enough for website design or automation build.

## What is already confirmed

### Gophr API

Confirmed from discovery:
- Authentication uses `API-KEY` header.
- Production base URL worked; sandbox rejected the production key.
- `POST /quotes` works.
- `POST /jobs` supports draft jobs with `is_confirmed = 0`.
- Deliveries cannot be added after a job is confirmed.
- Draft jobs can be edited more broadly than confirmed jobs.
- Required quote/job payload shape includes pickup/dropoff address, postcode, country code, parcels, and for jobs, contact name/mobile.
- Parcel payload requires external id, dimensions, and weight.
- `vehicle_type` changes price/timing.
- `job_priority = 3` materially changed price in the tested route.

### Product direction

Captured decisions:
- Website should offer collection plus delivery.
- Walk-in clients should be offered return delivery.
- Strategic aim is to move suitable walk-ins toward courier where this improves operations.
- Courier subsidy must be margin-aware, not a blunt free threshold.
- Working courier cost assumption is roughly £20 each direction.
- Working threshold around £250 is only a signal; real policy should protect margin-after-subsidy.
- Draft-first booking is the launch state; auto-confirm is the target state after confidence is proven.
- Telegram is the draft-review channel.
- Monday + Supabase together are the operating record.
- Shopify should be a thin client; backend owns pricing, margin, capacity, and Gophr API key.

### Same-day constraints

Captured decisions:
- Same-day collection + return for iPhone repairs is the constrained product.
- Launch cap: 2 same-day iPhone collection+return jobs per day.
- Hard max: 3 per day.
- Cutoff: 10:30.
- Do not promise exact same-day return ETA in v1; repair-time prediction is a separate system.

## What is not confirmed yet

API unknowns:
- exact mapping for Gophr service cards: Economy, Fast, Fastest, Direct, Custom;
- exact field for direct/no-stopping behavior;
- exact field or call pattern for pickup/delivery window price changes;
- whether postcode-only quoting is good enough or full address is required;
- full draft job creation response shape;
- exact tracking-link and time-window response fields for Monday writeback.

Ops unknowns:
- live Monday column IDs and status labels must be reconfirmed before writes;
- staff override/block switch rules are undecided;
- corporate default tier and cost treatment are undecided;
- under-threshold customer-facing prices are undecided.

## Office Hours forcing questions

### 1. What is the exact customer promise?

Recommended starting answer:
- London customers can request courier collection and return delivery.
- Standard future-date courier is a convenience option.
- Same-day iPhone collection+return is a limited-capacity premium product.
- v1 does not promise exact return ETA; it promises collection/booking window and staff-confirmed progression.

Decision captured 2026-05-02:
- Build a booking module/ledger where courier orders are saved.
- Website should only show same-day if the module says same-day capacity/eligibility is available.
- Same-day availability is therefore system-driven, not static website copy.
- Corporate orders must be addable into the same booking module when they arrive.
- Booking sources confirmed for v1: Shopify frontend, manual non-corporate, manual corporate.
- Monday is not the full data-entry UX for Gophr because it cannot comfortably capture all required courier metrics/fields.
- Monday `Book Courier` can act as a trigger to start the Telegram booking module, where staff complete/confirm the richer Gophr data.
- Monday has two intent statuses that should trigger different Telegram flows: `Book Courier` for inbound/collection courier and `Book Return Courier` for outbound/return courier.
- For same-day collection + return, the first/inbound leg should be booked first, while the return leg is created as a linked draft/quick-book leg for later confirmation once repair readiness is known.
- Return draft should be internal first, not an immediate Gophr draft, even if Gophr drafts can sit without expiry/pricing drift. Reason: manual return booking while Gophr drafts also exist creates duplicate-booking/mess risk.
- Return quick-book should be triggerable from both Monday `Book Return Courier` and a Telegram `Book Return Now` action on the linked booking card.
- Same-day collection+return capacity is consumed at parent booking/inbound booking time, not when the return leg is finally confirmed. This prevents overselling the same-day promise.

Recommendation updated:
- The booking module becomes the control point. Website, Telegram, and Monday all read/progress bookings from the same ledger. Same-day can be customer-facing only when availability is true; otherwise the website falls back to standard/future courier or staff contact.

### 2. What commercial rule protects margin?

Recommended starting answer:
- Calculate repair gross margin estimate.
- Calculate real Gophr gross cost for outbound/return legs.
- Set customer charge and subsidy from margin-after-subsidy.
- Never offer free/subsidised courier if margin-after-subsidy falls below the configured floor.

Decision needed:
- Minimum margin-after-subsidy floor.
- Customer-facing under-threshold prices for Standard and Fastest.

Recommendation:
- Use configurable policy, not hard-coded values:
  - `min_margin_after_subsidy_gbp`
  - `min_margin_after_subsidy_percent`
  - `max_subsidy_per_leg_gbp`
  - `free_courier_repair_value_signal_gbp`
  - `standard_markup_percent`
  - `fastest_markup_percent`

### 3. What is the v1 operational control point?

Recommended starting answer:
- All bookings start as draft Gophr jobs.
- Telegram receives booking cards.
- Staff approve, reject, or amend.
- Monday is updated only after a real booking exists.

Decision needed:
- Which users/channels can approve courier drafts.
- Whether auto-confirm is allowed for future-date bookings earlier than same-day bookings.

Recommendation:
- Launch with draft-first for all flows.
- Add auto-confirm only for low-risk future-date Shopify bookings after 2 weeks of clean booking data.

### 4. What needs to exist before Claude designs the website module?

Minimum design inputs:
- Customer promise and copy boundaries.
- Service tiers visible in v1: recommended `Standard` and `Fastest` only.
- Required customer fields: name, mobile, email, pickup address, postcode, repair/service, preferred date/window.
- Pricing response contract from backend.
- Error/edge states: not serviceable, outside capacity, outside cutoff, quote unavailable, staff review needed.

Recommendation:
- Do not ask Claude to design from raw Gophr API notes. Give it a clean backend contract and UX state list.

### 5. What needs to exist before automations write back to Monday?

Minimum build inputs:
- Reconfirmed Monday board/column IDs.
- Booking state machine.
- Supabase schema.
- Clear mapping from booking state to Monday status/service/link/window.
- Failure handling when Gophr succeeds but Monday writeback fails, or vice versa.

Recommendation:
- Build the booking ledger first. Monday should be a projection/writeback target, not the only source of booking state.

### 6. What is the first useful build slice?

Recommended first slice:
1. Booking module/ledger as the core object model, supporting three v1 sources: Shopify frontend, manual non-corporate, and manual corporate.
2. Backend quote endpoint with policy calculation and same-day availability checks.
3. Supabase `courier_bookings` table storing quote attempts, booking intents, corporate/manual bookings, and decisions, with support for linked legs where inbound is booked and return is internal draft/quick-book until confirmation.
4. Monday `Book Courier` or `Book Return Courier` trigger starts the matching Telegram data-completion/review module when the booking did not originate from Shopify/internal form.
5. Telegram draft card generated from a stored booking record.
6. Monday writeback in dry-run first.
7. Shopify module consuming backend quote/availability endpoint.
8. Draft Gophr job creation.
9. Manual approval to confirm booking.

Why:
- This isolates design from live mutation risk.
- It lets Claude design the website against a stable contract.
- It lets automations prove Monday writeback safely before customer-facing auto-confirm.

## Recommended Office Hours outcome

Office Hours should produce two artefacts:

1. Website module design brief for Claude Design:
   - customer journeys;
   - screen states;
   - copy boundaries;
   - backend contract;
   - edge cases.

2. System implementation plan:
   - Supabase schema;
   - backend quote/booking endpoints;
   - Gophr API probes still required;
   - Telegram review flow;
   - Monday writeback plan;
   - rollout gates from draft-first to auto-confirm.
