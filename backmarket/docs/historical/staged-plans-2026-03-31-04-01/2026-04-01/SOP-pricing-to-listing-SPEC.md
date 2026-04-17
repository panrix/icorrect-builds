# SOP-pricing-to-listing — Master Pricing & Listing Flow

**Last Updated:** 2026-03-08
**Replaces:** SOP-pricing.md, SOP-listing.md (both now deprecated — this is the single source of truth)
**Scope:** End-to-end process for listing a device on Back Market — from "To List" status on the BM board to a live, priced listing with confirmed Monday updates.
**Intended for:** Backmarket agent + bm-listings sub-agent

---

## AUTOMATION RULES (updated 2026-03-08)

Auto-listing is enabled **only when net profit is properly calculated from real data**:
- ✅ Purchase price from Monday BM board (`numeric`)
- ✅ Parts cost from Main board (`lookup_mkx1xzd7` mirror)
- ✅ Labour cost from Main board (`formula_mkx1bjqr`)
- ✅ Live market price scrape (same-day, ClawPod)

If **any** of these are missing or estimated → **flag to Ricky, do not auto-list.**

### Guardrails (when full data is available):
| Net Margin | Net Profit | Action |
|---|---|---|
| ≥ 30% | ≥ £100 | ✅ Auto-list |
| 15–30% | any | ⚠️ Flag to Ricky |
| < 15% | any | 🚫 Hard block — do not list |

Net profit = (sale × 0.90) − purchase − parts − labour − shipping(£15)
Net margin = net profit ÷ (sale × 0.90) × 100

### Group management:
- On session start, check main board "BMs Awaiting Sale" group for devices with `status24 = "To List"`
- Ensure all such items are in the "BM To List / Listed / Sold" group on the BM Devices board (move from "BM Trade-Ins" if needed)

---

---

## Trigger

A device on the BM Devices board (3892194968) shows `mirror3__1 = "To List"`.

## Assumptions

- The device has been fully repaired and QC'd by the team. **Do not check iCloud status, repair completion, or condition columns.** The team owns pre-listing checks. You own listing.
- Valid grades are **Fair, Good, Excellent** only. No others exist.
- All specs (chip, RAM, storage, colour, grade) are confirmed on the BM board and are correct.

---

## STAGE 1 — Pull Device Data & Create SKU

### Step 1 — Query the BM Devices board (3892194968)

Pull the following columns for the device item:

| Data | Column ID | Column Type |
|------|-----------|-------------|
| Model | `lookup` | mirror |
| Colour | `mirror` | mirror |
| Storage | `color2` | status |
| RAM | `status__1` | status |
| CPU cores | `status7__1` | status |
| GPU cores | `status8__1` | status |
| Grade | `mirror_Mjj4H2hl` | mirror |
| Purchase Price (ex VAT) | `numeric` | numbers |
| Main Board item ID | `board_relation` | board_relation → `linked_item_ids[0]` |

> ⚠️ Mirror columns return `null` for `text`. Always use `... on MirrorValue { display_value }` fragment.

### Step 2 — Construct the SKU

Format: `{Type}.{Model}.{Chip}.{GPU?}.{RAM}.{Storage}.{Colour}.{Grade}`

Rules:
- **Type:** `MBA` = MacBook Air, `MBP` = MacBook Pro
- **Chip:** M1, M2, M3, M1PRO, M2PRO, M3PRO, i3, i5, i7, i9
- **GPU cores:** Include ONLY when multiple GPU variants exist for the same model (e.g. MBA M1 A2337 has 7-core and 8-core GPU → include `7C` or `8C`). Omit for MBP M1/M2 A2338 (fixed GPU).
- **Storage:** Use `1TB` not `1000GB`, `2TB` not `2000GB`
- **Colour:** `Grey`, `Silver`, `Gold`, `Midnight`, `Starlight`, `Black`
- **Grade:** `Fair`, `Good`, `Excellent`

