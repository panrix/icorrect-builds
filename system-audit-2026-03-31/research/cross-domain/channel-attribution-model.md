# Channel Attribution Model

Last updated: 2026-04-02

## Purpose

This file turns the research answer to `Q14` into a practical attribution model.

Operator-confirmed truth:
- `Observed`: conversion truth should currently be treated as a blended model.
- `Observed`: telephone orders also exist and can go directly into Monday.

## Current Measured State

- `Observed`: web demand is measurable in GA4, PostHog, Search Console, Meta, and Shopify.
- `Observed`: Monday is the operational destination for jobs, but its current `Source` field is not usable as canonical attribution truth.
- `Observed`: a full main-board pull on `2026-04-02` shows:
  - `4,319 / 4,459` items are blank on `Source`
  - `3,039 / 3,178` non-BM items are blank
  - `1,546 / 1,677` paid non-BM items are blank
  - `0` items are labelled `Phone`
  - only `133` total items are labelled `Website`

Primary evidence:
- `/home/ricky/data/exports/system-audit-2026-03-31/monday/source-surface-2026-04-02.json`
- `/home/ricky/data/exports/system-audit-2026-03-31/monday/source-surface-summary-2026-04-02.json`
- `/home/ricky/builds/system-audit-2026-03-31/marketing-analysis.md`

## Current Best Working Model

### 1. Demand Truth

- `Observed`: GA4 and PostHog are the best current demand/session sources.
- `Observed`: Search Console is the best current search-intent source.
- `Observed`: Meta is the only operator-confirmed owned paid-spend source.

### 2. Paid Ecommerce Truth

- `Observed`: Shopify is the best current source for paid online orders and order revenue.
- `Observed`: `shopify_payments` is the live observed gateway path.

### 3. Operational Job-Closure Truth

- `Observed`: Monday is the best current source for job creation, repair progress, service type, and downstream operational closure.
- `Observed`: Monday is also the canonical customer identity owner, but not a clean attribution owner today.

### 4. Missing Direct-Demand Truth

- `Observed`: phone/direct-to-Monday demand exists operationally but is largely invisible in the current `Source` field.
- `Inferred`: any current conversion rate built from web sessions versus Monday closures is web-biased and understates non-web conversion capture.

## Recommended Blended Attribution Stack

Use these systems for these layers:

- `GA4/PostHog`: demand volume and behaviour
- `Search Console`: organic search intent
- `Meta`: paid spend and top-of-funnel paid performance
- `Shopify`: paid ecommerce orders
- `Monday`: repair-job creation and closure by service path
- `Intercom`: assisted enquiry and quote/comms timing

## Minimum Target-State Rules

### Rule 1: Separate Acquisition From Fulfilment

- `Observed`: Monday should not be forced to be the only acquisition source of truth.
- `Inferred`: it should hold a normalized ingress outcome, while web analytics and Shopify keep session/order truth.

### Rule 2: Rebuild Monday Source Capture

Minimum acceptable Monday source set:
- `Phone`
- `Website`
- `Intercom`
- `Shopify`
- `Walk-In`
- `Returning Client`
- `Corporate Referral`
- `Back Market`
- `Other Shops`

### Rule 3: Track Channel At Two Levels

For each job, capture:
- `initial_enquiry_source`
- `payment_closure_channel`

This matters because:
- website enquiry can become walk-in payment
- Intercom can assist a Shopify or phone-origin repair
- corporate work can originate on website but close in Xero

### Rule 4: Treat Phone As First-Class Demand

- `Observed`: phone is a real ingress path.
- `Observed`: current Monday source data records `0` phone items.
- `Inferred`: phone demand is currently leaking out of attribution, not out of the business.

## Practical Interim Reporting Model

Until source capture is rebuilt, report in four layers:

1. `Web demand`
   - GA4 sessions
   - PostHog high-intent events
   - Search Console clicks

2. `Paid web closures`
   - Shopify orders and revenue

3. `Repair-work closures`
   - Monday completed/paid jobs by service type

4. `Known blind spots`
   - phone/direct-to-Monday
   - walk-in without clean source capture
   - mixed Intercom/manual entry

## Main Conclusion

- `Observed`: the business has enough demand and closure data to run a blended model now.
- `Observed`: the Monday `Source` field is currently too blank to be trusted as attribution truth.
- `Inferred`: the correct next step is not “pick one analytics tool,” but “rebuild a blended attribution model with explicit phone and walk-in capture.”
