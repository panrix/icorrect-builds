# Gophr Courier Integration — Claude Design Handoff

Date: 2026-05-02
Owner: Ops Jarvis / Logistics
Status: draft handoff; use after Office Hours decisions are confirmed

## Handoff purpose

Use this document as the clean brief for Claude Design to design:

1. the Shopify website courier module;
2. the backend/system plan for Gophr booking automation;
3. the Monday automation/writeback flow.

This is not yet a build ticket. It is the design input pack.

## Repos likely involved

- Website module: `/home/ricky/builds/icorrect-shopify-theme/`
- Existing Gophr discovery: `/home/ricky/builds/royal-mail-automation/docs/GOPHR-INTEGRATION-DISCOVERY-2026-04-24.md`
- Operations process docs: `/home/ricky/builds/operations-system/docs/domains/logistics/`

Repo for backend booking service still needs confirmation. Recommendation: use or create a dedicated courier/logistics service rather than hiding booking logic inside the Shopify theme.

## Design principle

Shopify must be a thin client.

The backend owns:
- Gophr API key;
- Gophr quote/job calls;
- commercial policy;
- margin/subsidy calculation;
- same-day capacity;
- staff review state;
- Monday writeback;
- Supabase booking ledger.

Shopify owns:
- user input;
- clear customer-facing choices;
- quote display;
- checkout handoff;
- non-technical fallback states.

Core decision captured 2026-05-02:
- Build a booking module/ledger where courier orders are saved.
- Same-day options are shown only when the backend/module says they are available.
- Corporate courier orders must be addable into the same module, not handled as a separate side process.
- V1 booking sources confirmed: Shopify frontend, manual non-corporate, and manual corporate.
- Shopify is fully frontend/customer-facing; manual booking is the staff path for both non-corporate and corporate jobs.
- Monday is not the full data-entry UX for Gophr; it should trigger booking flow when needed, not carry every courier metric.
- Monday `Book Courier` should be able to start a Telegram module/card that gathers or confirms the required Gophr data.
- Monday has two trigger statuses: `Book Courier` for inbound/collection courier and `Book Return Courier` for outbound/return courier.
- Same-day collection + return should create a booked inbound leg and a linked draft return leg for quick booking once repair readiness is confirmed.
- Return draft should be an internal booking-module draft first, not an automatic Gophr draft. Gophr draft may be possible, but duplicate/manual return booking risk is higher if external drafts exist too early.
- Return quick-book should be triggerable from Monday `Book Return Courier` and from a Telegram `Book Return Now` action on the linked booking card.
- Same-day collection+return capacity is consumed at parent booking/inbound booking time, not when the return leg is confirmed.
- Shopify same-day collection+return should be presented as one bundled customer-facing courier product/price. Internal accounting still tracks both leg costs and subsidy separately.
- Manual/corporate flows can retain separate leg pricing/handling where staff need flexibility.

## Website module brief

### User journeys

#### Journey A — London collection + return delivery

Customer selects repair, then chooses courier collection + return delivery.

Flow:
1. Customer chooses service/repair.
2. Customer selects “London courier collection + return”.
3. Customer enters address/postcode and contact details.
4. Frontend calls backend quote endpoint.
5. Backend returns serviceability, price, customer charge, subsidy info hidden from customer, and available tiers.
6. Frontend shows simple service choices.
7. Customer selects service and continues checkout.
8. Backend stores booking intent and creates draft workflow after payment/order.

Visible v1 tiers:
- Standard
- Fastest

Do not expose Economy/Fast/Direct/Custom until API mapping is proven.

#### Journey B — same-day iPhone collection + return

Same as Journey A, with extra constraints:
- eligible iPhone repairs only;
- before 10:30 cutoff;
- launch cap 2/day;
- hard cap 3/day;
- same-day option appears only if backend availability check returns true;
- wording must avoid exact return ETA promise.

