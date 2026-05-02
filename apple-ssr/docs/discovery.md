# Apple Self Service Repair (selfservicerepair.eu) — API Discovery

Run: 2026-04-26. Account: Panrix Ltd (iCorrect).

## 1. Verdict

**Stack:** Angular SPA (Sentry SDK 8.55) on **ASP.NET Core / Microsoft IIS-10** behind AWS ALB. Operator: **CTDI** (`ssr*.ctdi.com` referenced in bundles). Auth: **AWS Cognito**, eu-west-1 pool `eu-west-1_CooYqUepb`, app client `6gkffmi3bl2qdbu6os8bkfmn2n`. Payments: Authorize.net + Radial + Stripe + PayPal.

**Automate?** Parts lookup: **YES**. Order history: **YES**. Order placement: **PARTIAL** — endpoints documented from bundle but never fired (per safety brief). Stripe-only path is the cleanest for headless UK ordering.

## 2. Endpoint surface (full list in `api-inventory.json`)

Base: `https://selfservicerepair.eu/api`

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET  | `/Orders/GetSessionToken` | none | Mints `WEBSTORE_SESSION` token (required by cart endpoints). |
| GET  | `/DeviceTypes` | none | Catalog of all device types + models in 24 langs. ~189 KB. |
| GET  | `/RepairTypes?modelId={id}` | none | Repair types valid for a model. |
| **POST** | **`/Orders/GetDeviceIdRecaptcha?sn={serial}`** | bearer | Serial -> `{deviceModelId, deviceTypeId, deviceModel, deviceModelCode, productCode, manualId, color, findMy}`. Body `{recaptchaToken}` (v3 site key `6LeoZYIdAAAAAAjZn-24zcepMBi08U8a9zvgAFAs`). |
| **GET**  | **`/Spares/SearchByDevice?deviceModelId&repairTypeId&sn`** | bearer | Compatible parts for `(model, repair)`. |
| GET  | `/Spares/Search?q=...` | bearer | Free-text spare search. |
| GET  | `/Account` / `/Addresses` | bearer+session | Profile + saved addresses. |
| GET  | `/Orders/GetMyOrders` | bearer+session | Order history list. |
| GET  | `/Orders/GetOrderByNumber?ordernumber=...` | bearer+session | Full order detail incl. line items, tracking, invoices. |
| POST | `/Orders/AddUpdateCart` | bearer+session | Replace cart. |
| POST | `/Orders/CheckoutStripe` | bearer+session | Stripe payment intent. UK pubkey `stripeLtdPublishableKey`. |
| POST | `/Orders/CheckoutAuth` / `/CheckoutRadial` / `/CheckoutApplePay` | bearer+session | Authorize.net / Radial / Apple-Pay paths (RDFUID hdr). |
| POST | `/paypal/createorder` / `captureorder` | bearer+session | PayPal flow. |
| POST | `/Orders/ReturnLabel` | bearer+session | Generate replaced-part return label (exchange flow). |

## 3. Search-by-serial response shape

`Spares/SearchByDevice` returns `Spare[]`. Per-spare fields that matter:

- `id` (numeric, use as `id_spares` in cart line) and `partnumber` (e.g. `661-21971`)
- `parttypedesc` (`Parts` / `Tools`), `imageurl`, `qtymax` (per-customer order limit)
- Flags: `hero`, `bundle`, `isrepairbundle`, `exchangeable` (core program), `manualidrequired`, `devicerequired`, `findmy`, `unavailable`, `comingsoon`
- `requiredparts`, `suggestedparts`, `relatives`, `choices` (bundle composition)
- `country_specific_attributes[]`: `{id_countries, price, creditamount, authamount, gsxprice, rawgsxprice, rawgsxexchangeprice, gsxexchangeprice}`. **GBP price = GB row.** `creditamount` = exchange credit.
- `language_specific_attributes[]`: `{id_languages, name, slug, description}`.
- Mac variant filters: `cpu`, `gpu`, `memory`, `storage`, `keyboard`, `ethernet`.

**No live stock field.** Only `unavailable`/`comingsoon` booleans. Live stock is likely checked at cart-add — flagged for Ricky.

For `MacBook Pro (14-inch, 2021)` `Display`: 24 candidates; display assembly `661-21971` GBP 531.55 with `exchangeable=true`. For `Battery Management Unit Flex Cable`: 10 parts.

## 4. Order placement chain (NOT FIRED)

