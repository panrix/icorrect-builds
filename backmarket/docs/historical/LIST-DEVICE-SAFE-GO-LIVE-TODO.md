# Todo: list-device.js Safe Go-Live

## Goal

Turn `backmarket/scripts/list-device.js` into a safe live listing flow that blocks wrong-spec and wrong-colour listings by default.

## Rules

- Do not trust legacy BM SKUs as proof of correctness.
- Do not reuse a listing unless identity is proven exactly.
- Treat colour mismatch as critical.
- Prefer blocking over guessing.
- Prefer fresh clean listing creation over ambiguous reuse.
- Phase 1 live runs must be single-item only.

## Phase 0: Map Current Behaviour

- [ ] Read the full flow in [list-device.js](/home/ricky/builds/backmarket/scripts/list-device.js).
- [ ] Identify every branch where a listing can be:
- [ ] reused
- [ ] reactivated
- [ ] quantity-bumped
- [ ] newly created
- [ ] verified after write
- [ ] Identify every source currently used for identity data:
- [ ] Monday Main Board
- [ ] BM Devices Board
- [ ] V7 data
- [ ] product-id lookup table
- [ ] existing BM listing payload
- [ ] Identify every place where colour/spec matching is currently fuzzy or partial.
- [ ] Identify every place where SKU is used as a trust signal.
- [ ] Identify the exact live-mode gate and confirm how live writes are currently enabled or disabled.

## Phase 1: Canonical Identity Model

- [ ] Create one canonical identity builder function.
- [ ] Define a normalized identity object that includes:
- [ ] main item id
- [ ] BM device id
- [ ] device family/type
- [ ] model number
- [ ] grade
- [ ] product_id
- [ ] colour
- [ ] RAM
- [ ] SSD
- [ ] CPU
- [ ] GPU
- [ ] device name
- [ ] source metadata
- [ ] Normalize RAM values into one format.
- [ ] Normalize SSD values into one format.
- [ ] Normalize CPU values into one format.
- [ ] Normalize GPU values into one format.
- [ ] Normalize colour values into one format.
- [ ] Normalize model numbers into one format.
- [ ] Add helpers for:
- [ ] storage unit conversion
- [ ] colour alias mapping
- [ ] CPU/GPU core extraction
- [ ] title-safe comparison values
- [ ] Ensure the same identity object is used by:
- [ ] product lookup
- [ ] stored listing reuse checks
- [ ] listing search
- [ ] post-create verification
- [ ] denylist decisions
- [ ] reporting

## Phase 2: Colour Hard Gate

- [ ] Define a single colour normalization map for:
- [ ] Monday colour values
- [ ] V6 colour values
- [ ] BM listing title values
- [ ] BM API colour values if present
- [ ] Document accepted aliases for each supported colour.
- [ ] Block listing if source colour is missing.
- [ ] Block listing if normalized colour cannot be resolved confidently.
- [ ] Block listing if listing title/product data cannot prove colour.
- [ ] Add explicit tests/examples for common aliases:
- [ ] `Space Gray` vs `Space Grey`
- [ ] `Midnight`
- [ ] `Starlight`
- [ ] `Silver`
- [ ] `Gold`
- [ ] `Grey`

## Phase 3: Product Identity Resolution

- [ ] Refactor product lookup to return structured identity evidence, not just `product_id`.
- [ ] Record which source resolved the product:
- [ ] lookup table
- [ ] Intel table
- [ ] V6 exact match
- [ ] Fail if lookup returns multiple plausible products without one exact winner.
- [ ] Fail if colour is only inferred weakly.
- [ ] Fail if RAM/SSD resolution is partial.
- [ ] Tighten Intel resolution so it cannot fall through to fuzzy V6 matching.
- [ ] Tighten shared-model resolution for:
- [ ] `A2442`
- [ ] `A2485`
- [ ] `A2918`
- [ ] `A2992`
- [ ] Require CPU/GPU-derived variant proof for those models.
- [ ] Remove or disable fuzzy acceptance for risky/shared-variant models.
- [ ] Record the final resolved identity evidence for logging and reporting.

