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

## SKU token map (iCorrect's schemes)

iCorrect uses **different SKU shapes per device family**. The reconciler must dispatch on the family token (first segment) before parsing the rest.

### MacBook (`MBP.*`, `MBA.*`)

Two observed shapes — token order is **not stable**:
- `MBP.A2338.M1.8GB.256GB.Silver.Fair` — ref before chip
- `MBP.M2.A2338.8GB.256GB.Grey.Fair` — chip before ref

Parse positionally by regex match, not by index:

| Token regex | Field |
|---|---|
| `^A\d{4}$` | `manufacturer_ref` (e.g. A2338, A2179) |
| `^M\d+$` | `chip` (Apple silicon: M1, M2, M3, M4) |
| `^I[357]$` | `chip` (Intel i3/i5/i7) |
| `^\d+C$` | `gpu` cores (e.g. 7C, 8C, 10C — present on some, absent on others) |
| `^\d+(GB\|TB)$` | first match = `ram`, second match = `storage` |
| `^(Fair\|Good\|Excellent\|Premium\|GOOD\|Mint\|VeryGood)$` | `grade` (always last segment) |
| Anything else (alphabetic) | `colour` (second-to-last when grade is last) |

Reconcile against the public spec table (`dt`/`dd`):
- `manufacturer_ref` ← `spec.Manufacturer Ref`
- `chip` ← `spec.Processor` (substring match — H1 fallback)
- `gpu` ← `spec.Graphic card` (e.g. "8-core GPU")
- `ram` ← `spec.Memory (GB)` (e.g. "8 GB")
- `storage` ← `spec.Storage (GB)` OR `spec.SSD storage capacity (GB)` (TB = raw GB on BM, so `2TB` = 2000)

### iPhone (`iP*` / `IP*`)

Shape varies; tokens you'll see: family, colour, storage, grade. Examples:
- `iP11.Green.256GB.VeryGood`
- `iP8Plus.SpaceGrey.64GB.Mint`
- `iPXR.White.256GB.Good`

**iPhone product pages don't have a `Storage (GB)` dt/dd entry.** Storage lives only in the **H1 line** in the form `<Family>\n<Colour> • <N> GB • Physical SIM…` (with a literal space between digits and "GB"). The reconciler MUST check H1 for both `'<n>gb'` AND `'<n> gb'` forms — checking only the no-space form misses every iPhone capture.

### iPad (`iPa*`)

Example: `iPaAir4.64gb.blue.good`. Storage token may be lowercase. Spec page does have storage entries.

### Trap: Apple-marketing colour names

BM's `spec.Colour` and H1 use Apple's marketing names ("Space Gray", "Midnight", "Starlight") rather than iCorrect SKU plain English ("Grey", "Black"). The reconciler needs an alias map:

```python
aliases = {
  'grey': ['space gray', 'space grey', 'grey', 'gray'],
  'spacegrey': ['space gray', 'space grey'],
  'silver': ['silver'], 'starlight': ['starlight'], 'midnight': ['midnight'],
  'black': ['black', 'space black'], 'white': ['white'], 'green': ['green'],
  'blue': ['blue', 'sky blue'], 'red': ['red', '(product)red'],
  'gold': ['gold'], 'pink': ['pink'], 'purple': ['purple'],
}
```

Match against `spec.Colour` first, fall back to `H1` and `page_title`. Codex's `listings-colour-map.json` is the canonical source if it exists — read from there before hand-rolling.

### Trap: storage in raw GB, not TB

BM stores `2TB` as `2000 GB` in `spec.Storage (GB)`. SKU tokens use TB suffix. Convert: `m.group(2) == 'TB' → n *= 1000` before substring-matching the spec value.

### Trap: stale CSV titles

Storage tokens occasionally appear "mismatched" when the listing's CSV title says one capacity but the public page advertises another. **Trust the public page (live BM) over the CSV** — multiple cases observed where the CSV title was stale and the canonical product UUID actually points at a different storage SKU. Mark these `captured_spec_mismatch` and surface for triage.

