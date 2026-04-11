# Research Brief: Retail Repair Profitability Model

## Objective
Build a per-product net profit model for every retail repair product we sell. Map Shopify products → Monday Products & Pricing board → linked parts (with cost) → ACTUAL historical repair time from completed jobs on the main board → net margin.

## What to produce
Write output to: `/home/ricky/builds/system-audit-2026-03-31/repair-profitability-model.md`

## Board Schema

### Products & Pricing Board (2477699024)
Key columns:
- \`name\`: Product name
- \`numbers\`: Price inc VAT
- \`formula\`: Price ex VAT
- \`connect_boards8\` (title: "Parts"): board_relation to Parts board
- \`mirror2\`: Stock Level (mirror from parts)
- \`status3\`: Product Type
- \`text_mkzdte13\`: Shopify ID
- \`link_to_devices6\`: Device relation
- Groups are organized by device model
- IGNORE the \`numbers7\` (Required Minutes) field. It contains guesses, not real data.

### Parts/Stock Levels Board (985177480)
Key columns:
- \`name\`: Part name
- \`supply_price\`: Supply Price (ex VAT)
- \`quantity\`: Total Stock
- \`formula_mkv86xh7\`: Available Stock
- \`link_to_products_beta73\` (title: "Repairs"): board_relation back to main repair board
- \`link_to_products___pricing\` (title: "Products Index"): board_relation to Products & Pricing

### Main Repair Board (349212843)
For historical labour time extraction:
- \`service\` column: repair type
- Item name contains device model and customer name
- Status dates: look for date columns including received date and repaired date
- The key measurement: time from when the device was received to when it was marked repaired
- Filter to completed/returned/shipped items only for clean data

## Required Analysis

### 1. Product-to-Part Mapping
- Pull every item from Products & Pricing board (2477699024)
- For each product, follow the \`Parts\` relation (connect_boards8) to get linked part(s) from the Parts board
- Extract supply price (ex VAT) for each linked part
- Flag products with no linked parts

### 2. Labour Time: MUST USE REAL DATA, NOT GUESSES
- DO NOT use the "Required Minutes" field from Products & Pricing. It contains manual estimates.
- Instead: for each product/repair type, find completed repairs on the main board (349212843) that used the same part(s) or match the same service type + device model
- The Parts board has a "Repairs" relation (link_to_products_beta73) back to the main board. Follow this to find actual repairs that used each part.
- For each matching completed repair, calculate the time between received date and repaired date
- Use the last 10 completed repairs per product/part if available
- Calculate: average repair time, median repair time
- This gives us ACTUAL labour time per repair type
- Labour rate: GBP 24/hr (loaded rate including overhead)

### 3. iPhone Screen Refurbishment Note
- iPhone original screens are made by taking a broken screen and refurbishing it
- The broken screen cost should already be in the parts board
- Add 1 hour (GBP 24) refurbishment labour to the part cost for any iPhone screen repair product
- This refurb time is ON TOP of the repair labour time derived from historical data
- You can identify iPhone screen repairs by: product name containing "Screen" AND device group being an iPhone model

### 4. Net Profit Model Per Product
For each product calculate:
- Sale price inc VAT (from \`numbers\`)
- Sale price ex VAT (from \`formula\`, or calculate as price / 1.2)
- Total parts cost ex VAT (sum of linked parts supply prices)
- Labour cost (actual average repair time from historical data × GBP 24/hr)
- For iPhone screens: add GBP 24 refurb labour on top
- Payment processing fee estimate (use 2% of inc VAT price as blended rate)
- Net profit = Price ex VAT - parts cost - labour cost - payment fee
- Net margin % = Net profit / Price ex VAT

### 5. Per-Part Average Repair Time Summary
Also produce a summary table of average repair times per part, showing:
- Part name
- Number of completed repairs found
- Average time (hours)
- Median time (hours)
- This data will later be written back to the Parts board as a new column

### 6. Output Format
- Full table of all products with: device, product name, price inc VAT, price ex VAT, parts cost, avg repair hours (from real data), labour cost, payment fee, net profit, margin %
- Note where data was insufficient (fewer than 3 completed repairs found)
- Summary by device category (MacBook, iPhone, iPad, Apple Watch)
- Flag products with margin below 40% as "review pricing"
- Flag products with margin above 70% as "healthy"
- Flag products with no parts linkage as "incomplete data"
- Top 10 highest margin products
- Top 10 lowest margin products
- Any products with negative or near-zero margins

## Credentials
Source \`/home/ricky/config/api-keys/.env\` for MONDAY_APP_TOKEN.
Monday GraphQL endpoint: https://api.monday.com/v2

## Rules
- Read only. Do not modify any Monday data.
- Rate limit: max 1 request per second on Monday API
- Use cursor-based pagination for large boards
- Write findings progressively to the output file

When completely finished, run this command to notify:
openclaw system event --text "Done: Retail repair profitability model complete (using real repair times). Output in repair-profitability-model.md" --mode now
