# Status Webhook Remap — 2026-04-08

## Result

The Monday status-notification webhook path was remapped to the minimum-action VPS trigger set.

## New VPS Webhooks

All point to:

- `https://mc.icorrect.co.uk/webhook/monday/status-notification`

Exact `status4` mappings now in place:

| Status label | Status index | Webhook ID |
|---|---:|---:|
| `Received` | `1` | `562149816` |
| `Courier Booked` | `3` | `562149840` |
| `Return Booked` | `19` | `562149843` |
| `Ready To Collect` | `102` | `562149845` |
| `Booking Confirmed` | `106` | `562149846` |
| `Password Req` | `109` | `562149847` |

These are the only status labels the VPS `status-notifications` service actually routes to customer notification templates.

## Removed Webhooks

Deleted during the remap:

| Webhook ID | Reason |
|---:|---|
| `530471762` | Ferrari catch-all `When any column changes, send a webhook` |
| `557594817` | app-listener catch-all webhook |
| `264095774` | old broad `status4` webhook |
| `337386341` | old broad `status4` webhook |
| `520364200` | old `Ready To Collect` webhook replaced by `562149845` |

## Verified

Post-remap live check:

- disposable item: `11697408190`
- disposable Intercom conversation: `215473819420485`
- test status: `Received`
- observed service log:
  - ` → Received for item 11697408190`
  - `✓ Sent received-walkin for item 11697408190 to conversation 215473819420485`
- observed Intercom snippet:
  - `thank you for dropping off your device`

## Remaining Review

Status notification action-burners were removed in this remap.

The parts catch-all webhook `537444955` was remapped separately later on 2026-04-08 and is no longer active.

Still visible via API and worth separate review:

- `349863361`
- `349863952`
- `350113039`

Those legacy catch-all webhooks were not part of the status remap.
