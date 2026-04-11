# Findings

## High

- Title: The business is loss-making primarily because weak-margin BM volume and poor lead conversion are overwhelming otherwise viable demand
  - Severity: High
  - Category: manual process, ownership gap, data quality issue, resilience issue
  - Affected systems: Back Market, Monday.com, Intercom, Shopify, Xero, customer-service operations, workshop operations
  - Observed evidence: operations business-deep-dive and financial-leak analyses show `5` of `6` months loss-making and roughly `-£19.2k` over six months; BM trade-in cost rose to `66.4%` of BM revenue in February 2026; Ferrari audit attributes roughly `£150k/year` of missed revenue to unanswered communications and slow response; live Shopify Admin data for `2026-03-01` through `2026-04-01` shows `64` orders and `£13,686.00` gross revenue, while marketing docs still point to real conversion near `0.78%`; queue/ops docs also show severe drag from `97` devices in the Hole, `200` stale leads to chase, long parts waits, and stuck BM inventory.
  - Business impact: the company can appear “busy” while still losing money because capital and labour are tied up in the wrong BM work, high-intent leads are not converted fast enough, and too much stock/work remains unfinished or unreconciled.
  - Recommended action: treat business recovery as a combined margin + conversion + throughput problem; cap BM acceptance pricing, reduce structurally weak FC inventory, protect customer-service response capacity, clear profitable stuck work before buying more, and complete finance/reconciliation closure so decisions are made on true channel economics.
  - Confidence label: Observed

- Title: Credential source of truth is split across two diverging env files
  - Severity: High
  - Category: security / permission risk, ownership gap, observability gap
  - Affected systems: `/home/ricky/config/.env`, `/home/ricky/config/api-keys/.env`, Google APIs, Typeform, SumUp, any agent/runtime relying on one env source
  - Observed evidence: `/home/ricky/config/.env` and `/home/ricky/config/api-keys/.env` are separate files with different contents, not symlinked mirrors; overlapping keys differ for at least `TYPEFORM_API_TOKEN`, `SUMUP_API_KEY`, `GOOGLE_REFRESH_TOKEN`, and `JARVIS_GOOGLE_REFRESH_TOKEN`, and only `config/api-keys/.env` contains `EDGE_GOOGLE_REFRESH_TOKEN`. In live probes, `config/.env` Typeform returned `403 AUTHENTICATION_FAILED` while `config/api-keys/.env` listed `37` forms; `config/.env` SumUp returned `401` while `config/api-keys/.env` returned a live merchant profile; `config/.env` lacked the Edge Google token entirely while `config/api-keys/.env` produced a valid token with Search Console and Drive access.
  - Business impact: agents and services can draw opposite conclusions about platform reachability depending on which env file they use, leading to false blockers, stale credentials staying in circulation, and unsafe assumptions about the canonical credential source.
  - Recommended action: choose one canonical env file immediately, reconcile and rotate overlapping credentials, then make any secondary path a real symlink or remove it from operational use.
  - Confidence label: Observed

- Title: Monday main board is structurally overloaded
  - Severity: High
  - Category: manual process, resilience issue, observability gap
  - Affected systems: Monday.com main board, BM Devices board, downstream automations
  - Observed evidence: live schema pull shows main board `349212843` has `4443` items, `34` groups, `169` columns, including `51` status columns; local design docs describe a target-state split because current concerns are mixed across repair, comms, shipping, QC, and trade-in flows.
  - Business impact: excessive status/column complexity increases automation fragility, role confusion, and difficulty tracing true process state.
  - Recommended action: treat Monday schema/automation cleanup as a core audit track; cross-check native automations and external workflows against the target-state model before further process automation.
  - Confidence label: Observed

- Title: Monday main board carries a large stale non-terminal queue that obscures real live work
  - Severity: High
  - Category: manual process, observability gap, ownership gap, data quality issue
  - Affected systems: Monday.com main board, customer-service operations, workshop operations
  - Observed evidence: a live `2026-04-01` board-wide pull found `900` non-terminal items on the main board; age buckets show only `158` are `0-30` days old while `440` are `366+` days old; largest statuses include `232` in `Booking Confirmed` with median open age `835.5 days`, `127` in `Awaiting Confirmation` with median open age `810 days`, `120` in `Client Contacted` with median open age `317.5 days`, `39` in `Repair Paused` with median open age `79 days`, `22` in `Quote Sent` with median open age `239.5 days`, and `22` in `Awaiting Part` with median open age `59.5 days`; the same pull found `322` items in blocked/customer-wait states and `75` open items with `Diag. Complete` populated but no `Quote Sent` date.
  - Business impact: operators cannot read the board as a clean live queue, stale exceptions hide true current workload, and follow-up ownership becomes diffuse enough to leak both customer conversion and workshop throughput.
  - Recommended action: separate stale historical queue debt from true WIP, define archive/closure rules for old non-terminal items, and assign explicit owners for blocked states and post-diagnostic exceptions.
  - Confidence label: Observed

