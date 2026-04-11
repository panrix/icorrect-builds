# Michael Ferrari — Complete Audit Reference
## Consolidated: 27 February 2026
## Audit Period: 18–25 February 2026

**Auditor:** Ricky Panesar (via Claude Code + CS Jarvis agent)
**Data Sources:** Monday.com API (Boards 349212843 + 18393875720), Intercom (MCP + CS Jarvis direct API), TeleSphere CDR, Zendesk historical export

This document consolidates all Ferrari audit findings into a single reference. Individual source reports are listed at the end.

---

# PART 1: EXECUTIVE SUMMARY

Ferrari logs 6.8–8.6 hours/day on his Monday board. The single largest bucket is "Clients" at 3–4.2 hours daily (~18h/week). Verified client output across all channels:

| Channel | Verified Weekly Output |
|---------|----------------------|
| Intercom emails | ~31 manual emails, ~75 min composition |
| Phone calls | 45 answered/week, 2.3–7.6h (no call duration data) |
| Monday board admin | 765 actions, mostly status clicks and field updates |

**Best-case total: ~11-12h/week of verifiable work against ~38h logged.**

Revenue-generating work (quoting, booking, invoicing) = **9% of 765 Monday board actions.** The remaining 91% is board admin (59%), BM logistics (16%), workshop intake (12%), and parts (4%).

**80 contact form leads came in during the audit period:**
- 24 (30%) got a human reply — 1 confirmed conversion (4%)
- 45 (56%) got Fin AI only — 0 confirmed conversions
- 11 (14%) got no reply at all

**Estimated annual revenue impact: ~£150,000 from unanswered or bot-only communications across Intercom + phone.**

---

# PART 2: MONDAY.COM TIME TRACKING (Self-Reported)

**Board:** Ferrari's Daily Work (18393875720)

## Weekly Summary

| Day | Items | Clients | BM | Labels | Meeting | Other | TOTAL |
|-----|-------|---------|-----|--------|---------|-------|-------|
| Wed 25 Feb | 16 | 4h 04m | 1h 11m | 11m | 34m | 48m | **6h 48m** |
| Tue 24 Feb | 6 | 4h 13m | 56m | 41m | 2h 17m | 26m | **8h 33m** |
| Mon 23 Feb | 6 | 3h 40m | 1h 29m | 41m | 1h 00m | 36m | **7h 26m** |
| Thu 19 Feb | 7 | 3h 20m | 59m | 23m | 1h 40m | 1h 38m | **8h 00m** |
| Wed 18 Feb | 8 | 3h 04m | 1h 19m | 8m | 1h 35m | 34m | **7h 37m** |

## Expected vs Actual

| Task | Expected/Day | Actual |
|------|-------------|--------|
| Client Calls & Enquiries | 3.0h | "Clients" bucket: 3–4.2h (unverifiable) |
| Quotes | 0.25h | 4 invoices in 5 days |
| Confirm Appointments | 0.25h | 11 booking confirmations in week |
| Back Market Work | 0.5h | ~15 min actual (see Part 5) |
| Shipping Labels | 0.5h | Batched — seconds per label |
| Corporate Invoicing | 1.0h | 7 corporate items, ~85 actions |
| Team Meeting | 1.5h | 34 min to 2h 17m (extreme variance) |

## Red Flags

1. **"Clients" is a black box.** 3–4.2h/day logged as a single item with zero breakdown. No subitems, no notes, no linked conversations.
2. **Team Meeting variance.** Expected 1.5h. Actual: 34m to 2h17m. Tuesday logged 137 minutes.
3. **Tasks marked "Done" with zero time.** "Order parts", "Tola", "Vedant to call back", "Contact Faiz" — all marked Done with no time.
4. **Incomplete assigned tasks carried forward.** "Fix email address issue at checkout", "Project new Intercom views", "Write thought processes for enquiries" — all To Do with no progress.
5. **No conversion data.** Board tracks time but not outcomes.

---

# PART 3: INTERCOM — ACTUAL CLIENT EMAIL ACTIVITY

## Admin Account Structure

| ID | Name | Type | Role |
|----|------|------|------|
| 9702338 | Alex | Bot | Automation (auto-tags, auto-assigns via workflows) |
| 9702337 | Support | Admin | Shared admin account — Ferrari sends from this |

Ferrari sends as "Support" (admin@icorrect.co.uk), not a personal account. Cannot distinguish his activity from any other admin.

## Inbound Volume: 80 Contact Form Leads (CS Jarvis Verified)

