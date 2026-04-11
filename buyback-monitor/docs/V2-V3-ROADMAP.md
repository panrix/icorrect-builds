# Buy Box Monitor: V2 & V3 Roadmap

**Author:** Jarvis | **Date:** 14 March 2026 | **Status:** Draft spec for implementation planning

## Context

V1 of the Buy Box Monitor runs daily at 05:00 UTC. It scans ~2,600 buyback listings, checks competitor positioning via the BM API, calculates profit using a simplified model, and auto-bumps losing listings where winning is profitable. It works, but the profit calculations are coarse and the system has no memory: it doesn't learn from its own actions.

### V1 Weaknesses (Why This Roadmap Exists)

| # | Problem | Impact |
|---|---------|--------|
| 1 | **Sell prices use one average per Apple model number.** A2681 covers both MBA13 M2 8GB/256GB and MBA13 M3 24GB/1TB. Profit calc can be off by hundreds. | Bumping unprofitable SKUs, leaving profitable ones on the table |
| 2 | **Parts costs are flat by grade** (FUNC_CRACK £120, NONFUNC_USED £50, NONFUNC_CRACK £170). An MBA13 screen costs ~£99; a MBP16 screen costs ~£250+. | Overstating profit on large devices, understating on small ones |
| 3 | **Overbid analysis returned £0 on 2,179 winning listings.** Either we genuinely never overbid, or the competitor API doesn't return granular `price_to_win` for winners. Unknown. | Can't optimise winning positions; potentially leaving money on the table |
| 4 | **No feedback loop.** Bumps happen but we never check if they won the buy box or led to orders. | No way to measure ROI of bumping or improve the strategy |
| 5 | **90-minute full scan.** Prices can shift mid-scan. High-value listings checked last may be stale. | Bumping based on outdated competitor data |
| 6 | **No rollback mechanism.** If bumps go wrong (bad data, API glitch), there's no undo. | Risk of mass over-bidding with no recovery path |

---

## V2: Accurate Profit Model + Smart Bumping

**Goal:** Make every profit calculation trustworthy, add accountability to bumps, and build the data foundation V3 needs.

**Timeline estimate:** 2-3 weeks of focused work.

---

### V2.1: Per-SKU Sell Price Lookup

**What:** Replace the single average sell price per Apple model number (e.g. one price for all A2681s) with per-spec sell prices from the BM Devices board. An MBA13 M2 8GB/256GB in Fair sells for ~£350; an MBA13 M3 24GB/1TB in Good sells for ~£750+. The current system uses one number for both.

**Why it matters:** This is the single biggest source of profit miscalculation. Getting sell prices right determines whether a bump is genuinely profitable or just looks profitable on paper. Every downstream decision depends on this.

**How to implement:**

1. **Query BM Devices board (3892194968)** for all items with status "Shipped" (completed sales).
2. **Extract spec fields:**
   - `text89` (BackMarket SKU, e.g. "MBA.A2681.8GB.256GB.Silver.Fair")
   - `numeric5` (Sale Price ex VAT)
   - `status__1` (RAM)
   - `color2` (SSD)
   - `status7__1` (CPU/chip)
3. **Build a lookup table** keyed by normalised spec tuple: `(model_family, chip, RAM, storage, sell_grade)`. For each tuple, compute the average, median, min, max, and count of historical sales.
4. **Match buyback SKUs to sell specs.** A buyback SKU like `MBA13.2022.M2.APPLECORE.8GB.256GB.FUNC.CRACK` maps to sell spec `(MBA13, M2, 8GB, 256GB)`. The sell grade depends on the buyback grade and our repair quality (FUNC_CRACK devices typically sell as Fair; NONFUNC_USED can sell as Good if only board work).
5. **Fallback chain:** Exact spec match -> same model+chip (any RAM/storage) -> same model family -> current default (£500). Log when falling back so we can fill gaps.
6. **Cache the lookup.** Generate `sell-price-lookup.json` daily (before the monitor runs). Structure:
   ```json
   {
     "MBA13.M2.8GB.256GB": {"avg": 347, "median": 340, "count": 42, "min": 280, "max": 410},
     "MBA13.M3.24GB.1TB": {"avg": 748, "median": 750, "count": 3, "min": 720, "max": 780}
   }
   ```
7. **Modify `buy_box_monitor.py`** to load this lookup instead of `profit-summary.json` by-model averages.

**Monday API query pattern:**
```graphql
query {
  boards(ids: [3892194968]) {
    items_page(limit: 500, query_params: {rules: [{column_id: "status", compare_value: ["Shipped"]}]}) {
      items {
        name
        column_values(ids: ["text89", "numeric5", "status__1", "color2", "status7__1"]) {
          id
          text
          value
        }
      }
    }
  }
}
```

**Dependencies:** None. BM Devices board already has this data.

**Complexity:** M (Monday API query + data normalisation + SKU-to-spec mapping logic)

**Expected impact:** Eliminates profit miscalculation of up to £200-400 per listing on high-spec devices. Prevents bumping SKUs that are actually unprofitable and enables bumping ones we've been leaving.

---

### V2.2: Real Parts Costs Per Model

**What:** Replace flat grade-based parts costs (£120/£50/£170) with actual average parts costs per device model, sourced from the Stock Checkouts board.