- Title: Two active catch-all Monday webhooks are firing with unknown destinations
  - Severity: High
  - Category: resilience issue, observability gap, ownership gap
  - Affected systems: Monday.com, unknown downstream consumers, status notification migration track
  - Observed evidence: `builds/webhook-migration/discovery/monday-webhooks.md` identifies webhook IDs `537444955` and `530471762` as active `change_column_value` rules with empty config, `plan-status-notifications.md` states they are burning `~4,000+` automation actions per day, and the Monday UI screenshot from `2026-03-30 14:00:15` shows both active with `3,572` actions each at capture time; the Michael Ferrari-owned rule is labeled `Notifications.` and the Ricky Panesar-owned rule is labeled `Stock Checker`.
  - Business impact: unknown live destinations create breakage risk during cleanup and waste Monday automation actions continuously.
  - Recommended action: inspect both rules in the Monday UI, record their exact destination URLs, then either scope them correctly or disable them after downstream confirmation.
  - Confidence label: Observed

- Title: Shopify token is materially over-scoped relative to its documented “read-only” role
  - Severity: High
  - Category: security / permission risk, ownership gap
  - Affected systems: Shopify, shared credentials documentation, any automation using `SHOPIFY_ACCESS_TOKEN`
  - Observed evidence: shared credentials describe `SHOPIFY_ACCESS_TOKEN` as read-only, but live `GET /admin/oauth/access_scopes.json` returns write scopes including `write_orders`, `write_products`, `write_content`, `write_theme_code`, and `write_themes`.
  - Business impact: operators or agents can rely on the documentation and unknowingly use a token that can mutate large parts of the storefront and order/content state.
  - Recommended action: either reduce the token to true read-only scopes or update the credentials documentation immediately and restrict which agents/services are allowed to use it.
  - Confidence label: Observed

- Title: Active Xero invoice workflow embeds live secret material and its own refresh-token state
  - Severity: High
  - Category: security / permission risk, resilience issue, ownership gap
  - Affected systems: Xero, Monday.com, n8n Cloud, finance automation
  - Observed evidence: the exported active n8n workflow `Xero Invoice Creator` contains embedded Monday API auth, embedded Xero OAuth app values, and workflow static data for `xeroRefreshToken`, rather than relying solely on a shared external secret source; local Xero integration evidence also documents token-rotation fragility across shell, n8n, and older scripts.
  - Business impact: secret sprawl and split token state increase the chance of credential leakage, workflow breakage, and refresh-token desynchronisation across finance automation paths.
  - Recommended action: move the workflow to proper n8n credential objects or one canonical external secret source immediately, remove embedded auth values from workflow definitions, and define a single refresh-token owner.
  - Confidence label: Observed

- Title: The business is currently blind on payment status because reconciliation is broken and ownerless
  - Severity: High
  - Category: ownership gap, observability gap, data quality issue, resilience issue
  - Affected systems: Monday.com, Stripe, SumUp, Xero, finance operations, customer-service operations
  - Observed evidence: operator confirmation on `2026-04-02` says Monday payment fields are unreliable, no reconciliation loop exists between Xero, Stripe, SumUp, and Monday, Shopify is the only channel currently reconciling cleanly, corporate invoices have no write-back when paid, and no one currently owns payment-received write-back into Monday.
  - Business impact: the company cannot trust whether repairs are actually paid, overdue, or reconciled across major payment rails, which distorts collections, profitability, and operational decision-making.
  - Recommended action: treat rebuilt reconciliation and payment write-back as a core business-control project with a named owner, and explicitly retire the archive-only legacy logic rather than letting it linger as a false safety net.
  - Confidence label: Observed

- Title: Monday source attribution is effectively broken, so phone and direct demand are disappearing inside the operational system
  - Severity: High
  - Category: observability gap, data quality issue, ownership gap
  - Affected systems: Monday.com, marketing analytics, business-viability reporting, customer-service operations
  - Observed evidence: fresh `2026-04-02` full-board pull shows `4,319 / 4,459` main-board items blank on `Source`; among non-BM items `3,039 / 3,178` are blank; among paid non-BM items `1,546 / 1,677` are blank; `0` items are labelled `Phone` even though operator confirmation says telephone orders can go directly into Monday.
  - Business impact: the business cannot trust Monday for channel attribution, blended conversion, or phone-versus-web closure analysis, which makes it harder to tell whether losses are caused by demand weakness or conversion/process leakage.
  - Recommended action: rebuild ingress-source capture immediately, treat current Monday source as non-canonical, and report conversion using a blended model until the field is fixed.
  - Confidence label: Observed

## Medium

- Title: n8n runtime has split-brain risk between live cloud and mostly dormant self-hosted instances
  - Severity: Medium
  - Category: ownership gap, observability gap, dormant
  - Affected systems: n8n Cloud, self-hosted n8n, any docs assuming one canonical runtime
  - Observed evidence: cloud n8n has `52` workflows with `13` active; self-hosted n8n is reachable but shows `1` inactive workflow only.
  - Business impact: operators may misread where automations actually run, slowing incident response and increasing migration/maintenance risk.
  - Recommended action: document cloud vs self-hosted ownership explicitly and mark self-hosted workflows as dormant or decommission candidates if confirmed unused.
  - Confidence label: Observed