### Reconciler dispatch (skeleton)

```python
def parse_sku(sku):
    parts = sku.split('.')
    fam = parts[0]
    out = {'family': fam, 'parts': parts}
    if fam.upper().startswith('MB'):
        for p in parts[1:]:
            if re.match(r'^A\d{4}$', p): out['ref'] = p
            elif re.match(r'^M\d+$', p): out['chip'] = p
            elif re.match(r'^I[357]$', p, re.I): out['chip'] = p.upper()
            elif re.match(r'^\d+C$', p): out['gpu'] = p
            elif re.match(r'^\d+(GB|TB)$', p, re.I):
                if 'ram' not in out: out['ram'] = p.upper()
                else: out['storage'] = p.upper()
        out['grade'] = parts[-1]
        out['colour'] = parts[-2] if parts[-2] not in ('Fair','Good','Excellent','Premium','GOOD','Mint','VeryGood') else parts[-3]
    elif fam.startswith('iP') or fam.startswith('IP'):
        out['grade'] = parts[-1]
        for p in parts[1:-1]:
            if re.match(r'^\d+(GB|TB|gb|tb)$', p): out['storage'] = p.upper()
            elif p.lower() in COLOUR_TOKENS: out['colour'] = p
    return out

# In reconcile(), for storage check the H1 in BOTH forms:
ok = (f'{n} gb' in stor.lower()) or (str(n) == stor.strip()) \
     or (f'{n}gb' in h1_l) or (f'{n} gb' in h1_l) \
     or (f'{n} gb' in title_l) or (f'{n}gb' in title_l)
```

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

## Pacing for bulk runs (revised after 10-SKU validation, 2026-04-27)

- **Skip the per-SKU filter when N SKUs are visible at once.** The portal page-size of 10 lets you read all 10 row→link mappings in one DOM walk; per-SKU filter+verify is only needed when the SKU isn't on the current page (sku_row_not_found check) or when scaling past one portal page.
- **Single public tab degrades.** Page load time grew 13s → 42s over 8 sequential `goto`s in the same tab on the validation run. **Cap at 8–10 SKUs per public tab** then `cdp("Target.closeTarget", targetId=pub_tid)` and `new_tab(url)` to recycle the renderer. The bo-seller tab stays untouched.
- **Cloudflare can re-challenge mid-batch**, not only on first hit per session. Real-Chrome attach clears the silent JS challenge in ~5–10s on first hit; later re-challenges sometimes don't clear at all and the WS drops. When that happens: restart the harness daemon (`from admin import restart_daemon; restart_daemon()`), re-resolve `BU_CDP_WS` from `:9333/json/version`, recycle the public tab, retry the failed SKU.
- **Realistic throughput observed:** ~26s/SKU (range 13–42s) including ramp-up, reconciliation, and one tab recycle every 8 SKUs. **Plan for ~3.5h per 500-SKU GB run, not the original ~1.5h estimate.**
- **Save records to disk after EACH iteration.** The 10-SKU run lost in-memory state on a WS drop. Append-and-rewrite a JSON file every loop turn so a mid-run failure leaves you with N-of-10 captured rather than 0.
- **Never use `current_tab()` to find the active page.** It returns the browser-level target's info, not the page's. `Target.attachToTarget` against that browser target throws `Page.navigate wasn't found`. Use `list_tabs(include_chrome=False)` and filter by URL substring (`'/en-gb/p/'` or `'testchallenge'`) instead.
- **The bo-seller tab can drift to `/bo-seller/` (landing) between sessions.** Always `goto(LISTINGS_URL)` and `wait_for_load()` at the start of a batch run — don't assume the active-listings filter is still applied just because the tab existed.

## What NOT to capture in this skill file

- The Codex DataImpulse / mailbox-IMAP / 2FA login chain — that approach is being deprecated by browser-harness attach; documenting it here would propagate the wrong path.
- The SKU canary write flow — separate skill, requires explicit per-SKU approval.
- Customer-care portal patterns — out of scope per Codex's SKILL.
