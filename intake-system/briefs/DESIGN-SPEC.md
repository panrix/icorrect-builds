# iCorrect Intake Form: Design Specification

## Brand Identity (extracted from icorrect.co.uk)

### Colours
- **Primary Dark:** `#1D1D1F` (near-black, Apple-style)
- **Primary Blue:** `#0071E3` (Apple blue, used for CTAs/links)
- **Secondary Blue:** `#005BBE` (darker blue for hover states)
- **Background Light:** `#F3F3F3` / `#F1F1F1` (light grey)
- **Background White:** `#FFFFFF`
- **Dark Section BG:** `rgb(29,29,31)` / `rgb(36,40,51)` (dark sections/footer)
- **Text Primary:** `#1D1D1F`
- **Text Secondary:** `#666666`
- **Text Muted:** `#999999`
- **Border/Divider:** `#CCCCCC`
- **Success Green:** `#34A853`
- **Error Red:** `#B91C1C`

### Typography
- **Headings:** "Assistant", sans-serif (weight 700)
- **Body:** "Assistant", sans-serif (weight 400)
- **Accent/Feature text:** "Axiforma" (medium/regular) - used on custom sections
- **System fallback:** -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif

### Logo
- **File:** `logo.png` (in this directory)
- **Source URL:** `https://icorrect.co.uk/cdn/shop/files/iCorrect_Logo_1.png?v=1732539616`
- **White BG version:** `https://icorrect.co.uk/cdn/shop/files/iCorrect_Logo_White_Background_7ef1b03c-48ae-478e-af43-3ceb6d2e46a9.png`

### Design Language
- Clean, minimal, Apple-inspired
- Buttons: solid fill, square corners (border-radius: 0), no shadows
- Cards: no visible borders, subtle shadows only where needed
- Progress indicators: thin, linear
- Spacing: generous whitespace, not cramped
- Animations: subtle fade/slide transitions between steps (200-300ms)
- Mobile-first: this runs on an iPad at reception

## Target Environment
- **Primary:** iPad in landscape, mounted at reception desk (kiosk mode)
- **Secondary:** Any mobile/tablet browser (responsive)
- **Orientation:** Landscape-optimised, portrait acceptable

## Form Architecture

### Phase 1 Prototype (THIS BUILD)

Single-page React app with step-by-step wizard flow. No backend required for prototype; pricing data is bundled as static JSON from Monday.com export.

#### Steps:

1. **Welcome Screen**
   - iCorrect logo centred
   - "Welcome to iCorrect" heading
   - "Let's get your repair started" subheading
   - Single CTA: "Start" button

2. **Your Details**
   - Full name (required)
   - Email address (required, validated)
   - Phone number (required, UK format hint)

3. **Select Your Device**
   - Large tap targets (card-style selection, not dropdowns)
   - Categories: iPhone, iPad, MacBook, Apple Watch
   - Each with device silhouette icon
   - Tapping selects and advances

4. **Select Your Model**
   - Filtered list based on device category
   - Search/filter bar at top
   - Scrollable grid of model names
   - Data source: Monday.com Products & Pricing board (bundled JSON)

5. **What's Wrong?**
   - Fault category cards (same card-style as device selection):
     - Screen Damage
     - Battery
     - Charging Issue
     - Keyboard (MacBook only)
     - Liquid Damage
     - Not Turning On
     - Diagnostic / Unknown Fault
     - Other
   - Free-text "Describe the issue" field below

6. **Pricing & Turnaround**
   - Shows exact price for selected model + fault from Monday data
   - Shows estimated turnaround time
   - If no exact match: "We'll confirm your quote when we see the device"
   - "Have you reviewed our pricing online?" toggle
   - If no: brief pricing explanation panel

7. **Before We Begin**
   - Conditional questions:
     - "Has this device been repaired before?" (Yes/No)
     - "Has Apple seen this device?" (Yes/No)
     - Data backup question (wording varies by fault type):
       - Normal: "Is your data backed up?"
       - Liquid/no power: "Do you have a backup of your data?"
     - "We'll need your device passcode for testing. Please have it ready." (acknowledge)
   - Delivery preference: "Deliver back (free)" / "I'll collect"

8. **Review & Submit**
   - Summary card of all answers
   - Edit buttons per section
   - "Submit" CTA
   - On submit: POST to webhook (configurable URL) + show confirmation

9. **Confirmation**
   - Checkmark animation
   - "Thank you, [Name]"
   - "A member of our team will be with you shortly"
   - Auto-resets to welcome screen after 15 seconds

### Data

Bundle `monday-products.json` as static pricing data for the prototype. Structure:
```json
{
  "iPhone 15 Pro Max": {
    "Screen Repair": { "price": 329, "turnaround": "Same day" },
    "Battery Replacement": { "price": 89, "turnaround": "Same day" }
  }
}
```

Extract and transform from existing `/home/ricky/.openclaw/agents/main/workspace/data/monday-products.json`.

### Tech Stack
- React 18 + TypeScript
- Vite for build/dev
- Tailwind CSS for styling
- Framer Motion for step transitions
- No routing library needed (wizard state only)
- No backend needed for prototype

### Key UX Principles
- One question/section per screen (Typeform-style pacing)
- Large touch targets (min 48px, prefer 56px+)
- Progress bar at top showing step completion
- Back button always visible (except welcome screen)
- Smooth slide transitions between steps
- Auto-focus on first input of each step
- Keyboard should not obscure inputs on iPad