- Title: Status notification cutover is complete, but Cloudflare-era cleanup is still incomplete
  - Severity: Medium
  - Category: resilience issue, ownership gap, observability gap
  - Affected systems: Monday.com, Cloudflare Worker, n8n Cloud, Intercom, VPS status-notifications service
  - Observed evidence: cutover verification dated `2026-04-01` says the old n8n sender workflow `TDBSUDxpcW8e56y4` is disabled, `status-notifications.service` is running live with `SHADOW_MODE=false`, and a controlled Intercom reply succeeded through the VPS path; however local docs also show Cloudflare worker history and unresolved Monday destinations still matter for final cleanup.
  - Business impact: the main live sender path is now clearer, but legacy Cloudflare-era destinations and webhook ownership can still create confusion during cleanup and incident response.
  - Recommended action: treat the VPS service as the canonical live notification path, then retire or document the remaining Cloudflare-era dependencies once destination ownership is confirmed.
  - Confidence label: Observed

- Title: Documentation drift exists in current source references
  - Severity: Medium
  - Category: observability gap
  - Affected systems: builds documentation, onboarding/research process
  - Observed evidence: `INDEX.md` references `backmarket/docs/buyback-optimisation-strategy.md`, but the current live path is missing and only a historical version exists; `backmarket/docs/staged/2026-04-01/BM-PROCESS-AUDIT.md` still describes `dispatch.js` as prematurely notifying BM of shipment, while current `royal-mail-automation/dispatch.js` main flow does not call `updateBmTracking()` and live `dispatch.log` still ends with `BM NOT notified`; staged BM payout docs still mention `buyback_payout_watch.py` as an active fallback even though the current crontab no longer contains that watcher and the script is absent from the current OpenClaw workspace.
  - Business impact: agents and operators can start from stale or broken references, wasting time and reducing trust in documentation.
  - Recommended action: repair or remove broken references and label historical docs clearly in the index.
  - Confidence label: Observed

- Title: Google credential documentation no longer matches the live Jarvis token scopes
  - Severity: Medium
  - Category: ownership gap, observability gap
  - Affected systems: Google APIs, shared credentials documentation, any automation assuming Drive/Sheets access on the Jarvis token
  - Observed evidence: shared credentials describe Jarvis Google access as including Drive read-only and Sheets write, but live tokeninfo from the Jarvis token in `config/.env` shows `analytics.readonly`, `calendar`, `gmail.readonly`, `webmasters.readonly`, and `youtube.readonly`; a Drive list probe returns `403 insufficientPermissions`, while Search Console and Calendar reads succeed.
  - Business impact: workflows or researchers can assume Drive/Sheets access exists when the currently active Jarvis token in the canonical env does not actually carry those scopes.
  - Recommended action: update the shared credential documentation to reflect the live scope set, or rotate the Jarvis refresh token so the documented Drive/Sheets scopes are actually present again.
  - Confidence label: Observed

- Title: JARVIS SMTP config points at a dead port even though the mailbox can authenticate on working ports
  - Severity: Medium
  - Category: ownership gap, observability gap
  - Affected systems: JARVIS email, SiteGround SMTP config, any workflow relying on `JARVIS_SMTP_PORT`
  - Observed evidence: configured SMTP path `uk1000.siteground.eu:465` times out, but direct no-send login probes using the same credentials succeed on `587` and `2525` with `STARTTLS`.
  - Business impact: any runtime that trusts the current SMTP env values can misclassify email sending as broken or fail outright, even though the mailbox credentials themselves work.
  - Recommended action: update the canonical env/docs to a working SMTP port and verify which existing n8n SMTP credential or runtime is actually used in production.
  - Confidence label: Observed

- Title: Shopify customer context reaches Intercom through more than one integration path
  - Severity: Medium
  - Category: duplicate data, ownership gap, data quality issue
  - Affected systems: Shopify, Intercom, n8n Cloud
  - Observed evidence: active n8n workflow `Shopify Order to Monday.com + Intercom - iCorrect` creates or enriches Intercom records from Shopify order events, while live Intercom contact attributes include multiple `shopify_*` fields explicitly described as imported by Shopify integration.
  - Business impact: customer context can diverge if native Shopify sync and n8n order-driven sync do not agree on record ownership, timing, or field precedence.
  - Recommended action: identify the canonical owner for Shopify-to-Intercom customer data, document field precedence, and confirm whether both paths are intentionally active.
  - Confidence label: Observed

- Title: Shopify order-trigger ownership remains opaque even though no webhooks are visible to the current token
  - Severity: Medium
  - Category: ownership gap, observability gap
  - Affected systems: Shopify, n8n Cloud, Intercom, Monday.com
  - Observed evidence: active n8n workflow `Shopify Order to Monday.com + Intercom - iCorrect` is triggered by `orders/create` and the workflow uses an n8n `shopifyTrigger` node with Shopify OAuth credentials; the current custom app installation resolves as `Jarvis`, but both Admin GraphQL `webhookSubscriptions` and REST `GET /webhooks.json` return zero visible webhook registrations for that app token.
  - Business impact: the live order-ingress path exists, but its ownership boundary is unclear, which makes incident response and cleanup harder if the trigger stops firing.
  - Recommended action: identify whether `shopifyTrigger` in n8n is bound to the `Jarvis` app or to a separate Shopify app installation, then document the actual subscription owner explicitly.
  - Confidence label: Observed