Examples:
- `MBP.A2338.M1.8GB.256GB.Grey.Fair`
- `MBA.A2337.M1.7C.8GB.256GB.Grey.Fair` ← 7-core GPU included
- `MBA.A2337.M1.8C.8GB.512GB.Grey.Good` ← 8-core GPU included
- `MBP.A2485.M1PRO.10C.16C.16GB.512GB.Grey.Good`

### Step 3 — Write reference SKU to BM Devices board (Monday only)

This SKU is for **internal Monday reference only**. It is NOT necessarily what goes on the BM listing — see Stage 2 / Stage 5 for how the actual listing SKU is determined.

```graphql
mutation {
  change_column_value(
    board_id: 3892194968,
    item_id: BM_ITEM_ID,
    column_id: "text89",
    value: "\"MBP.A2338.M1.8GB.256GB.Grey.Fair\""
  ) { id }
}
```

> Note: `value` must be double JSON-encoded. Use `json.dumps(json.dumps(sku))` in Python — single encode will be rejected by Monday API.

✅ Stage 1 complete when SKU is written to `text89`.

---

## STAGE 2 — Find the Listing Slot

Goal: identify the correct BM listing_id to activate (Path A) or confirm a new listing is needed (Path B).

### Step 1 — Get the product_id

The `product_id` is BM's catalogue identifier. It encodes **model + chip + RAM + storage + colour**. Colour is critical — wrong product_id = wrong colour shown to buyers = return.

**Check REF.md first** (`docs/SOPs/REF.md > BM Product ID Reference`).

- If the exact spec + colour is in the table → use that `product_id`. Go to Step 2.
- If not in REF.md → run NUXT scrape (Step 1b below) to find it.

#### Step 1b — NUXT scrape to find product_id (only if not in REF.md)

```bash
python3 scripts/scrape_bm_product.py \
  "https://www.backmarket.co.uk/en-gb/p/{any-slug-for-this-model}/{any-known-uuid-for-this-model}"
```

From the scrape output, read the `colours` array. Match the device's physical colour to the correct entry. Use that `product_id`.

- If device colour is `available: false` or `product_id` is empty → **STOP. Flag to Ricky. Do not list.**
- After confirming → add the new mapping to `REF.md > BM Product ID Reference`.
- For a genuinely new spec+colour combination never listed before → **confirm the product_id with Ricky before using**.

### Step 2 — Search for an existing listing slot

Paginate **ALL** listings (we have 823+):

```bash
GET /ws/listings?limit=100                   # page 1
GET /ws/listings?limit=100&cursor={cursor}   # repeat until no 'next'
```

Filter client-side:
```python
matches = [l for l in all_listings
           if l['product_id'] == target_product_id
           and l['grade'] == target_grade]
```

**Check qty on matches:**
- If any match has `quantity > 0` → an active listing already exists. **Bump qty on that listing** (see Appendix SOP-L2). Do not activate a second slot.
- If all matches have `quantity == 0` → select the one with the **highest listing_id** (most recently created). This is your Path A slot.
- If no matches at all → **Path B**.

### Path A — Existing slot found (qty = 0)
Record the `listing_id` **and the existing `sku` field from the BM listing**. The existing SKU is what goes live — do not overwrite it with your constructed SKU. Proceed to Stage 3.

### Path B — No existing slot
Record the `backmarket_id` (integer product catalogue ID) from any listing of the same model + colour (any grade) — this is needed for CSV creation at Stage 5.

> ⚠️ Before resorting to Path B, search ALL pages by `product_id` (not just SKU text). The correct Fair/Good slot frequently exists under an old SKU naming format and will be missed by text matching.

> ✅ Path B API creation works. Use `POST /ws/listings` with JSON body. Grade must be text (`FAIR`, `GOOD`, `VERY_GOOD`), NOT numeric (3/2/1). Numeric grades were the original cause of the "broken" diagnosis (2026-02-28). Confirmed working 2026-03-18.

Proceed to Stage 3.

---

## STAGE 3 — Pricing Research

**All 5 steps are mandatory. Live market data is required — never propose on cached data from a previous day.**

### Step 1 — Pull costs from Monday (3 queries)

**Query 1 — BM Board:** Already have `numeric` (Purchase Price) and `board_relation` (Main Board item ID) from Stage 1.

