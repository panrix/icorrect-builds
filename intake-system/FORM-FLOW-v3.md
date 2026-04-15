# FORM-FLOW.md: iCorrect Intake Form (v3)

> Definitive flow spec. All builds reference this document.
> Last updated: 11 April 2026 (v3: complete pre-repair capture, universal customer lookup, CRM vision)
> Previous version: 8 April 2026 (v2: four flows, branching engine)
> Changes from v2: pre-repair questions expanded to match/exceed current Typeform capture, customer lookup added to all flows, fault options updated, data model expanded

## Vision

This system replaces Typeform AND becomes the front-door CRM for iCorrect. When staff go to see a customer, they already know: who they are, how many times they've been in, what conversations have happened, what device and fault they have, and all pre-repair information captured. Returning customers feel recognized. New customers get thorough intake. Techs receive a complete handoff package with zero follow-up needed.

## Context

This form runs on an iPad at the iCorrect reception desk in kiosk/landscape mode. Customers fill it in while waiting. It replaces the current Typeform system (router + 5 sub-forms + separate pre-repair form).

**Current Typeform system being replaced:**
- Router form (`dvbfUytG`): "Drop off, collection or enquiry?"
- Walk-in form v2 (`Rr3rhcXc`): name, email, phone, device, model, fault, pricing, issue detail, data backup
- Walk-in form old (`LtNyVqVN`): device, model, fault, pricing, name, email, phone
- Collection form (`vslvbFQr`): ready confirmation, name, email, device
- Enquiry form (`NOt5ys9r`): name, issue description
- Drop-off with appointment form (`nNUHw0cK`): name, email
- Pre-Repair Questions form (`sDieaFMs`): email, fault cause, diagnosed by Apple, new/refurbished, previous repair detail, other issues, data backup, data importance, passcode, software update permission, remove accessories

**Critical change from v2:** The pre-repair questions form is currently a separate Typeform sent after walk-in submission. In v3, all pre-repair questions are integrated directly into the walk-in flow (Flow B) so everything is captured in a single session before the customer sits down. No second form needed.

## Design Principles

- One question/section per screen (Typeform-style pacing)
- Large touch targets (min 56px), iPad landscape optimised
- Cards for selection, not dropdowns (except long model lists)
- Auto-advance on card tap where there's a single selection
- Back button always visible (except Welcome and Confirmation)
- Progress bar visible during pre-repair questions in Flow B (after customer commits)
- Apple-minimal aesthetic, iCorrect brand colours
- Four distinct flows routed from a single entry point

---

## Architecture: Flow-Based Routing

The form uses a flow-aware step engine, not a linear step array.

```typescript
type FlowType = 'appointment' | 'dropoff' | 'collection' | 'enquiry';

const FLOWS: Record<FlowType, string[]> = {
  appointment: ['welcome', 'visit-purpose', 'identity', 'booking-confirm', 'pre-repair-appointment', 'additional-notes', 'confirmation'],
  dropoff: ['welcome', 'visit-purpose', 'identity', 'device', 'model', 'fault', 'fault-detail', 'pricing-gate', 'proceed-decision', 'pre-repair', 'accessories-reminder', 'confirmation'],
  collection: ['welcome', 'visit-purpose', 'identity-collection', 'device', 'collection-questions', 'confirmation'],
  enquiry: ['welcome', 'visit-purpose', 'identity-enquiry', 'device', 'fault', 'fault-detail-enquiry', 'confirmation'],
};
```

Steps `welcome` and `visit-purpose` are shared. After visit purpose selection, the form enters the selected flow.

**Customer lookup trigger:** On ALL flows, after identity is submitted, the backend runs a customer lookup by email. The result is stored in form state and passed to the team view. This happens silently; the customer does not see a loading state unless they are in the appointment flow (where the lookup is the primary action).

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

Customer has already booked online. This flow is about **confirming** what we have, capturing any missing pre-repair data, and flagging corrections.

### A1: Identity

**Fields:**
- Full name (required)
- Email address (required, validated)

**Advance:** "Find my booking" button.

