# Client iPad Flow

## Purpose

Guide a walk-in or pre-booking customer through triage before staff intervention, so staff only step in when there is clear intent or escalation need.

## Entry Conditions

- Reception iPad available.
- Customer starts self-service.
- Optional returning-customer lookup available.

## Step Flow

1. **Identity capture**
   - Capture customer name.
   - Attempt lookup against Intercom/Monday history.
   - If match found, pre-fill known details and surface prior context.

2. **Device and fault capture**
   - Device category selection.
   - Model confirmation helper.
   - Fault category selection.

3. **Pricing-awareness branch**
   - Ask: "Have you reviewed our pricing and turnaround?"

   **Branch A: Yes**
   - Show expected price and turnaround.
   - Ask "book now or future date?"
   - If now, continue to intent-confirming intake prompts and trigger staff handoff.

   **Branch B: No**
   - Show price/turnaround guidance.
   - Offer FAQ/assistant response path.
   - If still not ready, capture contact and send quote summary.

   **Branch C: I have a question**
   - Route to AI/knowledge answer path.
   - Escalate to staff if unresolved.

4. **Intent gate**
   - Staff notification only if:
     - customer confirms drop-off intent, or
     - customer requests human escalation.

## Data Captured

- Customer identity and contact fields.
- Device type/model.
- Fault category and initial notes.
- Readiness state (ready now / later / not proceeding).
- Escalation reason if handed to staff.

## Handoff Output

Staff receives short summary:
- Customer identity/context.
- Device/fault.
- Pricing-awareness path taken.
- Current intent state.
- Questions raised.
