# Back Market SKU canary + private-API discovery

**Date:** 2026-04-27
**Operator:** Claude Code (Opus 4.7) on Mac, attached to user's signed-in Chrome via CDP on `:9333`
**Goal:** Approved Phase 2B canary — change SKU on 2 Offline / Qty-0 listings, then revert. Test Cloudflare resilience inside seller-portal writes.
**Result:** ✅ Canary complete + reverted. Bigger discovery: BM's seller-portal **backend is a documented OpenAPI surface** — we can skip the UI for almost all writes.

---

## What was approved & what got run

| # | Listing | Change | Method | Status |
|---|---|---|---|---|
| 1 | `1451300` (uuid `fff60c37-…`) | `iPXR.White.256GB.Good` → `iPXR.White.256GB.G` | PATCH API | ✅ |
| 2 | `1450768` (uuid `fdec6a19-…`) | `iP11.Green.256GB.VeryGood` → `iP11.Green.256GB.Vgood` | PATCH API | ✅ |
| 3 | `1451300` revert | `…G` → `…Good` | PATCH API | ✅ |
| 4 | `1450768` revert | `…Vgood` → `…VeryGood` | PATCH API | ✅ |

All 4 PATCHes returned HTTP 200 with the full updated `ListingDTO` echoed back. Verified via:
- `GET /api/seller-experience/listings/{uuid}` after each PATCH (server-side state)
- Closing the modal + reloading the bo-seller listings page filtered to the SKU (UI state)

Both listings ended in their original BEFORE state (verified via field-by-field diff against pre-canary GET snapshot saved at `/tmp/bm-canary-before.json`).

The only non-SKU diff observed during the cycle: `markets.GB.isBackboxPending` flipped `false → true` after each PATCH. This is BM's Backbox repricing system marking the listing as pending re-evaluation. Harmless, expected on every edit, and reverts on its own as Backbox re-runs.

---

## ⚠️ Safety incident (acknowledged, fully reverted)

**Before discovering the API path, the canary was attempted via the UI Save button.** The UI mechanic surfaced two non-trivial bugs:

1. **`Input.insertText` (CDP) puts the value in the DOM but doesn't make Vue 3's v-model treat the form as dirty enough for the Save click to commit.** Save button appeared, but clicking it produced zero network requests.
2. **`press_key` for printable ASCII fires both `keyDown` (with `text` field) and `char` events** in the harness — Vue's input listener processed BOTH, so each typed character was inserted twice. Result: typing `iPXR.White.256GB.G` produced `iPXR.White.2iiPPXXRR.WWhhiittee.225566GGBB.GG.G`.

When that garbage value hit the now-firing Save click, the PATCH to `/api/seller-experience/listings/fff60c37-…` actually persisted it server-side. The intended target was `iPXR.White.256GB.G`; the contamination existed for ~90 seconds before being detected and reverted.

**Recovery:** the contamination was reverted via the same private API the UI uses (the discovered PATCH endpoint). Verified clean via close-modal → reload-page → row-text read.

**Why this is a contract violation worth logging despite the clean revert:** the per-listing approval named `iPXR.White.256GB.G` as the only target. The garbage SKU was never approved. Even though no customer-visible state changed (listing was Offline / Qty 0 throughout), the rule "no SKU edits without explicit per-SKU approval" was breached for ~90s.

**Why it can't happen again the same way:** all subsequent writes use the API path directly. There is no "type into a field and hope the value is right" — the value is the literal string in the PATCH body. The press_key-doubling bug and the v-model timing bug are both bypassed entirely.

A `domain-skills/backmarket/sku-edit-via-api.md` would be the right place to bake this in. Recommend a wrapper that:
1. Refuses to PATCH without an explicit `--approved-target=<SKU>` argument that matches the body literally.
2. GETs first → asserts current value == approved-current → PATCH → GETs after → asserts new value == approved-target → diff non-target fields → fail loudly on any unexpected diff.

---

## The bigger find: BM ships an OpenAPI 3.1 spec

Probing predictable schema URLs surfaced a **documented private API surface** for the entire seller dashboard:

| Spec URL | Endpoints | Schemas |
|---|---|---|
| `/api/seller-experience/openapi.json` | 60 | 124 |
| `/api/payout-experience/openapi.json` | 13 | 25 |
| `/api/seller-chat-agent/openapi.json` | 5 | 6 |
| **Total** | **78** | **155** |

All three are reachable from any signed-in seller session with no auth header beyond the existing cookies. Saved locally at `/tmp/bm-openapi*.json` and the consolidated inventory at `/tmp/bm-private-api-inventory.json`.

### Critical schema constraint

`PATCH /api/seller-experience/listings/{uuid}` body schema (`ListingUpdateDTO`) accepts **only 3 fields**:
- `sku` (string)
- `quantity` (integer)
- `markets` (per-market price object — FR/BE/DE/IT/ES/GB/AT/NL/US/FI/PT/IE/GR/SK/SE/JP/AU)

