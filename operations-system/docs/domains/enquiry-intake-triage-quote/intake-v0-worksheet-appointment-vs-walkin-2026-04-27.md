# Intake V0 Worksheet — Appointment vs Walk-In
Last updated: 2026-04-27 12:22 UTC
Status: working correction after Ricky feedback, not final SOP
Owner: Ops / Ricky / Naheed

## Purpose

This replaces the too-flat Naheed V0 checklist framing.

The key correction:

> Intake is not always starting from zero.

For booked appointments, much of the pre-repair information should already exist in Monday because the customer has completed the pre-repair form and the n8n automation posts the answers into the Monday item as an update.

For random walk-ins, the business may not have that information yet, so intake has to capture it.

V0 should therefore separate:

1. **Booked appointment / existing Monday item** — verify and fill gaps.
2. **Random walk-in / walk-in form response** — capture the information because it may not exist yet.
3. **Parts check** — use tooling to check whether requested repair has stock support before promising timing.

---

## Flow A — Booked Appointment / Existing Monday Item

### Starting assumption

There is already a Monday item.

The customer may already have completed the pre-repair form.

The Monday item may already contain an update from n8n with answers such as:

- confirmed email address
- current issue description
- whether Apple diagnosed/looked at the device
- whether the device was purchased new or refurbished
- previous repair history
- any other issues noticed
- data backup status
- whether data is important / should be preserved if possible
- passcode

### Naheed’s V0 job

Naheed should **not re-ask everything blindly**.

He should check the Monday item and verify:

1. Is the customer here for the booked item?
2. Does the physical device match the Monday item?
3. Is the pre-repair form update present?
4. Are any critical answers missing or unclear?
5. Is the passcode present, and does the system show enough access detail?
6. Is payment/deposit state clear where required?
7. Is the requested repair clear enough to run a parts check if it is a simple/known repair?
8. Is the next step diagnostic / repair / staff review?

### Output

Add a short Monday update only if something needs confirming, correcting, or escalating.

Suggested format:

```text
INTAKE VERIFY
Customer arrived for booked item: yes/no
Device matches Monday item: yes/no
Pre-repair answers present: yes/no
Missing/unclear info:
Access/passcode status:
Payment status:
Parts check needed/result:
Next step:
Owner:
```

### When to stop / hold

Use a hold if:

- device does not match Monday item
- pre-repair answers are missing and required before moving forward
- passcode is missing/invalid where testing is needed
- payment/deposit is unresolved where required
- requested repair is simple/known but parts status is unknown
- unclear whether the job is diagnostic, repair, or staff review

---

## Flow B — Random Walk-In / Walk-In Form Response

### Starting assumption

There may not be a complete Monday item or pre-repair form history yet.

The customer has physically arrived and intake may need to capture the missing basics.

### Naheed’s V0 job

Capture enough that the next person can act without chasing basics:

1. customer name, email, phone
2. device type/model
3. serial/IMEI where available
4. requested repair or diagnostic
5. clear fault description
6. how/when it happened if relevant
7. Apple diagnosis/service-provider history
8. previous repair history
9. other issues noticed
10. data backed up yes/no/unsure
11. data important/preserve if possible yes/no
12. passcode typed into system
13. payment/deposit state confirmed where required
14. parts check for simple/known repairs
15. next step and owner

### Output

Create or update the official Monday item / walk-in record.

Suggested update:

```text
WALK-IN INTAKE
Customer:
Device:
Requested repair / diagnostic:
Fault description:
Previous repair history:
Apple/service-provider history:
Other issues:
Data backup:
Data important:
Access/passcode:
Payment:
Parts check:
Next step:
Owner:
```

---

## Flow C — Parts Check V0

### Purpose

Before a simple/known repair is treated as repair-ready, check whether the likely part is in stock.

### Current V0 tool

Local script:

`/home/ricky/.openclaw/agents/operations/workspace/tools/parts-stock-check.js`

Example:

```bash
node tools/parts-stock-check.js "iPhone 15 Pro" "Screen"
```

### Current issue found

The script first checks Products & Pricing board `2477699024`.

It looks for the matching repair product, then checks the product’s Parts relation column:

- Products & Pricing column title: `Parts`
- column id: `connect_boards8`

Problem found:

- matching repair products exist, e.g. `iPhone 15 Pro Screen`
- but many products do **not** have the Parts relation filled in
- when the relation is empty, the script falls back to name search on Parts/Stock Levels board `985177480`
- fallback search is useful but not authoritative

### Operational rule today

If the product has connected parts:

- use that stock result as the clean result

If the product has no connected parts:

- treat as **Parts Mapping Missing / Manual Confirmation Needed**
- use fallback search only as guidance
- do not promise timing from fallback alone unless a human confirms the part

---

## Better V0 Definition

V0 is not “ask Naheed this whole checklist every time.”

V0 is:

- booked appointment: verify the Monday/pre-repair data is present and correct
- random walk-in: capture the missing pre-repair data
- simple repair: check parts before promising repair readiness
- all flows: make gaps visible instead of letting them drift

## Open Questions for Ricky / Naheed

1. Where exactly in Monday does the pre-repair form n8n update appear?
2. What wording/format does the pre-repair update use today?
3. Does Naheed reliably open/read that update before seeing the customer?
4. For booked appointments, which fields still commonly need double confirmation in person?
5. For walk-ins, does the walk-in form already capture any of the same pre-repair answers?
6. Where should the parts check result be written today?
7. Who owns fixing the Products & Pricing → Parts relation mappings?

---

## Correction — Monday Board Relation Lookup Syntax

After Ricky challenged the lookup, the parts checker was corrected.

The issue was not that Products & Pricing lacked parts in the tested cases. The issue was the script was only parsing the generic `value` field for the Products & Pricing `Parts` board-relation column. Monday returned `text: null` and `value: null`, while the actual linked parts were available via the typed GraphQL fragment:

```graphql
... on BoardRelationValue {
  linked_item_ids
  display_value
}
```

Correct lookup pattern:

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

Correct Products & Pricing relation:

- board: Products & Pricing `2477699024`
- relation column: `connect_boards8` / `Parts`
- related board: Parts/Stock Levels `985177480`

Validated examples after correction:

- `iPhone 15 Pro Screen` -> linked part `Full Screen - iPhone 15 Pro`, stock `0`
- `MacBook Air 13 'M1' A2337 Screen` -> linked part `LCD - A2337`, stock `10`
- `iPhone 12 Mini Battery` -> linked part `iPhone 12 Mini Battery`, stock `0`

Also corrected product search so it does not rely only on the exact raw string. Example: `MacBook Air 13 M1 A2337 Screen` now finds `MacBook Air 13 'M1' A2337 Screen` by falling back to model token lookup (`A2337`) and local scoring.
