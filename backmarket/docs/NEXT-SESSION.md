# BackMarket — Resume Here

Last session: 2026-04-22/23. This file is the single entry point for next session. Read this first, then branch into whichever section you need.

---

## Do these two things first, in order

### 1. Fix the urgent bug Hugo logged

**File:** `backmarket/qa/ISSUES.md` → section "2026-04-23 — matchByListingId() picks wrong device when multiple share a listing slot" (~line 78)

**Why urgent:** Revenue leak + silent failure. `dispatch.js` is writing tracking numbers to the wrong Main Board items when multiple BM Devices share a listing_id. Concrete examples already documented (orders 79840346 and 79852451).

**What to do:**
- Read the full entry
- Propose the fix (probably: also filter by `text_mkye7p1c` Sales Order ID being empty, not just `text53` tracking empty)
- Verify against the two reported cases
- Fix → commit → update the ISSUES.md entry status to `FIXED in <sha> — <branch>`

This is today's most important work item. Do it before anything else.

### 2. Decide on the sold-price-lookup merge

**Branch:** `fix/sold-price-lookup` (pushed to origin, PR link ready)

**State:** 4 code files + 2 new docs + PLAN v6 changelog + rollback-log entry. End-to-end verified — three £775 over-bids correctly flip to SKIP_NET at real £697. 14/15 recent bid decisions diff from old behaviour (mostly for the better).

**Decision required:** merge or hold.
- **Merge** means: install the daily cron `15 2 * * * cd /home/ricky/builds/backmarket && /usr/bin/node scripts/build-sold-price-lookup.js --live >> /home/ricky/logs/backmarket/sold-price-lookup.log 2>&1`, then `BM_PRICING_SOURCE=sold_first` (default) goes live. Instant rollback via env flag.
- **Hold** means: leave the gate on the scraper-based pricing it has been on since Phase 0.1. Every day of delay = more bids evaluated against noise.

Context in `backmarket/docs/pricing-architecture.md`.

---

## Everything else — pick up when time permits

### Hugo's other 5 issues (in `backmarket/qa/ISSUES.md`)
- QC To List Watch cron issue is superseded by live `bm-qc-listing.service` on 8015. Monday webhooks now handle `status4 = Ready To Collect` and `status24 = To List`.
- QC handoff / To List approval-card automation is live: Ready To Collect generates the BM SKU; To List posts an SOP 06 dry-run card to Telegram Listings for approval.
- Notifications live env probe passed on the VPS with `ICORRECT_TELEGRAM_BOT_TOKEN`, `BM_TELEGRAM_CHAT`, Slack auth, and Telegram topics.
- Monday Total Costs formula (`formula_mm0za8kh`) is deprecated for automation; fixed/projected/actual economics are code-derived.
- Reconciliation UUID count cosmetic bug (backlog)
- Scraper noise + iCloud silent-failure (already fixed — these are audit trail, close them out)

### Gate tightening
Recent bids at full-formula margins sit 20-29%. Stated strategy is "fewer, higher-margin." Current hard floor is 15%. If the strategy is real, the floor should move to 25-30% minimum. Quick edit in `buy_box_monitor.py` once you decide.

### Phase 5.2 re-spec
v5 PLAN has it keyed on scraper pricing. Scraper is now known-broken for pricing. Needs a rewrite pointing at sold-lookup + real workshop labour/parts. Deferred until sold-lookup merges.

### Stashes to review or drop
- `stash@{0}` in main builds worktree — has an INDEX.md conflict from this session's branch dance. Probably safe to drop after eyeballing.
- `stash@{1}` — from 2026-04-20, unrelated to this session.

---

## Where things live

| Thing | Location |
|---|---|
| Today's discoveries (scraper + iCloud) | `backmarket/docs/pricing-architecture.md` + `backmarket/docs/icloud-checker.md` (on `fix/sold-price-lookup`) |
| Plan + changelog | `backmarket/docs/PLAN-BM-REBUILD-2026-04-17.md` (v5→v6 changelog section at top, on `fix/sold-price-lookup`) |
| Rollback procedures | `backmarket/docs/rollback-log.md` (on `fix/sold-price-lookup`) |
| Open bugs Hugo finds | `backmarket/qa/ISSUES.md` (on `feat/agents-removed`) |
| Ops-level changes (restart, rotate, flip) | `backmarket/docs/rollback-log.md` (not ISSUES.md — that's for build work) |
| Handoff rules | `/home/ricky/builds/HANDOFF-PROTOCOL.md` |

---

## What NOT to do first

- Don't re-analyse acquisition profitability again. We did it three ways today (5-card spot check, 90-day window, all-purchased window). Numbers are in Codex terminal history + chat — don't re-run unless asking a new question.
- Don't touch the stashes until you've read them — just in case there's uncommitted work that matters.
- Don't trust scraper `models[*].grades.*` fields for pricing decisions. See `pricing-architecture.md`.
