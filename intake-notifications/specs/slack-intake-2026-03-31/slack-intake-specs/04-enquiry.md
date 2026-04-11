# Slack Intake Spec: Enquiry

**Written:** 2026-03-31
**Status:** Spec complete, ready for build
**Source:** Ricky confirmation + analysis of 73 past submissions

---

## Overview

Customer walks in and selects "Enquiry" on the iPad. Currently captures just name + a brief description. No email, no phone, no device type. Can't match to Monday or Intercom. Team goes upstairs blind.

---

## Current Typeform (Enquiry Form `NOt5ys9r`)

| Field | Type |
|-------|------|
| Name | short_text |
| Brief description of issue/reason | short_text |

That's it. No contact details, no device info, no categorisation.

---

## Analysis of Past Submissions (73 total)

Enquiries fall into four categories:

| Category | Example | % of submissions | What team needs |
|----------|---------|-----------------|-----------------|
| **Repair status update** | "Update on my iPhone 15 Pro", "About the payment" | ~25% | Pull up their Monday item immediately |
| **New repair enquiry** | "MacBook Pro liquid damage", "iPhone 15 Screen" | ~45% | Device, fault, pricing, availability |
| **Warranty/follow-up** | "Coming back about phone previously repaired", "Discuss return" | ~15% | Previous repair history, what was done |
| **Simple/misc request** | "Screen protector", "Reset iPhone" | ~15% | Quick answer, minimal context needed |

---

## Proposed Typeform Improvements

### Step 1: Name + Email (required)
- Name (existing)
- Email address (NEW, required): enables Monday + Intercom matching

### Step 2: Branch question
**"What's your enquiry about?"**
- 🔄 Update on an existing repair
- 🔧 New repair or quote
- 🔁 Issue with a previous repair (warranty)
- ❓ General question

### Branch A: Update on existing repair
- No further questions needed
- System matches by email to Monday item
- Slack shows: customer name, matched device, current status, last update, payment status
- Team can answer immediately without opening Monday

### Branch B: New repair or quote
- Device type (iPhone/iPad/MacBook/Watch)
- Specific model (dropdown, same as walk-in form)
- Issue (Screen/Battery/Port/Keyboard/Liquid/Diagnostic/Data Recovery/Other)
- Brief description (free text)
- System does pricing lookup (device + fault → price)
- Slack shows: customer name, device, issue, indicative price, returning customer check

### Branch C: Warranty / previous repair issue
- Brief description of the issue
- System matches by email to find previous repairs on Monday
- Slack shows: customer name, previous repair(s), what was done, when, warranty status

### Branch D: General question
- Brief description (existing field)
- Slack shows: customer name, question, returning customer check

---

## Slack Notification

All branches post to the same Slack channel with a consistent format:

- **Customer name**
- **Enquiry type:** badge/tag (Status Update / New Repair / Warranty / General)
- **Device** (if provided or matched from Monday)
- **Enquiry detail:** their question/description
- **Customer match:** if email matches Monday/Intercom, show context:
  - Current/recent devices
  - Repair status
  - Last Intercom conversation
- **Pricing** (Branch B only): indicative price for device + fault
- **Intercom + Monday links** (if matched)

---

## Actions (Buttons)

### For Status Updates (Branch A):
- **✅ Answered** - mark as handled, add a note if needed

### For New Repair Enquiries (Branch B):
- **✅ Book In** - convert to a booked appointment (creates/updates Monday item)
- **❌ Customer Declined** - with reason (price, timing, etc.)

### For Warranty (Branch C):
- **✅ Handled** - with notes on outcome
- **🔧 Rebook** - create a new Monday item linked to the original repair

### For General (Branch D):
- **✅ Answered** - mark as handled

---

## Hard Requirements

1. **Email is required.** Without it we can't match to Monday or Intercom and the notification is useless.
2. **Branching keeps it short.** Status-check customers answer 2 questions, not 8. New repair enquiries give us what we need for pricing.
3. **Customer matching on every branch.** Always check email against Monday + Intercom.
4. **Pricing lookup on new repair enquiries.** Same device + fault → price logic as walk-ins.
5. **Every enquiry gets a resolution.** Buttons ensure nothing falls through the cracks.

---

## Architecture Notes

- Typeform with logic jumps handles the branching
- Typeform webhook triggers n8n workflow
- n8n matches customer by email against Monday (Main Board) + Intercom
- Branch B: pricing lookup (Shopify products or reference table)
- n8n posts enriched Slack message with appropriate buttons per branch
- Button actions write back to Monday or create items as needed
- No separate n8n workflow exists for enquiries currently; this is a new build
