# Repair Analysis — BM Buyback Devices

**Created:** 2 March 2026
**Owner:** Ricky
**Status:** Research document — build phases to follow
**Parent project:** Buyback Optimisation (see build-tasks.md, Tasks 1-15 complete)
**Directory:** `/home/ricky/builds/backmarket/`

---

## Why

We repriced 365 listings and zeroed out unprofitable SKUs. NONFUNC.USED emerged as the best grade (£284 avg net, 0% loss rate). We want to shift volume towards NONFUNC.USED — but before increasing bids, we need to understand the actual repair reality.

**Profit on paper means nothing if we can't execute the repair.**

Right now:
- **Saf** handles NONFUNC (board-level / logic board work)
- **Misha and Andres** handle FUNC.CRACK (refurb — screen, casing, cosmetic)
- There's no data-driven view of repair success rates, failure modes, or tech capability gaps
- Every device we accepted but haven't repaired is capital spent with zero ROI
- If we scale NONFUNC.USED volume, we need to know whether Saf is a bottleneck and whether other techs can be upskilled

---

## What We're Building

Three layers of analysis, each building on the last.

### Layer 1: Received vs Repaired vs Stuck

**Question:** Of all the devices BM says we processed (accepted + shipped to us), how many have we actually repaired and sold? Where are the stuck ones?

**Method:**
1. Pull all trade-in orders from BM Buyback API where device was shipped to us (status = RECEIVED or later)
2. Cross-reference against Monday main board using BM Trade-in ID column (`text_mky01vb4` on main board, `text_mkqy3576` on BM board)
3. For each device, determine current state: Repaired & Sold / Repaired & Awaiting Sale / In Repair / Stuck (no progress) / BER / iCloud Locked / Cancelled
4. Calculate: capital tied up in stuck devices, time sitting, which grades/SKUs are stuck

**Output:** Stuck device report — every device we paid for that hasn't generated ROI, with reason and age.

### Layer 2: Repair Profiles by Grade and Tech

**Question:** What does the actual repair look like for each of the three grades, and how do the techs perform?

**Three grades:**
| Grade | What Arrives | Typical Repair | Primary Tech |
|-------|-------------|----------------|-------------|
| NONFUNC.USED | Doesn't power on, cosmetic wear, no cracks | Board-level diagnosis + component repair | Saf |
| NONFUNC.CRACK | Doesn't power on + cracked screen/casing | Board-level + screen/casing replacement | Saf + Misha/Andres |
| FUNC.CRACK | Powers on, cracked screen/casing | Screen + casing refurb | Misha / Andres |

**Method:**
1. Pull all BM trade-in items from Monday main board (last 3 months, Client = BM)
2. For each: tech assigned (Technician, Diagnostic person, Repair person, Refurb person), repair type, parts used + cost, time spent (Diagnostic Time, Repair Time, Refurb Time), reported vs actual condition (Battery/Screen/Casing/Function — both Reported and Actual columns), final grade, outcome (sold / stuck / BER)
3. Extract the listing grade from the SKU (last two segments: NONFUNC.USED / NONFUNC.CRACK / FUNC.CRACK)
4. Group by grade, then by tech

**Metrics per group:**
- Repair success rate (repaired & sold vs BER/stuck)
- Avg parts cost
- Avg repair time (diagnostic + repair + refurb)
- Parts usage patterns (what parts are consumed per grade)
- Reported vs actual condition mismatch rate
- Loss rate (net < 0 after all costs)

**Output:** Grade x Tech performance matrix showing who repairs what, how long it takes, what it costs, and where repairs fail.

### Layer 3: Logic Board Deep Dive (Saf's Work)

**Question:** What is Saf actually repairing on NONFUNC devices? How complex is it? Can any of it be taught to other techs?

**Method:**
1. Filter Layer 2 results to items where Parts Used includes "logic board" or similar board-level component
2. Pull Saf's diagnostic notes — these are **written update replies** (Monday item updates/activity log), not a column. Saf writes the starting ammeter reading before he begins repair.
3. Categorise repairs by complexity:
   - **Routine:** Known fault patterns, single component swap (e.g. USB-C IC, power IC)
   - **Moderate:** Multi-component, requires probing but predictable (e.g. PPBUS short, SSD controller)
   - **Complex:** Liquid damage trace work, multi-fault diagnosis, CPU/GPU reball
   - **Failed:** Diagnosed but BER / unrepairable