| Category | Count | % | Conversions |
|----------|-------|---|-------------|
| Human replied | 24 | 30% | 1 confirmed (4%) |
| Fin only, no human follow-up | 45 | 56% | 0 confirmed (0%) |
| No reply at all | 11 | 14% | 0 |

**1 confirmed conversion from 80 leads = 1.25% conversion rate.**

Two possible untracked: Jordan Clark ("I have booked online #U2TJF8MTC") and Nizam Kabir ("Thanks, I've now booked") — Shopify `create-repair` tag didn't fire.

## Manual vs Automated Distinction

| What n8n automates | What Ferrari types manually |
|--------------------|-----------------------------|
| Device received confirmation | Quotes and pricing |
| Repair complete notification | Diagnostic findings |
| Collection ready notification | Chasing customers (Typeform, payments) |
| Courier booking confirmation | Appointment confirmations |
| Typeform submission logging | Follow-up replies to customer questions |

## Full Activity (CS Jarvis — Direct API, 20 Sampled Conversations)

| Type | Count | Est. Time |
|------|-------|-----------|
| Manual customer-facing replies | ~31 | ~62 min |
| Internal notes (Monday item links, etc.) | ~12 | ~12 min |
| Automated (n8n: received, completed, courier) | 4 | 0 min |
| **Total estimated manual composition time** | | **~75 min** |

## Activity Pattern

| Day | Messages | Notes |
|-----|----------|-------|
| Thu 19 Feb | 2 | Van Pham, internal notes |
| Fri 20 Feb | 3 | Kristina, Jai, Francisco |
| Mon 23 Feb | ~14 | Bulk catch-up day |
| Tue 24 Feb | ~11 | Another bulk day |
| Wed 25 Feb | ~13 | Mostly existing repairs |

Batch working pattern — Mon/Tue are catch-up days. Thu/Fri leads sit over the weekend.

## Response Time Distribution (27 conversations that got a reply)

| Bucket | Count | % |
|--------|-------|---|
| Under 1 hour | 1 | 4% |
| 1–5 hours | 6 | 22% |
| 5–24 hours | 7 | 26% |
| **Over 24 hours** | **13** | **48%** |
| **Average** | **45.3h** | |
| **Median** | **22.4h** | |

Slowest: Amanda Davis (143h / 6 days), Bonnie Awesu (73h / 3 days), multiple contact forms at 76–101h (3–4 days).

## Email Quality Note

The emails Ferrari writes are well-crafted — detailed diagnostic findings, proper pricing, YouTube links, courier options. **Quality is not the issue. Volume and speed are.**

## Conversation Samples

### Ehiz Ufuah — MacBook Repair (Feb 17–25)

| Date | Message | Manual or Auto |
|------|---------|---------------|
| 17 Feb | Invoice + Xero payment link | **Manual** |
| 18 Feb | Courier arrangement confirmation | Auto (n8n) |
| 20 Feb | Chase: complete pre-repair Typeform | **Manual** |
| 21 Feb | Chase #2: Typeform still incomplete | **Manual** |
| 25 Feb | Detailed diagnostic: camera, battery, keyboard + pricing | **Manual** |
| 25 Feb | Reply to customer question about previous repair | **Manual** |

### Alicia Davies — iPhone Repair (Feb 9+)

| Date | Message | Manual or Auto |
|------|---------|---------------|
| ~9 Feb | Appointment booking | Auto (n8n) |
| ~12 Feb | Device received | Auto (n8n) |
| ~14 Feb | Repair complete + collection ready | Auto (n8n) |
| ~17 Feb | SN/IMEI clarification + invoice | **Manual** |
| ~25 Feb | Phone case brand recommendations | **Manual** |

### Hannah — MacBook Screen Quote (Feb 24)

Outbound quote: MacBook Pro 14" A2442, £549, 2-3 days, YouTube link, courier options. No customer reply.

### Vimal Shah — Warranty Booking (Feb 25)

Warranty appointment for 26 Feb 9:30am. Tagged `create-repair` → n8n created Monday item. The one conversation showing proper end-to-end workflow.

## Lost Leads — 18 Named Customers, No Reply

