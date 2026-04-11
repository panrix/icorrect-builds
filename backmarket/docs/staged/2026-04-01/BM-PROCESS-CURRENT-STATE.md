# BM Process: Current State (as told by Ricky, 2026-03-17)

This is the ground truth. Not what docs say. Not what the audit found. What actually happens and what should happen.

---

## Stage 1: Order Comes In (SENT)

**Current:** Poll for SENT orders → Slack notification fires.
**Problem:** Nobody on the team looks at the Slack notifications. Team has zero visibility on what's arriving each day.

**What's needed:** Morning briefing script that:
1. Checks Royal Mail tracking for all expected devices
2. Identifies which are at local delivery office (arriving today)
3. Posts to Slack/Monday: "3 expected today" with order number → BM number mapping
4. Team is briefed before devices arrive

---

## Stage 2: Device Arrives

**Current:**
1. Roni manually matches name on Royal Mail label to BM number
2. Enters serial number into Monday
3. Serial entry triggers: iCloud check + spec check + model check + colour check (Apple)
4. Results written back to Monday
5. If iCloud locked → auto-suspends on BM, writes update, notifies BackMarket ✅
6. Auto iCloud recheck when customer replies (Slack notification with recheck/message buttons) ✅
7. No more auto model changes on mismatch. Flags it, doesn't change anything ✅

**What's needed:** Pre-match the devices for Roni. Morning briefing from Stage 1 pairs order number → BM number, so Roni just matches label to list. No manual lookup needed.

---

## Stage 3: Diagnostic & Payout

**Current:** Team does diagnostic, changes status to "Pay-Out". Payout is manual (disabled).
**Fallback:** `buyback_payout_watch.py` (deadline safety net only).

**What should happen:**
1. Team changes status to "Pay-Out"
2. Script fires INSTANTLY: pays out via BM API
3. Changes column to "Purchased" so team sees it's done
4. No delay. Previous "delay to save cash cycle" strategy missed deadlines. Back to instant.

**Why it was disabled:** Adil couldn't differentiate models + auto model changer was causing issues. Both problems are gone now.

### Counter-Offer Module (new build)

**Trigger:** Spec check at intake detects model mismatch (older, not newer).

**Logic:**
- If received spec is BETTER (newer model, more RAM, more storage) → we win. Pay out at original price. No action.
- If received spec is WORSE (older model, less RAM, less storage, different chip):
  1. Calculate value difference: look up our historical BM listings for the actual spec received + query buyback API for current bid price
  2. If difference ≤ £20 → absorb. Pay out at original price.
  3. If difference > £20 → generate counter-offer
  4. Drop Slack message: "Spec mismatch. Expected [spec], received [spec]. Value diff £X. Counter-offer £Z. Approve/adjust?"
  5. On approval → execute counter-offer automatically via API with photos
  6. Must stay under **15%** counter-offer rate (updated from 18%)
- **Covers ALL mismatches:** model (M1 vs Intel), chip (M1 vs M2), RAM (8GB vs 16GB), storage (256GB vs 512GB), not just model swaps.

**Early flagging:** If spec check detects older model at intake:
- Immediately flag to Roni: "this one's a counter-offer candidate"
- Change status so he knows before diagnostic
- When he clicks "diagnostic complete", counter-offer is ready to go

**Future:** Diagnostic assistance system for NFU devices. Help engineers beyond Saf do initial triage to determine difficulty. Prevent everything queuing for Saf. Separate build but related.

---

## Stage 4-5: QC Pass → Listing

**Current:** QC signs off → status changes to "To List" → moves to listed group on Monday Main Board. Hugo then does the entire listing process manually with raw API calls.

**What should happen (two paths):**

### Path A: Top 20 SKU (already have one listed)
Device matches an existing active listing (same model, spec, grade, colour).
1. Confirm match (product_id + colour + grade)
2. Bump quantity +1 on existing listing
3. Write listing ID to Monday
4. Update status to "Listed"
5. **Fully automatic. No pricing decision needed.**

### Path B: Reactivating an offline listing
No active listing for this exact device.
1. Find the correct listing slot (product_id + grade + colour match). **Colour is a hard gate.**
2. Query BackBox for current buy box price at this spec+grade
3. Check grade ladder: price of grade below and grade above
4. Check adjacent specs: storage tier above and below
5. Run profitability calculation against our costs (purchase + parts + labour £24/hr + shipping £15)
6. Minimum thresholds: **≥30% net margin OR ≥£100 net profit**
7. If passes → list. If not → flag to Ricky.
8. Write listing ID to Monday, update status to "Listed"

