# Marketing Track Blockers And Open Data Gaps

Last updated: 2026-04-02

This file exists so the coordinator and other agents can answer or clear marketing-specific blockers without searching the whole audit pack.

## Confirmed Technical/Data Blockers

- `Observed`: GA4 landing-page reporting is contaminated by Shopify web-pixel sandbox routes and `(not set)` rows, so page-level conversion interpretation from GA4 alone is not trustworthy.
- `Observed`: Meta accessible insights do not currently expose a defensible purchase/ROAS view, so paid-social CAC is still partial.
- `Observed`: operator confirmation says Meta is the only currently owned paid-marketing spend source; no owned Google Ads source is currently in scope.
- `Observed`: no Mailchimp, Klaviyo, or other dedicated email-marketing platform token has been found yet.
- `Observed`: Search Console sitemap probe returned an empty object, so indexed-vs-submitted coverage is not yet closed from API evidence.
- `Observed`: Google Business Profile remains scope-blocked on the current Google token, so Google Reviews cannot yet be pulled from an authenticated API surface.
- `Observed`: telephone orders can go directly into Monday, so any web-only conversion model is incomplete by definition.
- `Observed`: the Monday main-board `Source` field is effectively unusable for attribution:
  - `4,319 / 4,459` total items blank
  - `1,546 / 1,677` paid non-BM items blank
  - `0` `Phone`-labelled items in the full board pull despite operator confirmation that phone orders exist

## Questions For Coordinator / Adjacent Agents

- Is there a current finance/ops view that attributes paid jobs back to channel or campaign?
- Is there any current non-Meta acquisition cost that should be included manually despite there being no owned source today?
- Should the current Monday `Source` field be rehabilitated, or replaced with a new ingress-source field that staff are required to populate?

## Best Next Evidence Sources

- Typeform -> Intercom -> Monday correlation
- PostHog event/property audit
- live Intercom conversation-source attribution
- Shopify checkout/order source tags if present
- any finance-side channel cost sheet or marketing budget tracker
- rebuilt Monday ingress-source capture on new jobs