| Date | Customer | Device / Repair |
|------|----------|----------------|
| Feb 19 | Nizam Kabir | MacBook Pro 14" M1 Pro (2021) |
| Feb 19 | Anthony Clay | iPad Pro 12.9" 3rd Gen (2018) |
| Feb 19 | Kieran | iPhone 11 |
| Feb 20 | Matthew Connell | MacBook Pro 16" M2 Pro (2023) |
| Feb 21 | Connor Carmichael | MacBook Air M1 (2020) |
| Feb 22 | Muhammad Ahmad Ahmer | MacBook Pro 16" M1 Pro (2021) |
| Feb 23 | Jarell Leslie-Okoro | iPhone 13 |
| Feb 24 | Kai Fish | iPhone 16 Pro Max |
| Feb 24 | Juyeon Lee | iPhone 14 |
| Feb 25 | Birju Ravaliya | iPad Pro 12.9" 4th Gen (2020) |
| Feb 25 | Juber Ahmed | Apple Watch Series 9 45mm |
| Feb 25 | ANNA BIENIEK | MacBook Pro 13" M2 (2022) |
| Feb 25 | James Liam Rosa Unda | MacBook Air M1 (2020) |
| + 5 more | Various | Various |

---

# PART 4: FIN AI PERFORMANCE

Fin handled 45 of 80 contact form leads with zero human follow-up.

## Quality Breakdown

| Fin Quality | Count | What Happened |
|------------|-------|--------------|
| OK | 28 | Gave a price, customer didn't engage further |
| Poor | 13 | Customer replied 2–4 times then gave up (repetitive loop) |
| Bad | 4 | Customer explicitly frustrated |

**0 confirmed Fin conversions. Zero.**

## Worst Conversations

- **Kyle Cowens** — 12 Fin messages, 10 customer replies. Fin promised a human would follow up. Nobody did.
- **Jordan Clark** — 9 Fin messages, 7 customer replies. Wrong repair quoted, looped on booking.
- **Adrian Mensah** — 5 Fin messages, 5 customer replies. Told a callback was coming. Still waiting.
- **Kai Fish** — told Fin directly: *"Your AI answers aren't great. A simple no would have been better."*

## Timeline

- Fin disabled ~Feb 21 on Ricky's instruction
- Before disabling: active but unsupervised, handling 56% of leads with no human oversight
- No process for human review of Fin's conversations
- Ferrari responsible for rollout but not maintaining/improving it
- **Lead bleed predates Fin disable** — Feb 18-19 forms went unanswered even with Fin available

---

# PART 5: MONDAY MAIN BOARD ACTIVITY (Board 349212843)

**Ferrari user ID:** 55780786 | **Audit week:** 765 total actions

## All Users — Weekly Activity

| User | Actions |
|------|---------|
| Automation (Monday internal, user -4) | 2,678 |
| Roni | 1,034 |
| **Ferrari** | **765** |
| Adil | 416 |
| Ricky (inc. n8n BM automation) | 378 |
| Andreas | 334 |
| Safan | 306 |
| Mykhailo | 140 |

## Ferrari Daily Breakdown

| Day | Actions | Key Activity |
|-----|---------|-------------|
| Wed 18 Feb | 135 | Column updates, 6 items created, board config |
| Thu 19 Feb | 146 | 114 column updates, 4 items created, BM status |
| Fri 20 Feb | 3 | 3 items created only — minimal |
| Sun 22 Feb | 2 | 2 items created (weekend) |
| Mon 23 Feb | 214 | Heaviest — 13 items created, 159 column updates |
| Tue 24 Feb | 125 | 9 items created, 91 column updates |
| Wed 25 Feb | 140 | 9 items created, 103 column updates |

## n8n Automation Under Ferrari's Profile

**16 of 46 item creations are n8n automation.** The Intercom `create-repair` → Monday workflow uses Ferrari's API token, so items are logged under his user ID.

Identifiable by `#XXXX - Name` format in "New Orders" group:

| Date | Item | Source |
|------|------|--------|
| Feb 18 | #1073 - Jessica Ukpebor | n8n |
| Feb 19 | #1074 - Nizam Kabir | n8n |
| Feb 19 | #1075 - Sean Connolly | n8n |
| Feb 22 | #1077 - Daniel Tiley | n8n |
| Feb 22 | #1078 - Ryan Burns | n8n |
| Feb 23 | #1079 - Alice Changa | n8n |
| Feb 23 | #1080 - Jean-Mari du Plooy | n8n |
| Feb 23 | #1081 - Stephane Michel | n8n |
| Feb 23 | #1082 - James Clarke | n8n |
| Feb 23 | #1076 - Olivia Lopes | n8n |
| Feb 23 | #1083 - Farah Korchi | n8n |
| Feb 24 | #1084 - Issam Abid | n8n |
| Feb 24 | #1085 - John Brinsmead-Stockham | n8n |
| Feb 24 | #1086 - Jan Perera | n8n |
| Feb 25 | #1087 - Natniel Aniel | n8n |
| Feb 25 | #1088 - Charlie Tristram | n8n |

Each n8n creation triggers ~26 rapid-fire column updates within seconds — all logged under Ferrari. **~42 of 765 actions (5%) are pure automation.**

