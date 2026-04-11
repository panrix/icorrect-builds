# Codex Build Brief: Port Quote Wizard Triage System into Intake Form

**Project:** iCorrect Intake System — Replace generic fault selection with specific issue triage
**Location:** `/home/ricky/builds/intake-system/frontend/`
**Source data:** `/home/ricky/builds/icorrect-shopify-theme/sections/quote-wizard.liquid` (lines 276-737)
**Owner:** Ricky (remote, UTC+8)
**Orchestrator:** Claude Code (will QA your output)

---

## What You're Doing

The intake form currently has 8 generic fault cards (Screen, Battery, Charging, Keyboard, Liquid Damage, Not Turning On, Diagnostic, Other) that are the same for every device. The website's quote wizard has a much richer system: **device-specific fault categories** with **92+ specific sub-issues**, each routing to repair, diagnostic, or contact.

You are porting the fault categories and specific issues from the quote wizard into the intake form. This means:

1. **Replace the generic fault list** with device-specific fault categories (MacBook has Touch Bar, iPhone has Rear Glass, etc.)
2. **Add a new "specific issue" step** after fault selection that shows the relevant sub-issues
3. **Record the route** (repair / diagnostic / contact) that each issue maps to — this tells the team what kind of intake this is

You are NOT porting: visual guides, colour selection, Shopify product lookup, pricing from Shopify, turnaround options, or the appointment booking flow. Those belong on the website, not the kiosk.

---

## Source Data

Extract these data structures from `/home/ricky/builds/icorrect-shopify-theme/sections/quote-wizard.liquid`:

### Device-Specific Fault Categories (line 276-315)

```typescript
// FAULTS per device — replaces the current generic list
const FAULTS: Record<DeviceCategory, FaultCategory[]> = {
  MacBook: [
    'Screen / Display',
    'Power / Battery / Charging',
    'Trackpad / Keyboard',
    'Touch Bar',
    'Audio / Mic / Speaker',
    'Water Damage',
    'Data Recovery',
    'Other',
  ],
  iPhone: [
    'Screen / Display',
    'Power / Battery / Charging',
    'Camera',
    'Audio / Mic / Speaker',
    'Rear Glass',
    'Buttons',
    'Water Damage',
    'Data Recovery',
    'Other',
  ],
  iPad: [
    'Screen / Display',
    'Power / Battery / Charging',
    'Camera',
    'Buttons',
    'Water Damage',
    'Data Recovery',
    'Other',
  ],
  'Apple Watch': [
    'Screen / Display',
    'Power / Battery / Charging',
    'Rear Glass',
    'Buttons / Crown',
    'Water Damage',
    'Other',
  ],
};
```

### Triage System — Specific Issues (lines 571-737)

The full `TS` object from the quote wizard. Each issue has:
- `label` — what the customer sees ("Cracked or shattered screen")
- `route` — where this issue leads: `'repair'` | `'diagnostic'` | `'contact'` | `'dismiss'`
- `repairType` — specific repair category (e.g., `'screen'`, `'battery'`, `'keyboard'`)
- `copy` — explanation text shown to the customer (use this in the intake form as a brief description)
- `urgent` — optional flag for safety-critical issues (swollen batteries, recent liquid damage)

**Copy the entire TS object from the source file (lines 571-737) into a new TypeScript data file.** Do not summarise or rewrite — use the exact data. The labels and routing decisions are carefully curated.

---

## Implementation

### New Data File: `src/data/triage.ts`

Create a TypeScript file containing:
- `DEVICE_FAULTS` — device-specific fault categories (replacing the generic `FaultCategory` type)
- `TRIAGE_ISSUES` — the full triage system keyed by `[device][fault]`
- `TriageIssue` type definition
- SVG icon data for each fault category (from `FAULT_ICONS` at lines 317-329)

### Updated Types: `shared/types.ts`

The current `FaultCategory` type is a flat union:
```typescript
type FaultCategory = 'Screen' | 'Battery' | 'Charging' | 'Keyboard' | 'Liquid Damage' | 'Not Turning On' | 'Diagnostic' | 'Other';
```

