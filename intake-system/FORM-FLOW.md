# FORM-FLOW.md: iCorrect Intake Form

> Definitive flow spec. All builds reference this document.
> Last updated: 8 April 2026 (rewritten to match plan.md v2)
> Previous version: 10 March 2026 (linear 10-step wizard — superseded)

## Context

This form runs on an iPad at the iCorrect reception desk in kiosk/landscape mode. Customers fill it in while waiting. It replaces the current Typeform system (router + 4 sub-forms).

**Current Typeform system being replaced:**
- Router form (`dvbfUytG`): "Drop off, collection or enquiry?"
- Walk-in form (`LtNyVqVN`): device, model, fault, pricing awareness, name, email, phone
- Collection form (`vslvbFQr`): name, device type
- Enquiry form (`NOt5ys9r`): name, description
- Drop-off with appointment form (`nNUHw0cK`): name only

## Design Principles

- One question/section per screen (Typeform-style pacing)
- Large touch targets (min 56px), iPad landscape optimised
- Cards for selection, not dropdowns (except long model lists)
- Auto-advance on card tap where there's a single selection
- Back button always visible (except Welcome and Confirmation)
- Progress bar only visible during pre-repair questions in Flow B (after customer commits)
- Apple-minimal aesthetic, iCorrect brand colours
- Four distinct flows routed from a single entry point

---

## Architecture: Flow-Based Routing

The form uses a flow-aware step engine, not a linear step array.

```typescript
type FlowType = 'appointment' | 'dropoff' | 'collection' | 'enquiry';

// Each flow defines its step sequence
const FLOWS: Record<FlowType, string[]> = {
  appointment: ['welcome', 'visit-purpose', 'identity', 'booking-confirm', 'additional-notes', 'confirmation'],
  dropoff: ['welcome', 'visit-purpose', 'identity', 'device', 'model', 'fault', 'pricing-gate', 'proceed-decision', 'pre-repair', 'confirmation'],
  collection: ['welcome', 'visit-purpose', 'identity-collection', 'device', 'collection-questions', 'confirmation'],
  enquiry: ['welcome', 'visit-purpose', 'identity-enquiry', 'device', 'fault', 'confirmation'],
};
```

Steps `welcome` and `visit-purpose` are shared. After visit purpose selection, the form enters the selected flow.

---

## Step 0: Welcome

**Screen:** iCorrect logo centered, "Welcome to iCorrect" heading.

**Action:** Single "Get Started" button.

**Notes:** Auto-resets to this screen after 30 seconds of inactivity on any Confirmation screen.

---

## Step 1: Visit Purpose

**Question:** "What brings you in today?"

**Options (large cards, tap to select and advance):**

| Card | Label | Routes to |
|------|-------|-----------|
| A | I have an appointment | Flow A: Appointment |
| B | I'd like to drop off for repair | Flow B: Walk-In |
| C | I'm collecting my device | Flow C: Collection |
| D | I have a question | Flow D: Enquiry |

---

## Flow A: Booked Appointment Drop-Off

Customer has already booked online. This flow is about **confirming**, not collecting.

### A1: Identity

**Fields:**
- Full name (required)
- Email address (required, validated)

**Advance:** "Find my booking" button.

**Backend:** `GET /api/customer/lookup?email=...` with group filter for Incoming Future (`new_group34198`).

### A2: Booking Confirmation

**Lookup resolution rules:**
- **1 match:** Show it directly.
- **Multiple matches:** Show list with device + service + booking date. Customer picks theirs.
- **0 matches:** "We couldn't find a booking for that email." Offer: try different email, or switch to walk-in flow (preserves name/email already entered).
- **Family/shared email:** Same as multiple matches — customer picks.

**If match found/selected:** Show what we have on file:
- Device and model
- Service/fault type
- Any pre-repair answers already captured
- Booking date/time

**Customer action:** "This is correct" (confirm) or "Something needs changing" (flag for reception).

