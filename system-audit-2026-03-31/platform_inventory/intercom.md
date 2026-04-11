# Intercom

## Access

- `Observed`: reachable via `INTERCOM_API_TOKEN`
- Base URL: `https://api.intercom.io`
- Workspace ID: `pt6lwaq6`
- Evidence exports:
  - `/home/ricky/data/exports/system-audit-2026-03-31/intercom/admins.json`
  - `/home/ricky/data/exports/system-audit-2026-03-31/intercom/contacts-page1.json`
  - `/home/ricky/data/exports/system-audit-2026-03-31/intercom/conversations-page1.json`
  - `/home/ricky/data/exports/system-audit-2026-03-31/intercom/contact-data-attributes.json`
  - `/home/ricky/data/exports/system-audit-2026-03-31/intercom/tags.json`
  - `/home/ricky/data/exports/system-audit-2026-03-31/intercom/teams.json`
  - `/home/ricky/data/exports/system-audit-2026-03-31/intercom/segments.json`
  - `/home/ricky/data/exports/system-audit-2026-03-31/intercom/articles.json`
  - `/home/ricky/data/exports/system-audit-2026-03-31/intercom/help-center-collections.json`
  - `/home/ricky/data/exports/system-audit-2026-03-31/intercom/ticket_types.json`
  - `/home/ricky/data/exports/system-audit-2026-03-31/intercom/tickets-page1.json`
  - `/home/ricky/data/exports/system-audit-2026-03-31/intercom/companies-page1.json`
  - `/home/ricky/data/exports/system-audit-2026-03-31/intercom/company-data-attributes.json`

## Observed Inventory

- Admins: `3`
  - Michael Ferrari
  - Support
  - Alex
- Teams: `1`
  - `Support` (`9725695`)
- Segments: `3`
  - `Active`
  - `New`
  - `Slipping Away`
- Tags: `21`
- Contacts: `19,798`
- Conversations: `30,959`
- Companies: `169`
- Ticket types: `2`
- Tickets: `30,650`
- Help-centre articles: `0`
- Help-centre collections: `0`
- Help centers: `1`
- User contacts from search: `19,361`
- Lead contacts from search: `440`

Representative observed tags:
- `bm-sale-issue`
- `bm-trade-in-confirmed`
- `bm-trade-in-counteroffer`
- `bm-trade-in-message`
- `booking-issue`
- `collection-query`
- `corporate`
- `create-repair`
- `email-enquiry`
- `high-value`
- `ready-to-book`
- `shopify`
- `status-check`
- `warranty`

Representative conversation source types from current sample:
- `admin_initiated`
- `instagram`
- `whatsapp`

Observed implication:
- Intercom is not just a web-chat inbox. Current production traffic spans at least direct admin-created threads plus social/messaging channels.
- Intercom ticketing is active at substantial scale and should be treated as a core operational/customer-service surface, not an edge feature.
- contact-role search suggests the workspace contains both a large user base and a smaller lead pool, even though the top-level contacts total can vary slightly by endpoint and timing.

## Admin, Team, And Seat Model

Observed from live reads:
- `GET /admins?per_page=1` still returns the full `3`-admin list
- only `1` admin has an inbox seat:
  - `9702337` `Support` (`admin@icorrect.co.uk`)
- `GET /teams?per_page=1` returns one team only:
  - `9725695` `Support`
  - distribution method `round_robin`
  - admin IDs `[9702337]`

Observed implication:
- visible Intercom inbox ownership is concentrated into one support seat/account and one team.
- this looks more like a shared support-operator model than a multi-seat teammate model.

## Tickets And Companies

Observed from live reads:
- `GET /ticket_types` returns two active ticket types:
  - `2985889` `Tickets`
  - `2985998` `Internal Notes`
- `POST /tickets/search` returns `30,650` tickets total across `1,533` pages
- first-page sample shows:
  - `20` tickets returned
  - all `20` are of ticket type `Tickets`
  - `18` are `submitted`
  - `2` are `waiting_on_customer`
  - all `20` sampled tickets include `operator_workflow_event` ticket parts
- `GET /companies?per_page=5` returns `169` companies
- `GET /data_attributes?model=company` returns `21` company attributes, `5` custom
- the main customer-facing ticket type has a heavily reduced active schema:
  - ticket type `2985889` (`Tickets`) has `22` total attributes
  - `20` of those attributes are archived
  - only `_default_title_` and `_default_description_` remain active and visible to contacts
- the internal ticket type `2985998` (`Internal Notes`) is `Back-office` and `is_internal=true`

