# Monday.com

## Access

- `Observed`: reachable via GraphQL with `MONDAY_APP_TOKEN`
- Endpoint: `https://api.monday.com/v2`
- Documented key boards:
  - Main repair board: `349212843`
  - BM Devices board: `3892194968`
  - Parts/Stock Levels: `985177480`

## Main Board Inventory

- Board: `iCorrect Main Board` (`349212843`)
- Items: `4443`
- Groups: `34`
- Columns: `169`

Representative groups:
- New Orders
- Today's Repairs
- BM Inbound
- Quality Control
- Outbound Shipping
- Trade-In BMs Awaiting Validation
- Locked

Column type profile:
- `51` status
- `32` text
- `20` date
- `16` mirror
- `10` numbers
- `8` formula
- `6` people
- `6` board_relation
- `5` time_tracking

Notable observed column patterns:
- multiple operational concerns are mixed in one board
- linked-board fields are central: `board_relation5` (`Device`) and multiple parts-related relations/mirrors
- formula and mirror fields are used for quote, parts, labour, and timing logic
- shipping, payment, client, QC, BM, and repair states all exist side by side

## BM Devices Board Inventory

- Board: `BM Devices` (`3892194968`)
- Items: `1334`
- Groups: `10`
- Columns: `93`

Representative groups:
- BM Trade-Ins
- BM To List / Listed / Sold
- BM Returns
- Devices to Refurbish
- Rejected / iC Locked
- Shipped

Column type profile:
- `45` mirror
- `13` text
- `10` status
- `8` formula
- `6` board_relation
- `5` numbers

Notable observed columns:
- `board_relation` (`Main Item`)
- `board_relation_mkxzfkpf` (`link to iCorrect Main Board`)
- `text_mkyd4bx3` / `text_mm1dt53s` are documented elsewhere as listing ID / UUID fields
- extensive mirror dependence for repair status, trade-in status, stock, timing, and condition data

Inference:
- the BM board is not an isolated system of record; it is a linked operational view layered on top of the main board and parts data.

## Parts Board Inventory

- Board: `Parts/Stock Levels` (`985177480`)
- Items: `1802`
- Groups: `52`
- Columns: `37`

Representative groups:
- MacBook LCDs
- Battery
- Logic Board
- Face ID
- MacBook Chargers/Cables/Adapters
- Misc
- To Be Processed

Inference:
- this board is a central dependency for inventory-aware automations and mirror/formula fields on the main and BM boards.

## Documentation Cross-References

- `repair-flow-traces.md` describes current state transitions observed from activity logs
- `target-state.md` says the current board mixes repair, comms, shipping, QC, and trade-in concerns and cites `187` total automations (`147` active, `40` deactivated)
- `main-board-column-audit.md` documents the current board as a high-automation, high-complexity board and identifies linked-board dependencies
- `webhook-migration/discovery/monday-webhooks.md` documents `31` webhook registrations on board `349212843`

## Observed Webhook Layer

Source: `builds/webhook-migration/discovery/monday-webhooks.md`

- Total webhook registrations documented: `31`
- Two active catch-all webhooks are explicitly flagged as token burners with unknown destinations:
  - `537444955` `change_column_value`
  - `530471762` `change_column_value`
- Properly filtered `status4` webhook IDs are documented separately from those catch-all rules:
  - `264095774`
  - `337386341`
  - `520364200` (`Ready To Collect`)
  - `554555283` (`Shipped`)
- Other targeted operational webhook IDs include:
  - `537692848` invoice action
  - `526854222` parts required
  - `520364311` parts deducted -> do now
  - `554546166` pay-out
  - `530469026` item created
  - serial-trigger webhooks `250217665`, `542684924`, `554493080`

UI screenshot confirmation:
- `builds/monday/automation screenshots/Screenshot 2026-03-30 at 14.00.15.png` shows both catch-all webhook automations active in the Monday UI with `3,572` actions each at capture time.
- by owner/description in that screenshot:
  - the Michael Ferrari-owned catch-all rule is labeled `Notifications.`
  - the Ricky Panesar-owned catch-all rule is labeled `Stock Checker`
- the same screenshot also shows active filtered webhook rules for:
  - `Status changes to Shipped`
  - `Repair Type changes to Pay-Out`
  - `Status changes to Diagnostic Complete`
  - `IMEI/SN changes`
- `Screenshot 2026-03-30 at 14.00.31.png` shows `Status changes to Ready To Collect, send a webhook` active with `61` actions at capture time.

Observed implication:
- Monday native webhooks are a distinct dependency layer from both native automations and n8n workflows.
- Several operational flows are now confirmed to depend on filtered webhooks, while the two catch-all rules remain unresolved risk.

## Open Threads

- confirm destination URLs in Monday UI for catch-all webhook IDs `537444955` and `530471762`
- confirm whether item-create webhook `530469026` and sale webhook `309734967` still point to live consumers
- identify the exact board relations and mirror dependencies that drive BM listing, intake, parts, and stock flows