## Phase 4: Stored Listing Reuse Hardening

- [ ] Refactor stored-listing reuse into a dedicated validator function.
- [ ] Fetch the live BM listing before any reuse decision.
- [ ] Validate exact match on:
- [ ] grade
- [ ] `product_id`
- [ ] colour
- [ ] RAM
- [ ] SSD
- [ ] CPU/GPU markers where relevant
- [ ] Treat any mismatch as reuse failure.
- [ ] Do not silently continue with partial matches.
- [ ] If mismatch is detected:
- [ ] send Telegram alert
- [ ] log the mismatch reason
- [ ] add the listing to denylist if critical
- [ ] fall back to fresh listing search/create only if safe
- [ ] Stop treating Monday stored listing id as trusted by default.
- [ ] Stop treating stored UUID as sufficient proof by itself.
- [ ] Remove SKU-only reuse validation as an approval path.

## Phase 5: Listing Search and Slot Selection

- [ ] Refactor listing search to operate on canonical identity, not just `product_id + grade`.
- [ ] For candidate reusable listings, inspect:
- [ ] title
- [ ] product_id
- [ ] grade
- [ ] quantity
- [ ] colour evidence
- [ ] RAM evidence
- [ ] SSD evidence
- [ ] CPU/GPU evidence where needed
- [ ] Reject ambiguous candidates.
- [ ] Reject candidates on denylist.
- [ ] Prefer exact validated candidates only.
- [ ] If no exact clean candidate exists, choose fresh creation path.
- [ ] Add explicit logging for why each candidate was accepted or rejected.

## Phase 6: Denylist

- [ ] Create a persistent denylist file for unsafe legacy/reused listings.
- [ ] Choose file location under the Back Market repo.
- [ ] Choose file format:
- [ ] listing id
- [ ] listing UUID if available
- [ ] reason
- [ ] timestamp
- [ ] item id
- [ ] operator/source
- [ ] Load denylist at script start.
- [ ] Check denylist before any Path A/A2 reuse.
- [ ] Auto-append when:
- [ ] critical verification fails
- [ ] stored listing validation fails critically
- [ ] manual operator mark is added
- [ ] Log denylist hits clearly in dry-run and live mode.

## Phase 7: Post-Action Verification and Rollback

- [ ] Expand post-create/post-reactivate verification into a full validator.
- [ ] Verify after any write:
- [ ] `product_id`
- [ ] grade
- [ ] quantity
- [ ] publication state
- [ ] title RAM
- [ ] title SSD
- [ ] colour
- [ ] CPU/GPU markers where relevant
- [ ] Define which mismatches are critical vs non-critical.
- [ ] On critical mismatch:
- [ ] set quantity to `0` immediately
- [ ] send Telegram alert
- [ ] add listing to denylist
- [ ] mark the run as failed
- [ ] Ensure verification uses the canonical identity object.
- [ ] Ensure retries do not reactivate a listing already marked unsafe.

## Phase 8: Live-Mode Safety Controls

- [ ] Enforce `--live --item <id>` for phase 1.
- [ ] Refuse bulk live mode during first rollout.
- [ ] Add an explicit guardrail error if `--live` is used without `--item`.
- [ ] Add an explicit guardrail error if multiple items are selected in phase 1 mode.
- [ ] Confirm dry-run still works for bulk analysis.
- [ ] Make live mode fail closed when critical data is missing.

## Phase 9: Logging and Audit Output

- [ ] Add a machine-readable run report per item.
- [ ] Choose report location under the repo.
- [ ] Choose JSON structure for:
- [ ] item id
- [ ] selected path
- [ ] canonical identity
- [ ] evidence sources
- [ ] rejected candidate listings
- [ ] chosen listing
- [ ] verification results
- [ ] denylist actions
- [ ] Telegram alerts sent
- [ ] dry-run vs live
- [ ] write timestamps and final outcome
- [ ] Write one report even on blocked/failure cases.
- [ ] Make log lines explain decisions, not just API actions.

