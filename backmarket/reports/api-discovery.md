# Back Market — private API discovery & direct-API path

The seller-experience UI is a thin Vue 3 / Nuxt 3 client over a documented private REST API. **Three OpenAPI 3.1 specs are publicly accessible from any signed-in seller session — no auth header beyond the existing cookies.** Together they cover ~78 endpoints across listing/order/pricing/payout/chat surfaces. **Anything you'd otherwise click through the UI, you can call directly via `fetch('/api/.../...')` from the page context.**

## Why this matters

The previous browser-automation plan was "drive the seller UI with browser-harness". After discovering this surface, the plan inverts: **browser-harness becomes an auth carrier (it holds the session and clears Cloudflare); the actual mutations go through fetch() in the page context.** Atomic, fast, bulk-safe, no DOM fighting, no Vue v-model traps. Same pattern as the SKU canary that proved this approach.

A typical mutation collapses from "find input → type via real keyboard events → find Save button → click → wait → poll → screenshot" (15+ seconds, fragile) to one HTTP call (200ms, idempotent).

## The three OpenAPI specs

| Spec URL | Endpoints | Schemas | Surface |
|---|---|---|---|
| `/api/seller-experience/openapi.json` | 60 | 124 | listings, orders, drafts, pricing-rules, sales-metrics, finance reports, insights, mailbook, seller info |
| `/api/payout-experience/openapi.json` | 13 | 25 | KYB / business details / stakeholders / W-9 / payout submission |
| `/api/seller-chat-agent/openapi.json` | 5 | 6 | seller-side support chat conversations |

All three are reachable as plain JSON; download once and version-control them so you can diff against future BM updates and notice when fields/endpoints change.

## Discovery methodology (replay or extend)

The same approach works for any modern admin app. In rough order of leverage:

### 1. Probe predictable schema paths

OpenAPI/Nuxt apps often inadvertently expose specs at well-known suffixes. After identifying the service prefix (find it from any one captured `requestWillBeSent` URL), try:

```
/api/<service>/openapi.json
/api/<service>/swagger.json
/api/<service>/_health
/api/<service>/spec
/api/<service>/_openapi
```

For BM, only `openapi.json` worked — but it gave us the entire surface.

```python
# Run inside browser-harness, where fetch() inherits the user's session cookies
PROBES = [
  '/api/seller-experience/openapi.json',
  '/api/seller-experience/_health',
  '/api/seller-experience/swagger.json',
  ...
]
for p in PROBES:
    r = js(f"""(async()=>{{
      const r = await fetch({json.dumps(p)},{{credentials:'include'}});
      return {{status: r.status, ct: r.headers.get('content-type'), body: (await r.text()).slice(0,300)}};
    }})()""")
    if r and r.get('status') == 200 and 'json' in (r.get('ct','') or ''):
        print(f"✅ {p}")
```

### 2. Drain network on a UI click

Even without a spec, every interactive UI control is a known-good API call you can copy. With the harness:

```python
cdp("Network.enable")
drain_events()  # baseline
# do the click
events = drain_events()
for ev in events:
    if ev.get('method') == 'Network.requestWillBeSent':
        req = ev['params']['request']
        if '/api/' in req['url']:
            print(req['method'], req['url'])
            if req.get('postData'): print('  body:', req['postData'])
```

This is how the SKU PATCH endpoint was first surfaced — clicking Save fired `PATCH /api/seller-experience/listings/{uuid}` with `{"sku":"..."}`. Once one endpoint is captured this way, the OpenAPI probe (step 1) usually unlocks the rest.

For full coverage in one pass: leave Network enabled while a session manually clicks through every page/tab/button. Dedupe by `{method, url-template}`. Done.

### 3. Grep loaded JS bundles for endpoint references

For services that DON'T expose openapi.json, grep what the page already loaded:

```python
urls = js("""[...new Set([
  ...[...document.querySelectorAll('script[src]')].map(s=>s.src),
  ...performance.getEntriesByType('resource').filter(e=>e.name.endsWith('.js')||e.name.endsWith('.mjs')).map(e=>e.name),
])].filter(u=>u.startsWith('http'))""")

import re
all_eps = set()
for url in urls:
    txt = js(f"""(async()=>{{const r=await fetch({json.dumps(url)});return await r.text();}})()""")
    for m in re.finditer(r'/api/[a-z][a-z0-9_/-]*[a-z0-9]', txt or '', re.I):
        all_eps.add(m.group(0))
```

This surfaced four other BM services beyond seller-experience: `payout-experience`, `seller-chat-agent`, `tableau-2`, and a legacy `/api/v1/{products,quotes,sourcing-opportunities,tasks}` set.

The bundle grep also catches endpoints the UI rarely fires, so don't skip it even when openapi.json exists.

## Calling these APIs from inside the harness

```python
def api(method, path, body=None):
    body_arg = f", body: {json.dumps(json.dumps(body))}" if body else ""
    r = js(f"""(async()=>{{
      const r = await fetch({json.dumps(path)}, {{
        method: {json.dumps(method)},
        headers: {{'Content-Type':'application/json'}},
        credentials: 'include'{body_arg}
      }});
      return {{status: r.status, body: await r.text()}};
    }})()""")
    if r and r.get('body'):
        try: r['parsed'] = json.loads(r['body'])
        except: pass
    return r

# All-in-one canary pattern:
before = api('GET',  '/api/seller-experience/listings/<uuid>')
patch  = api('PATCH','/api/seller-experience/listings/<uuid>', {'sku': 'NEW.SKU'})
after  = api('GET',  '/api/seller-experience/listings/<uuid>')
# Diff before vs after: only `sku` and `markets.<MKT>.isBackboxPending` should differ
```