**Why it matters:** An MBA13 M1 screen (A2337) costs ~£99. A MBP16 M1 Pro screen (A2485) costs ~£250+. Board components vary similarly. Using £120 flat for all FUNC_CRACK devices understates costs on large MBPs and overstates on MBAs.

**How to implement:**

1. **Query Stock Checkouts board (6267736041)** for completed checkouts.
2. **Follow the relation chain:** Stock Checkouts -> `connect_boards` -> iCorrect Main Board (3428555491). The main board item name contains the BM reference (e.g. "BM 1085").
3. **Get subitems of each checkout** to find individual parts used. Each subitem has:
   - `name`: Part description (e.g. "LCD - Air A2337")
   - `numbers`: Part cost
4. **Map parts to device models.** Parse the part name to extract the Apple model number. Group costs by (model_family, repair_type).
5. **Build lookup table:** `parts-cost-lookup.json`
   ```json
   {
     "MBA13.screen": {"avg": 99, "median": 99, "count": 45},
     "MBP16.screen": {"avg": 255, "median": 250, "count": 12},
     "MBA13.board": {"avg": 35, "median": 30, "count": 28},
     "MBP14.board": {"avg": 65, "median": 60, "count": 18}
   }
   ```
6. **Grade-to-parts mapping logic:**
   - FUNC_CRACK -> screen cost for that model
   - NONFUNC_USED -> board parts cost for that model
   - NONFUNC_CRACK -> screen + board costs for that model
7. **Fallback chain:** Exact model match -> model family average -> current flat rates.
8. **Generate daily** alongside the sell price lookup.

**Alternative approach (simpler):** Query the Products/Inventory board directly for `supply_price` of screen and board parts per model. Faster to implement but misses actual usage patterns (sometimes we use cheaper compatible parts).

**Monday API:** Query board 6267736041, get subitems via `subitems { name column_values(ids: ["numbers"]) { text } }`, cross-reference with main board via connected items.

**Dependencies:** Stock Checkouts board must have reasonably complete data. Need to validate coverage: how many models have at least 5 checkout records?

**Complexity:** M-L (complex relation chain across 3 boards, subitem parsing, model extraction from free-text part names)

**Expected impact:** Corrects parts cost estimates by £30-150 per listing on MBP14/MBP16 devices. Combined with V2.1, gives us a profit model we can actually trust.

---

### V2.3: Overbid/Price-to-Win API Investigation

**What:** Determine why the overbid analysis returned £0 across 2,179 winning listings. Either we genuinely never overbid (unlikely), or the competitor API doesn't return useful `price_to_win` data for winners.

**Why it matters:** If we're overbidding on winning listings, we're paying more than necessary on every buyback. At 860 devices over the analysis period, even £5 average overbid = £4,300 wasted. But we can't act without understanding the data.

**How to implement:**

1. **Design a manual test protocol:**
   - Select 10 winning listings across different models and grades
   - For each, record: our price, API `price_to_win`, `is_winning` flag
   - Cross-reference: are there other competitors visible? What are their prices?
   - Check: does `price_to_win` equal our own price when winning? (This would explain £0 overbid)
   - Check: does the API return the second-highest competitor, or just a boolean win/lose?

2. **Run the test:**
   ```bash
   # For each of 10 listings:
   curl -s "https://www.backmarket.co.uk/ws/buyback/v1/competitors/{listing_id}" \
     -H "Authorization: Basic ..." | python3 -m json.tool
   ```
   Document the raw response structure. Look for fields beyond `price_to_win` and `is_winning`.

3. **Document findings** in `docs/competitor-api-behaviour.md`:
   - Does `price_to_win` represent the minimum to win, or the next competitor's price?
   - For winners: does it return our own price, zero, or the second-place price?
   - Are there multiple competitor entries, or just our own?
   - Is there a separate endpoint for competitor breakdown?

4. **If `price_to_win` is useless for winners:** Design alternative approaches:
   - Lower our price incrementally on a test set and re-check: at what point do we lose?
   - Use the competitor list to find the next-highest bid directly.
   - Accept that overbid detection requires a different approach (track price changes over time, see if reducing price still wins).

**Dependencies:** None. Just API access and 30 minutes of investigation.

**Complexity:** S (investigation and documentation)

**Expected impact:** Unlocks the entire overbid reduction strategy. If we discover meaningful overbidding, the savings could be £5,000-15,000/year based on current volume.

---

### V2.4: Bump Effectiveness Tracking

**What:** After bumping listings, re-check those specific listings 24 hours later. Did we win the buy box? Did we get orders? Track results in a persistent history file.

**Why it matters:** Without feedback, we're flying blind. We might be bumping hundreds of listings and getting zero additional orders. Or we might be extremely effective. We literally don't know.

**How to implement:**

1. **Enhance the bump log.** Current `bumps-YYYY-MM-DD.json` already records every bump with listing_id, old/new price, and success/failure. Keep this structure.

2. **Create a new script: `bump_tracker.py`**
   - Reads yesterday's bump log
   - For each bumped listing, calls `GET /ws/buyback/v1/competitors/{listing_id}`
   - Records: is_winning now? price_to_win now? has our price changed since we set it?
   - Calls `GET /ws/buyback/v1/listings/{listing_id}` to check for recent orders (if the API exposes order data; otherwise cross-reference with BM Devices board for new items matching the SKU)