4. Cross-reference ammeter readings with outcomes — do certain readings predict repair success or failure?

**Output:** Saf's repair complexity breakdown — what % is routine (teachable) vs specialist, and which fault patterns are most common.

---

## Data Sources

### BM Buyback API
- **Endpoint:** `{BACKMARKET_API_BASE}/ws/buyback/v1/orders` (trade-in orders)
- **Auth:** `BACKMARKET_API_AUTH` env var (from `/home/ricky/config/api-keys/.env`)
- **Key fields:** orderPublicId, status (TO_SEND, SENT, RECEIVED, MONEY_TRANSFERED, PAID, CANCELLED), listingSku, device details
- **Pagination:** cursor-based (follow `next` URL)
- **Rate limit:** 1s between calls, exponential backoff on 429
- **Existing script:** `api/bm-crossref.py` (loads from CSV exports at `/tmp/bm-orders.csv`)

### Monday.com — Main Board (349212843)
- **API:** GraphQL at `https://api.monday.com/v2`
- **Auth:** `MONDAY_API_TOKEN` env var
- **Rate limit:** Monday rate-limits, retry with 10s backoff

**Columns needed (Layer 1+2):**

| Column | ID | Purpose |
|--------|----|---------|
| Name | — | Item name (e.g. "BM 1396") |
| Status | `status4` | Current repair status (39 values) |
| Repair Type | `status24` | Diagnostic / Repair / Board Level / Trade-In etc |
| Client | `status` | Filter to BM items |
| Technician | `person` | Assigned tech |
| Diagnostic (person) | `multiple_person_mkwqj321` | Who diagnosed |
| Repair (person) | `multiple_person_mkwqy930` | Who repaired |
| Refurb (person) | `multiple_person_mkwqsxse` | Who did refurb |
| BM Trade-in ID | `text_mky01vb4` | Links to BM order (e.g. GB-26081-WJLEO) |
| BM Listing UUID | `text_mkydhq9n` | Links to BM listing |
| Parts Used | `connect_boards__1` (board relation) | Board relation to Parts board |
| Parts Cost | `lookup_mkx1xzd7` (mirror) | Mirror from Parts board |
| Diagnostic Time | `time_tracking` | Time tracking column |
| Repair Time | `time_tracking9` | Time tracking column |
| Refurb Time | `time_tracking93` | Time tracking column |
| Cleaning Time | `duration_mkyrykvn` | Time tracking column |
| Total Time | `time_tracking98` | Time tracking column |
| Battery (Reported) | `color_mkqg66bx` | BM reported condition |
| Battery (Actual) | `color_mkqg4zhy` | Actual condition at intake |
| Screen (Reported) | `color_mkqg7pea` | BM reported condition |
| Screen (Actual) | `color_mkqgtewd` | Actual condition at intake |
| Casing (Reported) | `color_mkqg1c3h` | BM reported condition |
| Casing (Actual) | `color_mkqga1mc` | Actual condition at intake |
| Function (Reported) | `color_mkqg578m` | BM reported condition |
| Function (Actual) | `color_mkqgj96q` | Actual condition at intake |
| Liquid Damage? | `color_mkqg8ktb` | Liquid damage indicator |
| Ammeter Reading | `color_mkwr7s1s` | Ammeter reading (status column) |
| Batt Health | `numbers9` | Battery health % |
| Final Grade | `status_2_Mjj4GJNQ` | Final device grade after QC |
| LCD Pre-Grade | `color_mkp5ykhf` | LCD condition at intake |
| Lid Pre-Grade | `status_2_mkmc4tew` | Lid condition at intake |
| Top Case Pre-Grade | `status_2_mkmcj0tz` | Top case condition at intake |
| Received | `date4` | Date device was received |
| Date Repaired | `collection_date` | Date repair completed |
| Date Purchased (BM) | `date_mkqgbbtp` | BM purchase date |
| Date Sold (BM) | `date_mkq34t04` | BM sale date |
| Date Listed (BM) | `date_mkq385pa` | BM listing date |

### Monday.com — BM Board (3892194968)
- **Key columns:** SKU (`text89`), BM Order ID (`text_mkqy3576`), Sale Price (`numeric5`), Purchase Price (`numeric`), Listing UUID (`text_mkyd4bx3`)
- **Groups:** BM To List/Listed/Sold (`new_group`), BM Trade-Ins (`group_mkq3wkeq`), BM Returns (`new_group_mkmybfgr`)