Notable custom company attributes:
- `Company Address`
- `Payment Method`
- `Corporate Account Item ID`
- `creation_source`
- `company_id`

Observed implication:
- the previous `GET /tickets` `404` was an endpoint-shape problem, not evidence that tickets are absent
- Intercom operator workflows are actively mutating tickets in production
- company-level Intercom data likely carries corporate/B2B process context and at least one cross-system identifier (`Corporate Account Item ID`)
- the ticket surface has gone through meaningful schema churn, because many formerly operational fields now remain only as archived ticket attributes

## Contact Data Attributes

- Total contact attributes observed: `57`
- Custom attributes observed: `24`

Notable custom attributes:
- `Client address`
- `shopify_domain`
- `shopify_id`
- `shopify_accepts_marketing`
- `shopify_orders_count`
- `shopify_total_spent`
- `shopify_note`
- `shopify_last_order_name`
- `shopify_last_order_id`
- `shopify_verified_email`
- `shopify_tax_exempt`
- `shopify_state`
- `shopify_purchasing_summary_update_event_at`
- `shopify_email_marketing_consent_update_event_at`
- `shopify_update_event_at`
- `shopify_update_event`
- address fields: `address1`, `address2`, `country`, `country_code`, `city`, `province`, `province_code`, `zip`

Observed implication:
- Intercom has a real Shopify-linked customer data model already present in contact attributes.
- This is separate from the n8n `Shopify Order to Monday.com + Intercom - iCorrect` workflow, so Shopify customer/order context reaches Intercom through more than one path.

## Messenger, AI, And Help-Centre Surface

Observed from live reads:
- `GET /help_center/help_centers?per_page=10` returns one help center:
  - ID `4921762`
  - identifier `icorrect-4a11573b3058`
  - URL `https://intercom.help/icorrect-4a11573b3058`
  - `website_turned_on=false`
  - `custom_domain=null`
- `GET /articles?per_page=1` returns `0` articles
- `GET /help_center/collections?per_page=1` returns `0` collections
- `POST /conversations/search` with `source.type=conversation` returns `122` customer-initiated conversations
- sampled customer-initiated conversation evidence shows:
  - `team_assignee_id=9725695`
  - `admin_assignee_id=9702337`
  - `ai_agent_participated=true`
  - `ai_agent.resolution_state=routed_to_team`
  - custom conversation attributes include AI/CX fields such as `AI Title`, `AI Issue summary`, `Fin AI Agent resolution state`, `CX Score rating`, and `Copilot used`

Observed implication:
- Intercom Messenger/customer-initiated conversation handling is live and routes into the `Support` team.
- Intercom AI/Fin/Copilot features are not theoretical here; they are leaving real metadata on production conversations.
- the help centre technically exists, but it is turned off and empty, so it should be treated as dormant rather than active customer-facing content.

## API Surface Limits Still Present

Observed from current API probes with `Intercom-Version: 2.13`:
- `GET /inboxes` returns `404 not_found`
- `GET /macros` returns `400 intercom_version_invalid`
- `GET /news/news_items` returns `404 not_found`
- `POST /tickets/search` still works, but a probe using `ticket_state` as a filter returns `400 invalid_field`

Observed implication:
- some agent/admin surfaces are not exposed through the current REST path or version available to this token
- inbox, macro, routing, and bot admin discovery is therefore only partial through API, even though live conversation/ticket objects clearly show routing and AI activity

## Cross-System Signals

- `Observed`: active n8n workflow `Intercom -> Monday (Create Repair)` creates Monday repair items from Intercom-triggered events.
- `Observed`: active n8n workflow `Status Notifications -> Intercom Email` sends customer-facing Intercom replies based on upstream status webhooks.
- `Observed`: active n8n workflow `Warranty Claim Form` is Intercom-heavy and indicates Intercom is used beyond generic support inboxing.
- `Observed`: `telephone-inbound/server.py` can create Intercom contacts directly from Slack phone-enquiry flows.

Inference:
- Intercom is a live customer communications and contact context hub, but some operational creation/update actions are handled by n8n and bespoke services rather than Intercom-native workflow tooling alone.
- The empty help-centre/article surface suggests either the help centre is not actively used in Intercom or content is hosted elsewhere.

## Open Threads

- determine whether inboxes/macros/saved replies are exposed only through another Intercom API surface or only through the UI for this workspace/token
- enumerate routing rules and any additional workflow/bot admin surfaces beyond the operator-workflow and AI-routing signals visible inside tickets/conversations
- verify whether Shopify-native sync is currently active, historical, or partially active
- inspect conversation-level custom attributes and company attributes for Monday/BM identifiers
