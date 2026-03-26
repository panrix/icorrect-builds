# Transaction Flow Architecture — Agent 2

**Date:** 24 Mar 2026
**Author:** Code (Agent 2)
**Scope:** Payout, shipping confirmation, dispatch, sale detection

---

## Flow Overview

```
                    Monday Webhooks                    Cron / Manual
                         │                                  │
          ┌──────────────┼──────────────┐          ┌───────┴────────┐
          │              │              │          │                │
   status24→Pay-Out  status4→Shipped   (future)   BM API poll     Manual run
          │              │              │          state=1          │
          ▼              ▼              ▼          ▼                ▼
    ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
    │ bm-payout│  │bm-shipping│  │ 8010     │  │  sale-   │  │dispatch  │
    │ :8012    │  │ :8013     │  │ monolith │  │detection │  │  .js     │
    └────┬─────┘  └─────┬─────┘  └──────────┘  └────┬─────┘  └────┬─────┘
         │              │                            │             │
    BM buyback     BM sales API               BM sales API    RM label API
    PUT /validate  POST /orders/{id}          POST /orders/{id}  + Monday
         │              │                            │             │
    Monday status  Monday comment             Monday updates  Slack + Monday
    → Purchased    + move to Shipped          + Telegram        tracking
```

---

## 1. Payout (Port 8012) — SPLIT NOW

### Current state
Monolith handler at `/webhook/bm/payout` (index.js:1266). Triggered by Monday webhook when `status24` → index 12 (Pay-Out). Calls BM validate API, updates Monday to Purchased.

### Policy gaps in monolith
- **No iCloud lock check.** The monolith does not verify `color_mkyp4jjh`. A locked device could be paid out.
- **No counter-offer check.** If status24 was recently "Counteroffer", the webhook fires on the transition to Pay-Out — this is correct (counter-offer resolved), but should be logged.

### New service behavior
1. Receive Monday webhook (status24 → index 12)
2. Fetch item data: BM trade-in ID (`text_mky01vb4`), iCloud status (`color_mkyp4jjh`)
3. **HARD GATE:** No BM trade-in ID → alert, return
4. **HARD GATE:** iCloud locked/on → alert, return
5. Call `PUT /ws/buyback/v1/orders/{id}/validate` (empty body)
6. On success: update status24 → Purchased (index 6)
7. Notify Slack + Telegram

### Idempotency
- Monday webhook dedup: check if status24 is already Purchased before calling BM API
- BM API dedup: 4xx on already-validated order → log and skip, don't retry

### Cutover
1. Deploy `bm-payout` on `127.0.0.1:8012`
2. Verify: `curl -s -X POST http://127.0.0.1:8012/webhook/bm/payout -H 'Content-Type: application/json' -d '{}'`
3. Update nginx: change `/webhook/bm/payout` proxy from 8010 → 8012
4. `sudo nginx -t && sudo systemctl reload nginx`
5. Test: trigger a real Monday webhook, verify handler fires
6. Once verified, remove `/webhook/bm/payout` handler from monolith

---

## 2. Shipping Confirmation (Port 8013) — SPLIT NOW

### Current state
Monolith handler at `/webhook/bm/shipping-confirmed` (index.js:1114). Triggered by Monday webhook when `status4` → index 160 (Shipped). Fetches tracking, BM order ID, notifies BM.

### Policy gaps in monolith
- **No serial number sent.** Business rules require serial + tracking in BM notification.
- **No move to Shipped group.** BM Devices item stays in its current group after confirmation.

### New service behavior
1. Receive Monday webhook (status4 → index 160)
2. Dedup: check recent Monday updates for "BM notified"
3. Fetch from Main Board: tracking (`text53`), serial (`text4`), linked BM Device (`board_relation5`)
4. **HARD GATE:** No tracking → alert, return
5. **HARD GATE:** No serial → alert, return
6. **HARD GATE:** No linked BM Device → alert, return
7. Fetch BM order ID from BM Devices Board (`text_mkye7p1c`)
8. **HARD GATE:** No BM order ID → alert, return
9. `POST /ws/orders/{bmOrderId}` with tracking, serial, shipper
10. On success: Monday comment, Slack/Telegram notification
11. Move BM Devices item to Shipped group (`new_group269`)