**Loading state:** Spinner "Looking up your booking..." — timeout after 5 seconds → fallback.
**Error state:** If Monday API fails → "We're having trouble looking up your booking. Please let reception know you've arrived." Auto-reset after 15s.

### A3: Additional Notes

**Question:** "Anything else we should know before we come see you?"

**Field:** Free text (optional)

**Advance:** "Submit" button. Skip if they have nothing to add.

### A4: Confirmation

"Thanks [Name], please take a seat. We'll be with you shortly."

Auto-reset to Welcome after 30 seconds.

---

## Flow B: Walk-In (No Appointment)

Customer walks in off the street. Longest flow with a critical pricing/proceed gate.

### B1: Identity

**Fields:**
- Full name (required)
- Email address (required, validated)
- Phone number (required, UK format hint: "07...")

**Advance:** "Continue" button, active when all fields valid.

### B2: Select Device

**Question:** "Which device needs repair?"

**Options (large icon cards, tap to select and advance):**
- iPhone
- iPad
- MacBook
- Apple Watch

Each card has a clean device silhouette icon. Tapping auto-advances.

### B3: Select Model

**Question:** "Which model do you have?"

**UI:** Searchable scrollable list filtered by device category.

**Data source:** Bundled `pricing-data.json` (from Monday Products & Pricing board).

**Search:** Type-ahead filter. Typing "15 pro" narrows to iPhone 15 Pro / Pro Max.

**Bottom option:** "I'm not sure of my model" (free text fallback).

**Advance:** Tapping a model auto-advances.

### B4: What's Wrong?

**Question:** "What's the issue?"

**Options (icon cards):**

| Card | Shown for |
|------|-----------|
| Screen Damage | All devices |
| Battery | All devices |
| Charging Issue | All devices |
| Keyboard | MacBook only |
| Liquid Damage | All devices |
| Not Turning On | All devices |
| Diagnostic / Not Sure | All devices |
| Other | All devices |

**Below cards:** Optional free-text field: "Anything else about the issue?" (optional)

**Advance:** Tapping a card auto-advances. If they want to add a description, they type first, then tap "Continue".

### B5: Pricing Gate

**Question:** "Have you seen our pricing for this repair?"

**If Yes:** Show brief confirmation of price + turnaround, then advance.

**If No:** Show pricing panel:
- Price for their model + fault (from static JSON)
- Turnaround estimate
- Part quality info ("We use [OEM/aftermarket] parts for this repair")
- If no price match: "We'll confirm your exact quote when we inspect the device."

**Advance:** "Continue" button after viewing pricing info.

### B6: Proceed Decision

**Question:** "Would you like to go ahead and book in your repair?"

**If Yes:** "Great — just a few more questions and we'll get you sorted."
→ Continue to pre-repair questions. Progress bar appears here.

**If No:**
→ "Would you like the quote emailed to you?" (Yes / No)
→ "Any reason you'd prefer not to drop off today?" (free text, optional)
→ "No problem. Please hand the iPad back to reception. Thank you for visiting iCorrect."
→ Auto-reset to Welcome after 15 seconds.
→ [Backend: if email quote requested, create/update Intercom contact and send quote]

### B7: Pre-Repair Questions

> Progress bar visible from here onwards. These are the "few more questions" after committing.

**Questions shown in sequence (one per screen or grouped naturally):**

1. **"Has this device been repaired before?"** (Yes / No)
2. **"Has Apple looked at this device?"** (Yes / No)
3. **Data backup question** (wording depends on fault):
   - If fault is Screen/Battery/Charging/Keyboard: "Is the data on your device backed up?"
   - If fault is Liquid Damage/Not Turning On: "Do you have a backup of your data? There is a risk of data loss with this type of repair."
   - Options: Yes / No / I don't know
