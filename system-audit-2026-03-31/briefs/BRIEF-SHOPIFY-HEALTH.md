# Brief: Shopify Product Listing Health Audit

## Objective

Audit every Shopify product listing for completeness, SEO quality, pricing accuracy, and identify gaps where Monday products should be listed but aren't. This directly feeds the GSC/profitability crossref work.

## Data Sources

### Shopify
- Store: `i-correct-final.myshopify.com` / `icorrect.co.uk`
- Use REST Admin API with `SHOPIFY_ACCESS_TOKEN` from `/home/ricky/config/api-keys/.env`
- Pull ALL products with: title, handle, body_html, product_type, tags, variants (price, compare_at_price, sku, inventory), images (alt text), SEO title, SEO description, status (active/draft/archived), published_at

### Monday
- **Products & Pricing board**: `2477699024` - for cross-reference
- Credentials: `MONDAY_APP_TOKEN` from `/home/ricky/config/api-keys/.env`

### GSC (from existing file)
- Read `/home/ricky/builds/system-audit-2026-03-31/gsc-repair-profit-rankings.md` for search performance by page

## Analysis

### 1. Listing Completeness
For each Shopify product, check:
- Has a description (body_html is not empty/minimal)
- Description length (flag <100 chars as thin)
- Has at least one image
- All images have alt text
- Has proper product_type set
- Has relevant tags
- Has SEO title (meta title) set
- Has SEO description (meta description) set
- SEO title length (flag >60 chars or <30 chars)
- SEO description length (flag >160 chars or <70 chars)
- Price is set and >0
- Status is active (not draft/archived)

### 2. SEO Quality Assessment
- Does the SEO title include the device name + repair type?
- Does the SEO description include location keywords (London, UK)?
- Does the URL handle follow a consistent pattern?
- Are there duplicate/near-duplicate titles?
- Are there thin content pages (description <200 chars)?

### 3. Pricing Cross-Reference
- Match each Shopify product to its Monday product
- Flag where Shopify price differs from Monday price
- Flag products with no compare_at_price set (missed opportunity for showing "was/now" pricing)

### 4. Missing Listings
- Cross-reference Monday Products & Pricing board against Shopify
- Identify every Monday product that should be on Shopify but isn't
- Prioritise by: does it have a price set on Monday? Has it had completed repairs? Is it a current-generation device?
- Specifically flag NEW device models (iPhone 16 series, latest MacBook models, latest iPad models, latest Apple Watch models) that are missing

### 5. Dead/Stale Listings
- Shopify products that don't match any Monday product (orphaned listings)
- Products for very old devices that may no longer be worth listing
- Draft/archived products that should either be published or deleted

## Output

Write to `/home/ricky/builds/system-audit-2026-03-31/shopify-health-audit.md`:

### Section 1: Summary
- Total Shopify products, active vs draft vs archived
- SEO score distribution (good/needs-work/poor)
- Pricing match rate with Monday

### Section 2: SEO Issues (sorted by GSC traffic descending where available)
| Product | Handle | Issue | Current Value | Recommended Action |

### Section 3: Pricing Mismatches
| Product | Shopify Price | Monday Price | Difference | Action |

### Section 4: Missing From Shopify (sorted by priority)
| Monday Product | Device | Price | Completed Repairs | Generation | Priority | Reason |

Priority levels:
- `critical`: current-gen device, has price, has repair history
- `high`: current-gen device, has price, no repair history yet
- `medium`: previous-gen device, has price, has repair history  
- `low`: older device or no price set

### Section 5: Dead/Stale Listings
| Product | Handle | Status | Issue | Recommendation |

### Section 6: Quick Wins
Top 20 highest-impact fixes ranked by potential traffic/revenue gain

## Constraints

- Read-only. Do not mutate any Shopify or Monday data.

When completely finished, run:
openclaw system event --text "Done: Shopify product health audit complete - written to shopify-health-audit.md" --mode now
