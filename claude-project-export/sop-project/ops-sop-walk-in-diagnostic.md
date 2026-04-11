# SOP: Walk-In Diagnostic

**Status:** Draft v1 (compiled from Ricky Q&A, 2026-04-06)
**Scope:** Walk-in clients dropping off a device for diagnostic investigation. Device has an unknown or complex fault that needs assessment before repair can be quoted.

---

## 1. Client Arrival

Same as [Walk-In Simple Repair](sop-walk-in-simple-repair.md) - iPad Typeform, Slack notification, dedicated walk-in person goes up.

## 2. Client Meeting (Diagnostic-Specific)

The intake conversation is more detailed than a simple repair. We're building the full story for Saf.

### Questions to confirm/ask:
- What is the fault? (power, liquid damage, display, other)
- How did it happen? What caused it?
- How long has the device been in this state?
- Has the device been repaired before? By who?
- Was it bought new or second-hand? If second-hand, what state was it in?
- Has the client been to the Apple Store? What did Apple say? (critical intel)
- **Data:** Is data backed up? If no, is the data important? (affects how carefully we handle restoration)
- **Liquid damage specific:** What type of liquid? How long ago?
- **Software version:** What OS is the device running? (if known). If we need to update for calibration, is that OK? (some clients run cracked software or have company MDM restrictions)
- **Passcode:** Must collect (essential for all drop-offs)

### Turnaround
- **Standard:** 2-3 working days
- **Faster option:** within 24 hours (good upsell, but ONLY offer if queue capacity allows)
- Confirm turnaround with client at drop-off

### Payment
- Diagnostic fee taken upfront (same as simple repair payment rules)

### If client decides NOT to leave the device:
- Record the reason why

## 3. Device Intake (Downstairs)

- Same labelling process as simple repair (by device type)
- **Intake tech completes ammeter reading** before device goes to queue (currently not done, needs to become standard)
- Notes from intake conversation transferred to Monday
- Monday columns updated + internal note written
- Device goes to storage room queue
- **Diagnostic always assigned to Saf**

## 4. Diagnostic Process (Saf)

### Initial checks:
1. Confirm device matches booking, read intake notes for full story
2. Ammeter reading - compare with intake tech's reading
3. External check: keyboard feel, does it turn on, physical exterior condition

### Open the device:
4. Remove backplate, visual internal check
5. Remove logic board, visual check for obvious damage/blown components
6. If liquid damage: photograph affected areas

### Ammeter-based diagnosis:

**MacBook:**
- 5V reading = charging circuit issue
- 20V reading = charging works, fault is on front-end/peripheral system

**iPhone/iPad:**
- Different voltage thresholds (need to confirm specific readings with Saf)
- Same diagnostic logic applies

### Logic board repair:
7. **Hard rule: Saf must always complete the logic board repair** (get the board powering)
8. Fit board back into housing
9. Systematic peripheral checks (cameras, Face ID, speakers, etc.)
10. Saf does NOT repair peripherals - just identifies what's damaged
11. Uses known-good replacement parts to test: plugs in to confirm if the peripheral slot/connector works

### If blocked:
- Can't find fault → tags Ferrari to request more time from client
- Missing information (e.g. found undisclosed liquid damage) → tags Ferrari to contact client
- Part not in stock for testing → tags Ferrari to request more time

## 5. Diagnostic Report (Written by Saf)

Report contains:
- Ammeter reading before repair
- What he saw pre-repair (visual findings)
- What was repaired on the logic board (component-level)
- Which peripherals are damaged and need replacing
- If liquid damage: post-repair imagery, which peripherals affected
- **Verdict:** will device be functional after full repair, or data recovery only?
- His confidence on successful repair

**Known issue:** Saf's English is limited. Reports are in broken English and can be hard to interpret. A structured diagnostic UI with dropdowns/checkboxes would significantly help here (see systems vision).

## 6. Quoting (Ferrari)

- Ferrari receives the completed diagnostic
- Writes up an itemised quote: cost per repair item
- If multiple parts needed: bundled price with a discount
- Quote delivered via email
- Older devices: cap on repair value (won't quote beyond a certain cost threshold)

**Note:** Quoting process needs its own detailed SOP.

## 7. After Quote Acceptance

- If client approves: device goes through normal repair flow (tech queue → repair → QC → collection/shipping)
- If client declines: device returned to client, log reason for decline

## Known Issues

1. Intake techs don't consistently take ammeter readings at intake
2. Saf's diagnostic reports need structured format (broken English problem)
3. Ferrari manually emails clients for every blocker (causes delays)
4. No automated timer/chasing on diagnostic turnaround promises
5. iPhone/iPad ammeter thresholds not documented (need to get from Saf)

## Related Docs
- [Walk-In Simple Repair SOP](sop-walk-in-simple-repair.md)
- Diagnostic report format: TBD (needs own SOP)
- Quoting process: TBD (needs own SOP)
- Systems vision: Systems 6, 7 in `/home/ricky/builds/agent-rebuild/ricky-systems-dump.md`
