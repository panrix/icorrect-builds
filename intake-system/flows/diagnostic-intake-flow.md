# Diagnostic Intake Flow

## Purpose

Capture high-context fault history and diagnostic prerequisites before device reaches technician.

## Preconditions

- Customer service type is diagnostic, or repair flow is converted to diagnostic.

## Workflow

1. **Run universal intake block**
   - Complete all universal questions from standard flow.

2. **Extended diagnostic history**
   - Fault timeline: sudden vs gradual.
   - Power context: charger type, travel adapters, surge events.
   - Liquid context: liquid type, exposure timing, post-incident actions.
   - Prior intervention: opened by third party, prior attempts.

3. **Data safety branch**
   - Ask if data is backed up.
   - If no backup, flag as data-sensitive diagnostic path.

4. **Credential gate**
   - Capture passcode/password.
   - If passcode unavailable for diagnosable device, stop intake acceptance.

5. **Diagnostic instrumentation capture**
   - Record required ammeter reading.
   - For MacBook diagnostics, perform intake-level internal checks (back cover/opened/liquid signs where SOP allows).

6. **Flow conversion support**
   - Allow bidirectional conversion:
     - repair -> diagnostic if deeper issue discovered
     - diagnostic -> repair if straightforward fault confirmed
   - Preserve audit trail of conversion decision.

7. **Queue handoff**
   - Persist full diagnostic context.
   - Push to appropriate technician queue with data-safety and urgency flags.

## Hard Stop Conditions

- No passcode for diagnosable device.
- Missing ammeter field.
- Missing required extended-fault answers.
