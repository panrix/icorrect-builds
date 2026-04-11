# Shopify

## Access

- `Observed`: reachable via `SHOPIFY_ACCESS_TOKEN`
- Store: `i-correct-final.myshopify.com`
- API mode used: Admin REST + Admin GraphQL in read-only audit mode
- Important correction:
  - shared credentials describe this token as read-only
  - live `GET /admin/oauth/access_scopes.json` shows it is not actually read-only
  - current granted scopes include both read and write access, including:
    - `read_customers`, `read_inventory`, `read_products`, `read_reports`, `read_content`, `read_themes`, `read_orders`
    - `write_orders`, `write_products`, `write_content`, `write_theme_code`, `write_themes`, `write_online_store_navigation`
- Evidence exports:
  - `/home/ricky/data/exports/system-audit-2026-03-31/shopify/shop.json`
  - `/home/ricky/data/exports/system-audit-2026-03-31/shopify/inventory-graphql.json`
  - `/home/ricky/data/exports/system-audit-2026-03-31/shopify/shipping_zones.json`
  - `/home/ricky/data/exports/system-audit-2026-03-31/shopify/payment_gateways.json`
  - `/home/ricky/data/exports/system-audit-2026-03-31/shopify/price_rules.json`
  - `/home/ricky/data/exports/system-audit-2026-03-31/shopify/app_installations.json`
  - `/home/ricky/data/exports/system-audit-2026-03-31/shopify/shop-plan.json`
  - `/home/ricky/data/exports/system-audit-2026-03-31/shopify/access_scopes_oauth.json`
  - `/home/ricky/data/exports/system-audit-2026-03-31/shopify/current-app-installation.json`
  - `/home/ricky/data/exports/system-audit-2026-03-31/shopify/current-app-detail.json`
  - `/home/ricky/data/exports/system-audit-2026-03-31/shopify/orders-payment-sample.json`
  - `/home/ricky/data/exports/system-audit-2026-03-31/shopify/webhook-subscriptions-admin.json`
  - `/home/ricky/data/exports/system-audit-2026-03-31/shopify/app_installations_admin.json`
  - `/home/ricky/data/exports/system-audit-2026-03-31/shopify/webhooks_rest.json`
  - `/home/ricky/data/exports/system-audit-2026-03-31/shopify/webhooks-rest-admin.json`
  - `/home/ricky/data/exports/system-audit-2026-03-31/shopify/themes.json`
  - `/home/ricky/data/exports/system-audit-2026-03-31/shopify/pages.json`
  - `/home/ricky/data/exports/system-audit-2026-03-31/shopify/blogs.json`
  - `/home/ricky/data/exports/system-audit-2026-03-31/shopify/shop_metafields.json`
  - `/home/ricky/data/exports/system-audit-2026-03-31/shopify/redirects.json`

## Shop Inventory

- Shop name: `iCorrect`
- Plan: `professional` in earlier shop read; GraphQL `shop.plan.displayName` returns `Shopify`
- Currency: `GBP`
- Contact email: `ricky@icorrect.co.uk`
- Ships to countries: `GB`

Observed counts:
- Products: `967`
- Orders: `109`
- Customers: `182`
- Shipping zones: `1`
  - `Europe`
- Themes: `16`
  - live main theme: `icorrect-shopify-theme/main`
- Smart collections: `0`
- Custom collections sampled: `10`
- Pages sampled: `10`
- Blogs: `1`
  - `News`
- Shop metafields sampled: `10`
- Redirects sampled: `10`

Representative collections:
- `MacBook Pro 14’’ Repair Prices`
- `MacBook Repair Prices`
- `iPhone Repair Prices`
- `iPad Repair Prices`
- `Apple Watch Repair Prices`
- `MacBook Pro 16” Repair Prices`
- `MacBook Pro 15” Repair Prices`
- `MacBook Pro 13” Repair Prices`
- `MacBook Air 15” Repair Prices`
- `MacBook Air 13” Repair Prices`

Representative product tags:
- `battery`
- `battery-repair`
- `charging-port-repair`
- `diagnostic`
- `face-id-repair`
- `front-camera-repair`
- `keyboard-repair`
- `microphone-repair`
- `mute-button-repair`
- `power-button-repair`

Representative content signals:
- page `Contact`
- page `Corporate Service`
- page `How It Works`
- page `llms`
- multiple repair landing pages updated in late March 2026
- diagnostic redirects route many `/diagnostics?...` paths into `/pages/diagnostic` or `/pages/advanced-diagnostic`

