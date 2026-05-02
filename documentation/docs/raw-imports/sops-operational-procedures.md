# SOPs & Operational Procedures

> **Source:** Compiled from Claude.ai conversation history (Oct 2025 – Feb 2026)
> **Status:** PARTIAL — Some SOPs are detailed, others are thin outlines needing team input
> **Last updated:** 23 Feb 2026

---

## SOP 1: Walk-In Drop-Off Process

### Overview
When a customer walks in to drop off a device for repair at the London location.

### Trigger
Customer arrives at premises with a device for repair.

### Steps

1. **Greet customer** — confirm their name and the repair they've booked (cross-reference with Monday.com booking)
2. **Verify device details** — confirm the device model matches what was booked
3. **Check device condition on arrival** — note any pre-existing damage (cosmetic, functional) before accepting
4. **Create/update Monday item** — ensure the item exists on the Main Board (board 349212843) in the correct group
5. **Record device details:**
   - Serial number / IMEI → `text4` column
   - Device colour → `status8` column
   - Any customer-reported issues → updates section
6. **Print labels** — print label(s) with the job reference for the device
7. **Change status** → "Received" (`status4`)
   - This triggers the customer notification automation (walk-in variant)
8. **Set device aside** for diagnostic queue

### Notes
- Walk-in appointments have a booking time stored in `date6` column
- Service type should be set to "Walk-In" in the `service` column
- If the customer is a new Shopify order, the item may already exist in the "New Orders" group

---

## SOP 2: Back Market Trade-In Receive & Diagnostic Process

### Overview
Full end-to-end process for receiving, diagnosing, and processing Back Market trade-in devices. This is the most documented SOP — originally written in English and Ukrainian for Ronnie.

### Trigger
BM trade-in devices arrive via Royal Mail (tracking moves items to "Today's Repairs" group automatically via n8n Flow 0).

### Pre-Work
- Navigate to the **BM Trade-In View** on the Monday Main Board
- **Print 3 labels per BM trade-in** device. Label should ONLY contain BM number (e.g., "BM 1023")

### Phase 1: Receive & Match