3. **Bump history file: `bumps-history.json`**
   ```json
   {
     "bumps": [
       {
         "date": "2026-03-13",
         "listing_id": "abc123",
         "sku": "MBA13.2022.M2...",
         "old_price": 95,
         "new_price": 112,
         "check_24h": {
           "is_winning": true,
           "price_to_win": 110,
           "our_price_unchanged": true,
           "orders_since_bump": 1
         }
       }
     ],
     "summary": {
       "total_bumps": 264,
       "won_buybox_24h": 198,
       "win_rate": 0.75,
       "orders_attributed": 47,
       "avg_profit_per_order": 142
     }
   }
   ```

4. **Schedule:** Run `bump_tracker.py` daily at 06:00 UTC (1 hour after the main monitor). Only checks yesterday's bumps, so it's a small, fast scan.

5. **Cross-reference with BM Devices board:** Query for new items created in the last 48 hours. Match by SKU to bumped listings. This tells us if a bump led to an actual order.

**Dependencies:** V2.1 and V2.2 (accurate profit model needed to properly attribute profit to bumps)

**Complexity:** M (new script, BM Devices board query, history file management)

**Expected impact:** Provides the ROI data needed to justify and optimise bumping. If bumping has a 75% win rate and generates 50 extra orders/week at £150 avg profit, that's £7,500/week attributable to the system.

---

### V2.5: Rollback Capability

**What:** Save pre-bump prices before any changes. Provide a `--rollback` flag to revert the last bump batch.

**Why it matters:** If bad data causes mass over-bidding, or if a bug sets wrong prices, there's currently no recovery except manually checking each listing. At 264 bumps per run, manual recovery is not viable.

**How to implement:**

1. **Pre-bump snapshot.** Before `execute_bumps()` runs, save a snapshot of all candidate listings' current prices:
   ```json
   {
     "date": "2026-03-14",
     "snapshot_time": "2026-03-14T05:00:00Z",
     "pre_bump_prices": [
       {"listing_id": "abc123", "sku": "MBA13...", "price": 95.00}
     ]
   }
   ```
   Save to `data/buyback/rollback-YYYY-MM-DD.json`.

2. **Add `--rollback` flag** to `buy_box_monitor.py`:
   - Loads the most recent rollback file
   - For each entry, calls `PUT /ws/buyback/v1/listings/{id}` with the original price
   - Logs all reversions
   - Deletes the rollback file after successful completion

3. **Keep last 7 rollback files.** Auto-prune older ones. A bump from a week ago is not worth rolling back.

4. **Safety:** `--rollback` should require confirmation (or `--rollback --confirm`) to prevent accidental use.

**Dependencies:** None.

**Complexity:** S (straightforward file I/O and existing API calls)

**Expected impact:** Risk mitigation. Doesn't directly improve profit, but prevents catastrophic losses from bad bumps. Essential for running auto-bump with confidence.

---

### V2.6: Scan Optimisation

**What:** Reduce the 90-minute full scan time through parallelisation and smart ordering.

**Why it matters:** Prices shift during a 90-minute scan. A listing checked at minute 1 and bumped at minute 85 may be operating on stale data. Faster scans also mean we can run more frequently.

**How to implement:**

**Option A: Smart Ordering (simpler)**
1. Check high-value listings first (sorted by potential profit impact)
2. Prioritise yesterday's losers (they're more likely to still need bumping)
3. Skip listings we've been winning consistently for 7+ days (low priority)
4. Implement with a priority queue based on: `(days_losing * potential_profit) + recency_bonus`

**Option B: Parallel Competitor Checks (faster but riskier)**
1. Use `asyncio` + `aiohttp` for concurrent competitor API calls
2. Start with 3 concurrent requests (conservative: respect rate limits)
3. Implement adaptive concurrency: if no 429s, increase to 5; if 429s, back down
4. Target: reduce scan from 90 min to ~25-30 min

**Option C: Incremental Scans (most sophisticated)**
1. Don't re-check every listing every run
2. Always check: yesterday's losers, recently bumped listings, high-value listings
3. Check everything else on a rotating basis (1/3 of stable winners per day)
4. Reduces daily API calls by ~60%

**Recommendation:** Start with Option A (zero API risk, easy to implement). Add Option B after V2 stabilises. Option C is a V3 consideration.

**Dependencies:** None for Option A. Option B needs async refactor.

**Complexity:** S (Option A) / M (Option B) / L (Option C)

**Expected impact:** Option A: 20-30% scan time reduction. Option B: 60-70% reduction. Option C: 70-80% reduction + lower API usage.

---

### V2.7: Price Change History

**What:** Track our bid price over time for every SKU. Store in a time-series file.

**Why it matters:** Enables trend analysis (are we gradually bidding up across the board?), supports V3 competitor intelligence, and provides audit trail for pricing decisions.

**How to implement:**

1. **After each scan**, extract every listing's current price and save to a daily snapshot:
   ```json
   {
     "date": "2026-03-14",
     "prices": {
       "MBA13.2022.M2.APPLECORE.8GB.256GB.FUNC.CRACK": {
         "our_price": 112,
         "price_to_win": 110,
         "is_winning": true,
         "competitor_count": 3
       }
     }
   }
   ```
   Save to `data/buyback/price-history/YYYY-MM-DD.json`.

