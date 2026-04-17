# QA Fix: Formula Columns Need display_value via FormulaValue Fragment

## Root cause
Monday formula columns return `text=""` and `value=null` by default.
You MUST use `... on FormulaValue { display_value }` in the GraphQL query.

## Correct query syntax
```graphql
column_values(ids:["formula_mkx13zr7","formula_mkx1bjqr","formula__1"]) {
  id text value
  ... on FormulaValue { display_value }
}
```
Then read `display_value` instead of `text`.

## Correct column mapping (IMPORTANT - was wrong before)
- Parts Cost: `formula_mkx13zr7` (display_value, returns number like "45.50")
- Total Labour £: `formula_mkx1bjqr` (display_value, returns £ amount like "109.125")
- Labour Hours: `formula__1` (display_value, returns hours like "7.275")

## Verified working
Naboshika Nantheswaran item returns:
- formula__1 display_value: "7.275" (hours)
- formula_mkx1bjqr display_value: "109.125" (£ labour cost)

## Model+Grade fix
The Monday item name (e.g. "BM 1175") is just the BM reference number.
For the actual model, read the item name from the Main Board (e.g. "MacBook Air 13 M1 2020 8GB 256GB").
For grade, read from BM Devices board status column or from the BM buyback API order data.