## Phase 10: Operator Runbook

- [ ] Write a short operator note for safe rollout.
- [ ] Include:
- [ ] dry-run command
- [ ] single-item live command
- [ ] examples of blocked conditions
- [ ] meaning of denylist events
- [ ] where audit reports are saved
- [ ] what to manually inspect after each live run
- [ ] Add rollback guidance for operators.

## Phase 11: Historical Problem Cases

- [ ] Build a fixture list of known-problem items/listings.
- [ ] Include at least:
- [ ] wrong-colour examples
- [ ] wrong-RAM examples
- [ ] wrong-SSD examples
- [ ] shared-model variant confusion cases
- [ ] legacy stored listing mismatches
- [ ] Intel model edge cases
- [ ] Run dry-run checks against those examples.
- [ ] Confirm the new logic blocks or routes them safely.

## Phase 12: Cleanup of Existing BM Listing Pool

- [ ] Audit current BM listings and classify them as:
- [ ] trusted reusable
- [ ] ambiguous
- [ ] never reuse
- [ ] Seed the denylist from obvious unsafe listings.
- [ ] Optionally create a future allowlist for trusted reusable listings.
- [ ] Document any catalogue/product-id inconsistencies found during audit.

## Phase 13: Testing

- [ ] Add isolated helper functions where logic is currently too entangled to test safely.
- [ ] Add tests for normalization helpers.
- [ ] Add tests for risky-model variant resolution.
- [ ] Add tests for colour normalization and hard-gating.
- [ ] Add tests for stored listing validation.
- [ ] Add tests for post-list verification.
- [ ] Add tests for denylist handling.
- [ ] Add tests for live-mode guardrails.
- [ ] Run dry-run end-to-end checks on a small sample before live use.

## Phase 14: Rollout Checklist

- [ ] P0 safety changes implemented.
- [ ] Dry-run reports generated for sample items.
- [ ] Known-problem cases reviewed manually.
- [ ] Denylist file exists and is loaded correctly.
- [ ] Single-item live guardrail confirmed.
- [ ] Telegram alerts confirmed.
- [ ] Rollback-to-quantity-zero path confirmed.
- [ ] First live item completed and reviewed manually.
- [ ] First 5 live items completed with zero critical mismatches.
- [ ] Bulk live remains disabled until manual sign-off.

## Nice-to-Have After Safe Launch

- [ ] Introduce trusted allowlist for clean reusable listings.
- [ ] Normalize/replace dirty legacy BM SKUs.
- [ ] Build a repeatable BM listing pool audit command.
- [ ] Add a curated migration path from legacy reuse to clean reusable inventory.
- [ ] Revisit controlled bulk live only after safe single-item history is established.

---

## QA Audit (Code, 24 Mar 2026)

**Auditor:** Code (Claude Code, VPS-verified)
**Scope:** Cross-reference TODO against `list-device.js` (1843 lines), `LIST-DEVICE-SAFE-GO-LIVE-PLAN.md`, and codebase state

### Verdict

Thorough and well-structured. Correctly identifies the core risks. Several implementation-critical gaps.

---

### Issue 1: Script cannot run from clean checkout (BLOCKER)

`list-device.js` imports from `./lib/monday`, `./lib/bm-api`, `./lib/logger` (lines 16-18). These modules **do not exist** at `backmarket/scripts/lib/`.

They exist at `/home/ricky/builds/bm-scripts/lib/` (the old parallel directory with: monday.js, bm-api.js, logger.js, profitability.js, slack.js, dates.js).

**Impact:** The script throws `MODULE_NOT_FOUND` on every invocation from `backmarket/scripts/`. Phase 0 ("Map Current Behaviour") cannot even begin without fixing this.