1. **Unbox one BM trade-in at a time**
2. **Match device to Monday item** — match the return address name on the box to the name on the Monday board (e.g., "Heather" on box = Heather's MacBook on board)
3. **Open the item** — click on the person's name to open it
4. **Navigate to BM Trade-In View** — right-side panel within the item
5. **Verify device model** — confirm the device being sent matches what's recorded on Monday (e.g., MacBook Air 13" A2337)

### Phase 2: Initial Assessment

6. **Ammeter Reading** ⚡ [STATUS CHANGE]
   - Connect device to ammeter/DCPS
   - Record reading as one of:
     - 20V with 1.5A (normal)
     - 20V with under 1A (potential issue)
     - 5V (USB-C fallback — potential logic board issue)
   - Fill in the ammeter reading status column

7. **Record device colour** — update the colour column

8. **Enter serial number** — type the serial number from the bottom of the device into `text4`
   - **This triggers SickW** — automated iCloud lock check runs

9. **Change status from "Expecting Device" → "Received"**

### Phase 3: iCloud Check

10. **Wait for SickW result** — check the updates section for iCloud status
11. **If iCloud LOCKED:**
    - Change repair type from "Trade In" → "iCloud ON"
    - This notifies Ferrari to contact the customer
    - **IMMEDIATELY power off the device** — disconnect all power
    - If customer later removes iCloud, the device must be powered on fresh for the system to update correctly. Power during this window causes the process to fail.
12. **If NO iCloud:** Continue to Phase 4

### Phase 4: Grading & Diagnostics

13. **LCD Pre-Grade** — status column with options:
    - Excellent
    - Good
    - Fair

14. **Lid Pre-Grade** — status column with options:
    - Excellent
    - Good
    - Fair

15. **Top Case (Keyboard Case)** — status column with options:
    - Excellent
    - Good
    - Fair
    - Dead

16. **Customer Reported Condition** — fill in what the customer told Back Market about:
    - Battery condition (reported)
    - Screen condition (reported)
    - Casing condition (reported)
    - Functionality (reported)

17. **Actual Condition** — fill in what you actually find:
    - Battery (actual) — if accessible, record battery health percentage
    - Screen (actual)
    - Casing (actual)
    - Functionality (actual)

### Phase 5: Software & Internals

18. **Software check** — if the device isn't booting correctly or software isn't installed:
    - Perform software reinstallation
    - Use a combination of **Internet Recovery** and **external SSD**
    - Install the **newest software** available for that model
    - ⚠️ T2 models (A2159, A2251, A2289, A2338, etc.) have a more complex reinstall process

19. **Open the device** — remove bottom case to:
    - Check for liquid damage (visual inspection)
    - Record battery health if accessible
    - Visual inspection of internals

20. **Record requested repairs** — these could be:
    - Screen repair
    - Battery repair
    - Custom products
    - Other

### Phase 6: Completion

21. **Change repair type from "Trade In" → "Payout"**
    - This sends a notification to Ferrari
    - Ferrari handles the payout to the customer

### Post-Processing (Ferrari)
- Ferrari reviews the diagnostic information
- Processes the payout to the customer via Back Market
- Device enters the refurbishment queue if repairs are needed before listing

---

## SOP 3: Shipping & Dispatch Process

### Overview
Process for shipping repaired devices back to customers (mail-in) and trade-in devices sold on Back Market.

### Steps

1. **Verify the device** matches the item on Monday (check BM number, customer name, device model)
2. **Print shipping label** — labels are pre-paid via Royal Mail / courier service
3. **Package the device:**
   - Use correct box size for the device model
   - One standard size covers most MacBook models
   - **16" MacBook Pro requires a slightly larger box**
   - Ensure proper padding/protection
4. **Apply label** — place in the centre of the box on the top surface
5. **Tape the box correctly** — (Ferrari can demo the taping process)
6. **Sanity check shipping level:**
   - If shipping a high-value device (e.g., 16" 2022/2023 MacBook Pro), verify the shipping service level matches the device value
   - Track 24 is NOT appropriate for high-value devices — should flag this as an anomaly
   - This isn't a constant check, but should be in the back of your mind
7. **Daily post office run:**
   - Take all packaged devices to the post office once per day
   - Hand over packages — they weigh and verify
   - Collect the confirmation slip proving packages were shipped
8. **If a sold BM device is not yet packaged:**
   - Confirm correct packaging is available
   - Match the correct box size to the MacBook model

### Monday Board Updates
- Status changes to reflect shipped state
- Tracking numbers entered where applicable (`text53` for outbound tracking)
- n8n Flow 7 (Ship Confirmation) handles Back Market API confirmation

---

## SOP 4: Diagnostic Procedures

### Ammeter / DCPS Testing

**Purpose:** Initial assessment of device health by measuring power draw.

**Equipment:** Ammeter or DC Power Supply (DCPS)

**Procedure:**
1. Connect the device to the DCPS (not the charger — use DCPS for accurate readings)
2. Record the voltage and amperage:
   - **20V / 1.5A+** = Normal power draw, device likely functioning
   - **20V / under 1A** = Reduced power draw, potential component issue
   - **5V** = USB-C fallback mode, potential logic board issue
   - **0V / 0A** = No power draw at all — dead device or connector issue
3. Note: DCPS readings and charger readings should be the same, but DCPS is more precise

**What readings mean:**
- Normal readings (20V/1.5A+) with no display = likely screen issue
- Low readings = potential logic board, battery, or charging circuit issue
- 5V fallback = USB-C controller may be damaged

### Software Reinstallation

**When needed:** Device not booting correctly, corrupted OS, or fresh install required for trade-in devices.

**Method:**
1. **Primary: Internet Recovery**
   - Boot holding Command + Option + R (for latest compatible macOS)
   - Connect to WiFi
   - Select "Reinstall macOS"
   
2. **Secondary: External SSD**
   - Use the pre-prepared external SSD with macOS installer
   - Boot holding Option, select external drive
   - Install macOS from external media

3. **Always install the newest software** available for the device model

4. **T2 chip models (2018-2020 Intel + M1):**
   - May require additional steps
   - DFU restore via Apple Configurator 2 on another Mac if standard recovery fails
   - These are documented as "more difficult" — technicians should flag if stuck

### iCloud Lock Check (SickW Integration)

**Trigger:** Serial number entered in `text4` column on Main Board

**Process:**
1. SickW automation reads the serial number
2. Checks Apple's activation lock status
3. Posts result in the item's updates section
4. If **locked**: Change repair type to "iCloud ON" → notifies Ferrari
5. If **unlocked**: Continue with diagnostics

---

## SOP 5: Screen Refurbishment Process

### Overview
iCorrect refurbishes MacBook LCD screens in-house, taking "poor grade" screens from UK suppliers and converting them to Grade A usable screens.

### Input
Poor condition MacBook LCD screens purchased from UK suppliers (primarily Laptop Power NW, £25-45 per unit)

### Output
Grade A refurbished screens ready for customer repairs

### Two Repair Types

**Type 1: Polarizer Replacement Only (Simple)**
- Time: ~30 minutes
- Higher success rate (~90%+)
- Only the polarizer film needs replacing
- Lower skill requirement

**Type 2: Full Repair (Polarizer + Flex Cables + T-con Board)**
- Time: 1-4 hours (high variability)
- Lower success rate
- Requires replacing flex cables and the T-con (timing controller) board
- Can have significant failures requiring rework
- When it goes wrong, can burn 2-4 hours per screen

### Cost Comparison
| Source | Cost Per Unit | Refurb Labour | Total Cost | Skill Level |
|--------|-------------|---------------|------------|-------------|
| UK Poor Grade + Refurb | £25-45 | 0.5-4 hours | £25-45 + labour | High (refurb) |
| China Grade A (Nancy) | £120-170 ($128-264) | None | £120-170 | Standard (install only) |

### Success Rate
Target: 80-90% of poor screens successfully refurbished to Grade A

### Known Issues
- **No tracking system exists** — screens have no unique identity, leading to double deductions, ambiguous grades, and untracked transformations
- **QR code system planned** — every screen would be labelled at receiving with full condition data (polarizer grade, lid grade, T-con compatibility)
- **Separate Monday board needed** — to track screens through the refurbishment pipeline
- **Team input from Jan 2026 meeting:**
  - Ronnie suggested barcode scanning like wholesalers
  - Saf wanted a "cover system" where receiving logs condition so the system knows which models can be built from stock
  - Misha asked about using existing Apple/China QR codes (ruled out — need own system)

### T-con Swap Compatibility Matrix
| Donor LCD Model | Can Replace | Swap Required |
|----------------|-------------|---------------|
| A1932 / A2179 | A2337 (M1 Air) | T-con board swap |
| A2251 / A2289 | A2338 (M1 Pro 13") | T-con board swap |

---

## SOP 6: Quality Control (QC) Workflow

### Overview
After a repair is completed by a technician, the device goes through QC before being returned to the customer.

### Process (THIN — needs more detail from team)

1. Technician completes repair → changes status to QC stage
2. QC technician (typically Ronnie) reviews the repair:
   - Visual inspection of the repair
   - Functional testing
   - Verify the specific fault has been resolved
   - Check for any new issues introduced during repair
3. If QC passes → status moves forward (Ready To Collect / Ready To Ship)
4. If QC fails → back to technician with notes on what needs fixing

### Notes
- Saf mentioned in team meeting that QC was "still going through as normal"
- The process was acknowledged but the documentation is thin
- Ricky noted wanting to document this more formally as part of SOP buildout

---

## SOP 7: Ferrari's Daily Task Workflow

### Overview
Michael Ferrari's role as Client Services Manager includes a set of recurring daily tasks.

### Daily Template (Updated Jan 2026)

| Task | Est. Time | Description |
|------|-----------|-------------|
| Client Calls & Enquiries | 3 hrs | Handling incoming calls, responding to customer messages, managing Intercom conversations |
| Team Meeting | 1.5 hrs | Daily team standup + coordination |
| Corporate Invoicing | 1 hr | Processing invoices for corporate/warranty clients |
| Shipping Labels | 0.5 hr | Printing and preparing shipping labels for outbound devices |
| Reactive / Unplanned Work | 0.5 hr | Buffer for unexpected issues |
| Back Market Work | 0.5 hr | Processing BM trade-in orders, handling issues, defective reviews |
| Confirm Appointments | 0.25 hr | Confirming walk-in appointments for the next day |
| Quotes | 0.25 hr | Sending repair quotes to customers |
| **TOTAL** | **7.5 hrs** | |

### Deleted Tasks (never actually used)
- DMs (Instagram/Social/WhatsApp)
- Chase Quotes & Invoices
- Contact Missed Appointments
- BM Trade-in Orders & Issues (merged into "Back Market Work")
- List 'Manual' BMs (merged into "Back Market Work")

---

## Verification Checklist for Jarvis

- [ ] Confirm SOP 1 (Walk-In) against current team practice — may have evolved
- [ ] Validate BM Trade-In SOP against current Monday board columns — views and columns may have changed
- [ ] Get technician input on diagnostic procedures — ammeter readings, DCPS usage
- [ ] Document the QC workflow properly — needs team walkthrough
- [ ] Verify Ferrari's current daily task breakdown — may have changed since Jan
- [ ] Check if screen refurb QR code system has been started
- [ ] Verify software reinstallation process for M-series vs Intel differences
- [ ] Document any SOPs that exist but weren't captured in conversation history