### Monday.com — Item Updates (Layer 3)
- **API:** `{ items(ids: [ITEM_ID]) { updates { text_body created_at creator { name } } } }`
- **Purpose:** Saf's diagnostic notes with ammeter readings
- **Filter:** Updates by Saf (Safan) on items with logic board parts

### Monday.com — Parts Board (985177480)
- **Accessed via:** Board relation from main board (`connect_boards__1` for Parts Used, `board_relation_mm01yt93` for Parts Required)
- **Key data:** Part name, part cost — mirrored into main board via `lookup_mkx1xzd7`

---

## Build Phases

### Phase 1: Data Collection Script
- Pull all BM trade-in orders from API (or fresh CSV export if available)
- Pull all BM items from Monday main board (Client = BM, last 3-6 months)
- Pull BM board items for financial cross-reference
- Join on BM Trade-in ID / Order ID
- Cache everything to JSON for fast re-analysis
- **Output:** `audit/repair-analysis-data-YYYY-MM-DD.json`

### Phase 2: Layer 1 — Stuck Device Analysis
- Cross-reference BM orders (shipped to us) vs Monday status
- Categorise every device: Sold / Listed / In Repair / Stuck / BER / iCloud / Cancelled
- Calculate capital tied up in non-revenue-generating devices
- Age analysis (days since received with no progress)
- **Output:** `audit/stuck-devices-YYYY-MM-DD.json` + summary report

### Phase 3: Layer 2 — Grade x Tech Performance
- Extract listing grade from SKU (NONFUNC.USED / NONFUNC.CRACK / FUNC.CRACK)
- Group by grade, then by tech
- Calculate all metrics: success rate, parts cost, repair time, mismatch rate, loss rate
- Parts usage patterns per grade (what's being consumed)
- **Output:** `audit/grade-tech-matrix-YYYY-MM-DD.json` + summary report

### Phase 4: Layer 3 — Logic Board Deep Dive
- Filter to items with logic board in Parts Used
- Pull item updates (Saf's diagnostic notes)
- Parse ammeter readings from update text
- Categorise repair complexity (routine / moderate / complex / failed)
- Cross-reference readings with outcomes
- **Output:** `audit/logic-board-analysis-YYYY-MM-DD.json` + summary report

### Phase 5: Recommendations
- Which grades to increase bids on (data-backed)
- Saf's capacity ceiling and bottleneck analysis
- Upskilling opportunities (which routine repairs can Misha/Andres learn)
- Devices to write off (stuck too long, not worth continuing)
- Updated bid strategy incorporating repair reality

---

## Existing Scripts & Data

| File | Purpose | Reusable? |
|------|---------|-----------|
| `api/bm_utils.py` | BM API + Monday API wrappers, env loading | Yes — core utility |
| `api/bm-crossref.py` | Order ↔ listing ↔ Monday join | Yes — adapt for repair data |
| `api/bm-listing-optimizer.py` | SKU classification + max offer calc | Reference only |
| `api/bm-reprice.py` | Price execution via API | Not needed |
| `api/bm-full-chain.py` | Trade-in → repair → sale chain | Yes — has BM board query patterns |
| `audit/bm-crossref-data.json` | 715 matched orders with financials | Reference data |
| `audit/buybox-audit-2026-03-01.json` | 50 survivor SKUs with headroom | Reference data |
| `audit/api-listings-cache-2026-03-01.json` | 4,919 listings from API | Reference data |

---

## Success Criteria

1. **Layer 1:** Every device we accepted in the last 3-6 months accounted for — repaired, stuck, or written off. Total capital exposure quantified.
2. **Layer 2:** Clear picture of repair success rate, cost, and time by grade and tech. Data-backed answer to "should we scale NONFUNC.USED?"
3. **Layer 3:** Saf's repair complexity categorised. Specific fault patterns identified as teachable vs specialist-only.
4. **Recommendations:** Concrete bid adjustments, tech upskilling plan, and write-off list — all backed by the data.

---

## Constraints

- Monday API rate limits — batch queries, paginate with cursor, retry on rate limit
- BM API rate limits — 1s between calls, backoff on 429
- Time tracking columns return duration in seconds (need conversion)
- Parts Used is a board relation — need sub-query to get actual part names
- Item updates (Saf's notes) require per-item API calls — rate limit carefully
- Some items may have incomplete data (no tech assigned, no parts logged, no time tracking)