### Idempotency
- Monday update dedup: "BM notified" string in recent updates
- BM API: 4xx on already-shipped → log, don't retry

### Cutover
1. Deploy `bm-shipping` on `127.0.0.1:8013`
2. Verify: `curl -s -X POST http://127.0.0.1:8013/webhook/bm/shipping-confirmed -H 'Content-Type: application/json' -d '{}'`
3. Update nginx: change `/webhook/bm/shipping-confirmed` proxy from 8010 → 8013
4. `sudo nginx -t && sudo systemctl reload nginx`
5. Test: trigger a real Monday webhook, verify handler fires and serial is sent
6. Once verified, remove `/webhook/bm/shipping-confirmed` handler from monolith

---

## 3. Dispatch — STAYS AS STANDALONE SCRIPT

### Current state
`/home/ricky/builds/royal-mail-automation/dispatch.js` — batch script, not a webhook. Fetches BM orders (state=3), matches to Monday, buys RM labels via Playwright, writes tracking, posts to Slack.

### Why no split needed
Dispatch is a manual/cron batch job, not a webhook handler. No port required. It doesn't live in the monolith.

### Policy gap
- **No status4 update.** After successful label purchase + tracking write, `status4` should move to "Return Booked" per business rules. Currently it does nothing to status4.

### Changes needed
- After writing tracking to Monday (step 5), update `status4` to "Return Booked" for each order
- This is an additive change to the existing script

### Idempotency
- Already checks for existing tracking number before buying labels (line 229)
- status4 update should check current value before changing

---

## 4. Sale Detection — STAYS AS CRON POLLER

### Current state
`/home/ricky/builds/backmarket/scripts/sale-detection.js` — polls BM API for state=1 orders, matches to BM Devices Board, accepts, updates Monday.

### Why no split needed
Cron-driven poller, not a webhook. No Monday webhook trigger. Runs on schedule.

### Policy compliance
- Auto-accept on perfect match: ✅ implemented
- Stock verification (text4 empty, not in returns group): ✅ implemented
- SKU cross-check order vs Monday: ✅ implemented
- Multi-unit handling: ✅ implemented
- Double checkout detection: ✅ implemented

### Idempotency
- Checks `text4` (Sold to) before assigning — already sold items are skipped ✅
- Checks `text_mkye7p1c` (existing order ID) before processing ✅

### Minor issue
- Output path references `bm-scripts/test-output` (line 338) — should be `backmarket/data/` or removed
- Otherwise policy-correct as written

---

## Blockers & Risks

### Blocker: Serial number availability
The brief states shipping confirmation must include serial. Serial lives in `text4` on the Main Board and is populated at intake (iCloud check SOP). The shipping service must hard-gate on missing serial and must not notify BM without both serial and tracking.

### Risk: Monolith handler removal timing
After cutover, the monolith still has the old handlers. If nginx is reverted to 8010 (rollback), the old handlers would fire again. Remove monolith handlers once the new services are verified working with real webhooks.

### Risk: Slack vs Telegram notification channel
The monolith uses Slack (`DISPATCH_SLACK_CHANNEL`). The standalone scripts use Telegram (`BM_TELEGRAM_CHAT`). The new services send to both during transition. Target is Telegram-only once confirmed working.

---

## Summary

| Flow | Current | Target | Port | Split? |
|------|---------|--------|------|--------|
| Payout | Monolith (8010) | Standalone service | 8012 | Yes — missing safety checks |
| Shipping | Monolith (8010) | Standalone service | 8013 | Yes — serial + group move |
| Dispatch | Standalone script | Standalone script | N/A | No — batch job, not webhook |
| Sale Detection | Standalone script | Standalone script | N/A | No — cron poller |
