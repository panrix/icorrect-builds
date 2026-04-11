# Brief: Xero Revenue by Repair Type Reconciliation

## Objective

Pull all Xero sales invoices for the last 6 months and match them to Monday repair items. Build actual revenue-per-product-category data to validate or challenge the margin model in `repair-profitability-v2.md`. Quantify the reconciliation gap properly.

## Data Sources

### Xero
- Use Xero API (OAuth 2.0)
- Credentials from `/home/ricky/config/api-keys/.env`: `XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`, `XERO_REFRESH_TOKEN`
- If the refresh token in .env fails, try `/tmp/xero-recon-ATuAJ1/xero-refresh-token.txt` for a more recent one
- Tenant: `Panrix Ltd` (get tenant ID from `/connections` endpoint)
- Pull: all ACCREC (sales/accounts receivable) invoices from last 6 months
- For each invoice: invoice number, reference, contact name, date, due date, status (PAID/AUTHORISED/DRAFT/VOIDED), line items (description, quantity, unit amount, account code, tax type), total, amount due, amount paid, payments

### Monday
- **Main board**: `349212843` - repair items with customer names, device info, repair type, payment columns, Xero invoice ID field
- **Products & Pricing board**: `2477699024` - for product category mapping
- Credentials: `MONDAY_APP_TOKEN` from `/home/ricky/config/api-keys/.env`

### Previous Research
- `xero-monday-reconciliation-gap.md` found 75/295 Xero invoices unresolved (£32K), Monday Invoice Status field broken (all showing "Voided")

## Analysis

### 1. Xero Invoice Inventory
- Total invoices by status (PAID, AUTHORISED, DRAFT, VOIDED, DELETED) per month
- Total revenue by month (PAID + AUTHORISED only)
- Revenue by account code / category
- Average invoice value
- Payment method breakdown if visible from payment details

### 2. Monday Match
For each Xero invoice:
1. Check if the Monday board has a matching Xero Invoice ID
2. If not, try matching by: customer name + approximate date + amount
3. If matched, pull the Monday item's: device, repair type, product links, status
4. Classify the match quality: exact (invoice ID), strong (name+date+amount), weak (name only), unmatched

### 3. Revenue by Repair Category
Using matched items, aggregate revenue by:
- Device category (iPhone, iPad, MacBook, Watch, Other)
- Repair type (Screen, Battery, Charging Port, Board Level, etc.)
- Channel (BackMarket, Walk-in, Mail-in, Shopify, Corporate)
- Month

### 4. Reconciliation Gap Analysis
- Invoices in Xero with no Monday match: list and quantify
- Monday items with payment data but no Xero invoice: list and quantify
- Voided/deleted invoices: are they genuinely cancelled or is the field broken?
- Draft invoices: should they have been sent?
- BackMarket revenue: how much flows through Xero vs stays on BM platform?

### 5. Model Validation
- Compare the margin model's assumed prices against actual Xero invoice amounts per product category
- Flag categories where actual invoiced amount differs significantly from the Monday listed price
- Are there consistent discounts being applied? Bundled pricing? Corporate rates?

## Output

Write to `/home/ricky/builds/system-audit-2026-03-31/xero-revenue-by-repair.md`:

### Section 1: Revenue Summary
Monthly revenue totals, invoice counts, average values

### Section 2: Revenue by Category
Tables breaking down revenue by device, repair type, and channel

### Section 3: Monday Match Results
Match rate, match quality distribution, unmatched items on both sides

### Section 4: Reconciliation Gap
Quantified gap with specific items listed

### Section 5: Model Validation
Where the margin model's price assumptions are confirmed or challenged by actual invoicing

### Section 6: Key Findings
- Is BackMarket revenue properly captured in Xero?
- Are corporate customers getting different rates?
- Where are invoices being created but not paid?
- What's the real gap vs the previous estimate of £30-40K?

## Constraints

- Read-only. Do not create, modify, or void any Xero invoices.
- Do not modify any Monday data.
- Save the refreshed Xero token if you rotate it during auth, to `/home/ricky/config/api-keys/.env` (update the XERO_REFRESH_TOKEN value).
- Handle Xero rate limits (60 calls per minute).

When completely finished, run:
openclaw system event --text "Done: Xero revenue by repair type reconciliation complete - written to xero-revenue-by-repair.md" --mode now
