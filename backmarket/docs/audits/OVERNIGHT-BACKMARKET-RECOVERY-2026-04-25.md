# Overnight Back Market Recovery — 2026-04-25

Owner: Jarvis
Status: ACTIVE

## Ricky's current objective

Back Market is ~60% of revenue, stock is aging/perishing after the market value drop from MacBook Neo / M5 Pro releases, and cash flow matters more than perfect margin recovery right now.

The immediate goal is not maximum theoretical profit. The immediate goal is:

1. Get safe stock listed.
2. Clear stock even where profit is poor or negative, with visibility.
3. Fix the account/data breakages that stop listings, shipping, payout, and SKU integrity.
4. Remove Ferrari from manual Back Market portal admin, especially CS/warranty/returns monitoring.

## Important strategic pivot

Previous architecture optimised for right price and max profit.

Current mode is clearance-first:

- Prioritise cash in over stock tied up.
- Allow listing below previous profitability gates when explicitly classified as clearance stock.
- Do not silently auto-block stock just because projected margin is below old thresholds.
- Keep safety gates for wrong-device, wrong-SKU, wrong-colour, wrong-customer, and irreversible customer/account actions.

## Retired dependency

n8n / NAN is retired and must not be listed as an active Back Market dependency unless live evidence proves otherwise.

## Workstream map

### A. Account/data stabilisation: fix broken automation chain

Purpose: stop wrong links and silent failures from blocking sales.

Priority order:
1. Fix `matchByListingId()` wrong-device matching in `/home/ricky/builds/royal-mail-automation/dispatch.js`.
2. Fix `sent-orders.js` device relation mapping for new BM title variants so Main Board `board_relation5` is populated.
3. Improve `bm-shipping` failure markers/audit so shipped orders without BM confirmation are visible immediately.
4. Verify `bm-payout` real outcome path and add explicit success/failure audit markers.

### B. Listing queue: get 10+ To List devices moving

Purpose: produce a real listing queue with current mode: clearance-first.

Actions:
1. Identify current devices in To List / ready-to-list states.
2. For each device, classify:
   - SAFE_TO_LIST: data complete and SKU/product/colour confident.
   - CLEARANCE_LIST: low/negative profit but should list for cash recovery.
   - BLOCKED_DATA: missing serial/spec/colour/grade/device relation.
   - BLOCKED_ACCOUNT_RISK: wrong SKU/product/colour risk or active BM account risk.
3. Recommend listing price under clearance mode, not old max-profit-only mode.
4. Do not execute live listings until the queue and mode are approved or an explicit live gate is set.

### C. Browser ops: replace Ferrari manual portal work

Purpose: create the controlled browser layer for BM seller UI work.

Initial operations:
1. `fix-sku`: update existing listing SKUs via seller portal UI because BM API ignores SKU update on existing listings.
2. `cs-monitor`: read customer-service/warranty/returns/repair tabs and produce queue/alerts.

Guardrails:
- Jarvis BM user: `jarvis@icorrect.co.uk`.
- Login uses email code from SMTP.
- First milestone is read-only login/session/selector map.
- First live SKU batch is 5 listings only, after approval.
- CS/returns starts read-only. No replies, refunds, return accept/reject, or warranty decisions without explicit approval.

### D. Morning report

By Bali morning, report:
- What was fixed or prepared.
- What is still blocked.
- Current To List queue by category.
- Any orders/shipments/payouts needing manual action.
- Browser ops readiness and next approval needed.

## Non-negotiable safety rules

- Do not mutate live BM listings/customer-service/returns without explicit scoped approval.
- Do not send customer messages.
- Do not accept/reject returns or warranty claims.
- Do not change prices/listings in bulk without a generated queue and rollback path.
- Do not hide low-margin/loss-making stock: classify it as CLEARANCE_LIST instead.
