# Full GSC x Product Profitability Crossref

## Method

- Search Console property used: `https://www.icorrect.co.uk/`. 90-day window used: `2026-01-03` to `2026-04-02`.
- Property access note: `sc-domain:icorrect.co.uk` returned insufficient-permission with the provided token, so the pull used `https://www.icorrect.co.uk/` instead.
- Trend split used for comparison: current 30d `2026-03-04` to `2026-04-02` vs prior 30d `2026-02-02` to `2026-03-03`.
- Source rows pulled directly from `searchAnalytics/query` with pagination until exhaustion for `query,page` and `page` dimensions.
- Repair-intent filter used the brief keywords only. Broad family+repair queries with no model token were matched to aggregate targets instead of forcing a SKU.

## Section 1: Data Summary

- Total repair-intent `query,page` rows pulled: `1538`
- Unique repair-intent queries: `1436`
- Total clicks: `53`
- Total impressions: `9030`
- Queries matched to products or aggregate targets: `447`
- Queries unmatched: `989`
- Matched targets with traffic: `14`

## Section 2: Product-Level Demand x Profitability

| Product | Net Margin % | Net Profit | Shopify Listed | Total Clicks | Total Impressions | Avg Position | Click Trend (current 30d vs prior 30d) | Top Queries | Action Flag |
| --- | ---: | ---: | --- | ---: | ---: | ---: | --- | --- | --- |
| iPhone Battery (aggregate) | 56.3% | GBP 42.03 | Partial (31/37) | 7 | 655 | 3.7 | 2 vs 2 (0) | iphone battery replacement, iphone battery replacement london, iphone battery replacement near me | grow |
| Apple Watch Screen (aggregate) | 47.3% | GBP 86.11 | Partial (34/46) | 3 | 395 | 6.4 | 0 vs 1 (-1) | apple watch screen repair london, apple watch screen replacement, repair apple watch screen near me | hidden-gem |
| iPad Screen (aggregate) | 46.2% | GBP 85.32 | Partial (5/68) | 2 | 899 | 3.8 | 0 vs 1 (-1) | ipad screen repair near me, ipad screen repair, fixing ipad screen | hidden-gem |
| iPhone Screen (aggregate) | 29.9% | GBP 64.31 | Partial (26/38) | 2 | 737 | 2.8 | 1 vs 0 (+1) | iphone screen replacement, london iphone screen repair, replace screen iphone | investigate |
| MacBook Battery (aggregate) | 62.7% | GBP 115.10 | Partial (27/32) | 2 | 15 | 4.1 | 0 vs 0 (0) | replace macbook battery, macbook air battery replacement, macbook pro battery replacement | hidden-gem |
| MacBook Screen (aggregate) | 57.3% | GBP 215.27 | Partial (29/33) | 1 | 283 | 1.4 | 0 vs 0 (0) | macbook screen replacement london, macbook screen repair, macbook screen fix | hidden-gem |
| Apple Watch Battery (aggregate) | 50.4% | GBP 63.91 | Partial (17/23) | 1 | 25 | 3.7 | 0 vs 1 (-1) | apple watch battery replacement near me, apple watch battery replacement, apple watch battery service | hidden-gem |
| iPhone 13 | n/a | n/a | No | 1 | 9 | 3.4 | 0 vs 0 (0) | iphone 13 repair, repair iphone 13 | investigate |
| iPhone 16 Pro Screen | 2.7% | GBP 7.80 | Yes | 1 | 8 | 3.8 | 1 vs 0 (+1) | iphone 16 pro screen replacement, iphone 16 pro screen replace, iphone 16 pro screen repair | investigate |
| iPhone 8 Battery | 38.6% | GBP 18.99 | Yes | 1 | 8 | 1 | 0 vs 1 (-1) | iphone 8 battery replacement, iphone 8 battery replacement near me | hidden-gem |
| iPhone 12 Battery | 74.1% | GBP 54.97 | Yes | 1 | 6 | 2.2 | 0 vs 0 (0) | iphone 12 battery replacement near me, iphone 12 battery replacement genuine | hidden-gem |
| iPhone Charging Port (aggregate) | 44.8% | GBP 43.30 | Partial (31/37) | 1 | 6 | 2.7 | 0 vs 0 (0) | iphone charger port replacement, repair iphone port, iphone charging port repair | hidden-gem |
| iPhone 14 Plus Battery | 38.4% | GBP 25.25 | Yes | 1 | 3 | 1 | 1 vs 0 (+1) | iphone 14 plus battery replacement | hidden-gem |
| iPhone 16 Pro Charging Port | 83.1% | GBP 137.85 | Yes | 1 | 2 | 10 | 1 vs 0 (+1) | iphone 16 pro charging port replacement | grow |

## Section 3: Unmatched High-Traffic Queries

No unmatched repair-intent queries cleared the `5+ clicks` threshold.

## Section 4: Missing Shopify Listings With Demand