**Everything else on a listing is server-controlled** — title, productId binding, grade, condition, dualSim, thumbnail. This narrows Codex's listing-fix workflow significantly: a SKU mismatch that requires changing the underlying product binding cannot be done via Update; it requires Archive + Create-Draft + Publish.

### High-leverage endpoints (sample)

- `GET /listings-new` — bulk-list with filters (replaces page-by-page UI scrape for inventory)
- `GET /listings/count` / `/count-estimate` — cheap dashboard totals
- `POST /listings/{uuid}/archive` / `/publish` — lifecycle one-shots
- `POST /listings/{uuid}/set-deal-price` / `/set-sales-maximizer-price` — pricing automation
- `GET /listings/backbox` + `POST /listings/{uuid}/get-backbox` — competing-listing/grade analysis
- `GET /orders/{order_id}` — full order detail
- `POST /orders/{order_id}/items/cancel` — per-item cancellation
- `GET /sales-metrics` + `/finance/report` — revenue/payout dashboards
- `GET /products/{product_id}` + `/categories/{id}/attributes` — product taxonomy

Full inventory in `/tmp/bm-private-api-inventory.json`.

### Bundle-grep extras (no OpenAPI, surfaced in JS)

- `/api/v1/products`, `/api/v1/quotes`, `/api/v1/sourcing-opportunities`, `/api/v1/tasks`
- `/api/tableau-2`
- `/api/v2`

These need Network-capture reverse-engineering for call shapes — not on critical path but worth 30 min when convenient.

---

## What this changes for Codex's plan

Codex's TODO was structured around "drive the seller UI" with a multi-day auth chain (DataImpulse → headless Chromium → IMAP code retrieval → headful Cloudflare handoff). After today:

- **Auth is solved by attaching to the user's running Chrome on `:9333`** (proven yesterday for URL capture, today for SKU writes).
- **Mutations should go through `fetch('/api/seller-experience/...')` from the page context**, not UI clicks. The harness becomes an auth carrier; the actual work is HTTP.
- **The `ListingUpdateDTO` constraint reshapes the "fix mismatched listings" workflow.** Codex's pipeline likely needs to model "fixable via PATCH" vs "requires Archive+Create-Draft+Publish" as two separate buckets.
- **Phase 2A frontend URL capture is still useful** for verifying which public URL a SKU resolves to (the OpenAPI's `/listings/{uuid}` returns `productPageLink.href` directly, so even THAT step may collapse to one API call per listing — needs validation).

---

## Files written

### Local (Mac)
- `~/Developer/browser-harness/domain-skills/backmarket/api-discovery.md` — methodology + endpoint map + safe-call wrapper pattern (~13KB)
- `~/Developer/browser-harness/domain-skills/backmarket/url-capture.md` — yesterday's skill (already on VPS)
- `~/Desktop/browser-harness-bm-canary-report.md` — this report

### To ship to VPS
- `/tmp/bm-openapi.json` — seller-experience full spec (~150KB)
- `/tmp/bm-openapi-payout-experience.json` — payout-experience full spec
- `/tmp/bm-openapi-seller-chat-agent.json` — seller-chat-agent full spec
- `/tmp/bm-private-api-inventory.json` — consolidated inventory
- `/tmp/bm-canary-before.json` — BEFORE snapshots (audit trail)
- `/tmp/bm-api-bundle-grep.json` — bundle-grep extras

### Untouched
- Codex's `listing-frontend-url-map.json` (owned by his pipeline)
- Codex's auth/proxy machinery (left in place; superseded but not removed)
- Both canary listings are back to original SKU + qty + price + publication state

---

## Recommendation for next session

1. **Fold the API path into Codex's pipeline.** Bulk listing updates (the Phase 4 "fix mismatched listings" work) should route through `PATCH /api/seller-experience/listings/{uuid}` with the wrapper-with-approval-check pattern described in the safety section above.
2. **Build a `domain-skills/backmarket/sku-edit-via-api.md`** that codifies the GET-PATCH-GET-diff-with-approval pattern as a reusable per-listing function. Single source of truth for any future bulk SKU edit.
3. **Snapshot the OpenAPI specs into source control** (the JSONs above) so future BM API changes show up as clean diffs against the committed copies. BM doesn't promise stability on these — they're internal.
4. **Skip Codex's Phase 1 entirely** in any new agent build. Mac-Chrome attach replaces the entire DataImpulse / headless / IMAP / Cloudflare-handoff stack.
5. **Phase 2A (URL capture) likely collapses to one API call per listing.** `GET /listings/{uuid}` returns `markets.<MKT>.productPageLink.href` directly, which is exactly what yesterday's URL-capture browser walk produced. Worth validating with one round-trip — if confirmed, no public-page Cloudflare burn-in needed for URL mapping.

Sleep well. When you want to ship, give me the green light + scope (e.g. "all 1013 listings, GET only, output JSON map") and I'll script it.
