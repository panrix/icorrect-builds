# Naheed V0 — Physical Device Intake Checklist
Last updated: 2026-04-27 07:32 UTC
Status: V0 working checklist for confirmation, not final SOP
Owner: Naheed / Intake

## Purpose

When a customer physically arrives with a device, intake should personally check enough information that the next person can act without chasing basics.

This V0 is intentionally simple. It is not the full future intake app.

## V0 Rule

A device is not intake-ready just because it is physically in the building.

It is intake-ready only when:

- the customer is identified
- the device is identified
- the reason for visit is clear
- access/passcode is captured in the system
- payment/deposit state is confirmed where required
- simple-repair parts availability has been checked or flagged
- the next owner/action is clear

## Universal Intake Gate — Every Physical Drop-Off

### 1. Customer

Personally check/capture:

- customer full name
- email
- phone number
- returning customer / existing booking if known
- company/corporate account if relevant

### 2. Visit Type

Select one:

- booked repair drop-off
- walk-in repair drop-off
- diagnostic drop-off
- collection-related issue
- enquiry only / not leaving device
- Back Market / trade-in
- unclear / staff review needed

### 3. Device

Personally check/capture:

- device type: iPhone / iPad / MacBook / Apple Watch
- model
- serial / IMEI where available
- device physically received: yes/no
- received device matches booking/customer statement: yes/no
- visible condition notes, especially cracks, bends, liquid signs, missing parts
- accessories received, if any

V0 rule: if device does not match the booking/customer statement, stop and mark **Device Mismatch / Staff Review Needed**.

### 4. Requested Repair / Fault

Capture:

- requested repair type, e.g. screen, battery, charging, diagnostic
- customer’s description of the issue
- when/how it happened, if known
- whether it is urgent / deadline needed

Bad note:

- “phone repair”

Good note:

- “iPhone 13 screen replacement; glass cracked, touch still works, customer needs by Thursday.”

### 5. History

Ask/check:

- has this device been repaired before?
- if yes: what was repaired and where?
- has Apple or another repairer looked at it?
- if yes: what did they say?

### 6. Data / Access

Mandatory today:

- passcode/password must be typed into the system
- mark whether access was verified, if testable

Use one status:

- Access verified
- Access provided, not verified because device is dead/unusable
- Access missing
- Access invalid
- Corporate/access exception applies

If access is missing or invalid and testing is required, mark **Missing / Invalid Passcode** and assign next action.

### 7. Payment

Mandatory today:

- confirm payment/deposit state before moving forward where required
- if diagnostic payment is required, confirm it has been taken
- if payment is unresolved, mark **Payment Needed**

### 8. Parts Check for Simple / Known Repairs

For simple known repairs, check stock before treating the job as ready.

Examples:

- iPhone screen
- MacBook battery
- charging port
- iPad screen
- Apple Watch screen/glass where quoted as known repair

If stock check says available:

- mark parts checked
- note stock result

If no stock or unknown:

- mark **Parts Check Needed** or **Parts Unavailable**
- do not promise active repair timing without confirmation

V0 tooling direction: use a simple parts checker that looks up the selected requested repair and reports available stock from the parts board.

### 9. Photos

Not mandatory today.

Target-state habit:

- take photos of visible damage/condition where practical
- especially for cracked screens, dents, liquid signs, missing parts, disputed condition risk

### 10. Final Intake Status

Choose one:

- Intake Ready — can move to next owner
- Diagnostic Ready
- Repair Ready
- Staff Review Needed
- Customer Info Needed
- Device Mismatch
- Missing / Invalid Passcode
- Payment Needed
- Parts Check Needed
- Parts Unavailable

Every hold must have:

- reason
- owner
- next action
- whether customer needs an update

## Device-Specific Prompts

Keep these short. These are not full diagnostic trees.

### iPhone

Ask/check if relevant:

- screen issue: cracked glass / no display / touch fault / lines?
- does it turn on?
- any liquid damage or drop?
- Face ID affected?
- camera/audio/charging issue?
- previous screen/battery/charging repair?
- data backed up / data important?

### iPad

Ask/check if relevant:

- does it turn on?
- charging issue confirmed with another cable?
- screen/touch fault type?
- Apple Pencil used? If yes, note it.
- liquid damage: what liquid and when?
- Face ID / Touch ID issue?
- data backed up / data important?

### MacBook

Ask/check if relevant:

- does it power on?
- for display faults: does it work on external screen?
- charger type / original Apple charger?
- liquid damage: what liquid and when?
- keyboard/trackpad/touch bar affected?
- boot issue: Apple logo, folder icon, progress bar, no signs of life?
- data backed up / data important?
- password typed into system and verified if possible

### Apple Watch

Ask/check if relevant:

- glass/display damage type
- does it turn on?
- sound/haptic present?
- crown/side button responsive?
- charging issue?
- liquid contact?

## What Naheed Should Confirm Back

Please confirm:

1. Is this checklist realistic during a live walk-in?
2. Which fields are currently impossible or awkward to capture?
3. Where exactly are passcodes typed today?
4. Where should payment confirmation be checked?
5. For parts checks, what repair names do you normally select/use?
6. Which device/fault prompts are missing from the real front-desk flow?
