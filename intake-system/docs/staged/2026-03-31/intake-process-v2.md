# Reception Self-Service Pilot v2

**Status:** Staged pilot proposal - ready for pilot review, not canonical SOP
**Date:** 9 March 2026
**For:** Ferrari, Andres, Ricky

**Canonical note:** This file describes a proposed Slack/Typeform intake pilot. It is not verified live process truth. Use `/home/ricky/kb/operations/intake-flow.md` for the current canonical intake status.

---

## The Problem

With Adil gone, every walk-in customer pulls a technician (currently Andres) off the bench. That costs us repair output and revenue. We need to:

1. Minimise the time Andres spends away from the bench
2. Make sure nothing gets missed during intake
3. Give Andres context before he goes upstairs so the interaction is fast
4. Capture intake notes without Andres having to type them out

## Pilot Boundary

This pilot covers customer pre-triage, Slack briefing, and handoff support only.

It does not replace the canonical intake record or the internal acceptance gates before queue entry.

In particular:

- Monday remains the canonical intake record
- passcode capture/verification still has to be completed before queue entry unless a documented exception applies
- required internal acceptance gates still include parts check, turnaround confirmation, intake photos, and complete handoff notes
- baseline intake questions still need to capture prior repair history, Apple history, device origin, fault cause, and any authorisation requirements before the device enters the queue

## Proposed Pilot Flow (Phase 1)

### Step 1: Customer Arrives

In the proposed pilot, the customer walks in and fills in the Typeform on the iPad at reception. The form would route based on why they're there:

- **Drop-off (booked appointment)**
- **Drop-off (no appointment / walk-in)**
- **Collection**
- **Enquiry**

### Step 2: Typeform Improvements

The proposal adds questions to the existing forms so more context is captured before Andres goes up.

**Walk-in (no appointment) - new questions after issue description:**

| Question | Options | Why |
|----------|---------|-----|
| Have you reviewed our pricing and turnaround online? | Yes / No | If no, show them the pricing page before booking in |
| Has your device had any liquid damage or been dropped? | Yes / No / Not sure | Changes diagnostic approach, tech needs to know |
| Is your data backed up? | Yes / No / I don't know | Legal protection + sets expectations. For normal repairs (device powers on). |
| Would you like your device delivered back after repair (free of charge)? | Deliver / I'll collect | Reduces future collection appointments |
| We will need your device passcode for testing. Please have it ready. | Acknowledged | Not asking them to type it. Just a heads-up so Andres can take it in person |
| Do you have any other questions? | Free text (optional) | Captures anything else before Andres goes up |

**Data question logic:** If the customer answered "Yes" to liquid damage or the issue suggests no power/unresponsive, the form shows: *"Do you have a backup of your data?"* instead. This is stronger wording because there's a real risk of data loss in those cases.

**Booked appointment drop-off - add after name confirmation:**

| Question | Options |
|----------|---------|
| We will need your device passcode for testing. Please have it ready. | Acknowledged |
| Would you like your device delivered back after repair (free of charge)? | Deliver / I'll collect |
| Is there anything else we should know about your device? | Free text (optional) |

**Collection - add after name confirmation:**

| Question | Options |
|----------|---------|
| Do you have any questions about your repair before collecting? | Yes (free text) / No |

### Step 3: Slack Notification + Agent Briefing

When the Typeform submits, the intended pilot flow is for a notification to land in the relevant Slack channel (e.g. `#walk-in-form-responses`).

**Proposed: an agent replies in the Slack thread with extra context:**

The agent automatically:
- Searches Monday.com for the customer's name/email to find any prior repairs or open items
- Searches Intercom for previous conversations
- Posts a summary in the thread before Andres goes up

Example:
> **Returning customer.** Last repair: MacBook Air screen replacement, Oct 2025, collected.
> Intercom: 3 previous conversations, last one about battery health query (Jan 2026).
> Monday: No open items.
> **Note:** Customer has not reviewed pricing online. Ensure pricing is confirmed before booking in.

This would give Andres (or the future coordinator) a briefing before they walk upstairs.

### Step 4: Andres Sees the Customer

In the proposed pilot, Andres would go upstairs with context. The intended interaction is:
- Confirm details (not discover them)
- Take the device
- Take passcode verbally
- Take payment if needed

This pilot step does not waive the canonical intake hard gates. Before queue entry, the passcode and other required intake checks still need to be completed or explicitly excepted.

### Step 5: Voice Note (Post-Interaction)

After the customer interaction, Andres would come back downstairs and leave a **voice note** in the Slack thread instead of typing notes manually.

Example voice note: *"Customer John, MacBook Pro 14 M1 Pro, dropped it last week, screen cracked on the left side, no AppleCare, wants delivery back, took £49 deposit on SumUp, passcode 4521."*

**What should happen to the voice note in the pilot:**
1. The voice note is picked up and transcribed (via Whisper API)
2. The transcription is formatted into a structured note
3. That note is automatically added as an update to the Monday.com item

Andres talks for 30 seconds. The proposed system does the rest.

### Step 6: Monday.com Updated

The intended Monday item would then have:
- Original Typeform data (name, email, phone, device, issue, new questions)
- Agent-pulled context (prior repairs, Intercom history)
- Andres's voice note transcription as an update

Monday remains the canonical intake record. The Slack thread is supplemental handoff tooling only.

The tech picking up the repair would then have fuller context without chasing anyone.

---

## What This Solves

| Before | After |
|--------|-------|
| Andres goes up blind, spends 10-15 min per walk-in | Andres has a briefing, spends 3-5 min |
| Intake notes are inconsistent or missing | Voice note captures everything, transcribed automatically |
| No prior customer context at intake | Agent pulls Monday + Intercom history into Slack thread |
| Passcode chased after the fact | Customer told to have it ready, Andres takes it verbally |
| Every customer comes back to collect | Delivery option offered upfront, reduces future visits |
| "Issue: Slow" with no detail | Form captures liquid damage, backup status, additional questions |

---

## What Needs Building

| Task | Owner | Effort |
|------|-------|--------|
| Add new questions to Typeform (walk-in, drop-off, collection) | Jarvis (via API) | Today |
| Agent briefing bot (listens to Slack channels, pulls Monday + Intercom, posts in thread) | Build task (coding agent) | This week |
| Voice note transcription pipeline (Slack voice note > Whisper API > Monday update) | Build task (coding agent) | This week |
| Brief Andres on the new process | Ferrari / Ricky | Today |

---

## Phase 2 (Later)

- Replace Typeform with custom React intake form (saves £70/month, allows dynamic questions per device/fault)
- Enquiry routing to Ferrari via video call for complex questions
- AI-powered intake that can answer common questions before escalating to a human
- New coordinator takes over front of house entirely
