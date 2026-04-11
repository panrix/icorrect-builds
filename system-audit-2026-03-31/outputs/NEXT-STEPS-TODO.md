# Next Steps TODO

## Completed In This Pass

- Verified `backmarket/scripts/sent-orders.js` is live in production cron.
- Confirmed from cron log that `sent-orders.js --live` recently created linked Monday records.
- Mapped `list-device.js` as the operator-invoked BM listing publication path.
- Confirmed `sale-detection.js` is live in production cron and validated it against a successful production log run.
- Added the BM resale-order journey and linked it to dispatch and final BM shipping confirmation.
- Added first-pass journey drafts for mail-in/send-in, corporate/B2B, and warranty/aftercare/returns.
- Confirmed the two active catch-all Monday webhooks are live in the Monday UI and captured their current action counts.
- Narrowed the likely role of the two catch-all Monday webhooks:
  - one is labeled `Notifications.`
  - one is labeled `Stock Checker`
- Confirmed BM cron documentation drift:
  - `sale-detection.js` is scheduled live
  - `dispatch.js` is scheduled live
- Revalidated the Back Market workspace after cleanup changes.
- Corrected the audit pack to reflect:
  - resolver-truth-first listing safety in `list-device.js`
  - no live cron for `buy-box-check.js`
  - live weekly buy-box ownership still sitting in `buyback-monitor/run-weekly.sh` -> `python3 buy_box_monitor.py`
  - duplicate-label guard in dispatch using Main Board tracking field `text53`
  - staged BM process notes incorrectly claiming `dispatch.js` still marks BM shipped at label purchase time
  - `reconcile-listings.js` appearing operator-driven because no active scheduler was found in crontab, systemd, or pm2
- Deepened Intercom inventory with:
  - one `Support` team (`round_robin`)
  - one visible inbox seat across three admins
  - one Help Center object with `website_turned_on=false`
  - live AI-routed customer-initiated conversations
  - confirmation that `/inboxes` is `404`, `/macros` is version-blocked, and `/news/news_items` is `404` on the current REST surface
- Deepened Shopify inventory with:
  - REST `webhooks.json` also returning `0` visible webhooks
  - `16` readable themes and visible page/blog/redirect content surfaces
  - readable shop metafields showing GTM and SEO-manager configuration
  - confirmed scope-gated surfaces for `script_tags`, `locations`, and `product_listings`
  - a critical correction that `SHOPIFY_ACCESS_TOKEN` is not truly read-only despite shared docs saying it is
- Closed the current BM payout-runtime question:
  - `bm-payout.service` is active on `8012`
  - the historical rogue `buyback_payout_watch.py` cron is not present in the current crontab
  - the remaining issue is documentation drift in staged/current-state BM docs, not current runtime ownership
- Tightened the client journey pack with stronger evidence for:
  - walk-in intake through live Typeform -> Intercom -> Monday creation
  - mail-in notification/status routing and Royal Mail packaging/return handling
  - corporate/B2B website enquiry -> Intercom company/ticket -> Monday routing
  - warranty/aftercare split between website warranty intake and manual BM buyer returns
  - BM trade-in status24 branches and downstream payout/grade-check/runtime ownership
- Promoted the core journey files from draft wording to evidence-backed where live runtime evidence now supports it.
- Mapped the finance/payment ownership surface further with:
  - live Stripe account and payment-intent probes
  - stronger documented role separation between Shopify prepay, SumUp walk-in card payments, Stripe invoice/online payments, and Xero draft invoicing
  - explicit recognition that Xero send-invoice and payment-received flows remain undeployed in the current documented stack
  - confirmation that the only concrete Stripe/SumUp reconciliation script currently sits in archived tooling with no live cron/systemd owner
- Verified live Xero tenant access end to end with safe read-only probes:
  - tenant `Panrix Ltd`
  - `SalesTaxBasis = CASH`
  - `135` chart-of-accounts entries
  - live `ACCREC`, `ACCPAY`, payments, bank transactions, contacts, and April 2026 P&L / Balance Sheet
  - current-period samples proving Xero is active now, not only historical or planned

## External Ownership

- Monday webhook destination review/fix is being handled by another agent.
- Customer journey deep-dive rewrite is being handled by another agent in:
  - `client_journeys/*.md`
  - `client_journeys/_meta.md`
- Systems architecture mapping is being handled by another agent in:
  - `systems-architecture.md`
- Do not duplicate investigation on:
  - `537444955`
  - `530471762`
  - `530469026`
  - `309734967`

## Priority 1: Deepen Customer-Service Mapping

- Intercom API-side deep inventory is substantially complete.
  - teams, admins, seats, help-centre status, ticket schema, contact-role split, and AI-routed conversation evidence are now captured.