## Ferrari's Manual Board Work

| Category | Actions | Notes |
|----------|---------|-------|
| Status changes | 139 | Moving items through pipeline |
| Repair Type changes | 67 | Setting/changing repair categories |
| Item names updated | 47 | Renaming items |
| Tracking updates | 46 | Courier tracking numbers |
| Items created (manual) | 30 | Walk-ins, Today's Repairs |
| Moved between groups | 34 | Routing to correct queues |
| Deadline changes | 33 | Setting/adjusting deadlines |
| Technician assignment | 28 | Assigning Safan/Mykhailo/Andreas |
| Requested Repairs | 27 | Filling in repair descriptions |
| Device info (Device, IMEI/SN) | 33 | Recording device details |
| Client field | 22 | Setting client type |
| Booking updates | 16 | Booking times |
| Parts updates | 15 | Parts status, orders |
| Payment/Invoice | 14 | Paid status, invoice actions |
| Subscribe/Unsubscribe | 31 | Board notification changes |
| Other | ~80 | Various admin fields |

## Status Transitions

| Status | Count | Type of Work |
|--------|-------|-------------|
| Return Booked | 39 | **Back Market returns** |
| Queued For Repair | 18 | Intake → repair queue |
| Shipped | 13 | Courier dispatched |
| Book Return Courier | 12 | BM return logistics |
| Booking Confirmed | 11 | Client bookings |
| Client Contacted | 10 | Quote/update sent |
| Quote Sent | 7 | Pricing sent to client |
| Book Courier | 6 | Arranging collection |
| Courier Booked | 6 | Courier confirmed |
| Invoiced | 4 | Invoice sent |
| Other | 13 | Various |

**BM logistics = ~27% of main board activity.** Admin/logistics work, not client conversion.

---

# PART 6: MOVEMENT PATTERNS — WHAT PULLS HIM INTO CHAOS

## Daily Activity Shape (Minute-by-Minute Analysis)

| Time Block | Primary Activity | BM | Client | Chaos |
|-----------|-----------------|-----|--------|-------|
| 08:30–09:00 | BM returns batch | HIGH | LOW | Moderate |
| 09:00–10:30 | Gap + BM intake | Medium | LOW | Low |
| 10:30–11:00 | BM queue management | Medium | Medium | Rising |
| **11:00–12:00** | **CHAOS HOUR** | **HIGH** | **HIGH** | **Maximum** |
| 12:00–13:00 | BM IMEI + n8n bookings | Medium | LOW | Moderate |
| 13:00–14:00 | Lunch gap | LOW | LOW | Low |
| 14:00–16:00 | Client work picks up | LOW | HIGH | Moderate |
| **16:00–17:00** | **Client focused** | **Zero** | **HIGH** | **Lowest** |
| 17:00–18:00 | Mixed n8n + client | Medium | Medium | Moderate |
| 18:00+ | BM shipping batch | HIGH | Zero | Batched |

**BM dominates 08:30–12:00 — exactly when customer enquiries arrive. Client work only picks up after 14:00, by which point leads are 4-6 hours cold.**

## Context Switching

| Day | Actions | Unique Items | Context Switches | Focused Bursts | Active Span |
|-----|---------|-------------|-----------------|----------------|-------------|
| Tue 18 Feb | 135 | 27 | 57 | 15 | 10:15–21:13 |
| Thu 19 Feb | 146 | 33 | 70 | 12 | 06:10–18:24 |
| Mon 23 Feb | 214 | 53 | **132** | 17 | 08:36–22:10 |
| Tue 24 Feb | 125 | 34 | 70 | 10 | 08:42–18:17 |
| Wed 25 Feb | 140 | 36 | 68 | 19 | 08:54–18:06 |

**Monday 23 Feb: 132 context switches across 53 items — switching every 3-4 minutes.**

## The 11:41 Chaos Window (Monday 23 Feb)

```
11:41:21 [BM] BM 1247 (MICHAEL ABBOTT)        — Outbound Tracking
11:41:26 [BM] BM 1307 (Muhammad Fatir)         — Outbound Tracking
11:41:31 [BM] BM 1289 (Kali Jack)             — Outbound Tracking
11:41:36 [BM] BM 1407 (Pritesh Vadher)         — Outbound Tracking
11:41:40 [BM] BM 1410 (Shaoul Bar-Avraham)     — Outbound Tracking
11:41:45 [BM] BM 1379 (Andrew McGinley)        — Outbound Tracking
11:41:50 [BM] BM 1384 (adam elbardoun)         — Outbound Tracking
11:41:54 [BM] BM 1430 (Katherine Palley)       — Outbound Tracking
11:41:59 [BM] BM 1440 (Abdirahman Abdirahman)  — Outbound Tracking
11:42:04 [BM] BM 1448 (Ayoola Agboola)         — Outbound Tracking
11:42:15 [BM] BM 1451 (Akif Nalbantoglu)       — Outbound Tracking
  → switches to client Van Pham (tracking, ticket, Intercom ID, status)
  → then batch: 10 BM items → "Return Booked" at 11:43:00
```