4. **Passcode acknowledgement:** "We'll need your device passcode to test the repair. Please have it ready when you hand over your device." (Checkbox: "I understand")
5. **Delivery preference:** "How would you like your device returned?" (Deliver back (free) / I'll collect)

**Advance:** "Submit" button, active when all questions answered and passcode acknowledged.

### B8: Confirmation

"Thank you, [Name]. A member of our team will be with you shortly. Please take a seat."

Auto-reset to Welcome after 30 seconds.

---

## Flow C: Collection

Customer picking up a completed repair. Minimal flow. **Staff-assisted in v1** — no backend lookup. The form captures identity info; staff matches the customer manually in Monday or from memory. Automated collection lookup (email → Awaiting Collection group match) is a future enhancement.

### C1: Identity

**Fields:**
- Full name (required)
- Email address (required, validated)

**Advance:** "Continue" button.

### C2: Device

**Question:** "Which device are you collecting?"

**Options:** Same device cards as Flow B (iPhone, iPad, MacBook, Apple Watch). Tap to select and advance.

### C3: Questions

**Question:** "Do you have any questions about your repair?"

**Field:** Free text (optional)

**Advance:** "Submit" button. Skip option: "No questions".

### C4: Confirmation

"Thanks [Name], we'll bring your [device] out shortly."

Auto-reset to Welcome after 30 seconds.

---

## Flow D: Enquiry

Customer has a question. Simple for now; future: KB-powered self-service.

### D1: Identity

**Fields:**
- Full name (required)
- Email address (required, validated)

**Advance:** "Continue" button.

### D2: Device

**Question:** "Which device is this about?"

**Options:** Same device cards as Flow B. Tap to select and advance.

### D3: Fault/Issue

**Question:** "What's the issue?"

**Options:** Same fault cards as Flow B (Screen, Battery, etc.). Plus optional description.

**Advance:** Tapping a card submits (or "Continue" if description added).

### D4: Confirmation

"Thanks [Name], someone will be with you shortly."

Auto-reset to Welcome after 30 seconds.

---

## Data Model

```typescript
type FlowType = 'appointment' | 'dropoff' | 'collection' | 'enquiry';
type DeviceCategory = 'iPhone' | 'iPad' | 'MacBook' | 'Apple Watch';
type FaultCategory = 'Screen' | 'Battery' | 'Charging' | 'Keyboard' | 'Liquid Damage' | 'Not Turning On' | 'Diagnostic' | 'Other';

interface IntakeFormData {
  flowType: FlowType | null;

  // Identity (all flows)
  name: string;
  email: string;
  phone: string; // dropoff only

  // Device (dropoff, collection, enquiry)
  deviceCategory: DeviceCategory | null;
  model: string;

  // Fault (dropoff, enquiry)
  fault: FaultCategory | null;
  faultDescription: string;

  // Pricing gate (dropoff only)
  seenPricing: boolean | null;
  proceedWithBooking: boolean | null;
  declineReason: string;
  wantsQuoteEmailed: boolean | null;

  // Pre-repair questions (dropoff only, after proceed=yes)
  repairedBefore: boolean | null;
  appleSeen: boolean | null;
  dataBackedUp: 'yes' | 'no' | 'unknown' | null;
  passcodeAcknowledged: boolean;
  deliveryPreference: 'deliver' | 'collect' | null;

  // Appointment flow — holds the single booking the customer selected
  // Type matches MondayItem from plan.md API contracts
  selectedBooking: {
    id: string;
    name: string;
    device: string;
    service: string;
    status: string;
    group: { id: string; title: string };
    bookingDate: string | null;
    intercomLink: string | null;
  } | null;
  bookingConfirmed: boolean;
  additionalNotes: string;

  // Collection flow
  collectionQuestions: string;
}
```

## Pricing Data Structure

Bundled as `pricing-data.json`, sourced from Monday Products & Pricing board:

```json
{
  "iPhone": {
    "iPhone 15 Pro Max": {
      "Screen Repair": { "price": 329 },
      "Battery Replacement": { "price": 89 }
    }
  }
}
```

## Brand / Design

See `DESIGN-SPEC.md` for colours, typography, logo, and component specs.
