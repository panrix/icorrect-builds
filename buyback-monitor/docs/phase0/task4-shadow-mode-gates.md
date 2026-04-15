# Phase 0 Task 4: Shadow Mode Gate Definitions

## Summary

This report defines measurable thresholds the new engine must hit during Phase 5 (shadow mode) before it can control live bids. Gates are derived from the rebuild plan's acceptance criteria (section 15), the QA review's required plan changes (section 18), and the critique's identified failure modes. Baselines are drawn from the April 13 2026 production run.

## Current System Baselines (Apr 13 Run)

| Metric | Value | Notes |
|---|---|---|
| Total active listings | 2,603 | |
| Winning | 2,110 (81%) | |
| Losing | 493 (19%) | +243 vs prior run |
| Using default sell price (£500) | 1,152 (44.3%) | Fictional price driving real decisions |
| Default-price listings winning | 844 | Winning by luck, not data |
| Default-price listings losing | 308 (62.5% of all losers) | Decisions made on wrong numbers |
| UNKNOWN model family | 135 (5.2%) | Cannot be costed or priced |
| Auto-bumps executed | 212 | |
| Bumps relying on default price | 54 (25.5% of bumps) | **Critical: irreversible spend on fictional data** |
| Model families covered | 5 known + UNKNOWN | MBA13, MBP13, MBP14, MBP16, MBA15 |

### Why This Matters

The current system takes **irreversible financial actions** (auto-bumps that increase bids) where 25.5% rely on a hardcoded £500 default sell price. A £500 default on a device that actually sells for £350 makes unprofitable bumps look profitable. This is the exact failure mode the rebuild plan's acceptance criterion #1 ("no live decision depends on a generic default sell price") is designed to eliminate.

## Shadow Mode Gate Definitions

### Gate 1: Exact Sell-Price Coverage

**Metric:** % of active listings where the engine resolves an exact `PriceFact` from scraper v7 output (not a fallback, not a default).

| Threshold | Verdict |
|---|---|
| >= 80% | PASS |
| 60-79% | CONDITIONAL (investigate gaps, may proceed if gaps are low-volume families) |
| < 60% | FAIL |

**Rationale:** The current system has 55.7% exact coverage (100% minus 44.3% default). The new engine must materially improve on this. 80% means the majority of the catalog is priced from real market data. Below 60% means the engine is no better than the current system.

**Current baseline:** ~55.7% (1,451 of 2,603 have a non-default sell_price_ref)

### Gate 2: Approved Fallback Rate

**Metric:** % of active listings where the engine uses a lower-spec fallback price (e.g., higher-storage price applied to lower-storage variant) rather than an exact match.

| Threshold | Verdict |
|---|---|
| <= 15% | PASS |
| 16-25% | CONDITIONAL (review fallback accuracy on a sample) |
| > 25% | FAIL |

**Rationale:** Lower-spec fallback is conservative by design (the plan specifies using a lower-spec price as a ceiling). But if more than 25% of decisions rely on approximations, confidence degrades. The rebuild plan (section 2) requires conservative pricing; fallback serves that, but only in moderation.

### Gate 3: Blocked Rate

**Metric:** % of active listings the engine explicitly blocks due to missing data, unparseable SKU, no cost fact, or below-threshold profit.

| Threshold | Verdict |
|---|---|
| 5-20% | HEALTHY (engine is correctly refusing to guess) |
| < 5% | SUSPICIOUS (engine may not be blocking enough; review block logic) |
| 21-35% | ACCEPTABLE if blocks are concentrated in genuinely uncoverable specs |
| > 35% | FAIL (too much of the catalog is dark) |

**Rationale:** The plan's default bias is BLOCK (section 9: "Default bias must be BLOCK, not guess"). Zero blocks would mean the engine is guessing somewhere. Current UNKNOWN family rate alone is 5.2%, so a healthy floor is ~5%. Above 35% means the engine can't cover enough of the catalog to be useful.

### Gate 4: Stale Input Rate

**Metric:** % of listings where the most recent scraper v7 data used is older than 48 hours at decision time.

| Threshold | Verdict |
|---|---|
| <= 5% | PASS |
| 6-15% | CONDITIONAL (acceptable if stale listings are auto-blocked) |
| > 15% | FAIL |

**Rationale:** The critique identified stale scraper data as a critical failure mode: the old Python scraper had a 63% failure rate and produced zero data for days, causing mass fallback to £500. The plan requires blocking when "source data is stale" (section 9). The 48-hour window gives one missed daily run as buffer; beyond that, data is unreliable.

**Additional requirement:** Any listing where scraper data is > 48 hours old MUST be blocked, not priced from stale data. This gate measures whether that block is actually firing.

### Gate 5: Decision Divergence (Shadow vs Live)

**Metric:** % of listings where the new engine's recommended action differs from the current system's actual action on the same run.

| Threshold | Verdict |
|---|---|
| Divergence is expected and healthy | INVESTIGATE, not fail |
| New engine blocks where old engine bumped on default price | CORRECT divergence |
| New engine bumps where old engine did not | Review each case manually |
| Divergence > 40% | Requires full review before proceeding |

**Rationale:** The new engine SHOULD diverge from the current system; that's the point of the rebuild. The question is whether divergence is explained by better data (good) or by bugs (bad). Every divergent case must be traceable to a specific fact difference (different sell price source, different cost, block trigger). Unexplained divergence is a bug.

**Tracking method:** For each divergent listing, log:
- Old system action + data sources used
- New engine action + data sources used
- Which fact differs and why

### Gate 6: Zero Default-Price Decisions

**Metric:** Number of listings where the engine makes a RAISE, LOWER, or HOLD decision using a generic default sell price.

| Threshold | Verdict |
|---|---|
| 0 | PASS |
| > 0 | FAIL |

**Rationale:** This is the rebuild plan's acceptance criterion #1, stated as absolute: "no live decision depends on a generic default sell price." This is non-negotiable. If the engine cannot resolve a real or approved-fallback price, it must BLOCK. The current system makes 212 bump decisions daily, 54 of which rely on the £500 default. The new engine must achieve zero.

## What "Pass" Looks Like

All six gates met over a minimum 5 consecutive daily runs:

- Exact coverage >= 80%
- Fallback rate <= 15%
- Blocked rate 5-20%
- Stale input rate <= 5% (with auto-block on stale)
- Divergence reviewed and explained (no unexplained cases)
- Zero default-price decisions

If all gates pass for 5+ consecutive days, the engine is a candidate for Phase 6 (cutover).

## What "Fail" Looks Like

Any of:
- Exact coverage < 60% (engine not materially better than current system)
- Blocked rate > 35% (engine can't see enough of the catalog)
- Any decision made on a default price (absolute blocker)
- Stale data used without blocking (safety violation)
- Unexplained divergence > 10% of total listings

A single-gate failure requires root cause analysis and re-run. The engine does not proceed to cutover until all gates pass cleanly.

## Constraints

- Read-only analysis. No scripts modified.
- No API calls made. All baselines from existing output files.
- Baselines from: `data/buyback/buy-box-2026-04-13.json`, `data/buyback/bumps-2026-04-13.json`, `data/buyback/buy-box-2026-04-13-summary.md`