| Product | Net Margin % | Net Profit | Demand Clicks | Demand Impressions | Evidence | Supporting Queries |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| iPhone 13 | n/a | n/a | 1 | 9 | exact product match | iphone 13 repair, repair iphone 13 |
| iPhone 15 Pro Rear Housing | 87.3% | GBP 202.92 | 1 | 2 | related model demand | iphone 15 pro back repair |

### Gap List Cross-Check

| Missing Device Model | Missing SKUs | Related Clicks | Supporting Queries |
| --- | ---: | ---: | --- |
| iPhone 12 | 4 | 1 | iphone 12 battery replacement near me, iphone 12 screen replacement cost near me, iphone 12 screen replacement |
| iPhone 13 | 1 | 1 | iphone 13 repair, screen repair for iphone 13, repair iphone 13 |
| iPhone 14 Plus | 2 | 1 | iphone 14 plus battery replacement |
| iPhone 15 Pro | 2 | 1 | iphone 15 pro back repair, iphone 15 pro screen replacement, iphone 15 pro screen repair near me |
| iPhone 16 Pro | 2 | 2 | iphone 16 pro screen replacement, iphone 16 pro charging port replacement, iphone 16 pro screen replacement near me |
| iPhone 8 | 2 | 1 | iphone 8 battery replacement, take screenshot iphone 8, repairing iphone 8 screen |

## Section 5: Top Landing Pages Performance

| Page | Clicks | Impressions | CTR | Avg Position | Mapped Products | Aggregate Margin |
| --- | ---: | ---: | ---: | ---: | --- | ---: |
| https://www.icorrect.co.uk/ | 48 | 8878 | 0.5% | 4.2 | iPhone Battery (aggregate), Apple Watch Screen (aggregate), iPhone Screen (aggregate) | 51.1% |
| https://www.icorrect.co.uk/contact-us | 5 | 139 | 3.6% | 4.5 | iPad Screen (aggregate), iPhone 14 Plus Battery, iPhone Charging Port (aggregate) | 43.1% |

## Section 6: Recommended Actions

### 1. Products to list on Shopify immediately

No immediate Shopify listing candidates were supported by live GSC demand.

### 2. Products to reprice

No thin-margin or loss-making products cleared the demand threshold for repricing.

### 3. Products to push with content/SEO

1. `iPhone 16 Pro Charging Port`: 83.1% margin, average position 10, 1 clicks.
1. `iPhone 12 Battery`: 74.1% margin, average position 2.2, 1 clicks.
1. `iPhone 14 Plus Battery`: 38.4% margin, average position 1, 1 clicks.
1. `iPhone 8 Battery`: 38.6% margin, average position 1, 1 clicks.

### 4. Products to consider dropping

1. `iPhone 6s Rear Camera Lens`: -307.4% margin and only 0 clicks.
1. `iPhone 8 Plus Display (Original LCD Screen)`: -81.0% margin and only 0 clicks.
1. `iPod Touch 6th Gen Software Re-Installation`: -80.0% margin and only 0 clicks.
1. `iPod Touch 7th Gen Software Re-Installation`: -80.0% margin and only 0 clicks.
1. `iPad Mini 5 Display Screen`: -56.7% margin and only 0 clicks.
1. `iPhone 6s Original LCD Screen`: -53.3% margin and only 0 clicks.
1. `iPhone 7 Plus Rear Camera`: -46.9% margin and only 0 clicks.
1. `iPhone 7 Rear Camera`: -46.9% margin and only 0 clicks.
1. `iPhone 6 Plus Rear Camera`: -44.0% margin and only 0 clicks.
1. `iPhone 6 Rear Camera`: -44.0% margin and only 0 clicks.
1. `iPhone 6s Plus Rear Camera`: -44.0% margin and only 0 clicks.
1. `iPhone 6s Rear Camera`: -44.0% margin and only 0 clicks.
1. `iPad Pro 12.9 (2G) Display Screen`: -39.5% margin and only 0 clicks.
1. `iPad Air 2 Display Screen`: -39.2% margin and only 0 clicks.
1. `iPhone 6 Plus Original LCD Screen`: -37.4% margin and only 0 clicks.
1. `iPad Air 3 Display Screen`: -35.1% margin and only 0 clicks.
1. `iPhone 6 Original LCD Screen`: -34.9% margin and only 0 clicks.
1. `iPad Mini 4 Display Screen`: -32.1% margin and only 0 clicks.
1. `iPhone 6s Plus Original LCD Screen`: -22.4% margin and only 0 clicks.
1. `iPod Touch 6th Gen Battery`: -21.8% margin and only 0 clicks.
1. `Apple Watch S2 38mm Glass Screen`: -21.5% margin and only 0 clicks.
1. `Apple Watch S3 38mm Glass Screen`: -21.5% margin and only 0 clicks.
1. `iPhone 7 Plus Original LCD Screen`: -21.5% margin and only 0 clicks.
1. `iPhone XR Display (Original LCD Screen)`: -15.4% margin and only 0 clicks.
1. `iPhone 6 Charging Port`: -8.0% margin and only 0 clicks.
