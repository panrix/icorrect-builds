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