2. **Weekly aggregation script** (`price_trends.py`): reads the last 30 days of daily snapshots and produces trend summaries:
   - SKUs where our price has increased >20% in 30 days (are we in a bidding war?)
   - SKUs where competitor prices are dropping (market cooling)
   - SKUs where gap-to-win is consistently narrowing (aggressive competitor)
   - Average bid level by model family over time

3. **Retention:** Keep 90 days of daily snapshots. Archive older to compressed monthly summaries.

**Dependencies:** None.

**Complexity:** S (file I/O after existing scan)

**Expected impact:** Foundation for V3 competitor intelligence and trend detection. Immediate value: spot bidding wars early.

---

### V2 Implementation Order

| Priority | Item | Complexity | Dependency | Reason |
|----------|------|-----------|------------|--------|
| 1 | V2.3: Overbid Investigation | S | None | Quick win; unblocks overbid strategy |
| 2 | V2.5: Rollback Capability | S | None | Safety first; needed before expanding bumps |
| 3 | V2.1: Per-SKU Sell Prices | M | None | Biggest profit accuracy improvement |
| 4 | V2.2: Real Parts Costs | M-L | None | Second biggest accuracy improvement |
| 5 | V2.7: Price Change History | S | None | Start collecting data now for V3 |
| 6 | V2.4: Bump Effectiveness | M | V2.1, V2.2 | Needs accurate profit model to be meaningful |
| 7 | V2.6: Scan Optimisation | S-M | V2.4 | Priority ordering needs effectiveness data |

---

## V3: Autonomous Pricing Engine

**Goal:** Move from "bump to win" to "price to maximise profit." The system should make intelligent, data-driven pricing decisions across the entire portfolio without human intervention.

**Timeline estimate:** 4-8 weeks after V2 stabilises. Build incrementally.

---

### V3.1: Dynamic Pricing Strategy

**What:** Don't just bump to `price_to_win + £1`. Optimise the price point for maximum profit. If the next competitor after the buy box winner is £50 higher, we have room to win at a lower price.

**Why it matters:** V1/V2 bumps to the minimum needed to win. But "winning cheap" and "winning expensive" have the same outcome: we get the device. Winning cheap means higher profit per device.

**How to implement:**

1. **Extend competitor data collection.** For each listing, record not just `price_to_win` but the full competitor price ladder (all competitor prices, sorted).

2. **Pricing tiers:**
   - **Comfortable win:** Our price > price_to_win + £5 but < next_competitor - £5. We win with margin.
   - **Aggressive win:** Our price = price_to_win + £1. We barely win. Maximum cost.
   - **Strategic positioning:** Our price between price_to_win and next competitor, positioned for maximum profit.

3. **Algorithm:**
   ```
   competitors = sorted list of all competitor prices (ascending)
   price_to_win = competitors[0] if we're losing, else competitors[1]
   next_above = first competitor price > price_to_win
   
   if next_above - price_to_win > £20:
       # Room to breathe. Set our price in the middle for profit optimisation.
       target = price_to_win + £1  (still win, but consider the next step below)
   else:
       # Tight competition. Just win at minimum.
       target = price_to_win + £1
   
   # Profit check at target price
   if calc_profit(target) < min_profit:
       skip  # Not worth winning at any price
   ```

4. **For winning listings (overbid reduction):** If we're winning and our price is > `second_place_price + £10`, consider reducing to `second_place_price + £2` to save money while still winning.

**Dependencies:** V2.3 (understand competitor API data), V2.1 + V2.2 (accurate profit model)

**Complexity:** M

**Expected impact:** Saves £5-20 per device on wins where we're currently over-positioned. At 60+ orders/week, that's £300-1,200/week.

---

### V3.2: Demand-Weighted Bidding

**What:** Factor in how often each SKU actually generates orders (order velocity) when deciding whether to bump and how aggressively.

**Why it matters:** A SKU with 10 orders/month at £100 profit is worth £1,000/month. A SKU with 1 order/quarter at £150 profit is worth £50/month. The current system treats them equally. Bumping the high-velocity SKU aggressively is 20x more valuable.

**How to implement:**

1. **Calculate order velocity per SKU** from BM Devices board (3892194968):
   - Query items with status "Shipped", grouped by `text89` (BM SKU)
   - Count orders per SKU per 30-day window
   - Calculate: orders/month, trend (increasing/decreasing), last order date

2. **Build velocity lookup:** `order-velocity.json`
   ```json
   {
     "MBA13.M1.8GB.256GB.NONFUNC.USED": {
       "orders_30d": 12,
       "orders_90d": 38,
       "trend": "stable",
       "last_order": "2026-03-10",
       "velocity_tier": "high"
     }
   }
   ```

3. **Velocity tiers and bump behaviour:**
   | Tier | Orders/Month | Bump Strategy |
   |------|-------------|---------------|
   | High (>8) | >8/mo | Bump aggressively. Each win = frequent profit. Worth £20+ above min. |
   | Medium (3-8) | 3-8/mo | Bump normally. Standard price_to_win + £1. |
   | Low (1-2) | 1-2/mo | Bump conservatively. Only if gap < £30 and profit > £80. |
   | Dead (0) | 0 last 90 days | Don't bump. Consider zeroing if also losing. |

4. **Expected profit per bump = profit_per_device * monthly_orders * win_probability**. Use this as the sort key instead of raw profit.

