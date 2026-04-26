# Back Market — capture frontend URL for an active listing

Read-only flow. Given an active-listing **SKU**, find the canonical UK frontend URL (`/en-gb/p/<slug>/<product_uuid>?l=12`) and reconcile its public spec page against the SKU tokens. Output is one record fit for the iCorrect `listing-frontend-url-map.json` pipeline (verification_status = `captured_spec_match` / `_mismatch` / `sku_row_not_found`).

## Why this skill exists

Back Market does not expose a public API for frontend URL lookup. Codex tried to log in headlessly via DataImpulse residential proxies on the VPS for 5 days — it stalls on Cloudflare's email-code/2FA gates. Attaching the harness to the user's already-signed-in Chrome makes Cloudflare a non-issue: it clears the silent JS challenge in under 8 seconds and the user's session is already past every login gate.

## URL patterns

- **Seller back-office active listings**: `https://www.backmarket.co.uk/bo-seller/listings/active?orderBy=-quantity&pageSize=10` — landing page; do not pre-set the `sku=` param via URL, the SKU input field validates differently when typed (and Codex's row-detection assumes the visual filter UI was used).
- **Filtered URL after Apply**: same path with `?...&sku=<SKU>` appended.
- **Public product page**: `https://www.backmarket.co.uk/en-gb/p/<slug>/<product_uuid>?l=12`. The trailing `?l=12` is appended automatically by Back Market on first visit (12 = UK market). The legacy form `/second-hand-<slug>/<bm_id>.html#l=3` from the CSV is **not** the canonical frontend URL — always re-derive via the seller portal.

## CDP attach (user's signed-in Chrome)

The user typically runs Chrome with `--remote-debugging-port=9333` (Codex's setup) so multiple agents can share one authenticated session without disturbing their main browsing. Discover the websocket once and pass via `BU_CDP_WS`:

```bash
WS=$(curl -s http://127.0.0.1:9333/json/version | python3 -c "import sys,json;print(json.load(sys.stdin)['webSocketDebuggerUrl'])")
BU_CDP_WS="$WS" BU_NAME=bm browser-harness <<'PY'
print(page_info())
PY
```

Use `BU_NAME=bm` (or per-session) so this attach doesn't collide with any other harness.

## Stable selectors

The bo-seller listings table is React + obfuscated CSS-module classnames — selectors break on every release. What survives:

- Each row contains exactly **one** `a[href*="/en-gb/p/"]` — that's the GB public link. Walking up the DOM from the link finds the row container; gate on `row.innerText.length > 200 && row.querySelectorAll('a[href*="/en-gb/p/"]').length === 1`.
- The SKU filter input has empty `placeholder` and empty `name` — find it by enumerating all `input` elements in the visible filters strip, then identify by position (it's the second input in the filter row) or by the column header above it (text = `SKU`).
- "Apply filters" / "Reset filters" / "More filters" / "Archive listing" are reliable `button` matches on `textContent.trim()`.
- Row text format: `Title\nSKU: <SKU>\nDeal opportunity\n<Grade>\nArchive listing\n<rest>`. The literal `SKU: ` prefix is the most reliable anchor for parsing the SKU back out.

## Workflow per SKU

1. **Reset filters** if a previous SKU is still applied. Click `Reset filters` → wait 1s → re-screenshot to confirm 10 rows return.
2. **Click the SKU input** (find its bounding rect via JS). `type_text(sku)` directly — no need to clear first if filters were reset.
3. **Click `Apply filters`**. Wait 1.5–2s. The page does a server round-trip; row hydration is not instant.
4. **Verify**: query `a[href*="/en-gb/p/"]`. Expected count = 1. If 0 → `sku_row_not_found` (listing may be archived/on-hold/offline). If >1 → unexpected; abort and ask Ricky.
5. **Extract** the row's GB link `href` → that's the candidate `frontend_url` (still missing `?l=12`, BM appends it on first hit).
6. **Open in a new tab** with `new_tab(href)`. Wait for load.
7. **Cloudflare check**: if `page_info().url` contains `/testchallengepage`, poll for up to 25s. Real signed-in Chrome clears it silently in ~5–8s. If still challenged after 25s, abort — the session may have lost its `cf_clearance` cookie.
8. **Capture** H1, the spec dl/dt/dd table, page title, and the canonical URL (now includes `?l=12`).
9. **Reconcile**: compare each SKU token to spec evidence (see below). All-match → `captured_spec_match`. Any mismatch → `captured_spec_mismatch`.
10. **Write record**, screenshot for evidence, close the public tab, return to the bo-seller tab for the next SKU.

## SKU token map (iCorrect's MacBook scheme)

iCorrect's SKUs follow `<MODEL>.<MODEL_REF>.<CHIP>.[<GPU>.]<RAM>.<STORAGE>.<COLOUR>.<GRADE>`:

| Position | Example | Reconcile against (public spec) |
|---|---|---|
| Model family | `MBP` / `MBA` / `IPHN` etc. | `spec.Model` and H1 model name |
| Manufacturer ref | `A2338` | `spec.Manufacturer Ref` |
| Chip | `M1`, `M2`, `M3` | `spec.Processor` (e.g. "Apple M1 8-core") |
| GPU cores (sometimes) | `7C`, `8C`, `10C` | `spec.Graphic card` ("8-core GPU") |
| RAM | `8GB`, `16GB` | `spec.Memory (GB)` |
| Storage | `256GB`, `1TB` | `spec.Storage (GB)` (note: BM stores TB as raw GB; `1TB` = `1000 GB`) |
| Colour | `Silver`, `Grey`, `Starlight` | `spec.Colour` (case-insensitive; "Grey" vs "Space Gray" needs an alias map) |
| Grade | `Fair`, `Good`, `Excellent`, `Premium` | Portal row `Condition` field (reliable); public page Condition selector lists all available grades, not just this listing's grade |

**Trap**: BM's H1 colour for some Apple devices uses Apple's marketing name ("Space Gray", "Midnight", "Starlight"), not the iCorrect SKU's plain-English colour ("Grey", "Black"). When `colour` token doesn't match literally, check the `dt:Colour` row of the spec table — that one tracks the Apple marketing name, so an iCorrect-side alias map is needed. Codex's existing `listings-colour-map.json` likely already encodes this.

**Trap**: Storage tokens look mismatched when the listing's CSV title says one capacity but the public page advertises another. Trust the public page over the CSV — Codex saw multiple cases where the CSV title was stale and the actual product UUID points at a different storage SKU. Mark these `captured_spec_mismatch` and surface to Ricky.

## Output schema (one record)

Write into `data/captures/browser-harness-captures-<YYYY-MM-DD>.json` as:

```json
{
  "generated_at": "<ISO>",
  "captured_via": "browser-harness CDP attach to user's signed-in Chrome on 127.0.0.1:9333 (Mac, GUI)",
  "source_active_listings_csv": "<path>",
  "records": [{
    "listing_id": "<numeric Listing no.>",
    "listing_uuid": "<UUID Listing ID>",
    "back_market_id": "<numeric Back Market ID>",
    "sku": "<SKU>",
    "product_id": "<UUID from frontend URL>",
    "seller_portal_url": "<bo-seller filtered URL>",
    "frontend_url": "<en-gb/p/.../<uuid>?l=12>",
    "captured_at": "<ISO>",
    "verification_status": "captured_spec_match | captured_spec_mismatch | sku_row_not_found",
    "spec_snapshot": {
      "page_title": "...",
      "h1": "...",
      "portal_row_text": "...",
      "sku_spec_check": [{"field":"chip","expected":"M1","evidence":"...","ok":true}, ...],
      "sku_spec_mismatches": [...],
      "screenshots": ["<paths>"]
    },
    "source": "backmarket-active-listings-export+browser-harness-verification"
  }]
}
```

This is a strict superset of Codex's existing `listing-frontend-url-map.json` record schema, with three additions:
- `back_market_id` (Codex's pipeline already has it from the CSV; explicit in the capture)
- structured `sku_spec_check` array (vs Codex's stringified version) — easier to filter/aggregate
- `screenshots` paths for audit

The Codex pipeline that builds the canonical map can ingest this file as a higher-trust source than the no-browser inferred captures.

## Hard safety rules (inherited from Codex's TODO)

- **Read-only.** No clicks on `Save`, `Archive`, `Activate`, `Apply markup`, customer messages, refunds, returns, warranties, price changes, inventory changes, or publication state.
- **No SKU edits.** SKU canary is a separate explicit-approval flow (see `RUNBOOK-SKU-PORTAL-CANARY-2026-04-26.md` on VPS).
- **Stop on email-code / captcha / interactive Cloudflare.** Real-browser-attach sessions don't normally hit these; if they do, the session is degraded and any further action is unreliable.
- **Do not log cookies, tokens, or auth-bearing URL params.** Redact `?token=…`, `?auth=…` if seen.

## Pacing for bulk runs

- Reset filters between every SKU. Skipping the reset works most of the time but leaves you debugging selector states when it doesn't.
- Wait 1.5–2s after Apply filters; 2–3s after `new_tab` for the public page; an extra ~5s budget per SKU for Cloudflare clearance on first hit per session.
- Single tab strategy: instead of opening N public tabs, navigate the same public tab via `goto(href)` after each capture (avoids tab leak on long runs). The seller portal tab stays separate.
- Realistic throughput on a warm session: ~1 SKU per 12–15 seconds, including reconciliation. ~250 SKUs/hour. ~1000 SKUs in ~4h.

## What NOT to capture in this skill file

- The Codex DataImpulse / mailbox-IMAP / 2FA login chain — that approach is being deprecated by browser-harness attach; documenting it here would propagate the wrong path.
- The SKU canary write flow — separate skill, requires explicit per-SKU approval.
- Customer-care portal patterns — out of scope per Codex's SKILL.