**Resolution needed:** Either:
- Copy `bm-scripts/lib/` to `backmarket/scripts/lib/` as a temporary fix, or
- Wait for the shared lib (`backmarket/lib/`) from the master rebuild plan and refactor imports — but that blocks ALL list-device work until Phase 2 of the master plan completes

This must be resolved BEFORE any other phase of this TODO.

---

### Issue 2: product-id-lookup.json path points to `bm-scripts/` (HIGH)

Line 30: `const PRODUCT_ID_LOOKUP_PATH = '/home/ricky/builds/bm-scripts/data/product-id-lookup.json'`

This file also exists at `/home/ricky/builds/backmarket/data/product-id-lookup.json` (we copied it during repo reorganisation). The script references the old location.

**Resolution needed:** Update path to `backmarket/data/product-id-lookup.json` or make it configurable.

---

### Issue 3: V7 data path points to `buyback-monitor/` (HIGH)

Line 29: `const V6_DATA_PATH = '/home/ricky/builds/buyback-monitor/data/sell-prices-latest.json'`

This is Hugo's buyback-monitor data directory — a separate repo. If the scraper is redeployed under `backmarket/services/bm-price-scraper/` (per master plan), this path breaks.

**Resolution needed:** The TODO doesn't mention data path migration. Phase 3 (Product Identity Resolution) depends on V7 data but doesn't specify where V7 data will live after the rebuild.

---

### Issue 4: Colour handling already partially exists — TODO doesn't acknowledge it (MEDIUM)

The TODO treats colour normalization as fully new work (Phase 2). But `list-device.js` already has:
- A `colourMap` at line 810 mapping specs to BM variants (Space Gray → [Space Gray, Space Grey], etc.)
- Colour variant searching at lines 821-827
- Colour normalization at line 582 (`space grey` → `space gray`)
- Colour fallback logic at lines 631-682 (try other colours for V6 price data)

This isn't a from-scratch build — it's a hardening of existing partial logic. The TODO should reference the existing code locations so the implementer knows what to extend vs replace.

**Resolution needed:** Phase 2 should say "harden existing colour handling at lines 810-827" not imply starting from zero.

---

### Issue 5: Stored listing validation already partially exists — TODO doesn't acknowledge it (MEDIUM)

The TODO's Phase 4 (Stored Listing Reuse Hardening) describes validation that is **already partially implemented** at lines 1543-1619:
- Grade match check ✅ (line 1556)
- Product_id match check ✅ (line 1562)
- SKU-based RAM/SSD sanity check ✅ (lines 1574-1586)
- Telegram alert on mismatch ✅ (line 1592)
- Fallback to product_id search ✅ (line 1596)

What's **missing** from the existing code (and correctly flagged in the TODO):
- ❌ Colour verification in stored listing reuse
- ❌ CPU/GPU verification for shared-model variants
- ❌ Denylist check before reuse attempt
- ❌ Fetching the live listing is done but doesn't verify colour/CPU/GPU

**Resolution needed:** Phase 4 should reference the existing validation at lines 1543-1619 and specify exactly what to ADD (colour, CPU/GPU, denylist) rather than implying a full rewrite.

---

### Issue 6: Post-list verification already exists — TODO doesn't acknowledge it (MEDIUM)

Phase 7 (Post-Action Verification) describes a full validator. `verifyListing()` already exists at lines 1288-1341 with:
- Publication state check ✅
- Quantity check ✅
- Grade match (critical) ✅
- Title RAM check (critical) ✅
- Title SSD check (critical) ✅
- Auto-takedown (qty=0) on critical mismatch ✅

What's **missing**:
- ❌ Colour verification in post-list check
- ❌ CPU/GPU markers in post-list check
- ❌ Denylist auto-append on critical failure
- ❌ Telegram alert on critical failure (currently only console.error)

**Resolution needed:** Phase 7 should say "extend `verifyListing()` at line 1288" and list specific additions.