**Dependencies:** V2.1 (per-SKU sell prices), V2.4 (bump effectiveness data for win probability estimates)

**Complexity:** M

**Expected impact:** Concentrates bump budget on high-velocity SKUs. If we shift 50 bumps from dead SKUs to high-velocity ones, that's potentially 50 extra orders/month at £100+ avg profit = £5,000/month.

---

### V3.3: Competitor Intelligence

**What:** Track competitor pricing over time per SKU. Identify who we're competing against, their pricing patterns, and whether they're aggressive or passive.

**Why it matters:** If a competitor always matches within 24 hours, bumping is a waste: they'll just match and we'll enter a race to the bottom. If a competitor is passive (same price for weeks), a small bump wins indefinitely.

**How to implement:**

1. **Extend competitor data capture.** During each scan, record the full competitor response (not just price_to_win):
   ```json
   {
     "listing_id": "abc123",
     "date": "2026-03-14",
     "competitors": [
       {"price": 112, "is_winning": false, "seller_id": "competitor_1"},
       {"price": 108, "is_winning": true, "seller_id": "us"}
     ]
   }
   ```
   Note: need to verify the competitor API actually returns seller identifiers. If not, we can still track the price distribution.

2. **Competitor profiles** (built over 30+ days of data):
   - Price change frequency per competitor per SKU
   - Average time to respond to our bumps (do they match within 24h?)
   - Number of SKUs they compete on (diversified or specialist?)
   - Average position (usually winning, usually second?)

3. **Competitor behaviour classification:**
   | Type | Behaviour | Our Strategy |
   |------|-----------|-------------|
   | Passive | Rarely changes price | Bump once, enjoy weeks of wins |
   | Reactive | Matches within 24-48h | Only bump high-velocity SKUs (worth the brief win) |
   | Aggressive | Undercuts within hours | Don't engage; compete on quality/grade instead |
   | Cyclical | Changes on a pattern | Time our bumps for their low periods |

4. **Output:** `competitor-intelligence.json` updated weekly. Feeds into bump decision logic.

**Dependencies:** V2.7 (price history), V2.4 (bump effectiveness tracking)

**Complexity:** L (long data collection period, pattern detection, classification logic)

**Expected impact:** Avoids futile bidding wars (saves the bump cost on reactive competitors). Identifies easy wins on passive competitors. Over time: 10-20% improvement in bump ROI.

---

### V3.4: Portfolio Optimisation

