# BackMarket Rebuild — Rollback Log

One entry per deployed change. Every entry gives the exact rollback command(s) to revert within 5 minutes.

---

## Format

```
## YYYY-MM-DD HH:MM UTC — Phase X.Y — <change summary>

**What changed:** ...
**Files touched:** ...
**Rollback command(s):**
```

---

## 2026-04-17 — Phase 0.11 — Verification (no code changed)

Verified pre-existing fixes in `list-device.js`, `reconcile-listings.js`, `sale-detection.js`. No code touched, no rollback needed.

---

## 2026-04-22 — icloud-checker — proxy creds → env + silent-failure alert

**What changed:**
- `icloud-checker/src/apple-specs.js`: hardcoded dataimpulse proxy password removed; now reads `PROXY_SERVER` / `PROXY_USER` / `PROXY_PASS` from `/home/ricky/config/api-keys/.env` via inline env loader. Throws at module-load if vars missing.
- `icloud-checker/src/index.js`: new `else if (appleSpecs?.error)` branch posts the error to Monday + sends Slack alert. Exception path also alerts.
- `/home/ricky/config/api-keys/.env`: new `PROXY_SERVER` / `PROXY_USER` / `PROXY_PASS` entries (appended by Ricky 2026-04-22).
- Backfilled Monday update comments on BM 1602 and BM 1603 with canonical spec-match text (the intake comments that silently failed 2026-04-17/18).

**Commit:** `6049877` on `feat/agents-removed` (pushed to origin).

**Rollback command:**
```bash
# Revert the commit (keeps .env edits since those are outside git)
git -C /home/ricky/builds revert 6049877
systemctl --user restart icloud-checker
# If .env must also revert: remove the three PROXY_* lines manually
```

**Why fixed:** dataimpulse password rotated silently ~2026-04-15. Old code returned `{error}` without `.unsupported` flag → `index.js` only handled `unsupported`, so `specComment` stayed empty and every intake posted only the iCloud status with no spec verification. Ran undetected for 7 days. Affected orders included GB-26154-TYMAL and GB-26161-LEHQG (manually spec-checked after fix).

---

## 2026-04-22/23 — sold-price lookup (pending cutover, NOT yet deployed)

**State:** branch `fix/sold-price-lookup` ready in worktree `/home/ricky/builds-fix-sold-price-lookup/`. NOT merged, NO cron installed, NO live gate switch yet.

**What will change (on merge + cron install):**
- NEW: `backmarket/scripts/build-sold-price-lookup.js` (409 lines)
- NEW: `backmarket/scripts/tests/verify-sold-lookup.js` (588 lines)
- NEW: `backmarket/data/sold-prices-latest.json` (generated)
- PATCHED: `buyback-monitor/buy_box_monitor.py` (+200 lines net — sold-lookup + trade-in SKU resolver + fallback chain)
- PATCHED: `backmarket/services/bm-grade-check/index.js` (+170 lines — symmetrical resolver)
- Cron line to install: `15 2 * * * cd /home/ricky/builds/backmarket && /usr/bin/node scripts/build-sold-price-lookup.js --live >> /home/ricky/logs/backmarket/sold-price-lookup.log 2>&1`

**Rollback (after merge):**
```bash
# Instant runtime rollback (no code change — just flip the env flag)
# In /home/ricky/config/.env or api-keys/.env:
export BM_PRICING_SOURCE=scraper_only
systemctl --user restart icloud-checker                    # if bm-grade-check co-located
systemctl --user restart buyback-monitor                   # if applicable
# Next cron tick of buy_box_monitor.py picks up the new var

# Full revert (undo the code change)
git -C /home/ricky/builds revert <merge-commit>
# Also remove the cron:
crontab -l | grep -v 'build-sold-price-lookup' | crontab -
# And remove the generated data file:
rm -f /home/ricky/builds/backmarket/data/sold-prices-latest.json
```

**Pre-deployment watch:** after cron installs and consumers flip, monitor the next 24h of bids via `/home/ricky/logs/backmarket/sold-price-lookup.log` and compare gate decisions against the pre-cutover behaviour. If the sold-lookup produces unexpected decisions, flip `BM_PRICING_SOURCE=scraper_only` immediately — the scraper path is preserved as fallback.

**Background:** full discovery + architecture in `docs/pricing-architecture.md`. PLAN v5 → v6 changelog has the context.