11 tracking numbers in 54 seconds, then a client, then 10 batch status changes. Courier label printing — not client services.

## BM Real Time vs Spread Time (Monday 23 Feb)

| Window | BM Actions | Real Time |
|--------|-----------|-----------|
| 08:39–08:56 | 10 actions (Book Return Courier, Repair Type, Date Sold) | ~3 min |
| 11:41–11:43 | 11 tracking numbers + 10 batch status → Return Booked | **54 sec** + **1 sec** |
| 12:00–12:04 | 3 IMEI entries | ~2 min |
| 18:02–18:04 | 12 items batch → Shipped | **14 seconds** |

**Total actual BM work: ~15 minutes.** Smeared across 08:39 to 18:04 — the entire 9.5-hour day.

**If batched properly:** labels at 08:30, tracking at 11:00, shipping at 17:30 — three blocks, 15 min total, entire morning free for Intercom. Instead, 15 min of BM admin fragments the entire day.

## The BM-Intercom Correlation

| Time Period | BM Activity | Intercom Response |
|------------|------------|------------------|
| 08:00–12:00 | 45+ BM actions/hour (peak) | Near zero — enquiries piling up |
| 12:00–14:00 | Mixed + lunch | Near zero |
| 14:00–17:00 | Near zero BM | Client work starts (leads 4-6h old) |
| 17:00–18:00 | n8n confirmations | Sporadic responses |

The 45.3h average response time maps directly: morning enquiries don't get touched until afternoon, Thu/Fri arrivals sit until Monday.

---

# PART 7: COMPLETE TASK BREAKDOWN

130 unique items, 765 actions.

## Items by Type

| Item Type | Items | Actions | What Ferrari Does |
|-----------|-------|---------|------------------|
| Back Market | 44 | 222 | Status clicks, tracking, return bookings |
| Client (direct) | 36 | 168 | Everything from intake to invoicing |
| Unknown/System | 23 | 146 | Board moves, subscriptions, field updates |
| n8n (Intercom→Monday) | 19 | 140 | Completing item setup that n8n starts |
| Corporate | 7 | 85 | Full lifecycle for B2B (Boutique, Spacemade, VCCP, LCP, Everything Apple Tech) |
| Parts | 1 | 4 | Ordering |

## Client Item Depth

| Depth | Items | What Happened |
|-------|-------|--------------|
| 1 action (single click) | 13 | Created and abandoned |
| 2 actions | 4 | Quick deadline or minor update |
| 3–5 actions | 8 | Light touch — booking time, repair type |
| 6–10 actions | 6 | Meaningful — quotes, pricing, status progressed |
| 11+ actions (full lifecycle) | 5 | Ehiz, Anton Dawes, Amanda Davis, Van Pham, Test item |

**13 of 36 client items got one click and nothing else.**

## Quote → Invoice Pipeline (Revenue Work)

4 invoices in 5 working days:

| Client | Journey | Actions |
|--------|---------|---------|
| Xinzhang | Quote Sent → Invoiced → Queued For Repair | 9 |
| Bassem kamel | Quote Sent → Invoiced | 10 |
| Ridwan Mustapha (n8n) | Quote Sent → Invoiced → Queued For Repair | 12 |
| Fisayo Brooks | Quote Sent → Invoiced → Awaiting Part | ~8 |

7 other quotes sent but never converted.

Full quoting activity:
- 17 status changes to "Quote Sent" or "Client Contacted"
- 23 booking actions (~14 are n8n pre-arranged bookings)
- 23 pricing/payment actions
- 4 invoices sent via Xero

## n8n Items — The Half-Finished Handoff

19 items from Intercom `create-repair`. Each arrives with just name + order number. Ferrari manually fills 8–12 fields per item (Device, Requested Repairs, Repair Type, Client type, Custom Products, Status, Tracking, Passcode, Info Capture). Significant data entry.

## Monday Updates & Team Communication

| Update Type | Count | Ferrari Wrote? |
|------------|-------|----------------|
| Shopify Order (n8n) | 13 | No |
| Walk-in Typeform (auto) | 12 | No |
| Client Form Response (auto) | 7 | No |
| Repair notes / diagnostics | 2 | **Yes** |
| Warranty notes | 1 | **Yes** |
| Team instructions | 2 | **Yes** |