**What:** Given a fixed daily "bump budget" (total additional bid cost we're willing to absorb), allocate optimally across SKUs for maximum expected profit.

**Why it matters:** We currently bump every eligible listing equally. But bumping 264 listings costs us in elevated bid prices. Some of those bumps generate high-velocity profitable orders; others sit there winning a buy box nobody buys from. A constrained optimisation approach maximises return per pound of bump spend.

**How to implement:**

1. **Define the optimisation problem:**
   - **Decision variable:** For each losing SKU, bump (yes/no) and by how much
   - **Objective:** Maximise `sum(expected_profit_per_SKU)` where `expected_profit = profit_at_win * monthly_orders * win_probability`
   - **Constraint:** `sum(bump_amounts * expected_monthly_orders)` <= daily budget * 30 (total monthly additional cost)

2. **Simple greedy solution (start here):**
   - Calculate ROI per bump: `expected_monthly_profit_gain / monthly_bump_cost`
   - Sort all candidates by ROI descending
   - Take the top N until budget is exhausted
   - This is optimal for the unit-cost case (each bump is independent)

3. **Advanced (if needed):** Linear programming with `scipy.optimize.linprog` or `PuLP`. Handles constraints like "don't bump more than 3 NONFUNC_CRACK listings per model" or "maintain minimum coverage across all model families."

4. **Budget setting:** Start with a dynamic budget based on historical data:
   - Current bump count * avg bump amount * avg orders per bumped SKU
   - Cap at X% of monthly revenue (e.g., 5% of buyback revenue)

**Dependencies:** V3.2 (order velocity), V3.3 (competitor intelligence for win probability), V2.4 (bump effectiveness)

**Complexity:** M (greedy version) / L (LP version)

**Expected impact:** 20-40% improvement in bump ROI by cutting low-value bumps and doubling down on high-value ones.

---

### V3.5: Grade Strategy Optimisation

**What:** Data-driven answer to: should we bid more aggressively on NONFUNC_USED (our edge: no screen needed), FUNC_CRACK, or NONFUNC_CRACK?

**Why it matters:** The profit model spec calls out NONFUNC_USED as "where the margin is." But is that true across all models? On a MBP16, the screen cost (FUNC_CRACK) is £250, making NONFUNC_USED relatively more attractive. On an MBA13, the screen is £99, so FUNC_CRACK may be fine. We need data, not assumptions.

**How to implement:**

1. **Build grade-level P&L from historical data:**
   - From BM Devices board + Main Board: get actual sell price, buy price, parts cost, labour hours per device
   - Cross-reference with the original buyback grade (need to add "Original Buyback Grade" column to BM Devices board, or infer from the SKU `text89` field)
   - Aggregate: avg profit per (model_family, grade) combination

2. **Analysis output:** `grade-strategy.json`
   ```json
   {
     "MBA13": {
       "NONFUNC_USED": {"avg_profit": 165, "volume": 89, "monthly_revenue": 4900},
       "FUNC_CRACK": {"avg_profit": 110, "volume": 142, "monthly_revenue": 5226},
       "NONFUNC_CRACK": {"avg_profit": 45, "volume": 28, "monthly_revenue": 420}
     },
     "MBP16": {
       "NONFUNC_USED": {"avg_profit": 380, "volume": 12, "monthly_revenue": 1520},
       "FUNC_CRACK": {"avg_profit": 195, "volume": 18, "monthly_revenue": 1170}
     }
   }
   ```

3. **Feed into bump decisions:** Apply a grade multiplier to bump priority:
   - If NONFUNC_USED is 2x more profitable per unit than FUNC_CRACK for the same model, weight NONFUNC_USED bumps 2x in the priority queue.

4. **Ongoing:** Regenerate monthly. Grades may shift profitability as screen prices change or tech skills improve.

**Dependencies:** V2.1 (per-SKU sell prices), V2.2 (real parts costs)

**Complexity:** M (data aggregation + analysis)

**Expected impact:** Shifts bump budget toward the most profitable grade/model combinations. 10-15% profit improvement on the bumped portfolio.

---

### V3.6: Seasonal/Trend Awareness

**What:** Detect when sell prices are dropping (e.g., after a new MacBook release) and automatically reduce bid exposure. Detect rising trends and capitalise.

**Why it matters:** When Apple releases the M4 MacBook Air, M2/M3 sell prices drop 10-20% within weeks. If we're still bidding based on last month's sell prices, we're buying devices we'll sell at a loss. Conversely, during supply shortages, prices rise and we should bid more aggressively.

**How to implement:**

1. **Track sell price trends** from BM Devices board sales data:
   - For each (model, spec), compute: avg sell price this week vs last 4 weeks vs last 12 weeks
   - Flag: declining (>5% drop over 4 weeks), stable, rising (>5% increase)

2. **Track buy price trends** from our bid history (V2.7):
   - Are we bidding more this month than last month for the same SKU?
   - Is the market (price_to_win) trending up or down?

3. **Auto-adjust sell price estimates:**
   - If sell prices declining: use the lower of (30-day avg, 7-day avg) for profit calcs
   - If sell prices rising: use 30-day avg (conservative; don't chase the spike)

4. **Alert on significant moves:**
   - Telegram alert when a model family's sell price drops >10% in 2 weeks
   - Telegram alert when a new Apple model number appears in BM listings (new device launch)

5. **Calendar awareness:** Maintain a simple config of known Apple event dates. In the 2 weeks following a new MacBook launch, automatically reduce bid ceilings on the predecessor model by 15%.

**Dependencies:** V2.1 (per-SKU sell prices), V2.7 (price history)

**Complexity:** M

**Expected impact:** Prevents buying at yesterday's prices when the market has moved. Could save £2,000-5,000 per product cycle (happens 1-2x per year).

---

### V3.7: Parts Stock Integration

**What:** Check real-time parts inventory before bumping FUNC_CRACK or NONFUNC_CRACK listings. Don't win devices we can't repair.

**Why it matters:** If we win a FUNC_CRACK MBA13 buyback but have zero A2337 screens in stock, the device sits for weeks waiting for parts. It ties up cash, delays the sale, and the sell price may drop while we wait. Worse: screen back-order might cost more than the £99 we budgeted.

**How to implement:**

1. **Query Monday Products/Inventory board** for screen and board component stock levels:
   - Part item: e.g. "LCD - A2337" (ID: 6220432084)
   - Field: `quantity` (current stock count)
   - Map: Apple model -> part item ID (maintain a config mapping)

2. **Stock check before bump decisions:**
   ```python
   if grade == "FUNC_CRACK" and screen_stock[model] < 2:
       skip_bump("No screens in stock for {model}")
   if grade == "NONFUNC_CRACK" and (screen_stock[model] < 2 or board_parts_stock[model] < 2):
       skip_bump("Insufficient parts for {model}")
   ```

3. **Threshold logic:**
   - Stock >= 5: bump normally
   - Stock 2-4: bump but flag as "low stock"
   - Stock 0-1: don't bump; alert parts agent to reorder

4. **Integration point:** The parts agent (separate OpenClaw agent) manages inventory. Send it a notification when stock is low and we're leaving profitable bumps on the table.

**Dependencies:** Parts board must be accurate (this is a known issue: stock counts are often stale). Requires the parts agent to maintain accurate inventory.

**Complexity:** M (Monday API query + integration logic)

**Expected impact:** Prevents winning 10-20 devices/month we can't immediately repair. Reduces cash-in-device time and ensures repair turnaround stays fast.

---

### V3.8: Auto-Delist Unprofitable SKUs

**What:** Automatically set the price to £0 (effectively delisting) on SKUs that are consistently unprofitable, have no order history, or have been losing the buy box for 30+ days with no viable bump path.

**Why it matters:** Dead listings clutter the catalogue, waste API scan time, and occasionally attract orders at bad prices if the market shifts. The existing `bm-reprice.py` already handles zeroing Intel SKUs and delisting decisions, but it's a separate manual process. This should be automated and continuous.

**How to implement:**

1. **Auto-delist criteria (all must be true):**
   - Losing buy box for 14+ consecutive days
   - Profit at price_to_win is negative (even after V2 accuracy improvements)
   - Order velocity is zero (no orders in 90 days)
   - Model family is not on a manual whitelist

2. **Delist action:**
   - Set price to £0 via `PUT /ws/buyback/v1/listings/{id}`
   - Log the delist with reason in `delists-YYYY-MM-DD.json`
   - Send weekly summary to Telegram: "Auto-delisted 12 SKUs this week"

3. **Re-list logic:** If a previously delisted SKU becomes profitable (e.g. sell prices rise, parts costs drop), the system should flag it for manual review (don't auto-relist: there might be a reason it was dead).

4. **Safety:** Maximum 20 delistings per day. Require `--enable-delist` flag. Include in rollback capability.

**Dependencies:** V2.4 (bump effectiveness), V3.2 (order velocity)

**Complexity:** S-M

**Expected impact:** Reduces scan time by removing dead listings. Eliminates occasional bad orders on zombie SKUs. Keeps the portfolio clean.

---

### V3.9: Dashboard and Profit Attribution

**What:** Weekly trend reports showing: total buyback profit, profit attributed to auto-bumping, win rate trends, competitor landscape shifts, and model-level performance.

**Why it matters:** The entire system needs to prove its value. Without clear reporting, we can't know if the autonomous pricing engine is making or losing money. Ricky needs a single place to see "the system earned £X this week."

**How to implement:**

1. **Weekly report script: `weekly_report.py`**
   - Runs every Sunday at 22:00 UTC
   - Aggregates the week's data from: bump logs, bump tracker results, buy box scans, BM Devices board orders

2. **Report sections:**
   - **P&L Summary:** Orders this week, total revenue, total profit, avg profit/device
   - **Bump Attribution:** Bumps executed, bump win rate, orders attributed to bumps, profit from bumped listings vs organic
   - **Win Rate Trend:** Buy box win % this week vs last 4 weeks (chart data)
   - **Model Leaderboard:** Top 5 most profitable models this week, bottom 5
   - **Competitor Report:** New competitors detected, pricing trend direction
   - **Alert Summary:** Any anomalies flagged during the week

3. **Format:** Markdown file + Telegram message (summary only; full report as file attachment).

4. **Data storage:** Weekly summaries in `data/buyback/weekly/YYYY-WNN.json`. Monthly rollups in `data/buyback/monthly/YYYY-MM.json`.

**Dependencies:** V2.4 (bump effectiveness), V3.2 (order velocity), V3.3 (competitor intelligence)

**Complexity:** M

**Expected impact:** Makes the system accountable. Enables week-over-week improvement. Gives Ricky a single number to check.

---

### V3.10: Real-Time Alerting

**What:** Notify on unusual patterns that need human attention: aggressive competitor undercutting, sell price drops, win rate crashes, API failures, or anomalous order patterns.

**Why it matters:** The system runs autonomously, but not everything should be autonomous. Some situations need human judgement: a competitor dumping prices by 40% might signal a market shift. Win rate dropping from 84% to 50% overnight means something broke.

**How to implement:**

1. **Alert triggers (via Telegram to BM agent group -1003888456344):**

   | Alert | Trigger | Severity |
   |-------|---------|----------|
   | Win rate crash | Win % drops >15 points vs 7-day average | High |
   | Competitor price war | >10 SKUs see >£30 competitor price drops in 24h | High |
   | Sell price collapse | Model family avg sell drops >15% in 2 weeks | High |
   | Bump failure spike | >20% of bumps failing (API errors) | Critical |
   | Zero orders | No buyback orders for 72 hours | Medium |
   | Overbid opportunity | >20 listings overbidding >£20 each | Low |
   | Budget exceeded | Daily bump cost exceeds threshold | Medium |

2. **Implementation:** Add an `alerts.py` module. Check conditions after each scan. Deduplicate: don't re-alert the same condition within 24 hours.

3. **Alert format:**
   ```
   🚨 Buy Box Alert: Win Rate Crash
   Win rate: 65% (was 82% yesterday)
   Affected models: MBP14 (12 losses), MBA13 (8 losses)
   Top competitor: pricing £15-25 below us on 20 SKUs
   Action needed: Review competitor pricing strategy
   ```

**Dependencies:** V2.4 (bump effectiveness for win rate tracking), V2.7 (price history for trend detection)

**Complexity:** M

**Expected impact:** Early warning system prevents prolonged periods of bad pricing. One caught incident could save thousands.

---

### V3 Implementation Order

| Phase | Items | Prerequisite | Focus |
|-------|-------|-------------|-------|
| 3A | V3.1 (Dynamic Pricing), V3.5 (Grade Strategy) | V2 complete | Smarter individual decisions |
| 3B | V3.2 (Demand Weighting), V3.8 (Auto-Delist) | V2.4 + V3.5 | Portfolio-level intelligence |
| 3C | V3.3 (Competitor Intel), V3.6 (Seasonal) | V2.7 + 30 days of data | Pattern recognition |
| 3D | V3.4 (Portfolio Optimisation) | V3.2 + V3.3 | Mathematical optimisation |
| 3E | V3.7 (Parts Integration), V3.9 (Dashboard), V3.10 (Alerting) | V3A-D stable | Operational excellence |

---

## Architecture: How It All Fits Together

```
                         ┌─────────────────────────┐
                         │  Daily Data Generation   │
                         │  (runs before main scan) │
                         │                          │
                         │  sell-price-lookup.json   │  ← BM Devices board
                         │  parts-cost-lookup.json   │  ← Stock Checkouts board
                         │  order-velocity.json      │  ← BM Devices board
                         │  parts-stock.json         │  ← Products/Inventory board
                         └────────────┬──────────────┘
                                      │
                                      ▼
                    ┌──────────────────────────────────┐
                    │     Buy Box Monitor (main scan)   │
                    │                                    │
                    │  1. Load lookup files               │
                    │  2. Fetch listings                   │
                    │  3. Check competitors                │
                    │  4. Calculate per-SKU profit         │
                    │  5. Rank by expected value           │
                    │  6. Apply bump/reduce/delist         │
                    │  7. Save results + rollback file     │
                    └────────────┬───────────────────────┘
                                 │
                    ┌────────────┼────────────────────┐
                    ▼            ▼                    ▼
            ┌──────────┐  ┌───────────┐     ┌──────────────┐
            │ Bump Log │  │ Price     │     │ Rollback     │
            │          │  │ History   │     │ Snapshot     │
            └────┬─────┘  └─────┬─────┘     └──────────────┘
                 │              │
                 ▼              ▼
         ┌──────────────┐ ┌──────────────┐
         │ Bump Tracker │ │ Trend/Intel  │
         │ (next day)   │ │ (weekly)     │
         └──────┬───────┘ └──────┬───────┘
                │                │
                ▼                ▼
         ┌────────────────────────────┐
         │  Dashboard / Weekly Report  │
         │  Alerting                   │
         └────────────────────────────┘
```

---

## File Structure (Target State)

```
buyback-monitor/
├── buy_box_monitor.py          # Main scan + bump engine
├── data_generators/
│   ├── sell_price_lookup.py    # V2.1: BM Devices -> sell prices
│   ├── parts_cost_lookup.py    # V2.2: Stock Checkouts -> parts costs
│   ├── order_velocity.py       # V3.2: BM Devices -> order velocity
│   └── parts_stock.py          # V3.7: Inventory -> stock levels
├── bump_tracker.py             # V2.4: Post-bump effectiveness check
├── price_trends.py             # V2.7 + V3.6: Price history analysis
├── competitor_intel.py         # V3.3: Competitor pattern analysis
├── portfolio_optimizer.py      # V3.4: Budget allocation
├── weekly_report.py            # V3.9: Dashboard generation
├── alerts.py                   # V3.10: Anomaly detection
├── docs/
│   ├── V2-V3-ROADMAP.md       # This document
│   └── competitor-api-behaviour.md  # V2.3: Investigation results
├── config/
│   ├── grade_strategy.json     # V3.5: Grade-level bid multipliers
│   ├── model_whitelist.json    # SKUs never to auto-delist
│   └── alert_thresholds.json   # V3.10: Alert trigger config
└── README.md                   # Updated docs
```

---

## Summary: Expected Total Impact

| Item | Est. Annual Profit Impact | Complexity | Notes |
|------|--------------------------|-----------|-------|
| V2.1 Per-SKU Sell Prices | Prevents £10-50K in bad bids | M | Biggest accuracy fix |
| V2.2 Real Parts Costs | Prevents £5-15K in bad bids | M-L | Second accuracy fix |
| V2.3 Overbid Investigation | Unlocks £5-15K savings | S | Must do first |
| V2.4 Bump Effectiveness | Indirect (enables V3) | M | ROI measurement |
| V2.5 Rollback | Risk mitigation | S | Prevents catastrophe |
| V2.6 Scan Optimisation | Indirect (fresher data) | S-M | Reduces stale decisions |
| V2.7 Price History | Indirect (enables V3) | S | Data collection |
| V3.1 Dynamic Pricing | £15-60K/year savings | M | Smarter pricing |
| V3.2 Demand Weighting | £30-60K/year additional | M | Focus on what sells |
| V3.3 Competitor Intel | £10-25K/year from avoided wars | L | Long-term intelligence |
| V3.4 Portfolio Optimisation | 20-40% bump ROI improvement | M-L | Mathematical optimisation |
| V3.5 Grade Strategy | 10-15% portfolio improvement | M | Data-driven grade bids |
| V3.6 Seasonal Awareness | £5-10K per product cycle | M | Prevents cycle losses |
| V3.7 Parts Integration | Prevents 10-20 stuck devices/mo | M | Operational efficiency |
| V3.8 Auto-Delist | Reduces scan time, prevents bad orders | S-M | Portfolio hygiene |
| V3.9 Dashboard | Indirect (accountability) | M | Makes it all visible |
| V3.10 Alerting | Prevents prolonged bad pricing | M | Early warning system |

**Conservative total V2 impact:** £20-80K/year from accurate pricing alone.
**Conservative total V3 impact:** Additional £50-150K/year from intelligent optimisation.

These are not guaranteed numbers. They're informed estimates based on current volume (860 devices over the analysis period, ~£132K total profit) and the known weaknesses in V1's profit model. The actual impact depends on how wrong the current model is (V2) and how well the optimisation performs (V3).

---

*This is a living document. Update as V2 investigation (especially V2.3) reveals new information about the competitor API and data quality.*
