# QA Note — iCloud Checker BM 1605 relation lookup false negative

Date: 2026-04-23
Owner: Hugo
Status: Confirmed bug
Area: `icloud-checker` / Monday GraphQL relation lookup

## Summary

BM 1605 proves the iCloud checker is not failing on iCloud or Apple spec lookup.
The failure is in the **BM Devices lookup step** used for spec comparison.

The Main Board item and BM Devices item are correctly linked in Monday, but the lookup query used by `icloud-checker` returns no BM Devices item.

Result: the checker behaves as if the BM Devices link is missing and skips spec comparison with:

- `⚠️ Could not verify specs — linked BM Devices item not found via board_relation`

## Confirmation case

### BM 1605

- Main Board item: `11788179685`
- Main Board name: `BM 1605 ( Noah Graham )`
- BM Devices item: `11788203140`
- BM Devices name: `BM 1605`
- Trade-in ID: `GB-26164-YXJLZ`
- Serial: `C02H89AGQ6L4`

### Verified working parts

#### Service health

`systemctl --user status icloud-checker`

- service active and running
- health endpoint OK at:
  - `http://127.0.0.1:8010/webhook/icloud-check/health`

#### iCloud / Apple spec lookup

Journal shows:

- `Checking iCloud for BM 1605 ( Noah Graham ), serial: C02H89AGQ6L4`

Direct spec endpoint confirms Apple lookup works:

`GET /webhook/icloud-check/spec-check?serial=C02H89AGQ6L4`

Returned:

- model: `MacBook Air (M1, 2020)`
- color: `SpaceGray`
- chip: `M1`
- cpu: `8-Core`
- gpu: `7-Core`
- memory: `8GB`
- storage: `256GB`

## Actual break

### What the service does

`src/index.js`

- `findBmDeviceItemIdByMainItemId(mainItemId)` runs this query:

```graphql
{ boards(ids: [3892194968]) {
    items_page(limit: 500, query_params: {
      rules: [{ column_id: "board_relation", compare_value: ["11788179685"] }]
    }) {
      items { id }
    }
  }
}
```

- `getBmClaimedSpecs()` depends on that search returning a BM Devices item ID.
- If no item is returned, spec verification is skipped.

### What we verified in Monday

Main Board item `11788179685`:

- status: `BM`
- serial: `C02H89AGQ6L4`
- trade-in ID: `GB-26164-YXJLZ`
- `board_relation5`: points to device lookup board item `3926457177`

BM Devices item `11788203140`:

- group: `BM Trade-Ins`
- `board_relation`: links to Main Board item `11788179685`
- RAM: `8GB`
- SSD: `256GB`
- CPU: `8-Core`
- GPU: `7-Core`

### Failure proof

When querying BM Devices with the exact filter the service uses:

```graphql
{ boards(ids:[3892194968]) {
    items_page(limit:500, query_params:{
      rules:[{column_id:"board_relation", compare_value:["11788179685"]}]
    }) {
      items { id name }
    }
  }
}
```

Result:

- empty `items: []`

So:

- the relation **exists**
- the service lookup query still returns **no match**

## Root cause

The bug is a **false negative in the Monday API lookup pattern** used by `icloud-checker`:

- `items_page`
- filter on `board_relation`
- compare_value = Main Board item ID

This query is not reliably returning BM Devices items even when the relation is present.

## Impact

- iCloud check can still run
- Apple spec lookup can still run
- colour update on Main Board can still run
- spec comparison against BM claimed specs fails
- mismatch detection can be skipped
- counter-offer flow can fail to trigger when it should

This is an intake accuracy risk.

## Recommended fix

Do not rely on `items_page` filtering on `board_relation` for this path.

Instead:

1. fetch BM Devices items directly from the board
2. read `board_relation` as `linked_item_ids`
3. match the target Main Board item ID in application logic

This is the same safer pattern already used in other BM scripts such as listing/reconciliation flows.

## Suggested code area

File:

- `/home/ricky/builds/icloud-checker/src/index.js`

Functions:

- `findBmDeviceItemIdByMainItemId()`
- `getBmClaimedSpecs()`

## QA verdict

Confirmed:

- not an iCloud checker outage
- not an Apple lookup outage
- not missing BM/Main linkage on BM 1605
- yes, a lookup bug in the current Monday GraphQL relation-filter query
