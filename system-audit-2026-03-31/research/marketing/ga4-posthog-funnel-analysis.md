# GA4 + PostHog Funnel Analysis

Last updated: 2026-04-02

## Scope

- Objective: map the web conversion funnel from visitor to booking/purchase using GA4 and PostHog.
- Reporting window: `2026-01-02` through `2026-04-01` inclusive (`90` full days, excluding partial `2026-04-02` data).
- GA4 property: `353983768`
- PostHog endpoint: `https://us.posthog.com`

## Method

- Read supporting context first:
  - `marketing-analysis.md`
  - `marketing-blockers.md`
  - `channel-attribution-model.md`
- Pull like-for-like `90` day data from GA4 and PostHog APIs.
- Use observed page paths and event names only; do not infer missing events as if they existed.
- Treat conclusions as a blended web-analytics view only; phone/direct-to-Monday demand remains out of scope for these counts.

## Working Notes

- Context confirms demand exists and that leakage, not top-of-funnel traffic absence, is the likely problem.
- Known measurement caveat: GA4 landing-page reporting is partially contaminated by Shopify web-pixel sandbox routes and `(not set)` rows.
- PostHog probe confirms live funnel-relevant events exist:
  - `Product Added to Cart`
  - `Checkout Started`
  - `Checkout Step: Contact Info`
  - `Checkout Step: Payment Info`
  - `Checkout Step: Shipping Info`
  - `Order Completed`
  - `wizard_step`
  - `wizard_resolution`
  - `wizard_conversion`
  - `wizard_abandoned`

## Findings

## Short Answer

- `Observed`: demand is present in both tools. GA4 shows `24,947` sessions in the 90-day window, and PostHog shows `17,686` distinct pageview sessions.
- `Observed`: the site does not behave like one clean linear funnel. It splits into a booking/form branch and a Shopify checkout branch early.
- `Observed`: the booking widget is not confined to `/pages/contact`. PostHog shows most wizard activity on `https://icorrect.co.uk/#home-contact`, and both tools show booking interaction on `/` as well as `/pages/contact`.
- `Observed`: the best current web visitor -> customer conversion estimate is GA4 `105 purchases / 24,947 sessions = 0.42%`.
- `Observed`: PostHog records only `30` `Order Completed` events in the same window, so raw PostHog visitor -> customer comes out to `0.17%`, but that is a tracking floor, not the best truth.
- `Observed`: the biggest reliable measured ecommerce drop-off is PostHog `Checkout Started` -> `Checkout Step: Contact Info` (`338` -> `92`, `-72.8%`).
- `Inferred`: if the funnel is forced into the requested single sequence, the apparent biggest leak is product/service reach -> explicit booking page reach, but that overstates leakage because the booking wizard also runs on the homepage hash and some service/product pages.

## 1. GA4

### Acquisition

GA4 `sessions` by source/medium for `2026-01-02` through `2026-04-01`:

| Source / medium | Sessions | Share | Engaged sessions | Bounce rate |
| --- | ---: | ---: | ---: | ---: |
| `google / organic` | 14,926 | 59.8% | 12,194 | 18.3% |
| `(direct) / (none)` | 6,959 | 27.9% | 5,364 | 22.9% |
| `facebook / paid` | 1,077 | 4.3% | 705 | 34.5% |
| `(not set)` | 531 | 2.1% | 0 | 100.0% |
| `bing / organic` | 292 | 1.2% | 239 | 18.2% |
| `chatgpt.com / (not set)` | 279 | 1.1% | 228 | 18.3% |

`Observed`: organic search and direct still dominate top-of-funnel demand.

### Landing Pages And Bounce

Top valid GA4 landing pages after excluding `(not set)` and Shopify web-pixel sandbox rows:

| Landing page | Sessions | Bounce rate |
| --- | ---: | ---: |
| `/` | 1,186 | 48.5% |
| `/collections/iphone-battery-repair-prices` | 507 | 43.6% |
| `/collections/macbook-screen-repair-prices` | 412 | 56.8% |
| `/pages/macbook-repairs` | 215 | 55.8% |
| Flexgate blog page | 159 | 52.8% |
| `/collections/iphone-16-repair-prices` | 119 | 58.0% |
| `/collections/apple-watch-screen-glass-only-repair-prices` | 113 | 63.7% |
| `/pages/contact` | 78 | 53.8% |
| `/pages/iphone-repairs` | 75 | 64.0% |

Device-level bounce examples on high-intent landing pages:

| Landing page | Device | Sessions | Bounce rate |
| --- | --- | ---: | ---: |
| `/` | `desktop` | 578 | 53.3% |
| `/` | `mobile` | 592 | 44.6% |
| `/pages/macbook-repairs` | `desktop` | 75 | 69.3% |
| `/pages/macbook-repairs` | `mobile` | 140 | 48.6% |
| `/pages/contact` | `desktop` | 30 | 66.7% |
| `/pages/contact` | `mobile` | 47 | 44.7% |
| `/collections/apple-watch-screen-glass-only-repair-prices` | `desktop` | 22 | 68.2% |
| `/collections/apple-watch-screen-glass-only-repair-prices` | `mobile` | 89 | 62.9% |

`Observed`: desktop bounce is worse than mobile on the homepage, contact page, and key service pages.

Measurement caveat:

- `Observed`: GA4 landing-page output is materially contaminated by `(not set)` and Shopify web-pixel sandbox routes.
- `Observed`: `(not set)` alone carries `590` sessions at `99.3%` bounce.

### Page Path Flow

Top clean GA4 page paths by pageviews/sessions:

| Page path | Pageviews | Sessions |
| --- | ---: | ---: |
| `/` | 3,121 | 2,154 |
| `/collections/macbook-screen-repair-prices` | 1,941 | 1,428 |
| `/pages/macbook-repairs` | 1,341 | 1,072 |
| `/collections/iphone-battery-repair-prices` | 1,144 | 911 |
| `/collections/macbook-repair-prices` | 641 | 302 |
| `/collections/iphone-repair-prices` | 619 | 300 |
| `/pages/contact` | 485 | 287 |
| `/pages/iphone-repairs` | 389 | 233 |

Referrers into `/pages/contact`:

- `https://icorrect.co.uk/` -> `/pages/contact`: `278` pageviews
- `https://icorrect.co.uk/pages/about-us` -> `/pages/contact`: `78`
- direct / blank referrer -> `/pages/contact`: `48`
- `https://www.google.com/` -> `/pages/contact`: `45`

Referrers into checkout pages are mainly product pages and the homepage, for example:

- product page `macbook-pro-14-m1-2021-a2442-screen-repair` -> checkout: `16`
- homepage -> checkout path examples: `13`, `13`, `10`, `7`, `6`
- `/cart` -> checkout: `7`

`Observed`: GA4 supports a split-path interpretation:

- contact/booking traffic is mostly reached from the homepage, About page, direct traffic, and Google
- Shopify checkout traffic often starts directly from product pages or the homepage without touching `/pages/contact`

### Conversion Events

Top GA4 conversion-relevant event counts:

| Event | Count |
| --- | ---: |
| `form_start` | 437 |
| `purchase` | 105 |
| `form_submit` | 69 |
| `form_submission` | 32 |

GA4 booking-intent detail:

- `Observed`: `form_start` happens heavily on both `/pages/contact` (`115`) and `/` (`114`).
- `Observed`: `form_submit` happens on `/` (`18`) and `/search` (`14`), but `/pages/contact` returned no `form_submit` rows at all.
- `Inferred`: GA4 does not expose a clean Typeform-submit signal here; it exposes generic form events that do not close the booking story reliably.

GA4 ecommerce detail:

- `Observed`: `purchase` count is `105`.
- `Observed`: GA4 `purchaseRevenue` is `£20,141.00`.
- `Observed`: purchase page paths are almost entirely Shopify web-pixel sandbox checkout URLs, not clean storefront thank-you pages.

