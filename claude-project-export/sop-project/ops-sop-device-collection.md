# SOP: Device Collection After Repair

**Status:** Draft v1 (compiled from Ricky Q&A, 2026-04-07)
**Scope:** Covers what happens when a device is marked Ready To Collect through to customer handover, post-collection, and uncollected device escalation. Applies to walk-in and mail-in repairs.

---

## 1. Trigger: QC Pass

When Ronny passes a device in QC:

- Marks device as **"Ready To Collect"** in Monday
- Intercom automatically fires a "Ready To Collect" notification to the client
  - Message includes: device is ready, opening hours
  - **Does NOT** book an appointment or give client an option to book one
- Device moves to the **small storage room** (Ready To Collect area)
- Policy: **all devices paid for in advance** — collection should not require payment

---

## 2. Customer Arrival

### Single device collection:

- Client arrives at reception
- Fills out the **iPad Typeform** questionnaire
- Selects **"I'm here to collect"** option
- Typeform captures: **name** and **device they're collecting**
- Typeform auto-submits to **Slack** notification to the team

### Multiple device collection:

- Client indicates in Typeform that they are collecting **multiple devices**
- Typeform then offers a selection of which devices they're collecting
- Team member pulls all listed devices before going up

**Gap:** The "multiple devices" option does not yet exist on the Typeform — needs to be added.

- **Typeform notification is enhanced** to provide context before the team member goes up:
  - **Payment status** — has the device been paid for?
  - **Repair issues** — were there any issues logged during repair?
  - **Turnaround time** — was the repair completed within quoted turnaround?

---

## 3. Client Handover

The team member goes upstairs to the client with their device and:

1. **Confirms the repair was completed**
2. **Confirms what the original fault was** — clients always ask what was done
3. **Confirms payment** — takes payment if device hasn't been paid for (prepayment is the policy going forward, but must still handle the exception)
4. **Returns case and accessories** if they were taken at intake (logged in the "case" field on Monday)

---

## 3b. Device Not Found in Storage

If the device cannot be found when the team member goes to get it:

1. **Manually notify Ronny** (QC lead) — they physically go check
2. **Likely causes:**
   - It's a QC-rejected device that never got pulled back onto the shelf
   - Wrong label, misplaced storage
3. **If still not found:** client is asked to wait, full storage room search conducted

**Gap:** No procedure for this — should be a daily shelf audit ensuring all "Ready To Collect" devices are physically present and accounted for.

---

## 4. Monday Update

- Team member marks the device as **"Returned"** in Monday
- This is the completion of the collection process
- **Access code:** The passcode column is automatically wiped by Monday automation when the device is marked as Ready To Collect

---

## 5. Warranty at Handover

- Currently: all warranty information is explained **verbally only**
- **Gap:** No warranty card or printed information is given with the device
- **Needs:** A physical warranty card or information sheet to accompany the device at handover

---

## 6. Issues at Collection

- Currently: if a customer says something "doesn't feel right" — it's not formally logged
- **Gap:** No process for logging complaints, concerns, or issues raised at handover
- **Needs:** An escalation process — if a customer raises a concern or complaint, it should be:
  - Logged in Monday (on the same item, as a note or status flag)
  - Escalated to relevant team member for follow-up

---

## 6b. Corporate Client Collections

Corporate clients follow the same general flow with these differences:

- Devices are stored in the **same location** as regular clients
- Labels marked with **client name AND company name**
- Corporates **normally let us know in advance** when they're collecting
- **Current gap:** that advance notice doesn't go anywhere — it should be logged in **Monday and Slack** to confirm the collection for that day

## 7. Uncollected Device Escalation

### Current situation:

- No automated chaser for uncollected devices
- Main cause of devices sitting uncollected: **quote rejected** — client has no motivation to collect an unrepaired device
- Devices can sit for extended periods with no follow-up

### Policy (needs implementation):

| Time Uncollected | Action |
|-----------------|--------|
| 0-4 weeks | Device sits in Ready To Collect storage |
| 4+ weeks | **Problem under any circumstance** — should trigger chaser/escalation |

### What needs building:

- Notification to go out at 4 weeks
- **Automated chaser** for uncollected devices (does not exist yet)
- A **client-agreed policy** for how long we hold devices and what happens after
- Clear process for quote-rejected devices that are never collected

---

## Systems Used

| System | What For |
|--------|----------|
| Intercom | "Ready To Collect" notification to client |
| Typeform (iPad) | Client arrival check-in — name + device |
| Slack | Team notification from Typeform submission |
| Monday | Ready To Collect status → Returned, payment tracking, repair issues |

## Known Gaps

1. **No warranty card** — all information given verbally only
2. **No automated chaser** for uncollected devices
3. **No formal complaint logging** process at handover
4. **No client-agreed storage policy** — no terms the customer has agreed to around how long we hold devices
5. **Quote-rejected devices** sitting uncollected with no follow-up
6. **No appointment booking** — clients can turn up at any time during opening hours
7. **Payment exception handling** — prepayment policy not yet enforced
8. **Multiple device Typeform option** missing — can't indicate collecting more than one device
9. **No daily shelf audit** — devices get lost/misplaced with no procedure to catch it
10. **Corporate advance notice** not logged anywhere needs to go to Monday + Slack

## Related SOPs

- Walk-In Simple Repair: `../operations/sop-walk-in-simple-repair.md`