Recommended copy boundary:
- Allowed: “Same-day collection and return may be available for selected iPhone repairs before 10:30, subject to confirmation.”
- Avoid: “Guaranteed same-day return by [exact time]”.

#### Journey C — not eligible / out of capacity

Frontend should gracefully route customer to:
- future-date courier;
- mail-in;
- walk-in;
- contact staff.

### Required input fields

Minimum:
- customer name;
- mobile number;
- email;
- pickup address line 1;
- postcode;
- country code default `GB`;
- selected repair/service;
- requested date/window if available.

Optional later:
- address line 2;
- notes/access instructions;
- coordinates/address validation ID.

### Backend quote response contract

Claude should design UI against this shape, not raw Gophr:

```json
{
  "eligible": true,
  "review_required": true,
  "reason_code": null,
  "service_area": "london",
  "available_options": [
    {
      "tier": "standard",
      "label": "Standard courier",
      "customer_charge_gross": 0,
      "currency": "GBP",
      "display_window": "Collection window to be confirmed",
      "same_day": false
    },
    {
      "tier": "fastest",
      "label": "Fastest courier",
      "customer_charge_gross": 19.99,
      "currency": "GBP",
      "display_window": "Fastest available collection",
      "same_day": true
    }
  ],
  "booking_intent_id": "uuid",
  "expires_at": "iso_datetime"
}
```

Failure states:
- `OUTSIDE_SERVICE_AREA`
- `OUTSIDE_CUTOFF`
- `CAPACITY_FULL`
- `QUOTE_UNAVAILABLE`
- `MISSING_REQUIRED_FIELDS`
- `STAFF_REVIEW_REQUIRED`

## System implementation plan

### State machine

Recommended states:
- `quote_requested`
- `quote_returned`
- `booking_intent_created`
- `draft_job_created`
- `telegram_review_pending`
- `approved`
- `rejected`
- `confirmed_with_gophr`
- `monday_updated`
- `customer_notified`
- `failed`
- `cancelled`

### Supabase table: `courier_bookings`

Minimum fields:
- `id`
- `created_at`
- `updated_at`
- `source` (`shopify_frontend`, `manual_non_corporate`, `manual_corporate`)
- `status`
- `customer_name`
- `customer_phone`
- `customer_email`
- `pickup_address_json`
- `dropoff_address_json`
- `monday_item_id`
- `shopify_order_id`
- `shopify_checkout_or_cart_ref`
- `gophr_job_id`
- `parent_booking_id` or `booking_group_id` for linked collection/return legs
- `leg_type` (`collection`, `return`)
- `leg_status` (`internal_draft`, `gophr_draft`, `booked`, `cancelled`, `failed`)
- `gophr_tracking_url`
- `gophr_quote_net`
- `gophr_quote_gross`
- `estimated_repair_margin`
- `customer_charge`
- `customer_charge_mode` (`bundled`, `per_leg`)
- `subsidy_amount`
- `margin_after_subsidy`
- `service_tier`
- `vehicle_type`
- `job_priority`
- `pickup_eta`
- `delivery_eta`
- `pickup_window_label`
- `delivery_window_label`
- `same_day_flag`
- `capacity_bucket`
- `telegram_message_id`
- `review_decision_by`
- `review_decision_at`
- `last_error`

### Backend endpoints

Recommended endpoints:

- `POST /api/courier/gophr/quote`
  - validates address/service;
  - calls Gophr quote;
  - applies policy;
  - stores quote/booking intent;
  - returns customer-safe quote response.

- `POST /api/courier/bookings`
  - creates booking records from Shopify checkout, staff/manual non-corporate entry, or staff/manual corporate order input;
  - stores source, addresses, customer/corporate account context, and requested service;
  - does not require a Gophr job yet.

- `POST /api/courier/bookings/:id/create-draft`
  - creates draft Gophr job only after required data exists;
  - stores Gophr job id and raw response;
  - triggers Telegram review.