This needs to become device-aware. The fault values should now use the quote wizard's labels (e.g., `'Screen / Display'` instead of `'Screen'`, `'Power / Battery / Charging'` instead of `'Battery'`).

Add to `IntakeFormData`:
```typescript
interface IntakeFormData {
  // ... existing fields ...
  
  // Fault (updated)
  fault: string | null;           // Now uses quote wizard fault labels
  faultDescription: string;
  
  // New: specific issue from triage
  specificIssue: string | null;    // The issue label from TS
  issueRoute: 'repair' | 'diagnostic' | 'contact' | 'dismiss' | null;
  issueRepairType: string | null;  // e.g., 'screen', 'battery', 'keyboard'
  isUrgent: boolean;               // true if issue has urgent flag
}
```

### Updated Flow: Walk-In (Flow B)

Current step sequence:
```
identity → device → model → fault → pricing-gate → proceed-decision → pre-repair → confirmation
```

New step sequence:
```
identity → device → model → fault → specific-issue → pricing-gate → proceed-decision → pre-repair → confirmation
```

Add `'specific-issue'` step after `'fault'` in the dropoff flow definition (`src/flows/definitions.ts`).

**Exception:** If the customer selects "Other" as their fault, skip the specific-issue step (go straight to pricing gate with a free-text description).

### Updated Flow: Enquiry (Flow D)

Current: `identity → device → fault → confirmation`
New: `identity → device → fault → specific-issue → confirmation`

Same logic — add specific-issue step. "Other" skips it.

### New Step: `src/steps/SpecificIssueStep.tsx`

**Screen layout:**

```
              What's happening with the [fault]?

              ┌────────────────────────────────────┐
              │ Cracked or shattered screen         │
              └────────────────────────────────────┘
              ┌────────────────────────────────────┐
              │ Black screen (external monitor      │
              │ works)                              │
              └────────────────────────────────────┘
              ┌────────────────────────────────────┐
              │ Thick bands, artefacts, or          │
              │ distortion                          │
              └────────────────────────────────────┘
              ...
```

- Heading: "What's happening with the [fault category]?" (e.g., "What's happening with the screen?")
- List of specific issues for the selected device + fault from `TRIAGE_ISSUES`
- Each issue shown as a card with just the label
- Tap → select the issue, store `specificIssue`, `issueRoute`, `issueRepairType`, `isUrgent` in form state, auto-advance
- If issue has `urgent: true` → show a brief amber alert below the heading: "⚠ This may need urgent attention. Please let our team know immediately."
- Cards should be full-width (single column list, not grid) — these are text-heavy labels

### Updated Step: `src/steps/FaultStep.tsx`

- Replace the static 8-card generic list with device-specific faults from `DEVICE_FAULTS[selectedDevice]`
- Show only faults that have triage issues (if a fault category has an empty array in TS, hide it — e.g., iPad Camera currently has `[]`)
- Each card shows the fault label + the SVG icon from the quote wizard
- "Other" card always shown at the bottom
- Tapping "Other" → sets fault to "Other", skips specific-issue step, shows free-text description on the next screen (or adds a description field inline)

### Pricing Gate Update

The pricing gate currently looks up price from `pricing-data.json` using the generic fault. The quote wizard's fault labels don't match the pricing JSON keys.

**For now:** Use `issueRepairType` to map to pricing data. E.g., if `issueRepairType === 'screen'`, look up "Screen Repair" in the pricing JSON. If `issueRepairType === 'battery'`, look up "Battery Replacement". If `issueRoute === 'diagnostic'`, show "We'll confirm pricing after diagnosis."