### Product ID vs UUID confusion
- We LIST using product_id (identifies model + spec + colour in BM's catalogue)
- When we QUERY the API for our listings, it returns a UUID (the listing's unique identifier)
- BM board now stores both IDs so we can query either way
- Needs to be properly documented so Hugo doesn't confuse them

### Daily listing reconciliation
- Match: Monday "Listed" count vs BM active listing quantities
- If 20 devices in Monday = Listed, do 20 match what's live on BM?
- Flag mismatches immediately

### Daily profitability check
- For all live listings: are we still profitable at current market prices?
- If a SKU was previously signed off as unprofitable → log that decision so we stop re-asking
- Flag any listing where we've lost the buy box

### New Monday columns needed
- **Average list-to-sale days** (by model+spec, calculated from historical data)
- **Buy box status** (yes/no, auto-updating)
- If we lose buy box → query: should we drop price? How much profit do we lose? Worth it to move stock?

### Age-based escalation
- Device listed longer than expected list-to-sale average → investigate
- Is it the price? The buy box? The grade?

---

## Stage 6: Device Sells

**Current:** Flow 6 matches sale to Monday item. Fragile UUID matching.

**What should happen:** Simple, one sale at a time. Match sale → update Monday → done. Should never need manual matching if Stages 4-5 were done correctly (correct listing ID in Monday, correct colour, correct device).

**No manual matching should ever be needed.**

---

## Stage 7: Labels & Dispatch

**What should happen:**
1. Morning: run `labels.js` (or equivalent)
2. Buys Royal Mail labels for all pending shipments
3. Grabs packing slips from BackMarket
4. Posts labels + slips to Slack
5. **Does NOT notify BackMarket of shipment.** Just buys labels. That's it.

---

## Stage 8: Actual Shipping

**What should happen:**
1. Team physically ships the device
2. Team changes status to "Shipped" in Monday
3. Monday status change triggers webhook/script
4. Script sends tracking number + serial to BM API → marks as shipped
5. **Only fires when team confirms physical shipment, not when labels are bought**

---

## Stage 9: After-Sales / Returns

**Problem:** No API endpoint for customer messages. BM changed their process: used to ask customers for photos/details on returns, now their AI just auto-approves returns with no info. Device arrives back with no context.

**What's needed:**
- A cheap browser-based agent that logs into BM seller portal
- Login method: BM sends code to email, agent pulls code via IMAP from Jarvis iCorrect inbox
- Agent can read customer messages, return requests, and reasons
- When a return is incoming: flag to team with reason, so they know what's coming BEFORE it arrives
- Agent can ask follow-up questions to customer through BM portal
- Agent can action return steps as instructed

**This is a separate build** but important. Currently returns arrive with zero context and 2-day processing window.

---

## Summary: What Needs Building

| # | What | Type | Priority |
|---|------|------|----------|
| 1 | Morning delivery briefing (Royal Mail tracking → expected arrivals) | Script + cron | High |
| 2 | Instant payout on "Pay-Out" status change | Script (re-enable) | High |
| 3 | Counter-offer module (mismatch detection → Slack approval → API execution) | Script | High |
| 4 | Listing automation Path A (top 20 SKU, qty bump) | Script | Critical |
| 5 | Listing automation Path B (offline reactivation with pricing) | Script | Critical |
| 6 | Product ID / UUID documentation | Doc | Medium |
| 7 | Daily listing reconciliation (Monday vs BM) | Script + cron | High |
| 8 | Daily profitability check (all live listings) | Script + cron | High |
| 9 | Split dispatch.js: labels only, no BM shipping notification | Code fix | Critical |
| 10 | Shipping confirmation on Monday status change → BM API | Script/webhook | Critical |
| 11 | New Monday columns: avg list-to-sale days, buy box status | Monday config | Medium |
| 12 | BM seller portal browser agent for returns/customer messages | Agent build | Medium |
| 13 | Signed-off unprofitable SKU log (stop re-asking) | Doc/data | Low |
| 14 | Early counter-offer flagging at intake | Script enhancement | Medium |
| 15 | Intake profitability prediction (grade prediction → sell price → parts → labour → profit %) | Script | High |
| 16 | NFU maximum investment cap (flag before board repair exceeds threshold) | Script enhancement | High |

---

---

## Answers to Follow-Up Questions (verified)

**Q1: Serial → spec check trigger:**
- Service: `/home/ricky/builds/icloud-checker/src/index.js` running on port 8010 as systemd user service `icloud-checker.service`
- Trigger: Monday webhook fires when `text4` (serial column) changes on Main Board (349212843)
- Only processes items where `clientType = "BM"`
- Runs: SickW API (iCloud check) + Apple Self Service Repair (spec check via `apple-specs.js`)
- Writes back to Monday: iCloud status (IC ON/IC OFF), colour (main board), spec comparison against BM board
- If spec mismatch → posts "🔴 SPEC MISMATCH" to Monday comment + Slack alert
- If iCloud ON → auto-suspends on BM, sends customer message, moves to locked group
- Updates colour on main board column `status8`

**Q2: Auto iCloud recheck:**
- Same service (`index.js` on port 8010), route: `/webhook/icloud-check/slack-interact`
- When customer replies to BM suspended order, BM sends notification
- If reply contains recheck keywords (removed, unlocked, done, etc.) → auto-rechecks via SickW
- Slack notification has buttons: recheck manually, message customer
- Route `/webhook/icloud-check/recheck` handles manual recheck requests
- If unlocked → moves to Today's Repairs group, notifies customer via BM API
- NOT n8n Flow 3. This is fully VPS-based.

**Q3: Monday columns:**
- `text_mkyd4bx3` = listing ID (numeric)
- `text_mm1dt53s` = UUID
- BM board stores both so we can query either way

**Q4: Royal Mail tracking API:**
- **PARKED.** RM Tracking API requires full Royal Mail account onboarding. Not worth it; long-term move to DHL.
- Morning briefing will estimate arrivals based on BM order data: shipping service type + drop-off date.
- Tracked 48 = ~2-3 days from acceptance. Tracked Returns = similar.
- Credentials saved in env file but API subscription not activated. Remove when DHL transition happens.

**Q5: BM seller portal email:**
- `jarvis@icorrect.co.uk` — already set up

**Q6: "Top 20 SKUs":**
- Not a fixed list. Means any SKU where we currently have an active listing (qty > 0). If device matches an active listing, just bump qty.

**Q7: Counter-offer rate threshold:**
- 15% rolling (updated from 18%)

---

*Source: Ricky voice notes + VPS code audit, 2026-03-17*