- Determine which API/version/path exposes the remaining Intercom admin surfaces, if any.
  - `ticket_types`, `teams`, `admins`, `help_center`, `contacts/search`, `conversations/search`, and `tickets/search` are confirmed live.
  - `/inboxes` returns `404`.
  - `/macros` returns `intercom_version_invalid`.
  - `/news/news_items` returns `404`.
  - Remaining question is whether inbox/macro/routing admin features are exposed only through another API/UI layer.

- Confirm whether the Intercom Help Center is intentionally dormant.
  - Current live reads show one Help Center object, but `website_turned_on=false`, `0` articles, and `0` collections.

## Priority 2: Tighten Ecommerce And Native Integration Ownership

- Determine whether n8n `Shopify account 2` belongs to the same `Jarvis` Shopify app or to a separate Shopify app installation.
  - REST `webhooks.json` also shows `0` visible webhooks for the `Jarvis` app token.
  - The remaining ambiguity is now app/credential ownership, not whether a live trigger exists.

- Verify the intended ownership model for Shopify -> Intercom data:
  - native Shopify sync
  - n8n order-trigger sync
  - define field precedence and canonical owner

- Shopify API-side inventory is now substantially deeper.
  - shipping setup, themes, pages, blogs, redirects, and shop metafields are all partially mapped
  - current app installation is visible as `Jarvis`
  - recent paid order samples show `payment_gateway_names = ["shopify_payments"]`
  - GraphQL and REST both show `0` visible webhook subscriptions for the `Jarvis` app token
  - current scope blockers already observed:
    - `appInstallations` access denied
    - `price_rules` requires merchant approval for `read_price_rules`
    - `script_tags` requires merchant approval for `read_script_tags`
    - `locations` requires merchant approval for `read_locations`
    - `product_listings` requires merchant approval for `read_product_listings`
    - `shopifyPaymentsAccount` requires `read_shopify_payments` or `read_shopify_payments_accounts`

- Resolve the Shopify credential-risk question.
  - shared docs say `SHOPIFY_ACCESS_TOKEN` is read-only
  - live OAuth scope read shows write-capable scopes
  - document whether this is intentional or needs immediate reduction

## Priority 3: Complete BM Journey And Operational Cross-Reference

- Verify the live payout state end-to-end.
  - Current webhook path is confirmed, gated, and active.
  - Historical rogue cron path is now reclassified as removed from current runtime.
  - Remaining work is to align staged/current-state docs that still mention the old watcher.

- Verify whether `scripts/reconcile-listings.js` has a live scheduler or is still manual/operator-run.
  - Current evidence points to operator-driven / on-demand, not hidden scheduled runtime.

- Decide the canonical scheduled sell-side owner.
  - Current live weekly owner is still `buyback-monitor/run-weekly.sh` -> `python3 buy_box_monitor.py`.
  - `backmarket/scripts/buy-box-check.js` exists as the rebuilt SOP 07 path but is not in live cron.
  - Audit should stay aligned with whichever runtime is actually promoted.

- Confirm shipping/dispatch split:
  - label purchase path
  - tracking write-back to Monday
  - shipped-status webhook to BM

- Expand BM returns/aftercare mapping.
  - Document what is live now versus still planned/manual.

## Priority 4: Finish Blocked Or Partial Access Surfaces

- Verify remaining partial/blocked platforms with the safest possible read-only checks:
  - Cloudflare
  - Royal Mail

- Reclassify each as one of:
  - reachable
  - partially blocked
  - dead end with current credential

- This pass already reclassified:
  - Google APIs
  - Typeform
  - SumUp
  - JARVIS IMAP
  - JARVIS SMTP (now identified as config drift, not dead credentials)

- Keep only the non-journey questions that still require net-new evidence:
  - deeper corporate reporting/SLA automation beyond `Client = Corporate`
  - exact payment-link sending and payment-received ownership on invoiced consumer paths
  - how phone/direct-to-Monday demand should be attributed in the blended conversion model
- Tighten the financial mapping from current Xero evidence:
  - design the target-state paid-truth model now that current-state ownership is confirmed as broken/ownerless
  - determine what should replace the explicitly retired archived reconciliation logic
  - map how cash-basis Xero reporting should relate to Monday payment fields and channel-specific rails in the rebuilt model
- Finance controls cleanup:
  - remove embedded secret material from the active Xero invoice workflow
  - establish one canonical Xero refresh-token owner
  - decide whether Xero automation secrets live in n8n credentials, env-backed helpers, or another secret store
  - decide whether to repair-and-deploy the archived send-invoice / payment-received workflows or replace them with a different closure model
  - assign an owner for the ghost-invoice cleanup backlog and define the disposition path for the `78` unmatched review items
  - remove or rewrite current operations finance KB references that point to archive-only Xero/reconciliation scripts
## Priority 5: Access And Evidence Hygiene

- Keep saving raw evidence exports for each new live probe under:
  - `/home/ricky/data/exports/system-audit-2026-03-31/`

