# Fix: Parts Cost Column

## Wrong column
`formula_mkx13zr7` (Parts Cost formula) returns null for all items.

## Correct column
`lookup_mkx1xzd7` (Parts Cost — mirror type, Main Board 349212843)

## Query syntax
```graphql
column_values(ids:["lookup_mkx1xzd7"]) {
  id text
  ... on MirrorValue { display_value }
}
```

## Parsing
`display_value` returns a comma-separated string of individual part costs:
- `"18, 7, 11, 8, 29, 55, 47.0"` → sum = £175
- `"18, 100.0, 7, 11, 3"` → sum = £139
- `"15, 95, 7, 15"` → sum = £132

Split by comma, parseFloat each, sum for total parts cost.

## Verified data (BMs Awaiting Sale group)
- BM 1353: £175 (7 parts)
- BM 1400: £139 (5 parts)
- BM 1429: £132 (4 parts)
- BM 1486: £153 (4 parts)
- BM 1465: £186 (6 parts)

## Also update SOP 06
The SOP references `formula_mkx1bjqr` for parts cost. This is wrong (that's Total Labour).
Correct parts cost column: `lookup_mkx1xzd7` (mirror, needs MirrorValue display_value).