1. `GET /Orders/GetSessionToken` -> `WEBSTORE_SESSION`.
2. `POST /Orders/GetDeviceIdRecaptcha?sn=<serial>` body `{recaptchaToken}` -> `deviceModelId`.
3. `GET /RepairTypes?modelId=<id>`.
4. `GET /Spares/SearchByDevice?...`.
5. `POST /Orders/AddUpdateCart` with cart object: `{ details:[{spare, devicemodel:{id}, sn, orderedquantity, id_repairtypes}], country:{id:'GB'}, language:{id:'en'}, currency:{id:'GBP'}, shiptocountry:{id:'GB'}, shiptostate, ordernumber:'' }`. Response sets `articleParams.ordernumber`.
6. `POST /Addresses/Verify` for ship-to.
7. Payment leg — pick one. Stripe path is simplest:
   - `POST /Orders/CheckoutStripe {ordernumber}` -> `{clientSecret, type:"Setup"|"Payment"}` -> Stripe Elements confirm client-side -> `POST /Orders/FinalizeStripePayment` (or `FinalizeStripeSetup`).
   - Authorize.net / Radial paths require `RDFUID` header (Radial fingerprint blob, set by `radial-hostedpayments-js-sdk.js` into a hidden DOM input).
   - Apple Pay: Stripe path or `POST /Orders/CheckoutApplePay` body `{dataDescriptor:'COMMON.APPLE.INAPP.PAYMENT', dataValue:JSON.stringify(token.paymentData)}`.
8. Frontend then calls `orderService.createOrder()` to flip server state from Cart -> Created/Authorized.

## 5. Auth pattern (script-friendly)

```python
HEADERS = {
    "Authorization1": f"Bearer {COGNITO_ID_TOKEN}",   # NOTE: digit "1" suffix is literal
    "WEBSTORE_SESSION": SESSION_TOKEN,
    "Accept-Language": "en-GB",
    "Content-Type": "application/json",
}
SESSION_TOKEN = requests.get(f"{BASE}/api/Orders/GetSessionToken").json()["token"]
```

`COGNITO_ID_TOKEN`: from `localStorage.AUTH_TOKEN.token` after manual login, or refresh via Cognito `InitiateAuth REFRESH_TOKEN_AUTH` against `https://cognito-idp.eu-west-1.amazonaws.com/` with our pool/client ids and the stored `refreshToken`. The literal header **`Authorization1`** (with digit) is what the API checks — not standard `Authorization`.

## 6. Order-history audit summary

iCorrect (Panrix Ltd) on Apple SSR EU:

- **91 orders**, **GBP 11,775.10** total spend, **GBP 129.40** AOV
- **Range:** 2023-07-11 -> 2026-04-15
- **By year:** 2023 GBP 234 (3) | 2024 GBP 5,273 (53) | 2025 GBP 4,301 (27) | 2026 YTD GBP 1,967 (8)
- **Statuses:** 28 Delivered, 42 Replaced-Parts-Return-Complete, 16 Label-Generated, 5 Cancelled
- **36 unique device models repaired**; iPhone-heavy (top: iPhone SE 3G, 13, 14 Pro, 13 Pro)
- **Top by qty:** all 923-* sealing/sticker kits (iPhone SE 3G 923-02012 = 130 units)
- **Top by revenue:** MacBook Pro display assemblies (661-53103 / 661-36941 / 661-27745 each ~GBP 800-920), iPhone displays (661-17920 7× = GBP 496)
- **Most recent:** 2026-04-15  #1WJAA0R6D7A  GBP 91.98  Delivered  661-26143 (MBA M2 part)

Full breakdown in `order-history-audit.md`.

## 7. Risks / unknowns

- **No live-stock field** — needs an Add-to-Cart probe to confirm. Flagged, not done.
- **`qtymax` enforcement** — likely per-customer cumulative; need a test order to confirm.
- **`/api/Env/RadialSetup` returned 405 GET** — needs different verb.
- **Re-auth on idle** — API returns `Authorization token is not valid.` and SPA logs out. Refresh proactively via Cognito.
- **Headless ordering risks**: reCAPTCHA v3 on serial-resolution, Radial RDFUID for non-Stripe checkouts, Cognito refresh. Stripe-only path with our saved card avoids RDFUID and minimises Cognito session cost.

## 8. Skill recommendation

- **`parts-lookup.md`** — Auth bootstrap; serial-to-device flow (note reCAPTCHA cost; do via in-browser session, not headlessly); `Spares/SearchByDevice` with URL-encoded repair-type ids; spare schema cheatsheet (price/exchange/flags); cross-ref Apple part numbers with Mobilesentrix (universal across Apple supply chain); bulk-pull pattern (~250 models × ~15 repair types ≈ 3,750 calls; cache aggressively).
- **`parts-ordering.md`** — Cart shape; 8-step chain; Stripe-preferred for UK; `FinalizeStripeSetup` saved-card fast path; `/Orders/ReturnLabel` exchange flow (46% of audited orders went through it). **Do not publish until UAT-validated.**

---

Files:
- `domain-skills/apple-ssr/discovery.md` (this) | `api-inventory.json` | `order-history-audit.md`
- `/tmp/apple-ssr-orders-raw.json` (91-order list) | `/tmp/apple-ssr-orders-detail.json` (full details, 16 MB)