- Title: Intercom customer-service operations appear concentrated into one visible support seat
  - Severity: Medium
  - Category: ownership gap, resilience issue
  - Affected systems: Intercom, customer-service operations
  - Observed evidence: live `GET /admins` returns `3` admins, but only `admin@icorrect.co.uk` has `has_inbox_seat=true`; `GET /teams` returns only one team (`Support`) with round-robin distribution and that same admin as the only team member.
  - Business impact: if the shared support seat/account is the real operational owner, customer-service routing and accountability are concentrated into one visible seat, which creates resilience and traceability risk.
  - Recommended action: confirm whether this one-seat model is intentional, then document the real ownership model or add the missing teammate seats/assignments if the current API view reflects production accurately.
  - Confidence label: Observed

- Title: Payment ownership is split across Shopify, Stripe, SumUp, and Xero with incomplete canonical reconciliation
  - Severity: Medium
  - Category: ownership gap, data quality issue, observability gap
  - Affected systems: Shopify, Stripe, SumUp, Monday.com, Xero
  - Observed evidence: Shopify order ingress writes `payment_status = Confirmed`, `payment_method = Shopify`, and `dup__of_quote_total` onto Monday; live Stripe payment intents succeed and carry invoice-style metadata such as `Invoice number`; SumUp live merchant access is confirmed and local finance/data docs describe it as the walk-in card rail; live Xero tenant access now shows `SalesTaxBasis=CASH`, explicit `Cash Account`, `Starling`, and `Stripe` accounts, current-period receivables/payables/payments/bank transactions, and April 2026 P&L revenue accounts for `Backmarket` and `Shopify`; the active Xero automation creates draft invoices from Monday, but adjacent local Xero evidence still says the downstream send-invoice and payment-received workflows are not deployed. Operator confirmation on `2026-04-02` adds that no one owns payment-received write-back today.
  - Business impact: payment state can diverge across Monday, the payment rails, and Xero, making it harder to trust paid/outstanding status, invoice state, and repair-level profitability.
  - Recommended action: designate one canonical reconciliation owner, document payment-method precedence by channel, and close the gap between draft-invoice creation and payment-received write-back.
  - Confidence label: Observed

- Title: Customer-response performance appears improved from February but remains too slow and too inconsistent
  - Severity: Medium
  - Category: manual process, ownership gap, resilience issue
  - Affected systems: Intercom, customer-service operations, Shopify contact flow, website lead capture
  - Observed evidence: February 2026 Intercom audit recorded `29%` reply rate, `36.4h` average reply time, and `22.4h` median reply time across addressable conversations; a live `2026-04-01` read-only March-window sample found `58` customer-facing conversations after filtering noise, of which only `31` had an admin reply and `27` remained unanswered, with median reply time `6.39h`, mean `24.47h`, and `p90` `45.42h`; channel split in that sample shows `email` median `6.39h`, `instagram` median `17.97h`, and `whatsapp` `5/5` unanswered.
  - Business impact: even if the inbox is improving, high-intent conversations are still waiting too long for human engagement and too many remain unanswered, which continues to leak repair and quote revenue.
  - Recommended action: treat response-time reduction as a core business lever, not a customer-service hygiene task; assign a clear owner, protect response blocks from operational interruption, and keep measuring median, unanswered rate, and p90 by channel.
  - Confidence label: Observed

- Title: Broad quote turnaround is relatively healthy, but exception handling after diagnostics is not
  - Severity: Medium
  - Category: manual process, ownership gap, observability gap
  - Affected systems: Monday.com, customer-service operations, workshop operations
  - Observed evidence: a live `2026-04-01` Monday pull found `206` items with both `Diag. Complete` and `Quote Sent` populated, with median `Diagnostic Complete -> Quote Sent` of `1 day` and `p75 = 2 days`; the same pull found `75` open items with `Diag. Complete` present but no `Quote Sent` date, with the oldest sitting `111-176` days after diagnostics and commonly parked in `Repair Paused`, `Client Contacted`, `Awaiting Part`, or `BER/Parts`.
  - Business impact: the main quote problem is not average quote-generation speed; it is the long tail of unowned exceptions and stale post-diagnostic cases that continue to trap customer decisions and workshop capacity.
  - Recommended action: keep the baseline quote SLA, but add explicit ageing rules and ownership for post-diagnostic items with no quote or no decision, especially BM, BER, and paused cases.
  - Confidence label: Observed

- Title: Monday quote-to-payment fields are too contaminated to be trusted as clean lag truth
  - Severity: Medium
  - Category: observability gap, data quality issue
  - Affected systems: Monday.com, Xero workflow, payment-state reporting, timing analysis
  - Observed evidence: fresh `2026-04-02` quote/payment proxy pull found `132` items with `Quote Sent` since `2025-12-01`, but `0` had a populated `Xero Invoice ID`, all `132` showed `Invoice Status = Voided`, only `35` had any `Payment 1 Date`, and many rows had payment dates earlier than `Quote Sent`; only `15` rows produced a non-negative `Quote Sent -> Payment 1 Date` lag.
  - Business impact: the business cannot currently measure quote-approval/payment delay cleanly from Monday alone, which hides one of the most important cash-realisation bottlenecks.
  - Recommended action: treat Intercom timestamps plus rebuilt Xero/payment write-back as the future canonical lag surface, and do not use current Monday quote/payment dates naively for management reporting.
  - Confidence label: Observed