**32 of 37 updates are automation. 5 manually written.**

6 replies to others. Tagged 6 times by team (Adil x3, Ricky x2, Roni x1).

## Job Functions — Where 765 Actions Go

| Job Function | Actions | % | Revenue? |
|-------------|---------|---|----------|
| **Board Admin** | 452 | 59% | No |
| **BM Logistics** | 120 | 16% | No (margin) |
| **Workshop Intake** | 89 | 12% | Indirect |
| **Client Services** | 67 | **9%** | **Yes** |
| **Parts Management** | 27 | 4% | No |
| **Courier** | 10 | 1% | No |

## Ferrari's 24 Hats (Complete Task List)

1. Buy Royal Mail labels for BM outbound returns (morning)
2. Paste tracking numbers into Monday from Royal Mail
3. Batch status changes for BM items (Return Booked, Shipped)
4. Complete n8n items — fill 8-12 fields on each Intercom→Monday item
5. Walk-in intake — passcode, notes, tech assignment from Typeform
6. Build quotes — Custom Products pricing, discount calculations
7. Send quotes via Intercom / mark Quote Sent
8. Confirm bookings — booking time, status → Booking Confirmed
9. Book couriers — Gophr link, time window, status changes
10. Assign technicians — route to Safan/Mykhailo/Andreas
11. Order parts — supplier, part reference, status tracking
12. Send invoices — Xero integration, mark Invoiced, track payment
13. Handle phone calls — 45/week avg, 61% of all answered calls
14. iCloud/IMEI checks — verify device lock status
15. Move items between board groups — routing to queues
16. End-of-day shipping batch — mark items Shipped
17. Reply to team @tags — warranty, stock checks, instructions
18. Write diagnostics — detailed repair findings (high quality when done)
19. Manage corporate accounts — Boutique, Spacemade, VCCP, LCP, Everything Apple Tech
20. Board administration — renaming, subscribing/unsubscribing, cleanup
21. BM customer comms & counteroffers *(added by Ferrari)*
22. IC checks on incoming BM devices *(added by Ferrari)*
23. SKU checks — verifying BM SKUs/listings *(added by Ferrari)*
24. Emails — reading, triaging, responding to Intercom inbox *(added by Ferrari)*

*Tasks 21–24 added by Ferrari on review. Task 24 is the activity audited in Part 3 — ~31 manual emails / ~75 min composition (CS Jarvis verified).*

---

# PART 8: TELEPHONE CALL DATA

**Source:** TeleSphere/Asterisk CDR (Aug 2025 – Feb 2026, 6 months)
**Ferrari extension:** 205

## Volume Summary

| Metric | Value |
|--------|-------|
| Total unique inbound calls | 2,796 |
| Answered by anyone | 1,860 (67%) |
| Missed (nobody picked up) | 921 (33%) |
| Ferrari answered | 1,134 (61% of all answered) |
| Average calls/week (Ferrari) | 45 |

**Missed calls ring ALL handsets. Only "Answered" is meaningful per person.**

## Ferrari Weekly Trend

| Period | Avg Answered/Week | Trend |
|--------|------------------|-------|
| Aug–Sep 2025 | 55–81 | Peak |
| Oct 2025 | 47–74 | Solid |
| Nov–Dec 2025 | 19–45 | Declining |
| Jan 2026 | 37–52 | Partial recovery |
| Feb 2026 (partial) | 21 | Low |

## Ferrari by Hour of Day

| Hour | Ferrari Answered | Total Calls | Ferrari % |
|------|-----------------|-------------|-----------|
| 08:00 | 52 | 116 | 45% |
| 09:00 | 114 | 246 | 46% |
| 10:00 | 149 | 278 | **54%** |
| 11:00 | 121 | 275 | 44% |
| **12:00** | **69** | **270** | **26%** |
| **13:00** | **90** | **266** | **34%** |
| 14:00 | 142 | 305 | 47% |
| 15:00 | 145 | 298 | 49% |
| 16:00 | 169 | 305 | **55%** |
| 17:00 | 54 | 160 | 34% |

**Lunch gap: 26% at noon, 34% at 1pm — vs 55% at 4pm.**

## Who Else Answers

| Person | Answered | Share |
|--------|----------|-------|
| Ferrari (205) | 1,134 | 61% |
| Adil/Mike (200) | 456 | 25% |
| Andreas (201) | 268 | 14% |

## Missed Call Impact