- `POST /api/courier/bookings/:id/approve`
  - staff approval;
  - confirms Gophr job or marks approved for confirmation depending on Gophr API flow;
  - for same-day two-leg bookings, allows inbound leg to be confirmed while return leg remains internal draft/quick-book;
  - writes Monday after real booking exists.

- `POST /api/courier/bookings/:id/reject`
  - rejects draft;
  - records reason;
  - no customer tracking sent.

- `POST /api/courier/monday/book-courier-trigger`
  - receives/detects Monday `Book Courier` or `Book Return Courier` intent;
  - creates or locates a booking record;
  - posts Telegram data-completion/review card;
  - does not assume Monday contains all Gophr-required fields.

- `POST /api/courier/bookings/:id/monday-sync`
  - idempotent Monday projection/writeback.

### Monday writeback plan

Fields to reconfirm live before any code writes:
- `Gophr Link` — previously recorded as `text_mkzmxq1d`.
- `Gophr Time Window` — previously recorded as `text_mm084vbh`.
- courier service field values: `Gophr Courier`, `Gophr Express`, possibly `Stuart Courier`.
- status values: `Book Courier`, `Book Return Courier`, `Courier Booked`, `Return Booked`, `To Ship`, `Shipped`.

Rules:
- Do not write customer-facing tracking/time window until a real booking exists.
- Monday writeback should be idempotent.
- Monday should trigger and reflect courier state, not be the primary rich booking form.
- `Book Courier` should route to collection/inbound booking flow; `Book Return Courier` should route to return/outbound booking flow.
- Same-day collection+return is represented as linked legs: inbound confirmed first, return held as internal draft/quick-book until repair completion/return readiness.
- Same-day capacity must be reserved at parent booking/inbound booking time to prevent overselling, even while return remains internal draft.
- External Gophr draft return jobs should not be created automatically in v1 unless duplicate-booking controls are proven.
- Return booking can be initiated either by Monday status or Telegram action; both should resolve to the same internal return leg so duplicate bookings are blocked.
- If Gophr succeeds and Monday fails, booking remains real and must enter `monday_sync_failed` or equivalent alert state.
- If Monday succeeds and customer notification fails, booking remains real and must enter `customer_notify_failed` or equivalent alert state.

### Telegram review card

Card should show:
- customer;
- source;
- pickup/dropoff summary;
- selected service tier;
- Gophr gross cost;
- customer charge;
- subsidy amount;
- margin-after-subsidy if available;
- same-day capacity bucket;
- whether capacity was reserved;
- approve / reject / amend actions.

### Gophr probes still required

Before implementation:
1. Create minimally valid draft job and capture full response.
2. Confirm tracking URL response field.
3. Confirm time-window / ETA fields that should write to Monday.
4. Probe service-tier mapping for Standard/Fastest.
5. Probe direct/no-stopping field or confirm not in v1.
6. Confirm whether requested pickup/delivery window changes price and which field controls it.
7. Confirm whether postcode-only is accepted or full address is required for reliable quoting.

## Build sequence recommendation

1. Confirm Office Hours decisions.
2. Run read-only/live Gophr probes needed above.
3. Confirm Monday schema live.
4. Build backend quote endpoint + policy engine.
5. Build Supabase booking ledger.
6. Build Telegram review cards.
7. Build Monday dry-run sync, then live writeback after approval.
8. Design and implement Shopify module against backend contract.
9. Add draft Gophr job creation.
10. Launch draft-first.
11. Promote narrow auto-confirm only after clean data period.

## Open decisions for Ricky / Office Hours

- Confirmed direction: same-day can be customer-facing, but only when the booking module/backend says availability exists.
- What minimum margin-after-subsidy should be protected?
- What under-threshold prices should customer see for Standard and Fastest?
- Who can approve Telegram courier draft cards?
- Should future-date bookings be allowed to auto-confirm before same-day bookings?
- Should corporate courier costs be invoiced, absorbed, or just tracked internally?
- Should staff choose corporate service tier each time, or default to Fast/Gophr Express?