- Title: Demand is live, but website conversion quality and attribution remain too weak to turn marketing into a reliable growth lever
  - Severity: Medium
  - Category: observability gap, data quality issue, resilience issue
  - Affected systems: Shopify, PostHog, GA4, Search Console, Meta Ads, website conversion surfaces
  - Observed evidence: GA4 Q1 2026 shows `24,477` sessions with `61.8%` from Organic Search and `27.8%` from Direct; Shopify Q1 2026 shows `108` orders and `£20,711.00` gross revenue, with March alone at `64` orders and `£13,686.00`; PostHog shows live commerce/funnel events including `175` add-to-cart and `153` checkout-started events in the last `30` days, but also `2,122` dead clicks; GA4 landing-page data is materially polluted by Shopify web-pixel sandbox routes and `(not set)` rows, while Search Console still shows service-intent queries such as `iphone repair london` generating impressions without matching CTR.
  - Business impact: the business has real top-of-funnel demand, but it cannot yet measure or improve conversion efficiently enough because high-intent pages leak users and attribution is not clean enough to close CAC or enquiry-to-revenue truth.
  - Recommended action: treat conversion instrumentation cleanup and high-intent page UX fixes as part of business recovery, not a marketing side task; use PostHog as the cleaner interim behaviour source while GA4 landing-page contamination is being resolved.
  - Confidence label: Observed

- Title: Contact and service pages are concentrated marketing friction points
  - Severity: Medium
  - Category: manual process, data quality issue, resilience issue
  - Affected systems: website, contact flow, Shopify pages, PostHog, GA4, Search Console
  - Observed evidence: PostHog last-90-day dead-click analysis shows `/pages/contact` with `275` dead clicks, `/pages/macbook-repairs` with `160`, `/` with `135`, and `/pages/advanced-diagnostic` with `85`; GA4 also recorded `543` views of `404 Not Found – iCorrect` in the recent window; Search Console shows the contact page with `3,316` impressions but only `23` clicks (`0.69%` CTR).
  - Business impact: some of the highest-intent website journeys are still losing users before they become enquiries or paid bookings, which directly suppresses growth from traffic the business already has.
  - Recommended action: prioritise contact, MacBook service, and 404 remediation work as revenue-path fixes, then re-measure dead clicks, CTR, and downstream enquiry rate.
  - Confidence label: Observed

- Title: Monday free-text updates are useful but structurally noisy, with human operational narration concentrated in a few people
  - Severity: Medium
  - Category: observability gap, ownership gap, data quality issue
  - Affected systems: Monday.com main board, workshop operations, customer-service operations, BM operations
  - Observed evidence: six-month update mining found `6,164` recent updates, but only `2,240` were human-written while `3,924` were automation/template notes, mostly from `Systems Manager`; only `1,069` items had a human update at all. Human-written notes are concentrated in `Ricky Panesar` (`1,145`), `Michael Ferrari` (`647`), and `Adil Azad` (`348`). The strongest human-note themes are `bm_issue` (`790` matches), `diagnostic_complication` (`620`), and `rework_return` (`446`).
  - Business impact: Monday contains real operational knowledge, but that knowledge is concentrated in a few people and partially buried under template noise, which makes blocker extraction and management reporting harder than it should be.
  - Recommended action: keep mining updates for exception intelligence, but reduce template noise and define what must be captured in structured fields versus narrative notes.
  - Confidence label: Observed

- Title: Monday update text confirms BM exceptions, diagnostic complexity, and rework as major hidden workload drivers
  - Severity: Medium
  - Category: manual process, resilience issue, ownership gap
  - Affected systems: Monday.com, Back Market operations, repair diagnostics, warranty/returns handling
  - Observed evidence: the six-month human-update pass found `790` BM-issue mentions across `498` items, `620` diagnostic-complication mentions across `482` items, and `446` rework/return mentions across `425` items; sample notes show iCloud lock/suspension issues, spec mismatches, grade disputes, liquid/board-level findings, repeat warranty loops, and BM return/refund context.
  - Business impact: these are not abstract risks; they are recurring exception classes consuming operator time and complicating throughput, especially in BM-heavy work.
  - Recommended action: treat BM exception reduction, better diagnostic structuring, and repeat-repair/return control as core operational simplification work.
  - Confidence label: Observed

- Title: Bench throughput is concentrated in Safan, with Misha and Andreas as the only other material completion-volume contributors
  - Severity: Medium
  - Category: ownership gap, resilience issue
  - Affected systems: workshop operations, Monday.com main board, staffing/capacity planning
  - Observed evidence: six-month activity-log attribution found `1,275` unique completed items, with `610` attributed to Safan, `339` to Misha, `230` to Andreas, `89` to Roni, and only `7` to Ferrari in the accessible slice; completions per working day are `4.49` for Safan, `2.49` for Misha, and `2.45` for Andreas.
  - Business impact: meaningful repair throughput depends on a very small set of operators, which raises concentration risk and makes the business vulnerable to interruption, overload, or context switching on those people.
  - Recommended action: protect Safan/Misha/Andreas from avoidable queue drag and admin leakage, and do not model Ferrari as latent bench capacity.
  - Confidence label: Observed