Observed storefront/config implications:
- the store has an actively iterated theme workflow with many unpublished previews and one main live theme
- shop metafields include active `gtm` and `SEOMetaManager` configuration, tying Shopify into analytics and SEO tooling
- the store contains corporate-facing content that matters for the B2B journey map
- the current custom app installation is `Jarvis` (`gid://shopify/AppInstallation/651565531389`)
- the current custom app's granted scopes do not include `read_apps`, `read_shopify_payments`, or `read_shopify_payments_accounts`

## Webhooks And Integration Signals

- `Observed`: Admin GraphQL query returned `0` visible `webhookSubscriptions` for this token.
- `Observed`: REST `GET /webhooks.json?limit=50` also returns `0` visible webhooks.
- `Observed`: GraphQL `currentAppInstallation` resolves successfully and identifies the current app as `Jarvis`.
- `Observed`: GraphQL `currentAppInstallation.accessScopes` matches the REST OAuth scopes and confirms this app can read orders but cannot read installed apps or Shopify Payments account objects.
- `Observed`: active n8n workflow `Shopify Order to Monday.com + Intercom - iCorrect` is triggered by `orders/create`.
- `Observed`: the active workflow is using an n8n `shopifyTrigger` node with Shopify OAuth credentials (`shopifyOAuth2Api`), not a generic raw webhook endpoint.
- `Observed`: Intercom contact attributes include multiple `shopify_*` fields explicitly described as imported by Shopify integration.
- `Observed`: REST `shipping_zones.json` is readable and shows one configured shipping zone covering the United Kingdom.
- `Observed`: REST `price_rules.json` returns `403` and explicitly says the action requires merchant approval for `read_price_rules`.
- `Observed`: GraphQL `appInstallations` returns `ACCESS_DENIED`, so installed-app visibility is scope-limited on the current token.
- `Observed`: REST order samples show `payment_gateway_names = [\"shopify_payments\"]` on recent paid web orders, which is stronger evidence than the deprecated/unavailable `payment_gateways.json` path.
- `Observed`: GraphQL `shopifyPaymentsAccount` exists on the schema but returns `ACCESS_DENIED`, explicitly requiring `read_shopify_payments` or `read_shopify_payments_accounts`.
- `Observed`: REST `payment_gateways.json` still returns `404`, so the older gateway endpoint is not the right source of truth for this store/token.
- `User-confirmed` on `2026-04-01`: the store is using the Shopify payment gateway path, which includes Stripe-backed processing.
- `Observed`: additional scope-gated surfaces require merchant approval:
  - `script_tags.json` -> `403` requiring `read_script_tags`
  - `locations.json` -> `403` requiring `read_locations`
  - `product_listings.json` -> `403` requiring `read_product_listings`
- `Observed`: the non-versioned OAuth access-scopes endpoint works, while versioned `/admin/api/2025-01/access_scopes.json` returns `404`.

Inference:
- Shopify order/customer data is reaching the rest of the stack through at least two mechanisms:
  - n8n order-trigger automation into Monday/Intercom/Slack
  - a native or app-managed Shopify -> Intercom customer sync
- Shopify checkout itself is now directly observed as using Shopify Payments on sampled live orders, and user context further says this is the Shopify Payments / Stripe-backed path.
- The zero visible webhook subscriptions on both GraphQL and REST now has a narrower interpretation:
  - the `Jarvis` custom app token does not own or cannot see the live `orders/create` subscription
  - the active n8n Shopify trigger is likely owned by a different Shopify app/credential surface than the custom app token used for this audit
  - or the subscription is managed through an app/runtime layer not exposed to this token
- `Inferred`: the second explanation is now less likely than before because the current app installation itself is visible and still reports `0` exact webhook subscriptions.
- The current token is broad enough to mutate large parts of the store, but still not broad enough to enumerate every admin surface.

## Cross-System Role

- Customer-facing ecommerce and repair-price catalogue
- Feeds order data into active n8n operations/customer-service workflows
- Live order workflow creates Monday items on board `349212843` and Intercom tickets, then notifies Slack `shopify-orders`
- Feeds customer profile data into Intercom attributes
- Theme/source changes are documented as Git-managed rather than API-managed
- Hosts customer-facing content for contact, diagnostics, corporate, and repair landing pages
- Carries GTM/SEO-related shop metafields that connect Shopify to analytics/tracking infrastructure

## Open Threads

- identify whether the n8n `shopifyTrigger` credential is tied to the `Jarvis` app or to a different Shopify app installation
- enumerate installed apps and app-owned subscriptions if visible through another token or another API surface
- inspect Shopify Payments account surfaces through a scope/token that includes `read_shopify_payments`, mainly for payout/account detail rather than gateway confirmation
- determine whether `price_rules` access should be granted or whether discounts are intentionally outside this app's scope
- verify whether Shopify order data enters Monday only through n8n or through any direct custom app/service as well
- decide whether the current Shopify token should be reduced, because its live access scopes are materially broader than the shared “read-only” description
