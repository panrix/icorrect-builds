# BM Trade-In Intake Flow

## Purpose

Standardize BM trade-in intake with explicit functional/non-functional branching and accurate grading capture.

## Preconditions

- Service type is Back Market trade-in.

## Workflow

1. **Receipt confirmation**
   - Capture serial number.
   - Mark receipt event on board.
   - Trigger iCloud status check.

2. **Model/spec confirmation**
   - Manual operator confirmation of model/spec/color.
   - If mismatch with expected order, trigger mismatch decision path:
     - counter-offer
     - reject
     - accept as-is with explicit acknowledgment

3. **Functional state split**

   **Functional path**
   - Run functional checks and structured grading:
     - screen defect type
     - housing condition
     - charging/port condition
     - liquid indicators
     - ammeter reading
   - Allocate required parts and route into normal repair queue.

   **Non-functional path**
   - Capture ammeter first.
   - Capture liquid severity class.
   - Determine route:
     - ultrasonic clean path
     - SAF diagnostic path
   - Record parts findings and deductions through diagnostic process.

4. **Split-repair support**
   - If screen and board/liquid repairs are both required:
     - create parallel tracking tracks
     - screen stream and board stream progress independently
     - merge at final assembly/QC checkpoint

5. **Completion handoff**
   - Persist reported vs actual condition deltas.
   - Ensure grade evidence supports later BM decisioning.

## Hard Stop Conditions

- iCloud unresolved status without explicit exception path.
- Missing serial.
- Missing ammeter reading in non-functional path.
- Missing grading evidence required for BM decisions.
