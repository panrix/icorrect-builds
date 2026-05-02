# Codex Build Brief: UI Redesign with shadcn/ui

**Project:** iCorrect Intake System — Full visual redesign
**Location:** `/home/ricky/builds/intake-system/frontend/`
**Owner:** Ricky (remote, UTC+8)
**Orchestrator:** Claude Code (will QA your output)

---

## What You're Doing

The intake system's flow logic is correct (4 flows, branching engine, all working). The UI is terrible. You are restyling every component to look like a premium Apple Store check-in kiosk.

**Do not touch the flow logic, state management, hooks, or backend.** Only change visual components, CSS, and layout.

---

## Design Direction: Apple Store Clean

This iPad kiosk sits at the reception desk of a premium Apple repair shop. Customers interact with it while standing. The design must feel like it belongs next to Apple's own interfaces.

**Reference:** Apple Genius Bar check-in, Apple.com checkout flow, Apple Store app.

**Principles:**
- **White/light backgrounds.** No gradients, no glows, no glassmorphism. Just clean white and light grey.
- **SF Pro font stack.** Already configured: `-apple-system, BlinkMacSystemFont, "SF Pro Display"`. Do not use "Assistant" or any Google Fonts.
- **Generous whitespace.** Don't cram things together. Let the content breathe.
- **One thing per screen.** Each step asks one question or shows one set of information. Don't split into two-column layouts with sidebars.
- **Large, clear text.** Customer is standing at a counter, not sitting at a desk. Headings should be large and readable from arm's length.
- **Subtle, purposeful colour.** Blue (`#0071E3`) for primary actions only. Everything else is black, grey, and white.
- **No decorative elements.** No badges, no glowing orbs, no gradient backgrounds, no "kiosk-ready" labels. The interface IS the product.
- **No developer copy.** Remove ALL text that talks about "flow engines", "branching", "shared pipelines", "Phase X", or system architecture. The customer sees: "Welcome to iCorrect", "What brings you in today?", "Which device needs repair?" — that's it.

---

## Infrastructure Already Set Up

shadcn/ui dependencies are installed and configured:

- **Tailwind CSS v4** via `@tailwindcss/vite` plugin
- **CSS variables** in `src/app.css` with Apple-inspired colour palette
- **`cn()` utility** at `src/lib/utils.ts` (standard shadcn pattern)
- **`class-variance-authority`** for component variants
- **`lucide-react`** for icons
- **Path alias** `@/` → `./src/`

The old styling is in `src/index.css` — all custom CSS classes. You will replace these with Tailwind utility classes and delete `src/index.css` when done.

**Important:** Import `./app.css` instead of `./index.css` in `src/main.tsx`.

---

## What To Restyle (every file)

### Shell (`src/components/Shell.tsx`)
**Current:** Gradient background, glow orb, glassmorphism frame, "iCorrect / Intake System" brand bar with badge.
**Target:** Clean white background. Small iCorrect logo top-left. No frame, no glow, no badge. The shell should be almost invisible — just a white page with the logo and the content.

```
┌──────────────────────────────────────────────────┐
│  [logo] iCorrect                                 │
│                                                  │
│                                                  │
│              [step content here]                  │
│                                                  │
│                                                  │
└──────────────────────────────────────────────────┘
```