---

### Issue 7: No mention of the shared lib dependency (HIGH)

The master rebuild plan (PLAN-BM-REBUILD-MASTER.md) has `list-device.js` in Phase 4. The shared library (`backmarket/lib/`) is built in Phase 2 of that plan. This TODO doesn't mention the shared lib at all.

Once the shared lib exists, `list-device.js` should import from `backmarket/lib/monday.js` etc. instead of `./lib/monday`. The TODO should note this dependency — otherwise the implementer will build `backmarket/scripts/lib/` as a one-off, then have to refactor again.

**Resolution needed:** Add a note: "Imports should target `backmarket/lib/` (shared library from master rebuild Phase 2). If shared lib isn't ready yet, use `bm-scripts/lib/` as temporary shim."

---

### Issue 8: Phase 11 (Historical Problem Cases) needs real examples (LOW)

The TODO says "Build a fixture list of known-problem items/listings" but doesn't name any. The codebase has real examples:

- `backmarket/qa/TASK-QA-LIST-DEVICE.md` — 7 specific bugs
- `backmarket/qa/QA-ISSUES.md` — field extraction issues
- The shared-model variants are named (A2442, A2485, A2918, A2992) but no actual Monday item IDs or BM listing IDs are provided for test fixtures

**Resolution needed:** Reference `qa/TASK-QA-LIST-DEVICE.md` for known bugs. Ideally include 3-5 real item IDs from Monday that historically caused wrong-spec listings.

---

### Issue 9: `--live` without `--item` is not currently blocked (MEDIUM)

Phase 8 says "Add an explicit guardrail error if `--live` is used without `--item`." The current code (lines 46-49) allows `--live` without `--item` — it processes ALL "To List" items in live mode. This is the bulk-live path that caused damage.

The code already supports `--item` for single-item runs. The guardrail is a 2-line fix but it's not in the script today.

**Resolution needed:** This should be Phase 0, not Phase 8. It's the single most important safety control and it's a trivial fix. Block `--live` without `--item` IMMEDIATELY, before any other work.

---

### Summary

| # | Issue | Severity | Phase Affected |
|---|-------|----------|----------------|
| 1 | Script can't run (missing lib/) | BLOCKER | Phase 0 |
| 2 | product-id-lookup.json wrong path | HIGH | Phase 3 |
| 3 | V7 data path points to buyback-monitor/ | HIGH | Phase 3 |
| 4 | Colour handling already partially exists | MEDIUM | Phase 2 |
| 5 | Stored listing validation already partially exists | MEDIUM | Phase 4 |
| 6 | Post-list verification already exists | MEDIUM | Phase 7 |
| 7 | No shared lib dependency noted | HIGH | All phases |
| 8 | No real test fixture IDs | LOW | Phase 11 |
| 9 | `--live` without `--item` not blocked TODAY | MEDIUM | Should be Phase 0 |

### Recommendation: Immediate Actions (Before Any TODO Phase)

1. **Block `--live` without `--item`** — 2-line fix, prevents bulk damage
2. **Resolve lib/ imports** — either copy `bm-scripts/lib/` or symlink, so the script can actually run
3. **Fix data paths** — point product-id-lookup and V7 data to correct locations

### Verified Against Codebase

- `list-device.js` is 1843 lines ✅
- `./lib/monday`, `./lib/bm-api`, `./lib/logger` do NOT exist at `backmarket/scripts/lib/` ✅
- They DO exist at `bm-scripts/lib/` (6 files: monday.js, bm-api.js, logger.js, profitability.js, slack.js, dates.js) ✅
- Grade verification in stored listing reuse exists (line 1556) ✅
- Product_id verification in stored listing reuse exists (line 1562) ✅
- Colour verification in stored listing reuse does NOT exist ✅
- `verifyListing()` exists at line 1288 with auto-takedown ✅
- `--live` without `--item` is NOT currently blocked ✅
