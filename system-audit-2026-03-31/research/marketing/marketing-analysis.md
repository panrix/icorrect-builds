# Marketing And Growth Analytics

Last updated: 2026-04-02

## Scope

This file is the dedicated output for Track 1 from `RESEARCH-EXPANSION-BRIEF.md`.

Evidence base:
- PostHog exports in `/home/ricky/data/exports/system-audit-2026-03-31/posthog/`
- Google exports in `/home/ricky/data/exports/system-audit-2026-03-31/google/`
- Meta exports in `/home/ricky/data/exports/system-audit-2026-03-31/meta/`
- Shopify exports in `/home/ricky/data/exports/system-audit-2026-03-31/shopify/`
- derived summary in `/home/ricky/data/exports/system-audit-2026-03-31/marketing/track1-derived-summary-2026-04-01.json`
- marketing context docs in `/home/ricky/.openclaw/agents/marketing/workspace/docs/`

## Short Answer

- `Observed`: demand is live, not dead.
- `Observed`: the clearest current acquisition engine is organic search plus direct traffic.
- `Observed`: paid social is active, but its true acquisition efficiency is still only partially measurable from the accessible surfaces.
- `Observed`: operator confirmation says conversion truth should currently be treated as a blended model, and telephone orders also exist as a direct-to-Monday path outside normal web analytics.
- `Observed`: the biggest visible web-growth leaks are on high-intent pages such as `/pages/contact`, MacBook service pages, and the sitewide 404/problem-URL layer.
- `Inferred`: the business is not primarily failing because nobody is visiting; it is failing because too much traffic is leaking before enquiry or purchase, and the post-visit conversion chain is still not measured cleanly enough end to end.

## 1. Website Traffic And Behaviour

### GA4 Q1 2026

- `Observed`: GA4 Q1 2026 shows `24,477` sessions.
- `Observed`: channel split is:
  - `Organic Search`: `15,129` sessions (`61.8%`)
  - `Direct`: `6,802` sessions (`27.8%`)
  - `Paid Social`: `1,114` sessions (`4.6%`)
  - `Unassigned`: `781` sessions (`3.2%`)
  - all other channels combined: `651` sessions
- `Observed`: device split is:
  - `mobile`: `12,849`
  - `desktop`: `10,991`
  - `tablet`: `358`

### GA4 Landing-Page View

- `Observed`: the top visible landing pages include:
  - `/` with `1,144` sessions
  - `/collections/macbook-screen-repair-prices` with `596`
  - `/pages/macbook-repairs` with `493`
  - `/collections/iphone-battery-repair-prices` with `462`
- `Observed`: the landing-page layer is materially contaminated by Shopify web-pixel sandbox routes and `(not set)` rows, including:
  - `/web-pixels@.../sandbox/modern`
  - `(not set)` with `557` sessions and `99.3%` bounce rate
- `Inferred`: GA4 is still useful for channel mix and directional session volume, but it is not yet a clean source for page-level conversion diagnosis.

### PostHog Behaviour View

- `Observed`: PostHog last-30-day top events show live commerce and form activity:
  - `wizard_step`: `3,537`
  - `wizard_abandoned`: `601`
  - `wizard_resolution`: `547`
  - `Product Added to Cart`: `175`
  - `Checkout Started`: `153`
  - `wizard_conversion`: `104`
  - `Checkout Step: Contact Info`: `57`
  - `Checkout Step: Payment Info`: `45`
  - `Checkout Step: Shipping Info`: `20`
- `Observed`: PostHog last-90-day top pageviews are cleaner than GA4 landing-page output:
  - `/`: `4,522`
  - `/collections/macbook-screen-repair-prices`: `1,509`
  - `/pages/macbook-repairs`: `1,307`
  - `/collections/macbook-repair-prices`: `1,088`
  - `/pages/contact`: `1,057`
- `Observed`: PostHog dead-click concentration is strongest on high-intent pages:
  - `/pages/contact`: `275`
  - `/pages/macbook-repairs`: `160`
  - `/`: `135`
  - Flexgate blog page: `135`
  - `/pages/our-services`: `85`
  - `/pages/advanced-diagnostic`: `85`
- `Inferred`: the March 2026 PostHog/Shopify stitching work is directionally reflected in live event data because actual cart, checkout, and wizard events are now visible, but the full web analytics stack is still not clean enough to trust every session-to-conversion slice automatically.

## 2. Search Performance

### Search Console Q1 2026

- `Observed`: homepage search performance dominates the accessible page-level data:
  - `https://www.icorrect.co.uk/`: `531` clicks on `18,960` impressions, `2.8%` CTR
  - `https://www.icorrect.co.uk/contact-us`: `23` clicks on `3,316` impressions, `0.69%` CTR
- `Observed`: top visible queries are still heavily brand-led:
  - `icorrect`: `237` clicks / `2,168` impressions
  - `icorrect london`: `29` / `245`
  - `i correct`: `20` / `144`
- `Observed`: service-intent search exists but is under-converting:
  - `iphone repair london`: `4` clicks / `556` impressions / `0.72%` CTR / average position `1.46`
  - `iphone battery replacement`: `4` clicks / `200` impressions / `2.0%` CTR
- `Observed`: device split is asymmetric:
  - `MOBILE`: `421` clicks / `4,986` impressions / `8.44%` CTR
  - `DESKTOP`: `127` clicks / `13,913` impressions / `0.91%` CTR
- `Observed`: Search Console sitemap endpoint returned an empty object in the current probe.

### Interpretation

- `Observed`: search demand is real.
- `Observed`: the site is still more visible for brand and homepage queries than for service-page monetisation.
- `Inferred`: there is likely unrealised growth sitting inside service-term SEO because rankings/impressions exist without corresponding CTR.
- `Inferred`: desktop search performance looks especially weak and should be treated as a conversion-quality problem, not a demand problem.