- Background: `bg-white` or `bg-[#f5f5f7]` (Apple's light grey)
- Full viewport height, centered content
- Logo: small, top-left, subtle — not a branded header bar

### Welcome (`src/steps/WelcomeStep.tsx`)
**Current:** Two-column hero with developer summary cards ("Flow-ready", "UI direction", "Next phase"). Tech demo copy.
**Target:** Single column, centered. Large heading, one line of subtext, one button.

```
              [iCorrect logo — larger here]

              Welcome to iCorrect

              Tap below to get started.

              [ Get Started ]
```

- Logo centered and prominent (this is the first thing customers see)
- "Welcome to iCorrect" — large, clean, `text-4xl font-semibold`
- "Tap below to get started." — muted grey, `text-lg text-muted-foreground`
- Single blue button, large touch target (min 56px height, `w-full max-w-xs`)
- Remove the "View team shell" button (team view is accessed via `/team` URL, not from the customer form)
- Remove ALL summary cards
- Auto-reset to this screen after 30s of inactivity on Confirmation

### Visit Purpose (`src/steps/VisitPurposeStep.tsx`)
**Current:** Two-column with sidebar showing "Flow model / Branching engine" text. Cards have "Live now" badges and developer descriptions.
**Target:** Single column, centered. Four large cards in a 2x2 grid.

```
              What brings you in today?

              ┌──────────────────┐  ┌──────────────────┐
              │                  │  │                  │
              │  I have an       │  │  Drop off for    │
              │  appointment     │  │  repair          │
              │                  │  │                  │
              └──────────────────┘  └──────────────────┘
              ┌──────────────────┐  ┌──────────────────┐
              │                  │  │                  │
              │  Collect my      │  │  I have a        │
              │  device          │  │  question        │
              │                  │  │                  │
              └──────────────────┘  └──────────────────┘
```

- Heading: "What brings you in today?" — `text-3xl font-semibold` centered
- 4 cards in 2x2 grid (`grid grid-cols-2 gap-4 max-w-2xl mx-auto`)
- Each card: white background, subtle border (`border border-border`), rounded (`rounded-xl`), large padding, large text
- Card text: just the label ("I have an appointment", "Drop off for repair", "Collect my device", "I have a question"). No descriptions, no badges.
- Tap → auto-advance (already works, just restyle)
- Hover/active: subtle blue border, light blue background tint
- On mobile: stack to single column (`grid-cols-1`)

### Identity (`src/steps/IdentityStep.tsx`)
**Current:** Two-column with sidebar explanation.
**Target:** Single column, centered form.

```
              Your details

              Full name
              [________________________]

              Email address
              [________________________]

              Phone number          (walk-in only)
              [________________________]

              [ Continue ]
```

- Clean form fields with labels above
- Inputs: `h-12 rounded-lg border border-input bg-white px-4 text-base`
- Validation: red border + message below field on error
- Continue button: full-width blue, disabled until valid
- Max width container (`max-w-md mx-auto`)

### Device Selection (`src/steps/DeviceStep.tsx`)
**Target:** "Which device needs repair?" heading, 4 large cards (iPhone, iPad, MacBook, Apple Watch) in a 2x2 grid with device silhouette icons. Same card style as visit purpose. Tap → auto-advance.

### Model Selection (`src/steps/ModelStep.tsx`)
**Target:** "Which model?" heading, search bar at top, scrollable list of models below. Clean list items, not cards. Tap model → auto-advance. "I'm not sure" option at bottom.

### Fault Selection (`src/steps/FaultStep.tsx`)
**Target:** "What's the issue?" heading, fault cards in 2x2 grid (or 2x3 for 6+ options). Same card style. Optional description textarea below if they want to add detail. Keyboard option only shown for MacBook.

### Pricing Gate (`src/steps/PricingGateStep.tsx`)
**Target:** Clean pricing display.

```
              Screen Repair — iPhone 15 Pro

              £279
              Same-day turnaround

              We use quality-tested parts for
              all our repairs.

              [ Continue ]
```

- If no price match: "We'll confirm your quote when we inspect the device."
- Large price number (`text-5xl font-bold`)
- Turnaround below price in muted text
- No "Have you seen our pricing?" question with Yes/No — just show the pricing info and Continue

### Proceed Decision (`src/steps/ProceedDecisionStep.tsx`)
**Target:** Clean decision screen.

```
              Would you like to go ahead?

              [ Yes, book in my repair ]
              [ No thanks ]
```

- Two large buttons, stacked vertically
- "Yes" = primary blue button
- "No" = secondary/outline button
- If No → quote email offer + decline reason (keep existing logic, just restyle)
- Decline subflow: clean form, muted styling, "Please hand the iPad back to reception" message

### Pre-Repair Questions (`src/steps/PreRepairStep.tsx`)
**Target:** One question at a time feel, but can be grouped on one screen if they're quick Yes/No toggles.

```
              Just a few more questions

              Has this device been repaired before?
              [ Yes ]  [ No ]

              Has Apple looked at this device?
              [ Yes ]  [ No ]

              Is your data backed up?
              [ Yes ]  [ No ]  [ I don't know ]

              ☑ I'll have my passcode ready for testing

              How would you like your device returned?
              [ Deliver back (free) ]  [ I'll collect ]

              [ Submit ]
```

- Toggle buttons for Yes/No (not radio buttons or checkboxes)
- Selected toggle: blue fill. Unselected: white with border.
- Passcode acknowledgement: checkbox with text
- Submit button at bottom, disabled until all answered

### Booking Confirmation (`src/steps/BookingConfirmStep.tsx`)
**Target:** Show the booking details cleanly.

```
              Welcome back

              We found your booking:

              iPhone 15 Pro · Screen Repair
              Booked: 8 April 2026

              Is this correct?
              [ Yes, that's right ]  [ Something's wrong ]
```

- Clean card showing the matched booking
- If multiple matches: list them, let customer tap the right one
- If no match: "We couldn't find your booking" with options

### Collection Questions (`src/steps/CollectionQuestionsStep.tsx`)
**Target:** Simple form.

```
              Collecting your device

              Do you have any questions about your repair?

              [________________________]
              (optional)

              [ Submit ]
```

### Confirmation (`src/steps/ConfirmationStep.tsx`)
**Target:** Clean success screen.

```
              ✓

              Thank you, John

              A member of our team will be with
              you shortly. Please take a seat.
```

- Large green checkmark (animated, use Framer Motion)
- Customer's name
- Friendly message
- Auto-reset to Welcome after 30 seconds
- Small "Start new" link at bottom (muted, not prominent)

### Additional Notes (`src/steps/AdditionalNotesStep.tsx`)
**Target:** Simple textarea + submit. Same clean style as other form steps.

---

## Components To Rebuild

### `OptionCard` → Replace with Tailwind card
Don't use the custom `OptionCard` component. Build inline with Tailwind:

```tsx
<button
  className={cn(
    "flex flex-col items-start gap-2 rounded-xl border bg-white p-6 text-left transition-all",
    "hover:border-primary/30 hover:bg-primary/5",
    "active:scale-[0.98]",
    selected && "border-primary bg-primary/5"
  )}
  onClick={onClick}
>
  <span className="text-lg font-semibold">{title}</span>
</button>
```

### `Button` → Rebuild with CVA
Use `class-variance-authority` for button variants:

```tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl text-base font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-14 px-8",
        lg: "h-16 px-10 text-lg",
        sm: "h-10 px-4 text-sm",
        full: "h-14 w-full px-8",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);
```

### `TextField` / `TextAreaField` → Rebuild with Tailwind
Standard input styling:
```tsx
<input
  className="h-12 w-full rounded-lg border border-input bg-white px-4 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
/>
```

### `Shell` → Minimal wrapper
```tsx
export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <header className="flex items-center gap-3 px-8 pt-6">
        <img src="/logo.png" alt="iCorrect" className="h-8" />
        <span className="text-sm font-medium text-muted-foreground">iCorrect</span>
      </header>
      <main className="flex min-h-[calc(100vh-80px)] items-center justify-center px-6 pb-8">
        {children}
      </main>
    </div>
  );
}
```

### `Surface` → Delete
Replace with `<div className="...">`. No glassmorphism wrapper needed.

### `BrandMark` → Delete
Use the logo image directly: `<img src="/logo.png" alt="iCorrect" className="h-8" />`

---

## Files To Modify

| File | Action |
|------|--------|
| `src/main.tsx` | Change `import './index.css'` → `import './app.css'` |
| `src/App.tsx` | Remove "View team shell" from welcome, restyle back/progress |
| `src/components/Shell.tsx` | Full rewrite (minimal white shell) |
| `src/components/Button.tsx` | Rewrite with CVA + Tailwind |
| `src/components/OptionCard.tsx` | Rewrite with Tailwind (or inline) |
| `src/components/TextField.tsx` | Rewrite with Tailwind |
| `src/components/TextAreaField.tsx` | Rewrite with Tailwind |
| `src/components/Surface.tsx` | Delete (replace usages with plain divs) |
| `src/components/BrandMark.tsx` | Delete (use img tag directly) |
| `src/steps/WelcomeStep.tsx` | Full rewrite |
| `src/steps/VisitPurposeStep.tsx` | Full rewrite |
| `src/steps/IdentityStep.tsx` | Restyle |
| `src/steps/DeviceStep.tsx` | Restyle |
| `src/steps/ModelStep.tsx` | Restyle |
| `src/steps/FaultStep.tsx` | Restyle |
| `src/steps/PricingGateStep.tsx` | Restyle |
| `src/steps/ProceedDecisionStep.tsx` | Restyle |
| `src/steps/PreRepairStep.tsx` | Restyle |
| `src/steps/BookingConfirmStep.tsx` | Restyle |
| `src/steps/CollectionQuestionsStep.tsx` | Restyle |
| `src/steps/ConfirmationStep.tsx` | Restyle |
| `src/steps/AdditionalNotesStep.tsx` | Restyle |
| `src/index.css` | Delete entirely when done |

---

## Do NOT Change

- `src/flows/` — flow definitions, registry, types (logic is correct)
- `src/hooks/useFlow.ts` — flow state management (correct)
- `src/lib/route.ts` — routing (correct)
- `src/lib/pricing.ts` — pricing lookup (correct)
- `src/lib/api.ts` — API client (correct)
- `shared/types.ts` — type contracts (correct)
- `backend/` — entire backend directory (untouched)
- `tests/` — keep tests passing

---

## How To Work

1. Start by changing `main.tsx` to import `app.css` instead of `index.css`
2. Rewrite `Shell.tsx` first — this frames everything
3. Rewrite `WelcomeStep.tsx` and `VisitPurposeStep.tsx` — these set the visual tone
4. Work through the remaining steps one by one
5. Delete `Surface.tsx` and `BrandMark.tsx` when no longer imported
6. Delete `index.css` last, after all components use Tailwind
7. Run `npm run build` and `npm run lint` after each major change
8. Run `npm run test` at the end to ensure Playwright tests still pass

---

## QA Checklist

- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] `npm run test` passes (Playwright)
- [ ] No custom CSS classes remain (all Tailwind)
- [ ] `src/index.css` deleted
- [ ] No developer-facing copy visible to customers
- [ ] No gradients, glows, or glassmorphism
- [ ] All 4 flows render correctly
- [ ] Works on iPad landscape (1024x768 viewport)
- [ ] Works on phone portrait (390x844 viewport)
- [ ] Back button and progress bar work
- [ ] Auto-advance on card tap works
- [ ] Confirmation auto-resets after 30s
- [ ] Logo visible on all screens

---

## Final Note

The goal is NOT to make it "look nice." The goal is to make it **invisible** — so clean and simple that the customer doesn't think about the interface at all. They just answer the questions and sit down. Every decorative element, every unnecessary word, every visual distraction is a failure. Apple's genius is in what they remove, not what they add.
