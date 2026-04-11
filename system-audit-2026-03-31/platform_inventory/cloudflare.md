# Cloudflare

## Access

- `Observed`: live API token verification fails.
  - `GET https://api.cloudflare.com/client/v4/user/tokens/verify` -> HTTP `401`
  - response includes `Invalid API Token`
- `Observed`: Cloudflare still has an important documented operational role even without live API access.

Evidence sources:
- `/home/ricky/data/exports/system-audit-2026-03-31/cloudflare/verify.body.json`
- `/home/ricky/builds/webhook-migration/plan-status-notifications.md`
- `/home/ricky/builds/monday/icorrect-status-notification-documentation.md`
- `/home/ricky/builds/webhook-migration/discovery/cloudflare-icorrect-macros.js`

## Observed Operational Role

- `Observed`: the legacy status-notification architecture is documented as:
  - Monday webhooks -> Cloudflare Worker `icorrect-macros` -> n8n Cloud -> Intercom
- `Observed`: the status-notification cutover docs now show the VPS replacement is live as of `2026-04-01`.
  - old n8n sender workflow `TDBSUDxpcW8e56y4` is disabled
  - `status-notifications.service` is running with `SHADOW_MODE=false`
  - one controlled live Intercom reply was sent successfully through the VPS path
- `Observed`: Cloudflare is still relevant because:
  - the old worker handled more than just status notifications
  - remaining cleanup work depends on understanding which Monday automations still point at Cloudflare-era destinations

## Worker / Routing Notes

- documented worker name in current migration discovery:
  - `icorrect-macros`
- older docs also reference:
  - `icorrect-status-router`
- migration docs explicitly say the real worker name is `icorrect-macros`, not the older `icorrect-status-router` label

## Cross-System Role

- legacy/current boundary between:
  - Monday.com
  - Cloudflare Worker
  - Intercom
  - VPS live replacement
- likely website/DNS/cache role for Shopify front-end traffic is also implied in local docs, but not yet enumerated from live Cloudflare API because the token is invalid

## Observed Risks

- Cloudflare remains part of the documented notification history, but the current API token is unusable.
- This blocks live confirmation of:
  - worker inventory
  - routes
  - DNS records
  - zone settings
  - whether old workers are still deployed and serving traffic

## Open Threads

- obtain a valid Cloudflare API token or confirm the current one is intentionally retired
- verify whether any production Monday or website paths still terminate on Cloudflare workers rather than the VPS services, now that the status-notification cutover is complete
