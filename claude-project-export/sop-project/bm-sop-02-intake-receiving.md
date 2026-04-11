# SOP 2: Intake & Receiving

## Overview
Device arrives at the workshop. Team matches it to the Monday item, enters the serial number, and automated checks run (iCloud lock, spec validation).

## Service
- Runtime file: `/home/ricky/builds/icloud-checker/src/index.js`
- Systemd unit: `icloud-checker.service`
- Live unit file: `/home/ricky/.config/systemd/user/icloud-checker.service`
- Bind: `127.0.0.1:8010`
- Public ingress: nginx proxies `https://mc.icorrect.co.uk/webhook/icloud-check*` to `127.0.0.1:8010`
- Slack interactivity ingress: `https://mc.icorrect.co.uk/webhook/icloud-check/slack-interact` goes to `127.0.0.1:8003` (`telephone-inbound`), which forwards non-phone actions to `127.0.0.1:8010/webhook/icloud-check/slack-interact`

## Trigger
- Physical: device arrives via Royal Mail
- Team member matches customer name on package to Monday board item in "Incoming Future" group

## Flow

### Step 1: Match device to Monday item
- Team finds the item on Main Board "Incoming Future" group by customer name

### Step 2: Mark as received
- Team sets `status4` (Status) to "Received" on Main Board
- This auto-triggers `date4` (Received) to populate with today's date

### Step 3: Enter serial number
- Team enters serial number into Main Board column `text4` (IMEI/SN)
- This triggers the iCloud check webhook automatically (Step 4)

### Step 4: iCloud check + spec validation (automated)

Triggered by: Monday webhook fires when `text4` is written on board 349212843.

**4.1 Webhook receives event**
- Route: `POST /webhook/icloud-check` (port 8010)
- Validates: column is `text4`, board is `349212843`
- Extracts serial from event value
- Checks item is a BM client (`clientType === "BM"`), skips if not

**4.2 SickW iCloud check**
- Queries SickW API with the serial number
- Returns iCloud lock status: ON or OFF
- If SickW fails: posts error comment to Monday item (`❌ iCloud Check Failed`), stops

**4.3 Updates Monday iCloud status**
- Sets `color_mkyp4jjh` (iCloud) to "IC ON" or "IC OFF"

**4.4 Apple spec lookup (M1+ only)**
- Queries Apple Self Service Repair API using serial
- Gets: model, colour, chip, CPU, GPU, RAM, storage
- Pre-M1 devices: skipped ("Apple specs unavailable")
- Updates `status8` (Colour) on Main Board from Apple data
- Colour comparison later uses normalization logic in `src/lib/colour-map.js` (e.g. Space Gray / Space Grey normalization)

**4.5 Spec comparison**
- Reads BM claimed specs from BM Devices Board via `board_relation5` link
- Compares Apple-confirmed specs vs BM claimed specs (RAM, SSD, chip)
- If no BM Devices link found (`board_relation5` missing): logs warning

**4.6 Posts combined results**
- Single Monday comment: iCloud status + Apple specs + match/mismatch result

**4.7a — If iCloud ON (locked):**
- Dedup check: 6-hour cooldown per item (`_icloudAlertCache`), skips if already alerted recently
- Gets BM order status via `GET /ws/buyback/v1/orders/{orderPublicId}`
- If status is SENT/RECEIVED/TO_SEND: suspends BM order via API
- If already SUSPENDED: notes it, does not re-suspend
- Moves item to iCloud Locked group (`group_mktsw34v`) on Main Board
- Messages customer via BM messages API (`POST /ws/buyback/v1/orders/{orderPublicId}/messages`):
  > "Thank you for your message. Unfortunately, your iCloud account is still linked to the MacBook – could you please double-check that the device is no longer showing in the Find My menu on your iCloud.com account?..."
- Posts to Monday comment + Slack alert
- 30-min recheck scheduler runs inside the `icloud-checker` service (not crontab):
  - Checks BM messages for new customer replies
  - Keyword detection (e.g. "removed", "done", "unlocked")
  - If keyword match: auto-rechecks SickW
  - If unlocked: updates status to "IC OFF", moves to Today's Repairs group, messages customer confirmation, posts Slack
  - If no keyword: posts Slack alert with Recheck/Reply buttons

**4.7b — If iCloud OFF + spec mismatch:**
- Posts mismatch alert to Slack
- Calls `handleSpecMismatch()`:
  - Assesses mismatch direction (better/equivalent/worse)
  - If received spec is better/equivalent: logs "pay_original", proceeds normally
  - If received spec is worse: checks counter-offer rate (must stay below 15%)
  - If at rate limit: logs rate-limited, proceeds at original price
  - If under limit: sets `status24` to "Counteroffer" (index 3) on Main Board, posts Slack message with 3 buttons:
    - ✅ Approve Counter-Offer
    - 💰 Pay at Original
    - ✏️ Adjust Price
  - No auto-counter: requires human button click

**4.7c — If iCloud OFF + specs match:**
- Device verified. Ready for diagnostic (SOP 3)

