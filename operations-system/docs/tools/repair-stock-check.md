# Repair Stock Check Tool
Last updated: 2026-04-27
Status: V0 read-only helper

## Purpose

`repair-stock-check.js` checks whether a requested repair has linked stock available in Monday.

It is designed for intake/support use while the full intake app is still being mapped.

The output is intentionally simple:

```text
Stock Check
• Repair: MacBook Air 13 'M1' A2337 Screen
• Linked Part: LCD - A2337
• Available Stock: 10
```

## Location

```bash
/home/ricky/builds/operations-system/tools/repair-stock-check.js
```

## Usage

From `/home/ricky/builds/operations-system`:

```bash
node tools/repair-stock-check.js "MacBook Air 13 M1 A2337" "Screen"
node tools/repair-stock-check.js "iPhone 15 Pro" "Screen"
node tools/repair-stock-check.js "iPhone 12 Mini" "Battery"
```

## Data Sources

The script uses Monday.com:

- Products & Pricing board: `2477699024`
- Parts/Stock Levels board: `985177480`
- Products & Pricing `Parts` relation column: `connect_boards8`

## Correct Monday Relation Lookup

Monday board-relation columns should not be read only from `text` or `value`.

For the Products & Pricing `Parts` relation, the script uses the typed GraphQL fragment:

```graphql
column_values(ids:["connect_boards8"]) {
  id
  type
  text
  value
  ... on BoardRelationValue {
    linked_item_ids
    display_value
  }
}
```

This is important because Monday may return `text: null` and `value: null` while the real linked parts are available in `linked_item_ids`.

## Behaviour

1. Search Products & Pricing for the selected repair.
2. Match the best repair product by device/model and repair type.
3. Read linked part IDs from the product's `Parts` relation column.
4. Fetch stock from Parts/Stock Levels.
5. Print a simple stock-check block.

If no linked part is found, the script falls back to a best-effort Parts/Stock name search. Fallback matches should be treated as guidance only, not authoritative confirmation.

## Validated Examples

```bash
node tools/repair-stock-check.js "MacBook Air 13 M1 A2337" "Screen"
```

Expected output format:

```text
Stock Check
• Repair: MacBook Air 13 'M1' A2337 Screen
• Linked Part: LCD - A2337
• Available Stock: 10
```

```bash
node tools/repair-stock-check.js "iPhone 15 Pro" "Screen"
```

Expected output format:

```text
Stock Check
• Repair: iPhone 15 Pro Screen
• Linked Part: Full Screen - iPhone 15 Pro
• Available Stock: 0
```

## Environment

The script reads `MONDAY_APP_TOKEN` from the environment.

For current local ops use, it also falls back to:

```bash
/home/ricky/builds/icorrect-parts-service/.env
```

## Safety

This script is read-only.

It does not:

- reserve parts
- deduct stock
- write to Monday
- update repair items
- message customers or staff

## Current Limitations

- Product matching is good enough for V0, but not a final intake UX.
- If a Products & Pricing item has no linked part, fallback search is only advisory.
- Multi-part repairs may need a richer output later.
- The full intake app should eventually call this logic through a backend endpoint rather than shelling out to this script.