- Title: Technician groups are not clean bench-occupancy signals because they already contain aged paused work
  - Severity: Medium
  - Category: observability gap, manual process
  - Affected systems: Monday.com main board, workshop operations, capacity planning
  - Observed evidence: operator confirmed that technician groups are the current workstation/queue proxy, but fresh `2026-04-02` queue-age analysis shows `Safan (Short Deadline)` median age `40` days with `16` items over `30` days, `Safan (Long Deadline)` median age `236` days with `13` items over `90` days, and dominant statuses inside tech groups include `Repair Paused`, `Queued For Repair`, `BER/Parts`, and `Awaiting Part`.
  - Business impact: the workshop can appear bench-constrained when the real issue is aged queue debt and paused work mixed into technician queues, which weakens capacity decisions.
  - Recommended action: measure queue ownership and bench occupancy separately, and introduce an explicit bench-state field if utilisation is going to be managed operationally.
  - Confidence label: Observed

- Title: Rework and QC burden are materially eating into technician throughput
  - Severity: Medium
  - Category: resilience issue, data quality issue
  - Affected systems: workshop operations, QC flow, Monday.com main board
  - Observed evidence: six-month staff analysis found QC-failure proxy rates of `9.7%` for Misha, `8.9%` for Safan, and `7.4%` for Andreas; repeat-completion proxy rates are also high at `32.3%` for Safan, `24.3%` for Andreas, and `23.6%` for Misha.
  - Business impact: a meaningful portion of bench effort is going back into previously completed work or items that later fail QC, which depresses effective capacity even when raw completion counts look acceptable.
  - Recommended action: treat rework reduction and QC stability as a throughput lever, not just a quality metric.
  - Confidence label: Observed

- Title: Remote-job logistics spend is large enough to materially erode mail-in and courier margins
  - Severity: Medium
  - Category: resilience issue, data quality issue
  - Affected systems: Royal Mail, Gophr, courier workflows, Monday.com, Xero
  - Observed evidence: Xero spend since `2025-10-01` shows `£12,314.35` of identified logistics cost, led by Royal Mail `£10,305.21` and Gophr `£1,706.31`; the live Monday paid-value surface shows `£99,517.67` of visible remote-service paid value across Mail-In, courier, and related remote services, making identified logistics cost about `12.4%` of visible remote paid value.
  - Business impact: remote jobs can look healthy on gross paid value while losing a meaningful slice of contribution to outbound and courier cost before labour, parts, and rework are considered.
  - Recommended action: treat shipping as a first-class channel-cost input, not a back-office overhead, and decide clearly which remote shipping costs are customer-paid versus absorbed.
  - Confidence label: Observed

- Title: Parts-board supplier metadata is too weak to support real supplier economics or purchasing discipline
  - Severity: Medium
  - Category: data quality issue, observability gap, ownership gap
  - Affected systems: Monday.com parts board, purchasing, supplier management
  - Observed evidence: the live parts board contains `1,802` stock rows and `1,240` populated supply-price rows, but `Preferred Supplier`, `Order Supplier`, and `Supplier` relation are effectively blank across the snapshot, causing the full board to collapse into one `Unspecified` supplier bucket.
  - Business impact: the business cannot reliably answer which suppliers carry the most dependency, which suppliers drive cost or lead-time problems, or whether preferred-vendor discipline is actually being followed.
  - Recommended action: make supplier identity mandatory on stocked parts, then track preferred-vs-actual order source and lead-time outcome per supplier.
  - Confidence label: Observed

- Title: Repeat-customer demand exists, but it is not strong enough to compensate for weak new-demand conversion
  - Severity: Medium
  - Category: data quality issue, ownership gap
  - Affected systems: Monday.com, customer service, marketing/growth
  - Observed evidence: a board-wide dedupe pass across `4,453` items produced `3,944` identifiable customers and only `320` repeat customers (`8.1%`); repeat is materially stronger in Walk-In (`12.1%`) and courier-led work (`11.5-23.0%`) than in standard Mail-In (`2.6%`).
  - Business impact: the business still depends heavily on first-time demand, so slow response and poor conversion hurt more than they would in a high-retention model.
  - Recommended action: improve capture of customer identity and treat repeat-work growth as a strategic lever, especially in local and courier-led channels where retention looks stronger.
  - Confidence label: Observed

- Title: Physical workstation count is not the clearest current throughput constraint; queue hygiene and blocked states are
  - Severity: Medium
  - Category: observability gap, manual process, ownership gap
  - Affected systems: workshop operations, Monday.com, queue management
  - Observed evidence: operations docs state there are `8` workstations, but also state there is no workstation allocation tracking; the live open queue is dominated by non-bench states such as `Booking Confirmed` (`232`), `Awaiting Confirmation` (`127`), and `Client Contacted` (`120`), while more bench-adjacent states are much smaller (`Received` `44`, `Repair Paused` `39`, `Awaiting Part` `22`, `Queued For Repair` `12`, `Diagnostic Complete` `10`).
  - Business impact: the workshop can feel overloaded even when the clearer limiting factor is poor flow control rather than raw lack of benches.
  - Recommended action: do not assume more physical space fixes the loss problem; first separate live WIP from stale debt and add workstation-level allocation tracking if capacity planning is meant to be evidence-based.
  - Confidence label: Observed

