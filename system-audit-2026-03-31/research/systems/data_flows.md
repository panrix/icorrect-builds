# Data Flows

This file will hold stepwise data flow descriptions once live platform discovery is complete.

Initial likely major flows:
- intake serial entry -> device checks -> Monday updates -> BM actions
- BM order arrival -> Monday/BM/Slack visibility -> intake -> payout -> refurb -> listing -> sale -> shipping
- repair intake -> Monday workflow -> customer comms -> invoicing -> repair -> QC -> return

## Preliminary Confirmed Flows

### Shopify Order -> n8n Cloud -> Intercom + Monday + Slack

- `Observed`: active n8n workflow `Shopify Order to Monday.com + Intercom - iCorrect` is triggered by Shopify `orders/create`.
- `Observed`: the workflow checks Monday main board `349212843` for an existing item named `#<order_number>` before proceeding.
- `Observed`: transformed order data determines `Walk-In` vs `Mail-In`, turnaround priority, booking time, address fields, and optional IMEI/SN extraction from order notes.
- `Observed`: the workflow creates an Intercom ticket, then creates a Monday item on board `349212843` group `new_group77101__1`, writes payment/source/intercom-link fields, adds a Monday update, and posts to Slack channel `shopify-orders`.
- `Inferred`: a Shopify order creates or enriches both customer-service and operations records rather than staying in Shopify alone.

### Typeform Pre-Repair -> n8n Cloud -> Monday + Intercom + Slack

- `Observed`: active n8n workflow `Typeform To Monday Pre-Repair Form Responses (v2)` is triggered by Typeform form `sDieaFMs`.
- `Observed`: workflow nodes fetch or search Monday items, update columns, set info validated, create internal updates, optionally post an Intercom note, and move groups/statuses when needed.
- `Inferred`: pre-repair form completion can advance a repair item operationally while also updating customer-service context.

### Intercom Trigger -> n8n Cloud -> Monday

- `Observed`: active n8n workflow `Intercom → Monday (Create Repair)` exposes webhook path `intercom-create-repair`.
- `Observed`: workflow nodes fetch Intercom contact data, prepare payloads, create a Monday item, and add an Intercom note back to the conversation.
- `Inferred`: certain Intercom actions directly create operational repair records in Monday.

### Monday Main Board -> bm-payout VPS Service -> Back Market API

- `Observed`: Monday webhook on main board `349212843` triggers payout service when `status24` changes to `Pay-Out`.
- `Observed`: service performs pre-flight checks for BM trade-in ID, iCloud clear status, and stale-webhook status validation.
- `Observed`: on success, service calls Back Market buyback validate endpoint, updates Monday status to `Purchased`, writes a Monday update, and notifies Slack/Telegram.

### Monday Main Board -> bm-shipping VPS Service -> Back Market API

- `Observed`: Monday webhook on main board `349212843` triggers shipping-confirmed service when `status4` changes to `Shipped`.
- `Observed`: service requires tracking number, serial number, linked BM board item, and BM order ID before notifying Back Market.
- `Observed`: on success, service updates BM sales order state, comments on Monday, sends Slack/Telegram notifications, and moves the BM Devices item to the `Shipped` group.

### Monday Main Board -> icloud-checker VPS Service -> Monday / BM / Slack

- `Observed`: serial entry in main board column `text4` triggers `/webhook/icloud-check`.
- `Observed`: the service uses SICKW, Apple spec lookup, BM trade-in ID, and linked BM board data to check iCloud/spec state and branch into alerts, comments, or BM suspension.
- `Observed`: Slack interaction and manual recheck endpoints exist under the same service for follow-up handling.

### Monday Main Board -> bm-grade-check VPS Service -> Slack + Monday Update

- `Observed`: Monday webhook on main board `349212843` triggers `/webhook/bm/grade-check` when `status4` changes to `Diagnostic Complete`.
- `Observed`: the service reads two pre-grade fields, cost fields, and the linked BM device relation to predict sale grade and profitability.
- `Observed`: profitability logic uses local sell-price data, `10%` BM commission, `£15` shipping cost, `>=30%` margin threshold, and `>=£100` net-profit threshold.
- `Observed`: unprofitable outcomes create Slack warnings and a Monday comment.

### Monday To List -> list-device.js -> Back Market Listing + Monday

- `Observed`: BM listing is triggered from Main Board `349212843` group `new_group88387__1` when `status24` is `To List` index `8`.
- `Observed`: `list-device.js` is single-item live only, reads final grade plus linked BM Devices specs/cost context, resolves a safe product UUID from canonical resolver truth first and the BM catalog second, creates or reuses a draft listing, verifies the result, fetches backbox pricing, then publishes.
- `Observed`: probe mode is now a strict promotion gate with explicit `verdict` and `promotable_resolver_truth` output, and failed probes exit non-zero.
- `Observed`: on successful verification/publish, the script writes listing ID, product UUID, SKU, and total fixed cost back to BM Devices and moves the Main Board item to `Listed`.
- `Inferred`: listing publication is partly automated but still operator-gated rather than fully scheduled.

### Weekly Sell-Side Pricing -> sell_price_scraper_v7 -> buy_box_monitor.py -> Google Sheet

- `Observed`: the live Monday `05:00 UTC` weekly pricing path is `/home/ricky/builds/buyback-monitor/run-weekly.sh`, not `backmarket/scripts/buy-box-check.js`.
- `Observed`: `run-weekly.sh` runs `sell_price_scraper_v7.js --all`, then `python3 buy_box_monitor.py --no-resume --auto-bump`, then `python3 sync_to_sheet.py`.
- `Observed`: Back Market SOP 07 and the BM QA audit on `2026-04-01` both confirm `buy-box-check.js` has no active live cron.
- `Inferred`: scheduled sell-side pricing and buy-box management still depend on the older Python monitor path even though the rebuilt JS SOP path now exists in the Back Market workspace.