**Backend:** `GET /api/customer/lookup?email=...` searches both `new_group34198` (Incoming Future) and `new_group70029` (Today's Repairs). Also returns full customer profile (repair history, Intercom context).

### A2: Booking Confirmation

**Lookup resolution rules:**
- **1 match:** Show it directly.
- **Multiple matches:** Show list with device + service + booking date. Customer picks theirs.
- **0 matches:** "We couldn't find a booking for that email." Offer: try different email, or switch to walk-in flow (preserves name/email already entered).
- **Family/shared email:** Same as multiple matches; customer picks.

**If match found/selected:** Show what we have on file:
- Device and model
- Service/fault type
- Any pre-repair answers already captured (from the online booking form)
- Booking date/time

**Customer action:** "This is correct" (confirm) or "Something needs changing" (flag for reception).

**Loading state:** Spinner "Looking up your booking..." with timeout after 5 seconds, then fallback.
**Error state:** If Monday API fails, show: "We're having trouble looking up your booking. Please let reception know you've arrived." Auto-reset after 15s.

### A3: Pre-Repair (Appointment)

If the customer's booking already has pre-repair answers captured (from online form), this step shows a summary: "We already have your answers on file." with a "Continue" button.

If pre-repair answers are missing or incomplete, show the same pre-repair question sequence as Flow B step B7 (adapted: skip questions already answered in the booking). This ensures every device that enters the workshop has complete pre-repair data regardless of how it was booked.

### A4: Additional Notes

**Question:** "Anything else we should know before we come see you?"

**Field:** Free text (optional)

**Advance:** "Submit" button. Skip if they have nothing to add.

### A5: Confirmation

"Thanks [Name], please take a seat. We'll be with you shortly."

Auto-reset to Welcome after 30 seconds.

---

## Flow B: Walk-In (No Appointment)

Customer walks in off the street. Longest flow with pricing gate and complete pre-repair capture.

### B1: Identity

**Fields:**
- Full name (required)
- Email address (required, validated)
- Phone number (required, UK format hint: "07...")

**Advance:** "Continue" button, active when all fields valid.

**Backend (silent):** After advancing, fire `GET /api/customer/lookup?email=...` in background. Result stored in form state for team view. Customer does not see this.

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
| Data Recovery | All devices |
| Diagnostic / Not Sure | All devices |
| Other | All devices |

**Note:** "Data Recovery" added as explicit option (was in current Typeform walk-in v2, missing from v2 spec).

**Advance:** Tapping a card auto-advances to fault detail.

### B5: Tell Us More

**Question:** "Please describe the issue and how it happened."

**Fields:**
- Free text area (required, min 10 characters)
- Hint text: "What happened to the device? When did it start? Any details help us prepare."

**Rationale:** Current Typeform pre-repair asks "describe the current issue and how it happened" as a required field. This is critical for techs. Captures cause/origin (dropped, liquid, gradual degradation) which determines diagnostic approach.

**Advance:** "Continue" button.

### B6: Pricing Gate

**Question:** "Have you seen our pricing for this repair?"

**If Yes:** Show brief confirmation of price + turnaround, then advance.

**If No:** Show pricing panel:
- Price for their model + fault (from static JSON)
- Turnaround estimate
- Part quality info ("We use [OEM/aftermarket] parts for this repair")
- If no price match: "We'll confirm your exact quote when we inspect the device."

**Advance:** "Continue" button after viewing pricing info.

### B7: Proceed Decision

**Question:** "Would you like to go ahead and book in your repair?"

**If Yes:** "Great, just a few more questions and we'll get you sorted."
Continue to pre-repair questions. Progress bar appears here.

**If No:**
- "Would you like the quote emailed to you?" (Yes / No)
- "Any reason you'd prefer not to drop off today?" (free text, optional)
- "No problem. Please hand the iPad back to reception. Thank you for visiting iCorrect."
- Auto-reset to Welcome after 15 seconds.
- [Backend: if email quote requested, create/update Intercom contact and send quote]

### B8: Pre-Repair Questions

> Progress bar visible from here onwards. These are the complete pre-repair questions, replacing the separate Typeform pre-repair form.

**Questions shown in sequence (one per screen):**

**Screen 1: "Has this device been repaired before?"**
- Options: Yes / No
- If Yes: follow-up free text field appears: "What was repaired, and where?" (required if Yes)
- Rationale: Current Typeform asks free text. Y/N alone loses critical detail (was it us? another shop? Apple? what part?).

**Screen 2: "Has Apple or another service provider looked at this device?"**
- Options: Yes / No
- If Yes: follow-up free text: "What did they say?" (optional)

**Screen 3: "Was this device purchased new or refurbished?"**
- Options: New / Refurbished / Second-hand / I'm not sure
- Rationale: Was in current Typeform pre-repair. Tells us if this might be a pre-existing fault from a refurb.

**Screen 4: "Are there any other issues you've noticed with your device?"**
- Free text (optional)
- Hint: "For example: speakers sound off, camera is blurry, buttons don't click, battery drains fast"
- Rationale: Current Typeform asks this. Catches secondary faults before the tech discovers them mid-repair. Prevents surprise scope changes and "oh, that was already broken" disputes.

**Screen 5: Data backup question** (wording depends on fault):
- If fault is Screen/Battery/Charging/Keyboard: "Is the data on your device backed up?"
- If fault is Liquid Damage/Not Turning On/Data Recovery: "Do you have a backup of your data? There is a risk of data loss with this type of repair."
- Options: Yes / No / I don't know

**Screen 6: "Is the data on your device important to you?"**
- Options: Yes, please preserve my data / No, I don't mind if data is lost
- Rationale: Separate from backup status. Someone with no backup might not care about data (wiped phone). Someone with a backup might still want data preserved (photos not yet synced). This determines how aggressively we can approach board work, restores, and firmware updates.

**Screen 7: "Can we update your device software if needed during the repair?"**
- Options: Yes, update if needed / No, please don't update my software
- Rationale: Current Typeform asks this. Some repairs require firmware restore. Some customers refuse updates (jailbreak, specific iOS version, enterprise MDM). Tech needs to know before starting.

**Screen 8: Passcode collection**
- Text field: "Please enter your device passcode" (required)
- Secondary field: "If your device uses a password (MacBook), enter it here too" (shown for MacBook only)
- Checkbox: "I understand iCorrect needs my passcode to test the device and complete the repair"
- Rationale: Current Typeform collects the actual passcode. The v2 spec only asked for acknowledgement ("I understand"). That's not enough: the tech needs the code to test. Collecting it digitally here means the operator has it on screen during intake and can verify it works on the device before the customer leaves.

**Screen 9: Delivery preference**
- "How would you like your device returned?"
- Options: Deliver back (free) / I'll collect

**Advance:** "Submit" button, active when all required questions answered.

### B9: Accessories Reminder

**Statement screen (no input required):**
"Please remove any cases, chargers, or accessories from your device before handing it over. We only accept the device itself for repair."

**Action:** "Got it" button advances to confirmation.

**Rationale:** Current Typeform has this as final statement. Prevents accessories being lost in the workshop.

### B10: Confirmation

"Thank you, [Name]. A member of our team will be with you shortly. Please take a seat."

Auto-reset to Welcome after 30 seconds.

---

## Flow C: Collection

Customer picking up a completed repair. Minimal flow.

### C1: Identity

**Fields:**
- Full name (required)
- Email address (required, validated)

**Advance:** "Continue" button.

**Backend (silent):** Customer lookup by email fires after advancing. If a match is found in Awaiting Collection or Quality Control groups, the result is available in team view. Staff see who's collecting and which device.

### C2: Device

**Question:** "Which device are you collecting?"

**Options:** Same device cards as Flow B (iPhone, iPad, MacBook, Apple Watch). Tap to select and advance.

### C3: Collection Confirmation

**Question:** "Have you received a message confirming your device is ready?"

**Options:** Yes / No / I'm not sure

**Rationale:** Current Typeform asks this. Prevents staff from hunting for devices that aren't ready yet. If No/Not sure, the team view flags this so the operator checks before retrieving the device.

### C4: Questions

**Question:** "Do you have any questions about your repair?"

**Field:** Free text (optional)

**Advance:** "Submit" button. Skip option: "No questions".

### C5: Confirmation

"Thanks [Name], we'll bring your [device] out shortly."

Auto-reset to Welcome after 30 seconds.

---

## Flow D: Enquiry

Customer has a question. Captures enough for staff to prepare before going to see them.

### D1: Identity

**Fields:**
- Full name (required)
- Email address (required, validated)

**Advance:** "Continue" button.

**Backend (silent):** Customer lookup by email. Team view shows if this is a returning customer.

### D2: Device

**Question:** "Which device is this about?"

**Options:** Same device cards as Flow B. Tap to select and advance.

### D3: Fault/Issue

**Question:** "What's the issue?"

**Options:** Same fault cards as Flow B (Screen, Battery, etc.). Plus:

**Follow-up:** Free text field: "Tell us a bit more so we can help you when we come over." (optional but encouraged)

**Advance:** "Continue" button.

### D4: Confirmation

"Thanks [Name], someone will be with you shortly."

Auto-reset to Welcome after 30 seconds.

---

## Data Model

```typescript
type FlowType = 'appointment' | 'dropoff' | 'collection' | 'enquiry';
type DeviceCategory = 'iPhone' | 'iPad' | 'MacBook' | 'Apple Watch';
type FaultCategory =
  | 'Screen'
  | 'Battery'
  | 'Charging'
  | 'Keyboard'
  | 'Liquid Damage'
  | 'Not Turning On'
  | 'Data Recovery'
  | 'Diagnostic'
  | 'Other';
type DataBackupStatus = 'yes' | 'no' | 'unknown';
type DataImportance = 'preserve' | 'not_important';
type SoftwareUpdatePermission = 'yes' | 'no';
type PurchaseCondition = 'new' | 'refurbished' | 'secondhand' | 'unknown';
type DeliveryPreference = 'deliver' | 'collect';
type CollectionReadyStatus = 'yes' | 'no' | 'unsure';

interface IntakeFormData {
  flowType: FlowType | null;

  // Identity (all flows)
  name: string;
  email: string;
  phone: string; // dropoff only (required), others optional

  // Device (dropoff, collection, enquiry)
  deviceCategory: DeviceCategory | null;
  model: string;

  // Fault (dropoff, enquiry)
  fault: FaultCategory | null;
  faultDescription: string; // "tell us more / how it happened" (required for dropoff)

  // Pricing gate (dropoff only)
  seenPricing: boolean | null;
  proceedWithBooking: boolean | null;
  declineReason: string;
  wantsQuoteEmailed: boolean | null;

  // Pre-repair questions (dropoff, and appointment if not already answered)
  repairedBefore: boolean | null;
  repairedBeforeDetail: string; // "what was repaired, where?" (free text if repairedBefore=true)
  appleSeen: boolean | null;
  appleSeenDetail: string; // "what did they say?" (free text if appleSeen=true)
  purchaseCondition: PurchaseCondition | null; // new, refurbished, secondhand, unknown
  otherIssues: string; // "any other issues noticed?" (free text)
  dataBackedUp: DataBackupStatus | null;
  dataImportance: DataImportance | null; // preserve vs not_important
  softwareUpdatePermission: SoftwareUpdatePermission | null;
  passcode: string; // actual passcode (collected digitally)
  passcodePassword: string; // MacBook password if different from passcode
  passcodeAcknowledged: boolean; // "I understand you need my passcode"
  deliveryPreference: DeliveryPreference | null;
  accessoriesRemoved: boolean; // acknowledged accessories reminder

  // Appointment flow
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
  collectionReady: CollectionReadyStatus | null; // "received confirmation message?"
  collectionQuestions: string;

  // Customer lookup result (populated by backend, not user input)
  customerLookup: CustomerProfile | null;
}

interface CustomerProfile {
  isReturningCustomer: boolean;
  totalRepairCount: number;
  customerSince: string | null; // earliest repair date
  recentRepairs: RepairSummary[]; // last 5 repairs
  activeIntercomConversations: ConversationSummary[];
  linkedMondayItems: MondayItem[]; // current/recent items
  intercomContactLink: string | null;
  customerType: 'end_user' | 'corporate' | null;
  corporateAccount: string | null; // company name if corporate
}

interface RepairSummary {
  mondayItemId: string;
  deviceCategory: string;
  model: string;
  service: string;
  status: string;
  receivedDate: string | null;
  completedDate: string | null;
}

interface ConversationSummary {
  conversationId: string;
  intercomLink: string;
  subject: string;
  lastMessageAt: string;
  summary: string; // LLM-generated one-liner
}
```

## Pricing Data Structure

Bundled as `pricing-data.json`, sourced from Monday Products & Pricing board:

```json
{
  "iPhone": {
    "iPhone 15 Pro Max": {
      "Screen Repair": { "price": 329, "turnaround": "Same day" },
      "Battery Replacement": { "price": 89, "turnaround": "Same day" }
    }
  }
}
```

## Brand / Design

See `DESIGN-SPEC.md` for colours, typography, logo, and component specs.

---

## Cross-Reference: Current Typeform Coverage

Every question from the current Typeform system is accounted for in v3:

| Current Typeform Question | Where in v3 |
|--------------------------|-------------|
| Router: drop off/collect/enquiry | Step 1: Visit Purpose |
| Walk-in: device type | B2: Select Device |
| Walk-in: model | B3: Select Model |
| Walk-in: fault/issue type | B4: What's Wrong |
| Walk-in: issue description | B5: Tell Us More |
| Walk-in: pricing reviewed | B6: Pricing Gate |
| Walk-in: name, email, phone | B1: Identity |
| Walk-in: data backup | B8 Screen 5 |
| Pre-repair: describe issue + how it happened | B5: Tell Us More (required) |
| Pre-repair: diagnosed by Apple | B8 Screen 2 |
| Pre-repair: new or refurbished | B8 Screen 3 |
| Pre-repair: previous repairs (detail) | B8 Screen 1 (with follow-up text) |
| Pre-repair: other issues noticed | B8 Screen 4 |
| Pre-repair: data backed up | B8 Screen 5 |
| Pre-repair: data important/preserve | B8 Screen 6 |
| Pre-repair: passcode | B8 Screen 8 (actual passcode) |
| Pre-repair: software update permission | B8 Screen 7 |
| Pre-repair: remove accessories | B9: Accessories Reminder |
| Appointment: name, email | A1: Identity |
| Collection: ready confirmation | C3: Collection Confirmation |
| Collection: name, email, device | C1 + C2 |
| Enquiry: name, issue description | D1 + D3 |

**Net new in v3 (not in current Typeform):**
- Universal customer lookup on all flows (CRM context for team view)
- Appointment pre-repair gap fill (A3)
- Explicit data importance question separated from backup status
- Structured "repaired before" with detail capture
- "Apple seen" with detail capture