**Query 2 — Main Board (labour hours):**
```graphql
{ items(ids: [MAIN_ITEM_ID]) {
  column_values(ids: ["formula__1", "connect_boards__1"]) {
    id
    ... on FormulaValue { display_value }
    ... on BoardRelationValue { linked_item_ids }
  }
} }
```
- `formula__1` = Total RR&D hours (decimal, e.g. `2.796`)
- `connect_boards__1` → linked part item IDs on parts board

**Query 3 — Parts Board (985177480):**
```graphql
{ items(ids: [PART_ITEM_IDS]) {
  id name
  column_values(ids: ["supply_price"]) {
    ... on NumbersValue { number }
  }
} }
```
- `supply_price` = cost per part (ex VAT)
- Sum all parts for this device

**Fixed cost calculation:**
```
purchase_price = numeric (Query 1)
parts_cost     = sum of supply_price values (Query 3)
labour_cost    = formula__1 hours × £24/hr
shipping       = £15 (flat, always)
────────────────────────────────────
fixed_costs    = purchase_price + parts_cost + labour_cost + shipping
```

> ⚠️ **Do NOT use `formula_mm0za8kh`** (BM board total cost formula) — this column returns null and is unreliable. Always use the 3-query method above.

### Step 2 — Live market scrape (today only)

```bash
python3 scripts/scrape_bm_product.py \
  "https://www.backmarket.co.uk/en-gb/p/{model-slug}/{product_id}" \
  --output data/price-scrapes
```

