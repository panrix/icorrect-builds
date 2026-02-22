# Standard Repair Intake Flow

## Purpose

Capture complete repair intake data so technician receives actionable context without follow-up questioning.

## Preconditions

- Customer has confirmed repair intent.
- Intake operator starts team-facing flow.

## Workflow

1. **Run universal questions**
   - Prior repair history.
   - Apple Store history.
   - Device new/refurbished.
   - Fault causation summary.
   - Secondary fault authorization.
   - Battery authorization prompt where relevant.

2. **Collect and verify access credentials**
   - Capture passcode/password.
   - Validate credentials where technically possible.
   - If validation fails, block progression until resolved or explicitly flagged as untestable.

3. **Repair type and conditional questions**
   - Select repair type (screen/battery/camera/etc.).
   - Trigger device and repair-specific question set from device flow library.

4. **Parts and stock check**
   - Query parts/stock board for required part availability.
   - Reserve parts when available.
   - If unavailable, present revised turnaround before acceptance.

5. **Pre-check and evidence capture**
   - Visual inspection.
   - Basic function checks (charge/display/keyboard/trackpad as applicable).
   - Intake photos uploaded and linked.
   - Flag mismatch if observed condition differs from customer statement.

6. **Turnaround confirmation**
   - Confirm ETA with customer.
   - Persist commitment and push to handoff package.

7. **Queue handoff**
   - Write/update Monday item.
   - Send customer receipt notification.
   - Deliver full intake packet to technician queue.

## Hard Stop Conditions

- Missing required fields.
- Missing/invalid passcode verification where testable.
- Missing stock check.
- Missing turnaround confirmation.
- Missing intake photo evidence.