- 282 unique callers missed, NEVER got through (55%)
- 60% of callers are first-time — if missed, gone
- Median recovery time: 1.2h (customers calling back, not iCorrect)
- Someone called 28 times and was missed 16 of those

## Time Implications

| Assumption | Weekly Phone Time |
|-----------|------------------|
| 45 calls @ 3 min avg | 2.3 hours |
| 45 calls @ 5 min avg | 3.8 hours |
| 45 calls @ 10 min avg (generous) | 7.6 hours |

## Out-of-Hours Calls

| Period | Calls | Answered | Answer Rate |
|--------|-------|----------|-------------|
| Before 8:30am | 75 | 25 | 33% |
| After 6pm | 38 | 5 | 13% |
| Saturday | 192 | 86 | 45% |
| Sunday | 27 | 0 | 0% |
| **Total** | **332** | **116** | **35%** |

## AI Call Agent Opportunity

| Metric | Conservative | Moderate | Optimistic |
|--------|-------------|----------|-----------|
| Additional calls captured/week | 35 | 35 | 35 |
| Conversion rate | 10% | 15% | 20% |
| Avg repair value | £200 | £250 | £300 |
| **Annual revenue recovered** | **£36,400** | **£68,250** | **£109,200** |

---

# PART 9: ZENDESK HISTORICAL BASELINE (2023–2025)

What "normal" looked like before the Intercom migration.

## Key Benchmarks

| Metric | Value |
|--------|-------|
| Total tickets (2023–2025) | 18,256 |
| Average tickets/week | 116 |
| Median first reply time | 0.3h |
| Median lifecycle (created→closed) | 7.7 days |
| Primary agent messages/week (avg) | 284 |
| Web enquiry → booking conversion | 63% (when tagged properly) |

## Volume Trend

| Year | Tickets | Change |
|------|---------|--------|
| 2023 | 5,477 | |
| 2024 | 6,062 | +11% |
| 2025 | 6,717 | +11% |

## Agent Output Decline

| Quarter | Avg Messages/Week | Change |
|---------|------------------|--------|
| 2023 Q3 (peak) | 383 | — |
| 2024 Q4 | 319 | -17% |
| 2025 Q4 | 218 | -43% |
| 2026 Q1 | ~31 (Intercom) | **-89%** |

Primary agent went from 383 messages/week peak to ~31 manual Intercom emails. Volume is collapsing.

## Channel Mix Shift

Email channel grew from 32.8% to dominating in 2025 Q3-Q4, while API (Monday integration) declined and Instagram DMs dropped from 334/quarter (2024 Q2) to 101/quarter (2025 Q4).

---

# PART 10: COMBINED REVENUE IMPACT

## All Channels

| Channel | Weekly Missed/Failed | Annual Revenue at Risk |
|---------|---------------------|----------------------|
| Intercom — no reply at all | 11 | £11,400–£34,300 |
| Intercom — Fin only, 0 conversions | 45 | £46,800–£140,400 |
| Phone (missed calls) | 35 | £36,400–£109,200 |
| **Total** | **91** | **£94,600–£283,900** |

**Midpoint estimate: ~£150,000/year in missed revenue.**

Even modest improvement to 10% conversion on the 56 missed Intercom leads = ~5.6 additional bookings/week = £58,000+/year at £200 avg.

---

# PART 11: THE CORE DISCONNECT

## Time Logged vs Output — All Sources

| Source | What It Shows | Verified Output |
|--------|-------------|----------------|
| **Monday personal board** (self-reported) | 18h/week "Clients" | Unverifiable — opaque bucket |
| **Intercom** (CS Jarvis) | 80 leads, 24 replied (30%), 1 conversion | ~1.3h/week |
| **Phone** (TeleSphere CDR) | 45 calls/week avg | 2.3–7.6h/week |
| **Monday main board** (activity logs) | 765 actions, 130 items | Legitimate admin — not "Clients" |
| **Movement patterns** | 132 context switches, BM mornings | Enquiries ignored 08:00–14:00 |

## Best-Case Total

| Activity | Generous Estimate |
|----------|------------------|
| Phone calls (45/week @ 10 min) | 7.6h |
| Intercom emails (~31 manual + 12 notes) | 1.3h |
| Monday board admin | 2-3h |
| **Total verifiable** | **~11-12h/week** |
| **Monday logged total** | **~38h/week** |

**~26 hour gap between logged time and verifiable output.**

## Possible Explanations

1. Phone calls not captured in systems — only 1 call (Vimal) resulted in documented follow-up
2. Time tracker left running — inflating hours
3. Reading/sorting inbox counts as "Clients" — 30% of inbox is spam/marketing
4. Batch working pattern — Mon/Tue catch-up, Thu-Fri near zero
5. Actual low output — simplest explanation

