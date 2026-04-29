# Parts Shortage Alert Tool — V1 Planning Note
Last updated: 2026-04-29
Status: planned / ready for build brief
Source: Ricky office-hours planning in Operations topic

## Purpose

Prevent customer/device expectation damage caused by booked or accepted repairs needing parts that are already at shortage risk.

The tool is an alert layer on top of the existing repair stock checker. It does **not** order parts, reserve stock, deduct stock, message customers, or automate browser ordering in V1.

## Primary problem

Devices are arriving, or customers are committing to repairs, before the business has completed a reliable stock check or reservation path. The critical failure mode is an incoming or accepted job where a required part has stock `0` or `1`, and nobody sees the shortage early enough to delay, warn, or order in time.

Known related failure modes:

- Clients sign up when stock is low or out.
- Parts run out or get wasted, causing repair delay.
- A device is logged as requiring a part but no action follows.
- Ronnie/Roni often only finds out after Safan asks.
- Stock can reach zero without reorder ownership.

## V1 scope

### Triggers, in priority order

1. **Booked repair**
   - Highest value trigger.
   - Reason: the business can still delay the booking, warn the customer, or order the part before arrival.

2. **Quote accepted**
   - Second priority.
   - Reason: customer expectation has been created and stock risk should be surfaced before it becomes a workshop blocker.

### Shortage threshold

V1 shortage risk is simple:

- Stock `0` = shortage alert
- Stock `1` = shortage alert

Future versions should support part-specific reorder thresholds, but those thresholds need a defined stock policy first. Do not invent them during V1.

### Alert destinations

1. **Monday update on the repair item**
   - Must sit as an additional alert beside the existing stock checker output.
   - The alert must be clearly labelled as a shortage alert, not just stock visibility.

2. **General Slack view**
   - Purpose: stop the alert staying buried inside Monday updates.

### Alert body

Use exactly this V1 shape:

```text
Parts Shortage Alert — Review Required
Job: [customer / item]
Trigger: Booked repair or Quote accepted
Required repair: [repair]
Linked part: [part]
Available stock: 0/1
```

No V1 owner field. No V1 action automation.

## Relationship to existing stock checker

Existing stock checker:

- Runs from Requested Repairs changes.
- Posts a stock-check Monday update.
- Gives current stock visibility.
- Is read-only.

New alert layer:

- Fires only when a booked repair or accepted quote creates active demand for a required part at stock `0–1`.
- Posts a clearly labelled shortage alert.
- Also sends the alert to the general Slack view.
- Remains read-only/action-only in V1.

## Out of scope for V1

- Browser automation for ordering parts.
- Automatic reorder creation.
- Part reservation/allocation.
- Parts deduction.
- Customer messaging.
- Part-specific reorder thresholds.
- Owner/action workflow beyond the alert itself.

## Future enhancements

- Part ordering workflow once browser automation is reliable.
- Part-specific reorder thresholds by part category or sales velocity.
- Reservation/allocation at quote acceptance or booking.
- Explicit alert owner and resolution state.
- Escalation if alert remains unreviewed.
- Demand conflict detection where multiple incoming jobs need the same low-stock part.
