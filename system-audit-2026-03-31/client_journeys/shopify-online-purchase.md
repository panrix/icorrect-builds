# Shopify / Online Store Purchase Journey

Status: rebuilt from verified docs/code/data on 2026-04-02

## Scope And Ground Truth

- Recent sampled web orders use `shopify_payments`; operator confirmation says this is the live Shopify Payments / Stripe-backed route.
- The live Shopify order workflow is `Shopify Order to Monday.com + Intercom - iCorrect`.
- Shopify customer data also reaches Intercom through a second path: native/app-managed `shopify_*` contact attributes.
- After the order is created, Monday becomes the operational owner and Intercom becomes the customer-context hub.

## Journey Map

1. Customer browses repair products and content
- Customer touchpoint: repair collections, service pages, contact page, corporate page, diagnostic pages, and quote-adjacent flows on the Shopify storefront.
- Internal handoff: none yet; this is the marketing / conversion stage.
- Systems involved: Shopify store and theme; analytics tooling linked through shop metafields; Intercom on the customer-service side after submission/order.
- Automation state: storefront and analytics are live, but this step is not an operational workflow yet.
- Delay points and failure modes: contact and service pages are known friction points, with dead clicks and low CTR on key pages. A customer can abandon before any operational record exists.
- Sources: `findings.md`; `platform_inventory/shopify.md`.

2. Customer completes checkout
- Customer touchpoint: Shopify checkout for a repair product or service package.
- Internal handoff: ecommerce payment and order capture hand the case into the operational stack.
- Systems involved: Shopify order; Shopify Payments; customer/order profile data.
- Automation state: automated inside Shopify.
- Delay points and failure modes: deeper Shopify Payments account detail is scope-blocked to the current token, but sampled orders confirm `payment_gateway_names = ["shopify_payments"]`. The current access token is over-scoped, which is an operational risk even though this does not change the customer journey directly.
- Sources: `platform_inventory/shopify.md`; `findings.md`.

3. n8n receives `orders/create`
- Customer touchpoint: customer does not see this, but this is where the order stops being “just ecommerce”.
- Internal handoff: Shopify order becomes a support ticket, a Monday job, and a Slack ops alert.
- Systems involved: n8n Cloud workflow `fuVSFQvvJ1GRPkPe`; Shopify trigger; Monday; Intercom; Slack.
- Automation state: automated, with duplicate-stop logic before record creation.
- Delay points and failure modes: webhook/subscription ownership is still opaque because the current Shopify app token sees zero webhooks even though the n8n trigger is live. This is an operational resilience gap if the trigger stops firing.
- Sources: `/home/ricky/data/exports/system-audit-2026-03-31/n8n/active/fuVSFQvvJ1GRPkPe.json`; `findings.md`; `platform_inventory/shopify.md`.

4. Order data is transformed into service context
- Customer touchpoint: none directly, but this step determines what the customer will experience next.
- Internal handoff: line-item data is translated into operational labels for service type, turnaround, booking slot, address, and device identifiers.
- Systems involved: n8n code node; Shopify order payload; Monday fields.
- Automation state: automated transformation.
- Delay points and failure modes: the workflow defaults to `Mail-In` unless the line items clearly indicate walk-in. If products or titles drift, service type and turnaround routing can be wrong. IMEI/SN extraction depends on notes text quality.
- Sources: `/home/ricky/data/exports/system-audit-2026-03-31/n8n/active/fuVSFQvvJ1GRPkPe.json`; `data_flows.md`.

5. Intercom contact and ticket are created
- Customer touchpoint: the customer now has an Intercom-linked support record, even if they never open Messenger directly.
- Internal handoff: the order becomes visible to customer-service in Intercom.
- Systems involved: Intercom contact search/create; ticket type `2985889`; order summary in `_default_title_` and `_default_description_`.
- Automation state: automated.
- Delay points and failure modes: Shopify customer data also syncs into Intercom through separate `shopify_*` attributes. Canonical field precedence is not documented, so customer context can diverge between the native sync path and the n8n order path.
- Sources: `/home/ricky/data/exports/system-audit-2026-03-31/n8n/active/fuVSFQvvJ1GRPkPe.json`; `platform_inventory/intercom.md`; `findings.md`.

6. Monday item is created and linked back to Intercom
- Customer touchpoint: none directly, but this is the canonical ops record.
- Internal handoff: customer-service and workshop now share one item with payment/source/link fields already present.
- Systems involved: Monday board `349212843`, group `new_group77101__1`; fields for email, phone, service, `Awaiting Confirmation`, booking date, payment status, payment method, source, order total, Intercom link, conversation ID, address, and IMEI/SN.
- Automation state: automated.
- Delay points and failure modes: if the Monday write fails after the Intercom ticket is created, the customer-service side exists without an ops record. Human follow-up from the `New Orders` group is not yet fully verified in current docs.
- Sources: `/home/ricky/data/exports/system-audit-2026-03-31/n8n/active/fuVSFQvvJ1GRPkPe.json`; `integration_catalog.csv`.