---

# PART 12: RECOMMENDATIONS

## Restructuring Ferrari's Role

### Protected Time Blocks

| Time Block | Activity | Tracked As |
|-----------|----------|-----------|
| 08:30–09:00 | BM labels + shipping (batch) | "BM Admin" |
| 09:00–12:00 | **Intercom + calls ONLY** (no BM, no board admin) | "Client Response" |
| 12:00–12:30 | Lunch | — |
| 12:30–13:00 | n8n item completion (batch) | "Board Admin" |
| 13:00–16:00 | **Quotes, follow-ups, bookings** | "Client Conversion" |
| 16:00–17:00 | Corporate accounts + parts | "Corporate" |
| 17:00–17:30 | End-of-day shipping batch | "BM Admin" |

### Hats to Remove from Ferrari

| Hat | Give To | Why |
|-----|---------|-----|
| BM counteroffers/comms | Roni (already does BM intake) | Keep BM lifecycle with one person |
| Parts ordering | Roni | Natural extension of his parts role |
| Walk-in intake | Adil (already front desk) | Ferrari shouldn't do intake remotely |
| Board admin (renaming, subscribing, moving) | Automation/n8n | 59% of actions, mostly mechanical |
| Technician assignment | Workshop lead or queue-based | Simple routing, doesn't need Ferrari |

### 5 KPIs for Ferrari

| KPI | Target | Current | How to Measure |
|-----|--------|---------|---------------|
| Enquiry response time | <2h during 09:00-17:00 | 45.3h avg | Intercom `first_admin_reply_at` |
| Contact form → quote rate | >60% | ~21% (17 of 80) | Intercom tag tracking |
| Quote → booking rate | >40% | ~24% (4 of 17 quoted) | Monday status pipeline |
| Invoices/week | 10+ | 4 | Monday "Invoiced" status count |
| Intercom reply rate | >90% of leads | 30% | Weekly audit |

### Automation Fixes

1. **n8n item completion** — auto-fill Device, Repair Type, Client Type from Intercom conversation data. Save Ferrari 8-12 manual fields x 19 items/week
2. **Separate Intercom admin account** for Ferrari — makes individual tracking possible
3. **Dedicated automation Monday user** — stop n8n actions logging under Ferrari's profile
4. **Shopify webhook fix** — `create-repair` tag not firing reliably (Jordan Clark, Nizam Kabir cases)
5. **Board admin automation** — item naming, group routing, subscription management via n8n rules

---

# PART 13: DATA LIMITATIONS

- Shared "Support" Intercom account (admin 9702337) — can't distinguish Ferrari from other admins
- Phone call duration not captured — only answered/missed
- Monday time tracking relies on honest start/stop
- n8n automation inflates Ferrari's action count by ~5%
- Intercom audit covers email only — live chat may have additional activity
- TeleSphere CDR inbound only — no outbound call data
- Ferrari personal board is entirely self-reported
- Ferrari was on leave prior to Feb 18 — first day may be ramp-up
- Feb 2026 CDR only goes to Feb 18 (date of pull) — 1 day overlaps audit week
- CS Jarvis sampled 20 of 80 conversations — extrapolated figures carry margin of error

---

# PART 14: SOURCE DOCUMENTS

| Document | Location | Lines | Content |
|----------|----------|-------|---------|
| Master audit (original) | `ferrari_audit_2026-02-26.md` | 776 | 14-section audit with all findings |
| Call analysis | `call_analysis_report_2026-02-26.md` | 373 | 6-month TeleSphere CDR analysis |
| Zendesk baseline | `zendesk_historical_report_2026-02-26.md` | 238 | 2023-2025 historical comparison |
| Audit framework | `AUDIT_FRAMEWORK.md` | 193 | Standardised template for all roles |
| Agent instructions | `AGENT_AUDIT_INSTRUCTIONS.md` | 191 | Step-by-step for Team Jarvis |
| CS Jarvis deep dive | VPS: `~/.openclaw/agents/customer-service/workspace/docs/intercom-audit-feb2026.md` | ~300 | 127 conversations, full breakdown |
| CS Jarvis task spec | `CS_JARVIS_INTERCOM_AUDIT_TASK.md` | ~50 | 5-step brief for CS agent |
| Project overview | `PROJECT_OVERVIEW.md` | ~200 | Broader team analysis project brief |

---

*Consolidated: 2026-02-27 by Claude Code*
*Data sources: Monday.com API, Intercom API (MCP + CS Jarvis direct), TeleSphere CDR, Zendesk export*
*Next audit due: 2026-03-05*