### GA4 Funnel View

Definitions used:

- `Landing`: GA4 `sessions`
- `Product/service page`: sessions where `pagePath` matched repair/service/product patterns
- `Typeform/booking page`: explicit `/pages/contact` or `/contact-us` page sessions only
- `Typeform submit`: GA4 `form_submit` because no explicit Typeform event/form ID surfaced
- `Shopify checkout`: sessions where `pagePath` matched `checkout|checkouts`
- `Order complete`: GA4 `purchase`

| Stage | Count | Stage rate |
| --- | ---: | ---: |
| Landing sessions | 24,947 | 100.0% |
| Product/service-page sessions | 8,614 | 34.5% of landing |
| Explicit booking-page sessions | 287 | 3.3% of service reach |
| `form_start` | 437 | not linear with booking-page stage |
| `form_submit` | 69 | 24.0% of explicit booking-page sessions |
| Checkout sessions | 316 | 3.7% of service reach |
| `purchase` | 105 | 33.2% of checkout sessions |

`Inferred`: the requested linear funnel is only partially valid in GA4 because booking and checkout are parallel branches, not always sequential steps.

## 2. PostHog

### Event Surface

Top relevant PostHog event counts in the same window:

| Event | Count |
| --- | ---: |
| `wizard_step` | 3,714 |
| `wizard_abandoned` | 634 |
| `wizard_resolution` | 567 |
| `Product Added to Cart` | 286 |
| `Checkout Started` | 338 |
| `wizard_conversion` | 108 |
| `Checkout Step: Contact Info` | 92 |
| `Checkout Step: Payment Info` | 78 |
| `Checkout Step: Shipping Info` | 31 |
| `Order Completed` | 30 |

`Observed`: PostHog has much stronger downstream checkout-step instrumentation than GA4.

### Page Paths And Booking Surface

Top PostHog pageview paths:

| Path | Pageviews |
| --- | ---: |
| `/` | 4,545 |
| `/collections/macbook-screen-repair-prices` | 1,570 |
| `/pages/macbook-repairs` | 1,334 |
| `/collections/macbook-repair-prices` | 1,097 |
| `/pages/contact` | 1,061 |
| `/collections/iphone-repair-prices` | 983 |
| `/collections/iphone-battery-repair-prices` | 952 |

Observed booking-wizard locations:

- `wizard_step` top URL: `https://icorrect.co.uk/#home-contact` with `876` events
- `wizard_step` on `https://icorrect.co.uk/pages/contact`: `138`
- `wizard_step` also appears on service pages such as:
  - `/collections/iphone-14-pro-max-repair-prices`: `54`
  - `/collections/iphone-13-repair-prices`: `46`
  - `/collections/iphone-16-repair-prices`: `45`
- `wizard_conversion` top URL: `https://icorrect.co.uk/#home-contact` with `74`

`Observed`: the booking/intake widget runs on the homepage hash and some service/product pages, not just on the contact page.

### PostHog Funnel View

Session-based stages where PostHog had usable `$session_id`:

| Stage | Count |
| --- | ---: |
| Distinct pageview sessions | 17,686 |
| Distinct service-page sessions | 11,708 |
| Distinct explicit contact-page sessions | 896 |
| Distinct `wizard_conversion` sessions | 64 |

Checkout/order events are better read as event counts because the custom checkout/order events do not carry usable session IDs:

| Stage | Count | Stage rate |
| --- | ---: | ---: |
| `Product Added to Cart` | 286 | n/a |
| `Checkout Started` | 338 | n/a |
| `Checkout Step: Contact Info` | 92 | 27.2% of checkout starts |
| `Checkout Step: Payment Info` | 78 | 84.8% of contact-info steps |
| `Checkout Step: Shipping Info` | 31 | 39.7% of payment-info steps |
| `Order Completed` | 30 | 96.8% of shipping-info steps |