- Continue updating after each pass:
  - `discovery_log.md`
  - `integration_catalog.csv`
  - `platform_inventory/*`
  - `client_journeys/*`
  - `findings.md`
  - `open_questions.md`

## Priority 6: Team And Timing Synthesis

- Fold the OpenClaw team workspace into the main audit.
  - Current roster source of truth is `/home/ricky/kb/team/roster.md`.
  - Older February team docs remain useful, but some people/ownership assumptions are historical.

- Build the canonical workflow-owner map:
  - who owns intake/front desk now
  - who owns customer comms
  - who owns diagnostics
  - who owns repair throughput
  - who owns QC/parts/BM diagnostics

- Compute the missing timing layer from evidence rather than docs:
  - client first-response time
  - `Received -> Diagnostic Complete`
  - `Diagnostic Complete -> Quote Sent`
  - `Queued/Under Repair -> Date Repaired`
  - total elapsed lifecycle time by scenario

- This pass established two important timing truths:
  - broad `Diagnostic Complete -> Quote Sent` timing is relatively healthy (`206` samples, median `1 day`, `p75 = 2 days`)
  - the bigger operational issue is queue hygiene and exception ownership (`900` non-terminal items, `322` blocked/customer-wait items, `75` open post-diagnostic/no-quote items)

- Next timing step should focus on:
  - separating current WIP from stale historical non-terminal records
  - measuring `Quote Sent -> approval/payment`
  - splitting active work time from paused/customer-wait time

- Current blocker on `Quote Sent -> approval/payment`:
  - live board has no visible `comms_status` column yet
  - accessible Monday `status4` activity logs only produced `3` usable quote-to-next-decision traces out of `126` recent quoted items
  - operator guidance now says the next best proxy sources are Intercom conversation timestamps and Xero invoice creation dates
  - fresh `2026-04-02` Monday quote/payment proxy pull is also too dirty to close this alone:
    - `132` recent quoted items
    - `0` populated `Xero Invoice ID`
    - only `15` usable non-negative `Quote Sent -> Payment 1 Date` lags
    - many payment dates precede `Quote Sent`

- Separate elapsed time from active work time.
  - exclude or tag paused/customer-wait/courier states
  - preserve both customer-lifecycle and workshop-processing views

## Priority 7: Business Viability And Loss Driver Analysis

- Fold business-level diagnosis into the audit pack:
  - monthly loss drivers
  - margin pressure by channel
  - demand / conversion evidence
  - trapped cash / stuck-work impact
  - whether the business is structurally broken or operationally recoverable

- Build the missing channel economics layer:
  - BM contribution after acquisition, parts, labour, shipping, returns
  - Shopify contribution after fulfilment and service delivery
  - walk-in and corporate contribution where data permits

- Distinguish clearly between:
  - demand problem
  - conversion problem
  - work-mix / pricing problem
  - throughput / working-capital problem

- Completed in this pass:
  - quantified Monday source-field failure from a fresh full-board pull
  - documented blended attribution target state
  - documented payment-truth target state under cash accounting
  - documented Monday customer-ID normalisation target state
  - documented supplier source-of-truth rebuild requirements
  - documented bench-occupancy measurement gap and target-state method

## Priority 8: Supplementary Economics And Verification

- Completed in this pass:
  - supplier/logistics economics first pass from Xero + Monday
  - repeat-customer / retention proxy from Monday
  - physical-capacity first pass from queue state plus operations docs

- Next supplementary work:
  - deeper supplier economics if a better supplier-data source appears
  - cleaner remote-job unit economics once shipping pass-through rules are known
  - fixed-basket competitor comparison if a canonical repair basket is chosen
  - stable-customer-ID design for Monday now that canonical identity ownership is confirmed

- Verification pass:
  - loop back across `business-viability-analysis.md`, `financial-mapping.md`, `marketing-analysis.md`, `timing-mapping.md`, and the new supplementary files
  - include the new design/synthesis docs:
    - `channel-attribution-model.md`
    - `payment-truth-target-state.md`
    - `customer-identity-normalisation.md`
    - `supplier-source-of-truth.md`
    - `bench-occupancy-measurement.md`
  - confirm the main “not dead, but under-managed” diagnosis still holds after adding supplier/logistics/retention evidence

- Tie marketing/growth signals into finance:
  - sessions
  - paid orders
  - search demand
  - contact/lead volume
  - quote/payment closure

- New synthesis from this pass:
  - the business does not primarily look dead from lack of demand
  - broad quote creation is not the main hidden issue
  - the bigger hidden issue is stale queue debt plus weak exception ownership sitting on top of BM margin pressure and incomplete response coverage

## Suggested Execution Order

1. Supplementary supplier / retention / shipping cost research
2. Remaining blocked live-access surfaces
3. Finance-state ownership and reconciliation cleanup
4. Loop-back verification across Track 1, Track 2, and Track 3 conclusions
5. Final synthesis of business viability, marketing, and workshop performance
