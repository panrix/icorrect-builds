# Shopify / Intercom Migration Matrix

**Date:** 2026-04-01  
**Purpose:** Execution-facing matrix for moving Shopify form flows off n8n and onto the VPS in controlled phases.

| Path | Current Endpoint | Current Live Behavior | Current Risk | Target VPS Behavior | Phase | Build Status |
|---|---|---|---|---|---|---|
| Consumer contact form | `/webhook/shopify-contact-form` | SMTP email from `michael.f@icorrect.co.uk` to `support@icorrect.co.uk`; Intercom contact created/updated in parallel; ticket surface appears later on the same object | Wrong source authorship at ingress; browser success does not guarantee contact update completed | Search/create contact -> create Intercom ticket directly for the customer -> return JSON only after the core Intercom write succeeds | 1 | Ready for implementation after contract freeze |
| Corporate enquiry | `/webhook/shopify-contact-form` | Create/reuse contact -> create/reuse company -> attach company -> create ticket -> Slack notify; browser success returns before downstream steps finish | Side effects are not atomic; current success timing is misleading; company duplicate behavior should be explicit in the VPS version | Search/create contact -> search/create/attach company -> create ticket -> preserve Slack notification -> define explicit success/failure semantics | 1 | Ready for implementation after contract freeze |
| Quote wizard inline question | `/webhook/shopify-contact-form` | Uses the non-quote-email path and therefore still inherits the consumer email-authored ingress pattern | Shares consumer attribution problem but also has looser browser success handling | Create direct Intercom ticket with device context and preserve quote-wizard browser contract | 2 | Defer until consumer + corporate are stable |
| Quote wizard email quote | `/webhook/shopify-contact-form` | Sends outbound customer quote email via SMTP; updates Intercom contact custom attributes; sends internal Intercom notification via SMTP with `Quote Request:` subject | Customer-facing email plus internal notification are coupled; easiest path to regress visibly | Preserve outbound quote email first, then create internal ticket/notification without SMTP-authored Intercom ingress | 3 | Research only; do not include in first cutover |
| Warranty claim | `/webhook/warranty-claim` | SMTP email to Intercom -> search/create contact -> wait `45s` -> search conversation by subject -> add real customer -> remove sender contact | Delayed async repair logic; ingress still authored as `michael.f`; not suitable for early cutover | Search/create contact -> create direct warranty ticket with correct customer from the start | 4 | Research only; do not include in first cutover |

## Service And Theme Recommendations

- Recommended VPS service directory:
  - `/home/ricky/builds/intercom/services/shopify-contact-form/`
- Production Shopify theme target:
  - theme ID `158358438141`
  - theme name `icorrect-shopify-theme/main`

## Non-Negotiables

- No same-day all-path cutover.
- No cutover based on HTTP 200 alone.
- No quote-email or warranty migration bundled into Phase 1.
- No theme push without rollback tied to the live theme target and git commit.
