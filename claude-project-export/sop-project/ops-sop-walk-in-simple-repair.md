# SOP: Walk-In Simple Repair

**Status:** Draft v1 (compiled from Ricky Q&A, 2026-04-06)
**Scope:** Walk-in clients dropping off a device for a known, straightforward repair (e.g. screen replacement, battery swap). Does NOT cover diagnostics, mail-ins, BackMarket, or courier service.

---

## 1. Client Arrival

- Location: serviced office (WeWork-style building), not a traditional shop
- Client arrives at the building and is handed an **iPad with a Typeform questionnaire**
- Typeform asks: are you here for a **booked appointment**, **walk-in**, **collection**, or **enquiry**?
- Each type collects different fields:
  - **Booked:** name only
  - **Walk-in:** name, email, device, fault, viewed prices online?
  - **Collection:** name, device collecting
  - **Enquiry:** name, enquiry message
- Typeform submits to **Slack** channel

**Fallback:** If receptionist isn't present, client calls the phone number. Team takes name, goes up. If client hasn't filled the iPad, the team member fills it on their behalf.

**Monday item creation:**
- Booked appointment: already exists
- Walk-in: created automatically by Typeform automation
- Enquiry converted to booking: created manually downstairs
- Collection: item already exists

## 2. Team Member Meets Client

- **Dedicated walk-in person** (currently Andres or Nahid on trial). Always one person assigned
- They monitor Slack, see the notification, go upstairs to meet the client
- Confirm the device matches the booking

### For a simple repair (device screen accessible):
- Access device via passcode with client present
- Basic functionality testing: Face ID, cameras, general check
- Check battery health (easiest upsell if not a battery repair)
- Check for additional faults: anything else wrong? Other issues? Had since new?
- Confirm pre-repair form details, fill gaps if anything missing
- **Confirm deadline with client:** 2 working days for iPhone, generally same day for iPad/MacBook screen
- **Turnaround upgrade:** MacBook screen repairs have a standard vs faster option. Only offer if queue can accept it. (Currently testing before wider rollout)
- **Payment:** taken upfront at this point (card/online). If client refuses to pay until repaired, note this in Monday
- **Passcode:** must collect the device passcode (essential for all drop-offs)
- **Software version:** confirm what OS the device is running if possible. Some Apple calibration (for fitted parts) only works on newer software. If we may need to update, ask permission first (some clients run cracked software or company MDM restrictions)
- **Courier delivery:** offer courier delivery option to all clients, not just corporates (to be added to standard questionnaire)
- **Ask:** if an extra fault is found during repair, what would you like us to do? (currently not asked, but should be)

### If client decides NOT to leave the device:
- Record the reason why (price, needs to think, going to Apple, data concerns, etc.)

## 3. Device Intake (Downstairs)

### Labelling (Brother label machine, client first + last name):
- **iPhone:** label on front + back of device. Device goes into see-through box with screw box on top
- **iPad:** label on back + side. Goes into larger repair box, no screw box
- **MacBook:** 4 labels: spine, bottom (by serial number), inside, + extra loose label inside for tech to peel off for screw box

### Power check:
- If power-related fault: confirm ammeter reading at this point

### Queue:
- Device goes into storage room queue (same queue for repairs and diagnostics)
- Assign to technician:
  - Most repairs → **Saf**
  - iPad/MacBook screen repairs → **Misha**

**Note:** The coordination layer (parts check, allocation, queue management) should be automated, not done by a human. Currently there is NO parts reservation or allocation process. Ideal state: system checks stock, reserves parts at intake, and hands the tech device + part + screw box ready to go.

## 4. Repair

1. Tech checks their Monday queue, reads notes and requested repairs
2. Confirms device and fault match what was written at intake
3. Picks up the part from stock (currently ad-hoc, no allocation system)
4. Completes the repair
5. **Mid-repair test:** part fitted, test it works before sealing
6. Seals the device
7. Completes post-repair testing
8. Updates Monday notes confirming tests completed
9. Marks as **"Repaired"** → moves to QC queue

### Extra fault found during repair:
- Tech pauses the repair
- Writes up notes, tags Michael Ferrari on Monday
- Ferrari manually emails the client (causes delay every time)
- Waits for client response before proceeding
- **Ideal state:** automated notification to client with delay warning, based on intake preference (essential vs optional repair). Not a manual email

## 5. Quality Control (Ronny)

### What Ronny checks:
- Part fitted correctly
- Physical fit: flush, nothing sticking up, screws in properly
- Functionality testing

**Trust issue:** Ideally QC only checks the specific repair. In practice, Ronny does full device testing because techs miss notes, don't tick things off, or don't read notes correctly. Root cause: Monday UI doesn't support fault-based confirmation (should be "fault existed → confirm resolved").

### QC Pass:
- Marks **"Ready to Collect"**
- Client receives notification
- Device goes to collection storage

### QC Fail:
- Marks as **QC Fail**
- Writes reason, takes images
- Device goes back into repairer's queue
- No timing allocation or priority change, tech picks it up themselves
- **Hard rule:** No arguing QC rejections. No justification attempts. Re-repair, confirm fixed, done. (Rule set by Ricky after issues with Saf pushing back)

## 6. Collection

- Client gets "Ready to Collect" notification, comes back in
- Same walk-in tech goes upstairs to meet them
- **Explains:** what was repaired and why (must be accurate, not made up)
- **Confirms:** testing completed
- **Explains warranty:** what it covers, what it doesn't, contact us immediately if any issue
- **Checks:**
  - Completed within turnaround quota?
  - Any flags: client chased, complaints, issues during repair?
  - Client's case returned to them (left at intake)
  - Payment settled (check Monday, though payment data isn't reconciled correctly)
- Marks as **collected/returned** on Monday

---

## Systems Used

| System | What For |
|--------|----------|
| Typeform (iPad) | Client intake questionnaire |
| Slack | Intake notifications to team |
| Monday | Repair tracking, notes, queue management, payment status |
| Brother label machine | Physical device labelling |
| Email (manual) | Extra fault client communication (via Ferrari) |
| Phone | Client contact, fallback arrival process |

## Known Issues

1. **No parts reservation/allocation** at intake. Techs pick parts ad-hoc
2. **Extra fault communication is manual** and always delayed (Ferrari emails)
3. **Payment reconciliation is broken** in Monday
4. **QC over-testing** because techs don't reliably complete/document their own testing
5. **Monday UI too rigid** for fault-based confirmation workflows
6. **Collection explanation** of what was repaired has been made up by team members in the past
7. **No "what if extra fault" question** asked at intake

## Related Docs

- Systems vision: `/home/ricky/builds/agent-rebuild/ricky-systems-dump.md`
- Intake system spec: Systems 1-5 in the systems dump
- QC system spec: System 11 in the systems dump
- Tech dashboard spec: System 7 in the systems dump