Auth is automatic — `credentials:'include'` makes the browser attach all cookies including `cf_clearance` (Cloudflare bypass) and the seller session. No `Authorization` header needed. No CSRF token needed (BM seller-experience doesn't use one on these endpoints).

## High-leverage endpoints (seller-experience)

The full inventory is in `bm-private-api-inventory.json` — top picks:

| What | Method + Path | Notes |
|---|---|---|
| Read listing | `GET /listings/{uuid}` | Returns full ListingDTO; uuid = `id` field, not legacyId |
| **Update listing** | `PATCH /listings/{uuid}` | Body: `{sku?, quantity?, markets?}`. **Only these 3 fields are mutable.** Everything else (title, productId, grade, dualSim, thumbnail) is server-controlled. |
| Bulk-list listings | `GET /listings-new?...` | Paginated; supports filter params. Replaces the page-by-page UI scrape for inventory mapping. |
| Listings count | `GET /listings/count` / `count-estimate` | Cheap dashboard stat |
| Archive listing | `POST /listings/{uuid}/archive` | One-shot; no body required |
| Publish listing | `POST /listings/{uuid}/publish` | Inverse of archive |
| Set deal price | `POST /listings/{uuid}/set-deal-price` | Promotional pricing |
| Set sales-maximizer price | `POST /listings/{uuid}/set-sales-maximizer-price` / `set-all-...` | Automated repricing |
| Get backbox info | `GET /listings/backbox` + `POST /listings/{uuid}/get-backbox` | BM's competing-listing/grade analysis |
| Get product | `GET /products/{product_id}` | Canonical product spec |
| Get categories + attrs | `GET /categories` + `/categories/{id}/attributes` | Product taxonomy |
| Create draft | `POST /drafts` | Start a new listing |
| Get order | `GET /orders/{order_id}` | Read full order detail |
| **Cancel order items** | `POST /orders/{order_id}/items/cancel` | Per-item cancellation |
| Sales metrics | `GET /sales-metrics` | Revenue/units dashboard data |
| Finance report | `GET /finance/report` | Per-period seller payouts |
| Pricing rules | `GET/POST /pricing-rules` + per-id `apply`/`delete` | Bulk pricing automation |
| Insights | `GET /insights` + `/insights/embedded` | Tableau-embedded dashboards |
| Mailbook | `GET/POST /mailbook` + per-contact PUT/DELETE | Saved buyer contacts |
| Seller info | `GET /seller/information` + `/seller/features` | Account state |

## Key constraint surfaced from the OpenAPI

The `ListingUpdateDTO` schema has only **3 fields**: `sku`, `quantity`, `markets`. Everything else on a listing — title, product binding, grade, condition tier, repair-state, BackBox flags — is **immutable from the seller side via the documented surface**. Side-effect-free pattern: any PATCH that doesn't send those 3 fields is a no-op.

Implications for Codex's pipeline:
- "Fix mismatched listing" workflows that rely on UI-side editing of *anything other than SKU/quantity/price* will fail or silently no-op.
- A SKU mismatch that needs changing the underlying product binding requires Archive + Create-Draft + Publish, not Update. This is bigger scope than Codex's current SKU canary plan.

## Hard safety rules (still apply, no relaxation)

The API path doesn't soften the safety contract; it makes violations **faster and atomic**, so the contract matters more, not less.

- **No mutation without explicit per-listing approval.** API calls do not bypass this — they enforce it at a sharper level (one curl = one mutation, no UI undo).
- **Per-SKU approval still names current SKU + target SKU + Save.** "Save" maps to the PATCH; running the PATCH counts as the Save click for the contract.
- **GET is free.** Bulk reads of `/listings`, `/orders`, `/listings/{uuid}` etc. are read-only and do not need per-record approval.
- **Always GET-after-PATCH** to confirm the mutation, and diff vs the BEFORE GET. The only expected non-target diff is `markets.<MKT>.isBackboxPending` flipping to `true` (BM's repricing system flag — harmless, expected on every edit).
- **Bulk-mutation runs need a kill-switch.** Trivial to wrap a loop around 1000 PATCHes; trivial to corrupt 1000 listings. Add a max-batch-size + dry-run mode + interrupt-on-first-unexpected-diff.

## Bundle-grep services NOT covered by an OpenAPI

These appeared in the JS bundle but lack openapi.json — call shapes need to be reverse-engineered via Network capture (step 2):

- `/api/v1/products`
- `/api/v1/quotes`
- `/api/v1/sourcing-opportunities`
- `/api/v1/tasks`
- `/api/tableau-2`
- `/api/v2` (some root endpoint, unclear)

These are likely older / cross-service surfaces. Not currently on Codex's critical path but worth a 30-min Network-capture sweep when you next have the seller portal open.

## Replay caveat

This skill assumes the user has a live signed-in seller-portal session in the Chrome instance the harness is attached to (port 9333 in iCorrect's setup). If `credentials:'include'` returns 401, the session has expired; fall back to interactive re-auth via the `connection.md` flow.
