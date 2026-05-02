# Overnight Listing Clearance Map - 2026-04-25

Owner: Jarvis
Task: B - listing queue and clearance-first decision report
Mode: repo-backed analysis only

## Scope and constraints

- Based on repository code, docs, and saved local artifacts only.
- No live listing actions were run.
- No Monday or Back Market mutations were performed.
- The commands below are strict read-only commands.
- I am not using list-device.js dry-run or reconcile-listings.js dry-run as first-pass queue commands because those scripts still write logs, cache files, JSON reports, or Telegram summaries.

## Executive read

- The repo defines a reliable method for finding the live To List queue, but it does not contain a frozen full snapshot of the current queue.
- One device is repo-confirmed as an active To List candidate: BM 1555 / Main item 11522195767.
- The last saved reconciliation snapshot also shows three ready-to-relist adjacent candidates, but those are not confirmed To List items today and need a fresh read-only pull before action.
- Clearance-first split:
- SAFE_TO_LIST = exact product and colour resolution, complete data, no account risk, and the current commercial gate passes without override.
- CLEARANCE_LIST = exact product and colour resolution and no account risk, but economics fail the normal gate and should still be listed because the mode is clearance-first.
- BLOCKED = any data ambiguity, wrong device risk, wrong colour risk, missing board linkage, or active listing and account risk.

## Repo-backed queue-finding method

The current listing pipeline is defined by sops/06-listing.md, scripts/list-device.js, docs/VERIFIED-COLUMN-REFERENCE.md, and scripts/lib/resolver-truth.js.

### Queue discovery steps

1. Find Main Board items in board 349212843, group new_group88387__1, where status24 index = 8.
2. Join each Main item to BM Devices board 3892194968 via board_relation linked_item_ids.
3. Pull hard gates from Main Board: status_2_Mjj4GJNQ final grade, status8 colour, lookup_mkx1xzd7 parts cost, formula_mkx1bjqr labour cost, formula__1 labour hours.
4. Pull BM Devices fields: lookup device name, status__1 RAM, color2 SSD, status7__1 CPU, status8__1 GPU, numeric purchase price, text_mkyd4bx3 stored listing id, text_mm1dt53s stored uuid, numeric_mm1mgcgn total fixed cost, text89 SKU.
5. Build SKU, resolve product from listings-registry first, then bm-catalog fallback, and split economics from safety.

## Current repo-visible queue map

This section is limited to what the repo can prove from saved artifacts. It is not a complete live Monday snapshot.

| Classification | Main item | Device | Evidence | Notes |
| --- | ---: | --- | --- | --- |
| CLEARANCE_LIST | 11522195767 | BM 1555 | CHANGELOG.md entry 2026-04-20 14:00 UTC says the Main item was reset to To List after the wrong M1 to M2 mapping was fixed | Saved dry-run evidence in the changelog says SKU MBP.A2338.M2.8GB.256GB.Grey.Fair, registry slot 6569346, product_id ef20e8dd-bcbf-4d94-8933-15f59560b9b9, and net minus 67 pounds at min price. Data looks safe. Economics make it clearance stock. |

### Ready-to-relist adjacent candidates from the last saved reconciliation snapshot

Source: data/reports/reconciliation-2026-04-20.json at 2026-04-20T00:13:48Z.

| Preliminary class | Main item | Device | Last saved state | Why not list from repo evidence alone |
| --- | ---: | --- | --- | --- |
| BLOCKED | 11127258151 | BM 1353 | Monday Listed, BM listing 6505341 offline | Needs current state pull and physical or listing reconciliation before any relist decision |
| BLOCKED | 11624747873 | BM 1572 | Monday Listed, BM listing 6197426 offline | Same |
| BLOCKED | 11764853620 | BM 1601 | Monday Listed, BM listing 6197426 offline | Same, and shared listing history means qty and spec checks matter |

Artifact caveat: the saved reconciliation snapshot predates the BM 1555 fix. The 2026-04-20 00:13 UTC snapshot still showed BM 1555 sharing listing 5500817 with BM 1554, but the 2026-04-20 14:00 UTC changelog fix is newer and should be treated as the current repo truth.