7. Slack order alert and internal awareness
- Customer touchpoint: none.
- Internal handoff: Slack creates immediate team visibility for the new web order.
- Systems involved: Slack channel `shopify-orders`; Monday URL; Intercom URL.
- Automation state: automated.
- Delay points and failure modes: Slack creates visibility but not guaranteed ownership. The real operational follow-up still depends on how staff process the Monday item afterward.
- Sources: `/home/ricky/data/exports/system-audit-2026-03-31/n8n/active/fuVSFQvvJ1GRPkPe.json`.

8. Order branches into walk-in or mail-in operational flow
- Customer touchpoint: walk-in customers move into booking/arrival steps; mail-in customers move into packaging/courier and pre-repair steps.
- Internal handoff: from ecommerce intake into the correct service journey.
- Systems involved: Monday `service`; status-notification templates; Typeform pre-repair link for eligible paths; Intercom conversation.
- Automation state: partially automated. Service branching is automatic, but the downstream physical process depends on staff actions in Monday.
- Delay points and failure modes: the operational follow-up path after `Awaiting Confirmation` is still a known weak point because the main board is overloaded and carries large stale queues. A clean checkout does not guarantee a fast next human step.
- Sources: `findings.md`; `/home/ricky/builds/monday/services/status-notifications/templates.js`; `walk-in-customer.md`; `mail-in-send-in-customer.md`.

9. Payment state at ingress is marked confirmed
- Customer touchpoint: customer expects the order to be treated as paid.
- Internal handoff: the Shopify payment signal is written into Monday and should inform later finance logic.
- Systems involved: Monday `payment_status = Confirmed`; `payment_method = Shopify`; `dup__of_quote_total`.
- Automation state: automated at item creation.
- Delay points and failure modes: while Shopify-origin paid state is comparatively stronger than other channels, there is still no cross-rail canonical payment truth in Monday. This matters when Shopify purchases interact with later invoice adjustments, refunds, or follow-on finance reporting.
- Sources: `/home/ricky/data/exports/system-audit-2026-03-31/n8n/active/fuVSFQvvJ1GRPkPe.json`; `MASTER-QUESTIONS-FOR-JARVIS.md`; `findings.md`.

10. Ongoing customer updates depend on Monday
- Customer touchpoint: booking, received, ready, courier, return, and password-request updates.
- Internal handoff: the Shopify-origin order leaves ecommerce and becomes a standard Monday/Intercom-managed repair.
- Systems involved: Monday statuses; VPS `status-notifications`; Intercom.
- Automation state: automated only for specific status templates; otherwise manual through Intercom/email.
- Delay points and failure modes: if Monday statuses are not maintained cleanly, the Shopify customer sees the same communication gaps as any other journey. The root problem is not order capture; it is the overloaded downstream ops/comms system.
- Sources: `/home/ricky/builds/monday/services/status-notifications/templates.js`; `/home/ricky/builds/webhook-migration/verification/status-notifications-live-cutover-2026-04-01.md`; `findings.md`.

## Communication Gaps

- The order-ingress automation is strong, but current evidence does not show one clearly owned human follow-up path from the Monday `New Orders` group.
- Shopify customer context reaches Intercom through multiple paths, and field-precedence rules are undocumented.
- Post-purchase communication is only proactive at specific Monday status checkpoints; stalled `Awaiting Confirmation` and post-diagnostic cases can still leave customers waiting without updates.
- The live trigger ownership inside Shopify remains opaque, which increases incident-response risk if ingress breaks.

## Delay Points

- Order creation itself is fast and automated; the delay risk begins after the Monday item lands in the overloaded main board.
- Large stale open queues in `Awaiting Confirmation`, `Booking Confirmed`, and `Client Contacted` can hide genuinely current Shopify orders.
- If the order needs quote, invoice, or later exception handling, it inherits the same long-tail delay problems as other repair journeys.

## Improvement Opportunities

- Define one canonical owner for a newly created Shopify order within Monday so `shopify-orders` Slack visibility becomes accountable follow-up, not just awareness.
- Document field precedence between native Shopify -> Intercom sync and the n8n order flow.
- Verify and document the real Shopify app / credential that owns the live `orders/create` subscription.
- Build service-type-specific SLA ageing for Shopify orders so `Awaiting Confirmation` cannot silently become stale debt.

## Unknowns And Assumptions

- Unknown: exact production owner of the `shopifyTrigger` subscription because the visible `Jarvis` app installation does not expose the live webhook.
- Unknown: whether any Shopify order path bypasses the documented n8n workflow.
- [ASSUMPTION] Once the Monday item exists, staff treat it the same as equivalent walk-in or mail-in jobs; this is consistent with the evidence, but the exact operational SOP after `New Orders` is not fully documented.

## Sources

- `data_flows.md`
- `findings.md`
- `MASTER-QUESTIONS-FOR-JARVIS.md`
- `platform_inventory/shopify.md`
- `platform_inventory/intercom.md`
- `/home/ricky/data/exports/system-audit-2026-03-31/n8n/active/fuVSFQvvJ1GRPkPe.json`
- `/home/ricky/builds/monday/services/status-notifications/templates.js`
- `/home/ricky/builds/webhook-migration/verification/status-notifications-live-cutover-2026-04-01.md`