`Observed`: the biggest measured PostHog drop is `Checkout Started` -> `Checkout Step: Contact Info` (`338` -> `92`, `-72.8%`).

### PostHog Tracking Gaps

- `Observed`: `Checkout Started`, checkout-step, and `Order Completed` events had `0` usable session IDs.
- `Observed`: `142 / 338` `Checkout Started` events had `null` `current_url`.
- `Observed`: all `1,061` `/pages/contact` pageviews returned blank `prev_pageview_pathname`, so PostHog cannot reconstruct the contact-page incoming path cleanly from that property.
- `Observed`: `Order Completed` exists, but only `30` events were recorded in the full 90-day window.

## 3. Cross-Platform Comparison

### Where GA4 And PostHog Agree

- `Observed`: both tools show substantial service-page demand.
  - GA4 service-page sessions: `8,614`
  - PostHog service-page sessions: `11,708`
- `Observed`: both tools show that homepage plus high-intent service pages are the main traffic surfaces.
- `Observed`: both tools show that downstream conversion volume is much smaller than upstream demand.
- `Observed`: both tools show a live ecommerce path into Shopify checkout/order events.

### Where They Diverge

- `Observed`: top-of-funnel coverage differs sharply.
  - GA4 sessions: `24,947`
  - PostHog distinct pageview sessions: `17,686`
  - PostHog captures about `70.9%` of the GA4 session volume at the top of funnel.
- `Observed`: explicit contact-page reach is far higher in PostHog.
  - GA4 `/pages/contact` sessions: `287`
  - PostHog `/pages/contact` sessions: `896`
- `Observed`: this divergence is partly explained by booking-widget placement.
  - PostHog clearly records heavy `#home-contact` usage.
  - GA4 page-path reporting cannot see URL fragments like `#home-contact`.
- `Observed`: GA4 purchase tracking is materially higher than PostHog order-complete tracking.
  - GA4 `purchase`: `105`
  - PostHog `Order Completed`: `30`
- `Inferred`: PostHog order tracking is incomplete relative to GA4 purchase tracking and the wider Shopify context already documented elsewhere in the audit.

### Actual Visitor -> Customer Conversion Rate

- `Best current web estimate`: GA4 `105 / 24,947 = 0.42%`
- `PostHog tracked floor`: `30 / 17,686 = 0.17%`

`Inferred`: use `0.42%` as the best current web visitor -> customer estimate, and treat the PostHog number as an under-tracked lower bound.

### Biggest Drop-Off Point

- `If forced into the requested single linear funnel`: product/service reach -> explicit booking-page reach is the largest apparent drop (`8,614` -> `287` in GA4).
- `Important caveat`: that stage is not a clean like-for-like step because the booking widget also lives on `/`, `#home-contact`, and some service/product pages.
- `Most reliable measured branch-specific leak`: PostHog `Checkout Started` -> `Checkout Step: Contact Info` (`338` -> `92`).
- `Secondary booking-tracking leak`: GA4 shows `115` `form_start` events on `/pages/contact` but no matching `/pages/contact` `form_submit` rows.

## Conclusion

- `Observed`: demand is real; leakage is the problem.
- `Observed`: the site has two main conversion branches, not one:
  - booking/wizard
  - direct Shopify checkout
- `Observed`: GA4 is stronger for session volume and purchase truth, but weaker on clean booking-page interpretation because of web-pixel contamination and missing hash-fragment visibility.
- `Observed`: PostHog is stronger for behavioural and checkout-step shape, but weaker for final-order truth because checkout/order events are missing session IDs and final completed-order counts are much lower than GA4 purchases.
- `Inferred`: the most defensible current diagnosis is:
  - too few high-intent visitors progress from service discovery into either booking completion or checkout
  - the ecommerce branch loses most users at checkout start -> contact info
  - the booking branch is also under-measured in GA4, especially where the widget lives on homepage/service surfaces rather than a standalone contact page
