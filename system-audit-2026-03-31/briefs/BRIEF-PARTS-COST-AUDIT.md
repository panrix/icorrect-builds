# Brief: Parts Board Cost Gap Audit

## Objective

Audit every part on the Monday Parts board for missing or suspicious supply costs. Cross-reference with Xero supplier invoices where possible to fill gaps. Output a clean report of what's missing, what looks wrong, and what the financial impact is on the profitability model.

## Data Sources

### Monday
- **Parts board**: `985177480` - every part, supply prices, linked products, stock status
- **Products & Pricing board**: `2477699024` - to understand which products are affected by missing part costs
- Credentials: `MONDAY_APP_TOKEN` from `/home/ricky/config/api-keys/.env`

### Xero
- Pull recent purchase invoices (ACCPAY) for the last 12 months
- Match invoice line items to parts by description/name where possible
- Credentials: Xero OAuth via `/home/ricky/config/api-keys/.env` (`XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`). The current refresh token is at `/home/ricky/config/api-keys/.env` as `XERO_REFRESH_TOKEN`. If that fails, check `/tmp/xero-recon-ATuAJ1/xero-refresh-token.txt` for a more recent token.
- Tenant: `Panrix Ltd`

## Analysis

### 1. Missing Supply Costs
- Pull every part from the Parts board
- Flag every part where the supply/cost price is null, zero, or blank
- For each missing-cost part, list: part name, linked product(s), product selling price, how many completed repairs used this part

### 2. Suspicious Supply Costs
- Flag parts where supply cost seems too high (>80% of the linked product selling price ex-VAT)
- Flag parts where supply cost is suspiciously low (<£0.50 for a physical component that isn't a screw/adhesive)
- Flag duplicate parts (same name or very similar name with different costs)

### 3. Xero Cross-Reference
- Pull all ACCPAY (purchase) invoices from the last 12 months
- Extract line items with descriptions
- Attempt to match Xero purchase line items to Monday parts by name/description similarity
- Where a match is found and Monday has no cost, report the Xero cost as a suggested fill
- Where a match is found and costs differ significantly (>20%), flag the discrepancy

### 4. Impact on Profitability Model
- Read `repair-profitability-v2.md` to identify which products were affected by missing part costs
- Calculate: if the missing parts had typical costs for their category, how would product margins change?
- Category cost estimates (use as fallback only):
  - iPhone battery: £8-15
  - iPhone screen (OEM): £40-120 depending on model
  - MacBook screen: £150-400
  - Apple Watch screen: £15-40
  - Small parts (charging port, speaker, mic, lens): £2-15
  - iPad screen: £30-100

## Output

Write to `/home/ricky/builds/system-audit-2026-03-31/parts-cost-audit.md`:

### Section 1: Summary Stats
- Total parts, parts with costs, parts without costs, percentage coverage

### Section 2: Missing Cost Parts (sorted by repair volume descending)
| Part | Linked Products | Product Price | Completed Repairs | Xero Suggested Cost | Impact |

### Section 3: Suspicious Costs
| Part | Current Cost | Issue | Linked Products |

### Section 4: Duplicate/Conflicting Parts
| Part Name A | Cost A | Part Name B | Cost B | Likely Same Part |

### Section 5: Xero Matches
| Part | Monday Cost | Xero Invoice Cost | Xero Supplier | Invoice Date | Discrepancy |

### Section 6: Profitability Impact
- Products whose margin classification would change if missing part costs were filled
- Total £ impact on the model

## Constraints

- Read-only. Do not mutate any Monday or Xero data.
- Do not write supply costs back to Monday. This is an audit only.

When completely finished, run:
openclaw system event --text "Done: Parts cost gap audit complete - written to parts-cost-audit.md" --mode now