## What does NOT happen at this stage
- No grading (that's SOP 3)
- No pricing or listing decisions
- No payout
- No passcode check (trade-ins don't have passcodes)

## Columns used

### Main Board (349212843)
| Column ID | Title | Purpose | Set by |
|-----------|-------|---------|--------|
| `text4` | IMEI/SN | Serial number, triggers webhook | Team (manual) |
| `status4` | Status | Set to "Received" | Team (manual) |
| `date4` | Received | Auto-populates when status4 = Received | Monday automation |
| `color_mkyp4jjh` | iCloud | Lock check result (IC ON / IC OFF) | iCloud checker (automated) |
| `status8` | Colour | Updated from Apple spec lookup | iCloud checker (automated) |
| `status24` | Repair Type | Set to "Counteroffer" (index 3) if spec mismatch | iCloud checker (automated) |

### BM Devices Board (3892194968)
| Column ID | Title | Purpose | Set by |
|-----------|-------|---------|--------|
| `mirror7__1` | Serial Number | Mirrors `text4` from Main | Auto (mirror) |

## Services
| Service | Port | Route | Purpose |
|---------|------|-------|---------|
| icloud-checker | 8010 | `POST /webhook/icloud-check` | iCloud lock + spec check |
| icloud-checker | 8010 | `POST /webhook/icloud-check/slack-interact` | Slack button handler (recheck, counter-offer actions) |
| icloud-checker | 8010 | `POST /webhook/icloud-check/recheck` | Manual recheck trigger |
| icloud-checker | 8010 | `GET /webhook/icloud-check/spec-check` | Read-only Apple spec lookup endpoint |
| icloud-checker | 8010 | `GET /webhook/icloud-check/health` | Health check |

## Groups
| Group | Group ID | Board | Purpose |
|-------|----------|-------|---------|
| Incoming Future | `new_group34198` | Main (349212843) | Where items arrive |
| iCloud Locked | `group_mktsw34v` | Main (349212843) | Items with active iCloud lock |
| Today's Repairs | `new_group70029` | Main (349212843) | Items cleared and ready for work |

## Error handling
- SickW API fails: error comment posted to Monday, item not moved, no status change
- Apple spec lookup fails: non-blocking, logs warning, iCloud check still proceeds
- BM Devices link missing: warning logged, spec comparison skipped
- Duplicate webhook fires: 6-hour cooldown on iCloud alerts prevents spam
- Recheck loop is service-managed: first run starts ~60s after service boot, then repeats every 30 minutes
- Slack customer-reply alerts route via `telephone-inbound` on port `8003`, then forward to `icloud-checker`

## BM API endpoints used
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/ws/buyback/v1/orders/{orderPublicId}` | GET | Check BM order status |
| `/ws/buyback/v1/orders/{orderPublicId}/suspend` | PUT | Suspend order (iCloud locked) |
| `/ws/buyback/v1/orders/{orderPublicId}/messages` | POST | Message customer |
| `/ws/buyback/v1/orders/{orderPublicId}/messages` | GET | Read customer replies (recheck cron) |

## Helper Mappings
- Colour normalization in `src/lib/colour-map.js`
  Used when comparing Apple colour vs BM/Monday colour so equivalent labels do not false-mismatch.
- Grade mapping in `src/lib/grade-map.js`
  Used elsewhere in the same service for BM listing/status flows; not part of the core intake webhook itself, but it is part of the shared `icloud-checker` service logic.

## QA Notes (2026-03-28)

### Findings
1. `PASS` Column IDs in the SOP match the live service constants.
   Verified against `BOARD_ID`, `SERIAL_COLUMN`, `STATUS_COLUMN`, `ICLOUD_LOCKED_GROUP`, `TODAYS_REPAIRS_GROUP`, `BM_BOARD_RELATION`, `COLOUR_COLUMN`, and the BM Devices spec columns in `src/index.js`.

2. `PASS` Today's Repairs group ID filled in.
   The live constant is `new_group70029`, so the placeholder text was removed.

3. `PASS` Recheck schedule clarified.
   The 30-minute recheck is not a VPS crontab entry. It is an in-process scheduler inside `icloud-checker`:
   first run starts about 60 seconds after boot, then repeats every 30 minutes via `setInterval`.

4. `PASS` `board_relation5` confirmed.
   The SOP correctly references the BM Devices link column used by the service.

5. `PASS` Service / ingress / extra endpoints documented.
   Added the runtime file, systemd unit, nginx ingress shape, Slack-forwarding path, `spec-check`, `recheck`, and `health` endpoints.

6. `PASS` Helper mapping logic documented.
   Added notes for colour normalization and grade mapping helper files so the SOP no longer implies all logic lives inline in `index.js`.

7. `PASS` No CLI section needed.
   This is a webhook service, not a CLI script.

8. `PASS` No stale V6 references found in the active SOP.

### Per-check Summary
1. Column IDs vs service constants: `PASS`
2. Group IDs vs service constants: `PASS`
3. Recheck scheduler vs live VPS state: `PASS`
4. BM Devices relation column: `PASS`
5. Service / unit / ingress documentation: `PASS`
6. Mapping/helper logic documented: `PASS`
7. Stale references / V6 mentions: `PASS`

### Known Operational Limits
- Apple spec lookup is only available for supported serials; pre-M1 or unsupported serials can skip the detailed spec comparison path.
- Colour mapping and grade mapping live in shared helper files, so changes there can affect behavior without the SOP body changing.
- The service still contains other non-intake routes because `icloud-checker` remains a shared monolith for the unsplit handlers.

### Verdict
SOP 02 now matches the active `icloud-checker` intake flow closely enough to hand to an agent without the earlier documentation gaps.