- Title: Public market pricing does not make iCorrect look obviously uncompetitive; execution still looks like the bigger failure
  - Severity: Medium
  - Category: ownership gap, resilience issue
  - Affected systems: Shopify website, customer-service operations, workshop operations, market positioning
  - Observed evidence: competitor benchmarking shows iCorrect public entry pricing (`iPhone from £39`, `MacBook from £49`) is broadly in line with London peers; iSmash advertises iPhone screen repairs from `£35` and MacBook batteries from `£79.99`, TommyTech advertises iPhone screen repairs from `£25-40` on older models and up to `£200` on newer models, while premium Mac specialists like I Repair Macs and Mac Repair London use higher-price diagnosis-led models.
  - Business impact: the company risks blaming headline pricing when the stronger evidence still points to missed conversion, margin mix, and operating drag after demand is already present.
  - Recommended action: treat pricing review as a secondary optimisation and prioritise conversion, follow-up speed, trust signalling, queue hygiene, and margin discipline first.
  - Confidence label: Observed

- Title: Monday does not currently hold a trustworthy canonical customer-identity surface for retention analysis
  - Severity: Medium
  - Category: observability gap, data quality issue, ownership gap
  - Affected systems: Monday.com main board, customer-service operations, retention/LTV reporting
  - Observed evidence: the main-board relation `Link - Client Information Capture` is live in schema but has `boardIds: []`; the small `Contacts` and `Leads` boards contain only `3` and `4` items and sampled rows are placeholder/demo-style entries rather than a live repair-customer registry.
  - Business impact: repeat-customer and LTV analysis must currently rely on weak email/phone/name heuristics, which makes retention insight noisier than it should be and prevents a clean cross-system customer view.
  - Recommended action: choose one real customer-identity owner across Monday/Intercom/Shopify/Xero and either bind the client-capture relation properly or retire the dead-end mini-CRM boards.
  - Confidence label: Observed

- Title: Xero is live and current, but the Monday -> Xero automation loop is still one-way at draft-invoice stage
  - Severity: Medium
  - Category: ownership gap, observability gap, resilience issue
  - Affected systems: Xero, Monday.com, n8n Cloud, finance operations
  - Observed evidence: live Xero reads confirm the `Panrix Ltd` tenant is active, cash-basis, and carrying current 2025-2026 receivables, payables, payments, bank transactions, and April 2026 reporting; active n8n workflow `Xero Invoice Creator` creates draft invoices from Monday and writes invoice ID/URL back; Monday evidence shows one live finance trigger `Invoice Action -> Create Invoice -> webhook [537692848]` and no matching live `Send Invoice` board control; current/archived `xero-send-invoice.json` and `xero-payment-received.json` are not deployed and are not deployment-ready because they contain placeholder Xero credential IDs, placeholder Slack channel IDs, depend on an unregistered Xero webhook, and the payment-received workflow expects `Monday ID:` in invoice reference while the live `2025+` Xero invoice sample contains `0` such references. Live Monday schema also exposes `Payment Method = Invoiced - Xero` and `Invoice Status = Paid`, not the draft workflow's `payment_method = Online (Xero)` and `payment_status = Paid` write-back.
  - Business impact: finance has a live accounting ledger, but operational systems are not receiving a fully closed invoice-and-payment loop back from Xero, which leaves paid/outstanding state and collections ownership partly manual.
  - Recommended action: decide whether Xero remains a draft-ledger step only or becomes the authoritative invoice-status source by deploying and owning the send/payment write-back path.
  - Confidence label: Observed

- Title: Operations docs show a large ghost-invoice cleanup backlog with no live automated owner
  - Severity: Medium
  - Category: ownership gap, observability gap, data quality issue
  - Affected systems: Xero, Stripe, SumUp, Monday.com, operations finance reporting
  - Observed evidence: `/home/ricky/.openclaw/agents/operations/workspace/docs/IMPROVEMENTS.md` describes `343` ghost invoices and approximately `£91k` of fake debt caused by missing payment matching; `/home/ricky/.openclaw/agents/operations/workspace/docs/reports/xero_invoice_crossref.csv` contains `343` rows, including `265` `SAFE TO VOID - payment matched` and `78` `REVIEW NEEDED - no payment found`; `/home/ricky/.openclaw/agents/operations/workspace/docs/reports/xero_invoice_cleanup.csv` contains `450` rows, including `343` `VOID - Likely paid/ghost` and `107` `KEEP - Corporate`.
  - Business impact: debt visibility, aged receivables interpretation, and cleanup decisions are distorted by a large backlog that still has no proven live reconciliation owner.
  - Recommended action: assign one owner for ghost-invoice triage and closure, decide the disposition path for the `78` unmatched items, and either restore or replace the payment-matching automation with a supported runtime.
  - Confidence label: Observed

- Title: Repair-payment reconciliation currently exists only as archived tooling, not as a live runtime
  - Severity: Medium
  - Category: ownership gap, observability gap, dormant
  - Affected systems: Stripe, SumUp, Monday.com, Xero, archived finance tooling
  - Observed evidence: the only concrete Stripe/SumUp reconciliation implementation found is `/home/ricky/data/archives/agents/2026-03-31/disk-orphans/finance-archived/workspace/docs/payment_reconciliation.py`; it reads `config/api-keys/.env`, matches Stripe and SumUp payments to Monday repairs, and writes Payment 1/2 fields plus `Payments Reconciled`, but no current cron, systemd unit, or active workspace reference runs it; Monday audit docs also note `Payments Reconciled` has zero activity. The current operations finance knowledge base still references `docs/payment_reconciliation.py`, `docs/xero_vat_forensics.py`, `docs/xero_vat_forensics_v2.py`, `docs/xero_refresh_token.txt`, and `docs/xero_vat_forensics_results.json`, but those files are absent from the live operations workspace and only exist in the archived finance orphan tree.
  - Business impact: repair-payment matching is not reliably happening in a live, owned runtime, so paid-state accuracy and downstream profitability/reconciliation reporting remain fragile.
  - Recommended action: either restore this logic into a supported runtime with clear ownership or formally retire it and replace it with a new canonical reconciliation service.
  - Confidence label: Observed