Create a mapping in `src/data/triage.ts`:
```typescript
const REPAIR_TYPE_TO_PRICING_KEY: Record<string, string> = {
  'screen': 'Screen Repair',
  'battery': 'Battery Replacement',
  'keyboard': 'Keyboard Repair',
  'trackpad': 'Trackpad Repair',
  'touch-bar': 'Touch Bar Repair',
  'loudspeaker': 'Speaker Repair',
  'earpiece': 'Earpiece Repair',
  'rear-camera': 'Rear Camera Repair',
  'front-camera': 'Front Camera Repair',
  'rear-glass': 'Rear Glass Repair',
  'rear-camera-lens': 'Camera Lens Repair',
  'charging-port': 'Charging Port Repair',
  'power-button': 'Power Button Repair',
  'volume-button': 'Volume Button Repair',
  'mute-button': 'Mute Button Repair',
  'home-button': 'Home Button Repair',
  'side-button': 'Side Button Repair',
  'crown': 'Crown Repair',
  'heart-rate-monitor': 'Heart Rate Monitor Repair',
  'screen-glass': 'Screen Glass Repair',
  'dustgate': 'Dustgate Repair',
  'flexgate': 'Flexgate Repair',
  'diagnostic': null, // no price — show diagnostic message
};
```

If the mapped pricing key doesn't exist in the JSON for the selected model, fall back to "We'll confirm your quote when we inspect the device."

If `issueRoute === 'diagnostic'`, show: "This issue needs a diagnostic first. We'll confirm the exact repair and cost after inspection."

### What About `contact` and `dismiss` Routes?

- **`contact` route:** Skip pricing gate and proceed decision. Go straight to a simplified confirmation: "Thanks [Name], one of our team will come up to discuss this with you."
- **`dismiss` route:** Show the `copy` text from the issue (e.g., "We can't bypass an iPhone passcode or iCloud lock...") with a "Back" button and no submit action. The customer reads the message and can go back to try a different issue.

---

## Do NOT Change

- Flow engine (`src/flows/` core logic, `src/hooks/useFlow.ts`)
- Backend (`backend/`)
- Shared types (add to them, don't replace existing fields)
- Design system (keep the current Tailwind/shadcn styling)
- Welcome, identity, model, pre-repair, booking-confirm, collection, confirmation steps (unless needed for the new data model)
- Tests that aren't affected by the fault/issue changes

---

## Files To Create

| File | Purpose |
|------|---------|
| `src/data/triage.ts` | Device faults, triage issues, fault icons, repair-type-to-pricing mapping |
| `src/steps/SpecificIssueStep.tsx` | New step component for issue selection |

## Files To Modify

| File | Change |
|------|--------|
| `shared/types.ts` | Add `specificIssue`, `issueRoute`, `issueRepairType`, `isUrgent` to `IntakeFormData` |
| `src/flows/definitions.ts` | Add `'specific-issue'` step to dropoff and enquiry flows |
| `src/flows/registry.tsx` | Register `SpecificIssueStep` |
| `src/steps/FaultStep.tsx` | Device-specific faults from triage data instead of generic list |
| `src/steps/PricingGateStep.tsx` | Use `issueRepairType` for price lookup; handle diagnostic route |
| `src/steps/ConfirmationStep.tsx` | Handle contact/dismiss routes differently |

---

## QA Checklist

- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] Walk-in: selecting MacBook shows MacBook-specific faults (including Touch Bar)
- [ ] Walk-in: selecting iPhone shows iPhone-specific faults (including Rear Glass, Camera)
- [ ] Walk-in: selecting a fault shows specific issues from the triage system
- [ ] Walk-in: tapping a specific issue stores route, repairType, and isUrgent
- [ ] Walk-in: repair-route issues show pricing from static JSON
- [ ] Walk-in: diagnostic-route issues show "needs diagnostic" message instead of price
- [ ] Walk-in: contact-route issues skip to simplified confirmation
- [ ] Walk-in: dismiss-route issues show info text with back button
- [ ] Walk-in: "Other" fault skips specific-issue step
- [ ] Walk-in: urgent issues show amber alert
- [ ] Enquiry flow includes specific-issue step
- [ ] iPad Camera fault is hidden (empty triage array)
- [ ] Back navigation works through the new step
- [ ] No generic fault categories visible anywhere (no "Not Turning On", no "Diagnostic")