### Back Market New Sale -> sale-detection.js -> Monday + BM Devices + Telegram

- `Observed`: `sale-detection.js` polls `GET /ws/orders?state=1` on a live cron schedule and matches `orderlines[].listing_id` to BM Devices `text_mkyd4bx3`.
- `Observed`: after stock checks, the script accepts the order on BM with the order payload SKU, updates BM Devices buyer/order/price fields, updates the linked Main Board item to `Sold` with a sold date, renames the item to the buyer name, and sends Telegram confirmation.
- `Observed`: cron logs show a successful live acceptance on `2026-03-31` followed by later no-op polling runs the same day.
- `Inferred`: BM sale acceptance is a live autonomous operational path between BM and Monday once a listing is active.

### Back Market Dispatch -> Royal Mail Label + Slack -> Monday Shipped Webhook -> Back Market Shipping Confirmation

- `Observed`: scheduled `dispatch.js` buys Royal Mail labels, extracts tracking, uploads PDFs to Slack, and prepares packaging slips.
- `Observed`: current shipping logic skips duplicate label purchase when Main Board `text53` already contains tracking, even if BM still shows `state=3`.
- `Observed`: dispatch does not notify BM directly; final BM shipping confirmation still happens later through the Monday `status4 -> Shipped` webhook into `bm-shipping`.
- `Inferred`: dispatch and BM shipment confirmation are separate operational control points, with Monday serving as the final human-confirmed release gate.

### Website Warranty Claim -> n8n Cloud -> Intercom

- `Observed`: active n8n workflow `Warranty Claim Form` exposes webhook path `warranty-claim` for `icorrect.co.uk` origins.
- `Observed`: the workflow validates customer/device/issue fields, emails `support@icorrect.co.uk`, waits for the conversation to exist, then searches/creates the real Intercom contact and swaps that customer onto the created conversation.
- `Inferred`: website warranty/aftercare claims are operationally handled through Intercom even though BM-side aftercare remains largely manual.

### Monday Spec Mismatch -> icloud-checker -> Slack Approval -> BM Counter-Offer

- `Observed`: `icloud-checker` can detect BM trade-in spec mismatches after Apple spec lookup and post Slack approval buttons.
- `Observed`: approval or adjusted-price actions execute BM `PUT /ws/buyback/v2/orders/{orderPublicId}/counter-offers`, while the pay-original branch resets Monday status to `IC OFF`.
- `Observed`: the helper library enforces a rolling `15%` counter-offer rate limit and logs decisions locally.
- `Inferred`: counter-offer handling is a partial automation island inside an otherwise manual returns/aftercare space.

### Slack Phone Enquiry -> telephone-inbound -> Intercom + Monday

- `Observed`: Slack `/call` intake is handled by `telephone-inbound` on port `8003`.
- `Observed`: the service captures customer/device/fault data in a modal, posts a Slack summary, and can create an Intercom lead and a Monday main-board item.
- `Observed`: operators can choose `log_only`, `intercom_only`, or `intercom_monday`, and log-only posts carry deferred action buttons.

### Shopify Native Integration -> Intercom Contact Attributes

- `Observed`: live Intercom contact data attributes include `shopify_*` fields whose descriptions state they are imported by Shopify integration.
- `Observed`: the fields cover customer identifiers, order counts, spend, last order, marketing consent, and address details.
- `Inferred`: Shopify customer profile sync into Intercom exists independently of the n8n order-creation flow.

### Monday Main Board -> n8n Xero Invoice Creator -> Xero Draft Invoice -> Monday Write-Back

- `Observed`: active n8n workflow `Xero Invoice Creator` receives webhook path `xero-invoice-create` from Monday main board `349212843`.
- `Observed`: the live Monday-side trigger currently evidenced is automation `537692848`, `Invoice Action -> Create Invoice -> webhook`.
- `Observed`: no separate live Monday `Send Invoice` trigger has been found in current board automation or column evidence.
- `Observed`: the workflow refreshes the Xero token, fetches Monday item data, validates invoiceability, resolves or creates a Xero contact, creates a draft invoice, then writes Xero invoice ID and URL back to Monday.
- `Observed`: local rules calculate invoice total as `formula74 - dup__of_quote_total - numeric_mkxx7j1t`, block totals `<= 0`, and exclude client types such as `Corporate Warranty`, `BM`, and `Refurb`.
- `Inferred`: Monday is the operational trigger and Xero is the accounting ledger target, but the current live automation stops at draft creation rather than a fully closed sent-and-paid loop.

### Payment Rails + Banking -> Xero Ledger And Cash-Basis Reporting

- `Observed`: live Xero organisation settings show `SalesTaxBasis=CASH` and `SalesTaxPeriod=QUARTERLY`.
- `Observed`: live Xero accounts and reports include named finance-state lines for `Cash Account`, `Starling Business Account`, `Stripe GBP`, `Stripe GBP 1`, `Accounts Receivable`, and revenue accounts `Backmarket` and `Shopify`.
- `Observed`: current-period Xero samples from `2025-01-01` onward include:
  - receivable invoices in `AUTHORISED`, `DRAFT`, `PAID`, `VOIDED`, and `DELETED` states
  - payable invoices mostly in `PAID`
  - payment rows tied to invoice numbers
  - authorised bank spend rows against suppliers/logistics/payment-rail contacts including `Stripe`, `Royal Mail`, and `Stuart Couriers`
- `Inferred`: Xero is already serving as the central accounting view for cash, receivables, supplier costs, and channel revenue, even though the exact import/feed ownership from each payment rail is still not fully mapped.