- Title: Back Market Stage 1 intake is documented inconsistently
  - Severity: Medium
  - Category: observability gap, ownership gap
  - Affected systems: Back Market, Monday.com, Telegram/Slack intake visibility
  - Observed evidence: `BM-PROCESS-CURRENT-STATE.md` describes SENT-order intake as poll -> Slack notification only, while SOP 01 and `scripts/sent-orders.js` document a stronger flow that creates linked items on both Monday boards and sends Telegram notifications; live crontab and `sent-orders.log` confirm the script is scheduled and recently created records in production.
  - Business impact: operators and agents can form the wrong mental model of how trade-ins first enter the system, which makes reconciliation and incident response harder.
  - Recommended action: verify the live scheduler/runtime for `sent-orders.js`, then align the current-state doc and SOP so BM ingress has one clear source of truth.
  - Confidence label: Observed

- Title: BM sell-side buy-box management has split canonical-vs-runtime ownership
  - Severity: Medium
  - Category: ownership gap, observability gap, resilience issue
  - Affected systems: Back Market sell-side pricing, buy-box management, buyback-monitor, Back Market workspace SOP 07
  - Observed evidence: `backmarket/sops/07-buy-box-management.md` now correctly says `scripts/buy-box-check.js` has no live cron, `backmarket/qa/QA-SOP-SCRIPT-AUDIT-2026-04-01.md` confirms the same, and the live Monday `05:00 UTC` schedule still runs `/home/ricky/builds/buyback-monitor/run-weekly.sh`, which executes `python3 buy_box_monitor.py --no-resume --auto-bump` rather than the JS SOP 07 script.
  - Business impact: operators can read the rebuilt JS SOP as the canonical buy-box process while production still depends on a separate Python scheduler path, which increases incident-response and migration risk.
  - Recommended action: choose one canonical scheduled sell-side runtime, either promote `scripts/buy-box-check.js` into the live weekly schedule or explicitly document the Python `buy_box_monitor.py` pipeline as the production owner until cutover is complete.
  - Confidence label: Observed

- Title: BM resale automation is split between operator-driven listing and scheduled downstream execution
  - Severity: Medium
  - Category: manual process, ownership gap, resilience issue
  - Affected systems: Back Market resale flow, Monday.com, BM Devices board, Royal Mail dispatch
  - Observed evidence: `list-device.js` requires `--live --item` and has no user crontab entry, while `sale-detection.js` and `dispatch.js` are both scheduled live; `dispatch.log` explicitly says BM is not notified at label purchase time and shipping confirmation still depends on the later Monday `Shipped` webhook path.
  - Business impact: the resale chain has mixed ownership boundaries, so failures can occur at the operator handoff into listing or between dispatch and final BM confirmation without one clear runtime owner.
  - Recommended action: document the canonical human handoff at listing publish, the canonical automation owner for reconciliation/dispatch, and the exact control point where shipment becomes irrevocably confirmed to BM.
  - Confidence label: Observed

- Title: BM returns and aftercare remain mostly manual despite partial counter-offer and warranty automation
  - Severity: Medium
  - Category: manual process, resilience issue, observability gap
  - Affected systems: Back Market aftercare, BM dashboard messaging, Monday.com, Intercom, icloud-checker, n8n Cloud
  - Observed evidence: SOP 12 states there is no automated return detection and BM `/ws/sav` is non-functional; buyer returns are handled through BM dashboard/email/manual checks, while only two edges are automated today: trade-in counter-offer execution via `icloud-checker` Slack actions and website warranty claims via the active n8n `Warranty Claim Form` workflow.
  - Business impact: post-sale issues rely on human monitoring and manual state handling, which increases SLA risk and makes return/relist loops harder to audit.
  - Recommended action: document one canonical aftercare operating model, decide whether BM return detection should be automated, and tie manual BM return handling back into Monday/Intercom with clearer ownership.
  - Confidence label: Observed

- Title: Back Market listing safety now depends on canonical resolver truth, not generic catalog matching
  - Severity: Medium
  - Category: resilience issue, data quality issue
  - Affected systems: Back Market listing flow, Monday.com, listings registry, BM catalog
  - Observed evidence: `backmarket/scripts/list-device.js` and `backmarket/sops/06-listing.md` were updated on `2026-03-30` to make `data/listings-registry.json` canonical resolver truth, normalize slots through `scripts/lib/resolver-truth.js`, restrict auto-resolution to live-safe trust classes, and require strict probe verdicts before promoting new resolver truth.
  - Business impact: any tooling or operator habit that still treats raw catalog matching as sufficient can publish the wrong product mapping or bypass the tighter listing safety gates.
  - Recommended action: align operator guidance and any adjacent tooling with the new resolver-truth model, and treat raw catalog matches as advisory unless they are promoted into the registry under the documented trust classes.
  - Confidence label: Observed