## 3. Paid Advertising

### Meta / Facebook Q1 2026

- `Observed`: the visible Meta account is `iCorrect Ads`.
- `Observed`: `30` campaigns are visible, with only `2` active and `28` paused.
- `Observed`: the active campaigns are:
  - `MacBook Screen Repair — Cold — Mar 2026`
  - `MacBook Repairs — Cold — Mar 2026`
- `Observed`: visible Q1 spend for those accessible campaign-insight rows totals `£317.75`.
- `Observed`: the two active campaigns delivered:
  - `1,141` clicks
  - `212` landing-page views
  - `20` combined visible `view_content`
  - `9` click-to-call placements on the repairs campaign
- `Observed`: no reliable purchase or ROAS metric was exposed in the accessible insights pull.

### Social Footprint

- `Observed`: Facebook page metrics show:
  - page name `iCorrect`
  - `4,500` followers
  - `4.8` overall star rating
- `Observed`: the connected Instagram business account is accessible and currently shows:
  - username `icorrect_`
  - `31,541` followers
  - `417` media items

### Interpretation

- `Observed`: paid social is not dormant; it is running, but in a very concentrated way.
- `Inferred`: the paid-social question is no longer “are we advertising?” but “is this spend producing profitable jobs?”
- `Observed`: the current accessible Meta surface does not close that question because conversion and revenue attribution remain partial.

## 4. Shopify Conversion Surface

- `Observed`: Shopify Q1 2026 shows:
  - `108` orders
  - `£20,711.00` gross revenue
  - `97` paid
  - `9` refunded
  - `2` partially refunded
  - `£747.00` total discount usage
- `Observed`: March 2026 alone shows:
  - `64` orders
  - `£13,686.00` gross revenue
- `Observed`: payment gateway distribution is effectively all `shopify_payments`.
- `Observed`: top line items by quantity are service-entry products, not only repair SKUs:
  - `Walk-In Service`: `76`
  - `Mail-In Service`: `33`
  - `Walk-In Deposit`: `5`
- `Observed`: PostHog commerce funnel events now exist in production, but there is still a measurable drop from:
  - `175` add-to-cart
  - `153` checkout started
  - `57` contact-info step
  - `45` payment-info step
  - `20` shipping-info step
- `Inferred`: the store is generating paid orders, but the accessible funnel still looks shallow and mixed with service-booking behaviour rather than a clean retail ecommerce funnel.

## 5. Conversion Leakage

### Strongest Current Leakage Signals

- `Observed`: GA4 logged `543` pageviews for `404 Not Found – iCorrect` in the recent audit window.
- `Observed`: PostHog logged `2,122` dead clicks in the last `30` days and `275` dead clicks on `/pages/contact` alone over the longer page analysis.
- `Observed`: the contact page is simultaneously:
  - a top pageview destination
  - a high dead-click surface
  - a poor search CTR destination
- `Inferred`: the website is leaking demand at exactly the points where intent should convert into contact or booking.

## 6. CAC And Attribution State

- `Observed`: there is enough data to prove demand and some channel contribution, but not enough to produce a defensible full CAC model yet.
- `Observed`: operator confirmation on `2026-04-02` is that conversion truth should currently be treated as a blended model rather than PostHog-only or GA4-only.
- `Observed`: operator confirmation also says telephone orders exist and can go directly into Monday, which means web-only analytics understate total conversion activity.
- `Observed`: a fresh full-board Monday source pull on `2026-04-02` shows the current `Source` field is not usable as canonical attribution truth:
  - `4,319 / 4,459` total items are blank
  - `3,039 / 3,178` non-BM items are blank
  - `1,546 / 1,677` paid non-BM items are blank
  - `0` items are labelled `Phone` despite operator confirmation that phone/direct-to-Monday orders exist
- `Observed`: current measurable pieces include:
  - GA4 session volume and source mix
  - Search Console search demand
  - Meta spend/click/LPV data
  - Shopify order and revenue data
  - PostHog event-level behaviour
- `Observed`: the missing closure points are:
  - reliable source-to-enquiry attribution
  - reliable enquiry-to-paid-job attribution
  - reliable paid-social purchase attribution
  - inclusion of phone/direct-to-Monday demand inside the same attribution model
  - rehabilitation or replacement of Monday's effectively blank `Source` field
- `Inferred`: the business likely has a conversion problem before it has a traffic problem, but CAC cannot yet be calculated cleanly per channel without more stitching.

## 7. What This Means For The Wider Business Audit

- `Observed`: there is enough acquisition and conversion activity to reject the idea that the business is dead because demand disappeared.
- `Observed`: organic search remains the strongest visible acquisition engine.
- `Observed`: paid social is live, but not yet proven profitable from the accessible data.
- `Observed`: Meta is currently the only operator-confirmed owned paid-marketing spend source.
- `Observed`: Shopify is producing paid orders and current gross revenue.
- `Observed`: the current Monday source field cannot be trusted as channel truth, so attribution leakage exists inside the operational system as well as in web analytics.
- `Inferred`: the bigger current marketing risk is leakage and measurement quality:
  - friction on high-intent pages
  - partial analytics contamination
  - incomplete enquiry-to-revenue attribution

## Current Blockers

See `marketing-blockers.md`.

## Conclusion

- `Observed`: marketing demand exists across organic search, direct traffic, social, and Shopify.
- `Observed`: the site is still leaking conversions through UX friction, broken/404 traffic, and incomplete measurement.
- `Inferred`: the right business diagnosis is not “no growth,” but “growth is being captured and attributed badly enough that it is not turning into clean profitable output fast enough.”