Same-day cache is valid (check `data/price-scrapes/` for today's date prefix). Previous-day cache is **not valid** — re-scrape.

Extract from the result:
- Grade prices: Fair, Good, Excellent at the **device's storage tier**
- All storage tier prices (at the device's grade)
- Colour picker prices

> If the scrape fails (Cloudflare block): retry with `--delay 8`. If still failing, note the failure explicitly in the proposal and use the most recent available cache with its date clearly stated.

### Step 3 — Adjacent spec check

From the storage picker in the scrape:
- Note the price at one tier below and one tier above the device's storage.
- **Flag if gap between adjacent tiers is < £20** — too tight to differentiate.
- **Flag any anomaly** where a smaller storage tier is priced higher than a larger one.

### Step 4 — Grade ladder check

From the grade picker in the scrape at the device's storage tier:
- Confirm Fair < Good < Excellent.
- **Flag any anomaly** (e.g. Fair and Good within £10 of each other — buyers will upgrade to Good).
- **Rule:** Never price a lower grade at or above a higher grade on the same spec.

### Step 5 — Historical sales

Query the BM orders API for completed orders:

```bash
GET /ws/orders?state=9&limit=100   # paginate all pages
```

**Filter by listing_id, not SKU text.** SKU naming conventions are inconsistent across our historical listings. Use the listing_ids collected in Stage 2 (all slots matching product_id + grade) as the filter set.

For each order, check `orderlines[].listing_id` (numeric). If it matches any of the target listing_ids, record `orderlines[].price` (string, convert to float).

Report:
- Number of matching sales (n)
- Average sale price
- Low and high

If no exact spec match: report closest available (same model, same grade, adjacent storage or grade) as context. Clearly label what you're comparing.

**Red flag:** If our average historical sale price is significantly above current market → market has moved down. Do not anchor to old prices.

### Step 6 — Calculate proposed price

**Break-even:**
```
break_even = (fixed_costs - purchase_price × 0.1667) / 0.7333
```

**At proposed price:**
```
bm_fee     = proposed × 0.10
tax        = (proposed - purchase_price) × 0.1667
net_profit = proposed - fixed_costs - bm_fee - tax
margin_pct = (net_profit / proposed) × 100
```

**Min price rule — 3% floor:**
```
min_price = ceil(proposed × 0.97)
```
> BM's dynamic pricing will typically sell at the min price. Keep the floor tight (3%) so we don't inadvertently discount away margin. Historically, most devices sell at min price — treat it as the effective sale price.

**Always calculate P&L at min_price (worst case), not at listing price.**

**Hard rules before proposing:**
- Net profit < £0 at min_price (loss): **do NOT propose**. Flag to Ricky with break-even price.
- Margin < 15% at min_price: **do NOT propose**. Flag to Ricky with explanation.
- Net profit < £100 at min_price: propose with explicit ⚠️ warning — below target.
- Proposed price above current market: always flag and explain why.

**Auto-list thresholds (checked at min_price):**
- Net margin ≥ 30% AND net profit ≥ £100 → AUTO-LIST (no approval needed)
- Net margin 15–30% → PROPOSE to Ricky
- Net margin < 15% → BLOCK

Target: **£100 net profit minimum** per device at min_price.

---

## STAGE 4 — Propose to Ricky

Present one code block per device using the grid format below. All data on short lines — no wrapping.

````
BM [#]   [Device] [Config] [Grade] [Colour]
Market   F:£X  G:£X  E:£X
Adj      [spec below]:£X  [spec above]:£X
Sales    [avg £X (£low–£high) n=X] or [no data]
Costs    Purchase £X | Parts £X | Labour £X (Xh) | Ship £15
Fixed    £X  |  B/E £X
Prop     £X  |  Min £X (3%)
Net@min  £X [⚠️ if <£100]  |  Margin X% [⚠️ if <15%]
Note     [flags — anomalies, above-market price, etc.]
Rationale [one sentence]
Status   ✅ AUTO-LISTED / ⚠️ AWAITING APPROVAL / ⛔ BLOCKED
````

**⛔ STOP HERE. Wait for explicit approval from Ricky before Stage 5.**

Ricky's approval must be clear (e.g. "approved", "go ahead", "yes"). A question or comment is not approval.

---

## STAGE 5 — Apply (after approval only)

### Path A — Reactivate existing listing

> **SKU rule:** Use the **existing SKU from the BM listing** (captured in Stage 2) — do NOT overwrite with your constructed SKU. The existing SKU has proven history and avoids format drift. Only supply your constructed SKU on Path B (new listing creation).

```bash
POST https://www.backmarket.co.uk/ws/listings/{listing_id}
Headers:
  Authorization: {BACKMARKET_API_AUTH}      ← required
  Accept-Language: en-gb                    ← required (GBP context)
  User-Agent: {BACKMARKET_API_UA}           ← required
  Content-Type: application/json

Body:
{
  "quantity": 1,
  "price": X.00,
  "min_price": Y.00,
  "sku": "{existing_sku_from_bm_listing}",   ← use BM's existing SKU, not our constructed one
  "pub_state": 2,
  "currency": "GBP"
}
```

> ⚠️ `pub_state: 2` is **mandatory** — omitting it leaves the listing at pub=3 (offline). BM does not auto-publish on qty update.
> ⚠️ Always POST. PATCH returns 405.
> ⚠️ Always include all 3 headers. Missing `Accept-Language: en-gb` → API returns EUR prices and wrong pub_state.

### Path B — Create new listing

> ✅ Path B API creation works. Grade must be text (`FAIR`, `GOOD`, `VERY_GOOD`), NOT numeric. See Stage 2 Path B note.

To create via API:
```
POST /ws/listings
Body (multipart/form-data):
  catalog = {backmarket_id}
  quotechar = "
  delimiter = ;
  encoding = UTF-8
  file = CSV (CRLF line endings):
    sku;product_id;price;min_price;quantity;warranty_delay;comment;grade;currency
    {SKU};{UUID};{price};{min_price};1;12;"Fully tested. 12 month warranty.";{GRADE};GBP
```
State values in CSV: `3` = Fair, `2` = Good, `1` = Excellent
Poll `GET /ws/tasks/{task_id}` to confirm listing creation and retrieve listing_id.

### Post-listing steps (mandatory for both paths)

All 4 steps are required. Do not skip any.

**Step A — Verify listing is live:**
```bash
GET /ws/listings/{listing_id}
```
Confirm: `pub_state = 2`, `quantity = 1`, price and min_price are correct.

**Step B — Write listing_id to BM Devices board:**
```graphql
mutation {
  change_column_value(
    board_id: 3892194968,
    item_id: BM_ITEM_ID,
    column_id: "text_mkyd4bx3",
    value: "\"listing_id_here\""
  ) { id }
}
```
> Note: `text_mkyd4bx3` stores the numeric listing_id (not a UUID). This is what Flow 6 reads.

**Step C — Update status to "Listed" on Main Board (349212843):**
```graphql
mutation {
  change_column_value(
    board_id: 349212843,
    item_id: MAIN_BOARD_ITEM_ID,
    column_id: "status24",
    value: "{\"index\": 7}"
  ) { id }
}
```
- Index 7 = Listed
- Index 8 = To List
- Index 10 = Sold
- Index 104 = Unlisted

Get `MAIN_BOARD_ITEM_ID` from: `board_relation` column on BM Devices board → `linked_item_ids[0]` (pulled in Stage 1).

> ⚠️ This updates the `mirror3__1` "Status" column on the BM board — it mirrors from the Main Board. You cannot write directly to mirror columns.

**Step D — Write listing_id to Main Board:**
```graphql
mutation {
  change_column_value(
    board_id: 349212843,
    item_id: MAIN_BOARD_ITEM_ID,
    column_id: "text_mkydhq9n",
    value: "\"listing_id_here\""
  ) { id }
}
```

✅ Stage 5 complete when all 4 steps are confirmed.

---

## APPENDIX A — Listing Qty Management (SOP-L2)

Listing qty must always equal the number of available (unsold, unassigned) physical units for this spec.

| Situation | Action |
|-----------|--------|
| New unit ready, existing active listing (qty > 0) | `POST /ws/listings/{lid}` → `{"quantity": N+1, "pub_state": 2, "currency": "GBP"}` |
| Unit sold | BM auto-decrements. Verify after each sale. |
| All units sold | Force `qty = 0` immediately |
| Unit returned / sale cancelled | `POST /ws/listings/{lid}` → `{"quantity": N+1, "pub_state": 2}` |
| Phantom qty (qty > 0, no physical unit) | Set to 0 immediately — oversell risk |

---

## APPENDIX B — Weekly Listing Health Check (SOP-L3)

Run weekly for all active listings (pub_state = 2, qty > 0).

For each active listing:
1. Check BackBox: `GET /ws/backbox/v1/competitors/{listing_id}` — is `is_winning: true`?
2. If not winning: note `price_to_win` and gap from current price
3. Check grade ladder integrity (Fair < Good < Excellent still holds)
4. Check qty matches available physical units in Monday
5. Check min_price rule: `listing_price × 0.92 ≤ min_price` (i.e. min is within 8% of listing)

Report all non-winning listings to Ricky with recommended adjustments. Wait for approval before changing prices.

---

## PRICE AUDIT SOP (periodic review of live listings)

Run when asked for a pricing audit or when sales are slow. Covers all 16+ live listings.

### Data to pull per listing
1. **BM API** — current price, min_price, quantity, pub_state, product_id, UUID
2. **Market scrape** — today's grade ladder via `scripts/scrape_bm_product.py` (ClawPod, cache same-day)
3. **Monday costs** — purchase price + parts + labour + shipping → reconstruct net profit
4. **Date listed** — check Monday BM board for date listed (not BM API — date_creation always empty)

### Audit columns (output per listing)
```
[Listing ID] BM# | SKU | Listed: YYYY-MM-DD (N days) | Ours: £X / min £Y
  Market: Fair £? / Good £? / Excellent £?
  Net @ current price: £N (M%)
  Gap to market: ±£Z | Buy box: winning / not winning
  Grade inversion: YES/NO
  Action: HOLD / DROP / URGENT
```

### Flags & thresholds
| Flag | Condition | Action |
|------|-----------|--------|
| ⛔ GRADE INVERSION | Our grade costs MORE than a better grade | Act immediately — listing won't convert |
| ⛔ ABOVE MARKET | Our price > market by >£20 | Drop to market or flag to Ricky |
| ⚠️ STALE + ABOVE MARKET | Listed >14 days AND above market | Aggressive drop recommended |
| ⚠️ LOW MARGIN | Net profit < £100 at proposed drop price | Flag before actioning |
| 🚫 CANNOT DROP | Drop to market = loss | Hold, consider delisting at 21+ days |
| ✅ HOLD | At/below market, sole seller, or <7 days old | No action |

### Age-based escalation
- **0–7 days**: monitor only unless grade inversion
- **8–14 days**: flag if above market by >£15
- **15–21 days**: drop to market if profitable, flag if not
- **21+ days**: consider delisting if cannot price competitively

### Net profit in audit context
- Calculate at BOTH current price AND proposed drop price
- If drop makes net < £100 → flag with ⚠️, let Ricky decide
- If drop makes net < £0 → CANNOT DROP, show break-even price instead
- Net formula: `(price × 0.90) − purchase − parts − labour − £15 shipping`

### Minimum price rules (CRITICAL)
Two constraints must BOTH be satisfied:
1. **BM platform rule**: min ≥ ceil(price × 0.92) — enforced by BM, POST will reject otherwise
2. **Profit floor**: min must produce net profit ≥ £0 (break-even). Formula: min ≥ ceil(cost / 0.90)
   - Ideally min ≥ ceil((cost + 100) / 0.90) for £100 net at minimum price
   - If the 8% BM cap prevents this, raise the listing price until the min can cover costs

Set min = max(ceil(price × 0.92), ceil(cost / 0.90)) — whichever is higher.
Never set min using only the BM 8% rule — that ignores profitability entirely.

### Update safety checklist (mandatory before any price change)
1. **Verify SKU via GET** before every POST: `GET /ws/listings/{uuid}` → check `sku` field matches expected
2. If SKU doesn't match → STOP, do not update, flag the mismatch
3. Calculate net profit at BOTH new price AND new min before submitting
4. If net at min < £0 → do not update, raise price first or flag to Ricky
5. Note: BackBox/auto-repricing can override prices — always verify current state after updating

### Practical note on costs
BM board `formula_mm0za8kh` (Total Costs) returns null — mirrors not resolvable via API.
Reconstruct from Monday main board columns or use known values from session memory.
If costs unavailable for a device → flag as "cost unknown, cannot assess net" and ask Ricky.

---

## API Quick Reference

```bash
# All BM API calls require all 3 headers:
source /home/ricky/config/api-keys/.env
curl -s "$BACKMARKET_API_BASE/ws/..." \
  -H "Authorization: $BACKMARKET_API_AUTH" \
  -H "Accept-Language: $BACKMARKET_API_LANG" \
  -H "User-Agent: $BACKMARKET_API_UA"
```

| pub_state | Meaning |
|-----------|---------|
| 2 | LIVE (visible to buyers) |
| 3 | Delisted / offline |

---

## Critical Rules

- **NEVER create a new BM board item** — the trade-in item already exists. Always update the existing item.
- **Colour is in the product_id** — wrong product_id = wrong colour shown = return. Always verify via REF.md or scrape colours array.
- **SKU on activation: use BM's existing SKU (Path A), not our constructed one.** Our constructed SKU goes to Monday `text89` for internal reference only. Only use our constructed SKU when creating a brand new listing (Path B).
- **Stage 4 is a hard gate — no exceptions.** Ricky's approval must be explicit: "go ahead", "approved", "yes", or equivalent. Context, preference, or cost acceptance ("we have to take the hit") is NOT approval. Do not proceed to Stage 5 without a clear go-ahead.
- **pub_state: 2 must be explicit** on every activation POST — BM will not auto-publish.
- **PATCH returns 405** — always POST to update listings.
- **All 4 post-listing steps are mandatory** — missing Step C leaves Monday showing "To List" permanently.
- **Monday text columns require double JSON encoding** — use `json.dumps(json.dumps(value))` not single encode.

---

## References

- `docs/SOPs/REF.md` — product_id mappings, order states, column IDs
- `docs/historical/listings-research.md` — historical existing listing pool by spec
- `scripts/scrape_bm_product.py` — ClawPod product page scraper
- `data/price-scrapes/` — cached scrapes (same-day valid only)