## Required data columns for the clearance report

| Report column | Source | Required | Why it matters |
| --- | --- | --- | --- |
| main_item_id | Main Board item id | Yes | Stable primary key for manual runs |
| item_name | Main Board item name | Yes | Human identification |
| queue_state | Main status24 text and index | Yes | Distinguishes To List from relist-adjacent |
| bm_device_id | BM Devices item id | Yes | Needed for linkage validation |
| has_back_link | BM Devices board_relation | Yes | Missing back-link is a hard block |
| final_grade | Main status_2_Mjj4GJNQ | Yes | Hard gate |
| colour | Main status8 with BM Devices mirror fallback | Yes | Required for SKU and product resolution |
| device_name | BM Devices lookup or item name | Yes | Model-family fallback |
| model_a_number | Derived from device name or BM Devices name | Yes | Required for SKU family resolution |
| ram | BM Devices status__1 | Yes | Required for exact match |
| ssd | BM Devices color2 | Yes | Required for exact match |
| cpu | BM Devices status7__1 | Yes | Required for shared A-number disambiguation |
| gpu | BM Devices status8__1 | Yes | Required for shared A-number disambiguation |
| purchase_ex_vat | BM Devices numeric | Yes | Required for break-even and net |
| parts_cost | Main lookup_mkx1xzd7 summed | Yes | Required for break-even and net |
| labour_hours | Main formula__1 | Yes | Required for break-even and net |
| labour_cost | Derived or Main formula_mkx1bjqr | Yes | Required for break-even and net |
| stored_listing_id | BM Devices text_mkyd4bx3 | No | Flags relist and conflict history |
| stored_uuid | BM Devices text_mm1dt53s | No | Resolver cross-check |
| sku | Derived from code logic | Yes | Resolver key |
| product_id | Registry or catalog resolution | Yes | Required for listing |
| resolution_source | Registry vs catalog vs manual | Yes | Tells how strong the mapping is |
| trust_class | Resolver slot | If registry hit | Safety gate |
| verification_status | Catalog result | If catalog hit | Safety gate |
| break_even_price | Derived | Yes | Clearance pricing anchor |
| proposed_market_price | Derived from live read or local fallback | Yes | Starting point for recommendation |
| min_price, net_at_min, margin_at_min | Derived | Yes | Economics split |
| classification, classification_reason, blocked_reason_category | Derived | Yes | Final decision trace |

## Classification rules

### SAFE_TO_LIST
- Use when Final Grade is present, BM Devices back-link exists, RAM SSD CPU GPU colour and purchase are present, SKU is unambiguous, product resolution is exact and live-safe, there is no active account or listing risk, and the current economics pass without a clearance override.

### CLEARANCE_LIST
- Use when every safety rule above still passes, but the item only fails on economics.
- Include cases such as secondary gate only, low margin clearance, and loss-maker clearance.
- BM 1555 is the repo-confirmed example in this bucket.

### BLOCKED
- Use when the problem is not just economics.
- Carry a reason category: DATA or ACCOUNT_RISK.
- DATA examples: missing Final Grade, no BM Devices entry, missing back-link, missing RAM SSD CPU GPU colour or purchase, ambiguous catalog candidates, market_only catalog result, unresolved colour mismatch.
- ACCOUNT_RISK examples: listing already active in a conflicting state, orphan listing, oversell condition, spec drift on shared listing history, or stale linkage to the wrong product family.

## Exact next commands for strict read-only dry-runs

Commands:
1. Pull live To List queue:
2. Current queue via operational dry-run:
cd /home/ricky/builds/backmarket && node scripts/list-device.js --dry-run --skip-history

3. Item-level decision drill for the repo-confirmed clearance candidate:
cd /home/ricky/builds/backmarket && node scripts/list-device.js --dry-run --item 11522195767 --skip-history

4. Relist and listing-state audit before any live action:
cd /home/ricky/builds/backmarket && node scripts/reconcile-listings.js --dry-run

Recommended sequence: run the batch dry-run to surface the live To List queue, run item-level dry-runs for each candidate, then run reconciliation to catch listed-but-offline and oversell risk before any approval.
