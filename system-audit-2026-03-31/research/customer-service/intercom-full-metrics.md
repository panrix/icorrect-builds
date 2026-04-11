# Intercom Full Metrics Deep Dive

Generated from live read-only Intercom API data on 2026-04-03T07:38:15.926530 UTC.

## Scope And Method

- Reporting window: `2025-10` through `2026-03` using London calendar months.
- Conversation pulls: `3,380` conversations in the six-month window and `2,108` current open conversations for backlog risk checks.
- Contacts/tickets: contacts counted via `POST /contacts/search`; tickets counted via `POST /tickets/search`.
- Conversation timing and reassignment metrics are based on `GET /conversations/{id}` detail pulls and parts-level analysis.
- Business-hours note for coverage recommendations: Europe/London business-hours proxy: Mon-Thu 09:30-17:30 and Fri 10:00-17:30. Weekends treated as out of hours.

## Section 1: Volume Overview

Monthly conversation counts:

| Month | All | Customer-Inbound | Closed | Still Open |
| --- | --- | --- | --- | --- |
| 2025-10 | 544 | 0 | 448 | 96 |
| 2025-11 | 545 | 0 | 469 | 76 |
| 2025-12 | 505 | 0 | 434 | 71 |
| 2026-01 | 890 | 464 | 573 | 317 |
| 2026-02 | 473 | 341 | 206 | 267 |
| 2026-03 | 423 | 275 | 125 | 298 |

Channel rollup by month:

| Channel | 2025-10 | 2025-11 | 2025-12 | 2026-01 | 2026-02 | 2026-03 | 6-Month Total |
| --- | --- | --- | --- | --- | --- | --- | --- |
| company_outbound | 532 | 530 | 489 | 369 | 98 | 135 | 2,153 |
| email | 0 | 0 | 0 | 362 | 292 | 226 | 880 |
| web_messenger | 0 | 0 | 0 | 89 | 32 | 1 | 122 |
| phone | 12 | 15 | 16 | 28 | 19 | 17 | 107 |
| social | 0 | 0 | 0 | 33 | 27 | 41 | 101 |
| other | 0 | 0 | 0 | 9 | 5 | 3 | 17 |

Initiator breakdown by month:

| Initiator | 2025-10 | 2025-11 | 2025-12 | 2026-01 | 2026-02 | 2026-03 | 6-Month Total |
| --- | --- | --- | --- | --- | --- | --- | --- |
| company_initiated | 544 | 545 | 505 | 415 | 127 | 145 | 2,281 |
| customer_initiated | 0 | 0 | 0 | 466 | 341 | 275 | 1,082 |
| unknown | 0 | 0 | 0 | 9 | 5 | 3 | 17 |

Customer reach-out pattern by day of week:

| Day | Volume |
| --- | --- |
| Monday | 663 |
| Tuesday | 558 |
| Wednesday | 614 |
| Thursday | 529 |
| Friday | 476 |
| Saturday | 275 |
| Sunday | 265 |

Top inbound hours (Europe/London):

| Hour | Volume |
| --- | --- |
| 12:00 | 312 |
| 15:00 | 278 |
| 16:00 | 275 |
| 11:00 | 257 |
| 13:00 | 254 |
| 14:00 | 241 |
| 10:00 | 239 |
| 17:00 | 223 |

Contacts and tickets created per month:

| Month | New Contacts | New Tickets |
| --- | --- | --- |
| 2025-10 | 0 | 544 |
| 2025-11 | 0 | 545 |
| 2025-12 | 0 | 505 |
| 2026-01 | 19139 | 727 |
| 2026-02 | 348 | 381 |
| 2026-03 | 280 | 368 |

- Total contacts found via search: `19,816`
- Role split: `19,375` users and `441` leads.
- Total tickets found via search: `30,670`

## Section 2: Response Time Analysis

First-response time by month:

| Month | Sample | Replied | Reply Rate | Median | P75 | P90 |
| --- | --- | --- | --- | --- | --- | --- |
| 2025-10 | 0 | 0 | n/a | n/a | n/a | n/a |
| 2025-11 | 0 | 0 | n/a | n/a | n/a | n/a |
| 2025-12 | 0 | 0 | n/a | n/a | n/a | n/a |
| 2026-01 | 464 | 121 | 26.1% | 19.32h | 64.53h | 138.30h |
| 2026-02 | 341 | 95 | 27.9% | 19.22h | 45.87h | 84.04h |
| 2026-03 | 275 | 150 | 54.5% | 12.45h | 24.51h | 51.31h |

Subsequent-response time by month:

| Month | Turns | Median | P75 | P90 |
| --- | --- | --- | --- | --- |
| 2025-10 | 0 | n/a | n/a | n/a |
| 2025-11 | 0 | n/a | n/a | n/a |
| 2025-12 | 0 | n/a | n/a | n/a |
| 2026-01 | 136 | 2.40h | 18.25h | 65.42h |
| 2026-02 | 164 | 1.90h | 17.96h | 33.77h |
| 2026-03 | 214 | 2.73h | 19.82h | 37.12h |

First-response time by admin:

| Admin | Sample | Median | P75 | P90 |
| --- | --- | --- | --- | --- |
| Support | 366 | 16.43h | 43.78h | 82.38h |
| Alex | 0 | n/a | n/a | n/a |
| Michael Ferrari | 0 | n/a | n/a | n/a |

First-response by day of week:

| Day | Sample | Reply Rate | Median | P75 | P90 |
| --- | --- | --- | --- | --- | --- |
| Monday | 218 | 26.6% | 7.57h | 34.49h | 85.82h |
| Tuesday | 171 | 39.2% | 16.36h | 30.39h | 51.23h |
| Wednesday | 191 | 34.0% | 10.27h | 24.40h | 132.59h |
| Thursday | 191 | 37.7% | 10.02h | 20.20h | 93.87h |
| Friday | 136 | 36.0% | 4.46h | 65.38h | 73.90h |
| Saturday | 90 | 27.8% | 54.50h | 63.50h | 113.20h |
| Sunday | 83 | 36.1% | 23.93h | 31.35h | 53.16h |

First-response by hour of day (Europe/London):

| Hour | Sample | Reply Rate | Median | P75 | P90 |
| --- | --- | --- | --- | --- | --- |
| 00:00 | 14 | 64.3% | 15.94h | 35.71h | 44.62h |
| 01:00 | 17 | 29.4% | 40.86h | 62.04h | 72.71h |
| 02:00 | 17 | 29.4% | 12.91h | 33.65h | 47.03h |
| 03:00 | 15 | 40.0% | 9.63h | 26.75h | 43.31h |
| 04:00 | 10 | 30.0% | 12.61h | 36.12h | 50.23h |
| 05:00 | 12 | 41.7% | 52.97h | 77.21h | 123.46h |
| 06:00 | 18 | 16.7% | 9.58h | 10.05h | 10.33h |
| 07:00 | 14 | 14.3% | 6.48h | 7.39h | 7.94h |
| 08:00 | 36 | 27.8% | 5.98h | 73.92h | 179.22h |
| 09:00 | 65 | 32.3% | 5.32h | 31.88h | 100.29h |
| 10:00 | 89 | 33.7% | 2.88h | 24.36h | 76.41h |
| 11:00 | 76 | 36.8% | 5.78h | 75.66h | 105.28h |
| 12:00 | 88 | 28.4% | 2.64h | 4.13h | 46.97h |
| 13:00 | 74 | 31.1% | 1.83h | 13.95h | 42.30h |
| 14:00 | 63 | 36.5% | 20.10h | 25.43h | 89.70h |
| 15:00 | 82 | 34.1% | 2.21h | 24.53h | 31.81h |
| 16:00 | 81 | 37.0% | 19.52h | 43.78h | 73.55h |
| 17:00 | 81 | 30.9% | 22.64h | 45.96h | 84.50h |
| 18:00 | 55 | 29.1% | 20.81h | 26.77h | 56.75h |
| 19:00 | 35 | 25.7% | 20.81h | 63.50h | 94.89h |
| 20:00 | 43 | 39.5% | 18.98h | 62.51h | 66.03h |
| 21:00 | 44 | 36.4% | 30.33h | 63.27h | 113.36h |
| 22:00 | 29 | 51.7% | 16.55h | 74.18h | 172.65h |
| 23:00 | 22 | 54.5% | 39.56h | 69.88h | 130.24h |

## Section 3: Resolution Metrics

| Month | Sample | Close Rate | Reopen Rate | Silent Rate | Reassigned Rate | Resolve Median | P75 | P90 | CSAT Count |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2025-10 | 0 | n/a | n/a | n/a | n/a | n/a | n/a | n/a | 0 |
| 2025-11 | 0 | n/a | n/a | n/a | n/a | n/a | n/a | n/a | 0 |
| 2025-12 | 0 | n/a | n/a | n/a | n/a | n/a | n/a | n/a | 0 |
| 2026-01 | 464 | 65.9% | 30.6% | 19.4% | 48.1% | 0.65h | 50.07h | 146.96h | 0 |
| 2026-02 | 341 | 54.5% | 5.6% | 19.9% | 60.7% | 0.29h | 20.00h | 73.94h | 0 |
| 2026-03 | 275 | 42.9% | 1.5% | 33.1% | 100.0% | 17.22h | 36.12h | 63.89h | 0 |

- Current open backlog older than 7 days: `2,036` conversations.
- Long-open age mix: `7-29d=219`, `30-89d=610`, `90d+=1,207`.

## Section 4: Team Performance

| Admin | Handled | First Resp Median | P75 | P90 | Subseq Median | Resolution Rate | CSAT Count | Positive CSAT |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Support | 361 | 16.43h | 43.78h | 82.38h | 2.33h | 8.9% | 0 | n/a |
| Alex | 0 | n/a | n/a | n/a | n/a | n/a | 0 | n/a |
| Michael Ferrari | 0 | n/a | n/a | n/a | n/a | n/a | 0 | n/a |

## Section 5: AI/Bot Analysis

- AI participated in `601` inbound conversations over the six-month window.
- Entirely AI/bot-handled: `454`; escalated from AI to human: `147`.
- AI resolution rate without human intervention: `61.2%` (`368` conversations).

AI resolution-state distribution:

| Resolution State | Count |
| --- | --- |
| routed_to_team | 239 |
| assumed_resolution | 173 |
| unknown | 168 |
| confirmed_resolution | 20 |
| abandoned | 1 |

Common AI handoff themes:

| Theme | Count |
| --- | --- |
| repair_technical | 107 |
| booking_reschedule | 53 |
| unclassified | 28 |
| status_update | 17 |
| payment_invoice | 12 |
| complaint_delay | 9 |
| pricing_quote | 8 |
| warranty | 8 |

## Section 6: Revenue Risk Signals

Risk-keyword conversation counts:

| Risk Signal | Conversations | No Human Reply |
| --- | --- | --- |
| pricing_quote | 286 | 192 |
| complaint | 128 | 65 |
| slow | 17 | 10 |
| return | 15 | 7 |
| waiting | 9 | 5 |
| refund | 6 | 2 |
| unhappy | 3 | 1 |
| cancel | 2 | 1 |

- Pricing/quote conversations with no human follow-up: `59`.
- Repeat-contact customers in the six-month inbound set: `94` contacts had 2+ conversations.

Sample flagged conversations:

| Conversation | Created | Channel | State | Owner | Reasons | Title |
| --- | --- | --- | --- | --- | --- | --- |
| 215473196482699 | 2026-02-22 00:15 | email | open | Support | complaint,customer_went_silent,open_over_7d,refund,return,slow,unhappy | Re: Formal Complaint - Incorrect Return Packaging and Ongoing Delay (Iphone 13 R |
| 215472873717151 | 2026-01-29 10:35 | email | open | Support | complaint,customer_went_silent,open_over_7d,pricing_quote,slow,waiting | Re: Laptop Repair |
| 215473453967390 | 2026-03-12 14:04 | email | open | Support | complaint,customer_went_silent,open_over_7d,pricing_quote,refund | Problem iPhone 14 pro max |
| 215473074069365 | 2026-02-12 13:35 | email | open | Support | customer_went_silent,open_over_7d,return,slow,waiting | Update & query |
| 215472674802852 | 2026-01-14 15:01 | email | open | Support | no_human_reply,open_over_7d,pricing_quote,return,slow | Re: IPad repair request |
| 215472673423556 | 2026-01-14 13:40 | phone | open | Support | complaint,no_human_reply,open_over_7d,pricing_quote,return | RE: Tate and Lyle Sugars |
| 215473650396368 | 2026-03-26 17:44 | email | open | Support | complaint,no_human_reply,open_over_7d,pricing_quote | Quote Request: Muhammad - MacBook Air 13” ‘M4’ A3240 (2025) |
| 215473645802661 | 2026-03-26 13:59 | email | open | Support | complaint,customer_went_silent,open_over_7d,pricing_quote | Quote Request: Matt Baker - MacBook Pro 14” ‘M3 & M3 Pro /Max’ A2918, A2992 (202 |
| 215473459751736 | 2026-03-12 19:44 | email | open | Support | complaint,customer_went_silent,open_over_7d,pricing_quote | iPhone 16 Pro screen flickering |
| 215473451302290 | 2026-03-12 10:50 | email | open | Support | complaint,customer_went_silent,open_over_7d,pricing_quote | Contact Form: Sivasankar Kesavan - iPhone 14 Pro [1773312609840] |
| 215473436492965 | 2026-03-11 13:09 | email | open | Support | customer_went_silent,open_over_7d,pricing_quote,return | iPhone 13 Battery Replacement |
| 215473424646343 | 2026-03-10 15:54 | email | open | Support | complaint,customer_went_silent,open_over_7d,pricing_quote | Contact Form: Katie Sexton - MacBook Pro 16-inch A2141 (2019) [1773158038394] |

Long-open backlog examples:

| Conversation | Created | Age (Days) | Channel | State | Title |
| --- | --- | --- | --- | --- | --- |
| 215472711480510 | 2025-01-01 15:05 | 456.7 | admin_initiated | open | Conversation with Precision Motorsports |
| 215472711339682 | 2025-01-01 20:53 | 456.4 | phone | open | Your iPhone Enquiry with iCorrect |
| 215472711480972 | 2025-01-03 11:27 | 454.8 | admin_initiated | open | Conversation with ☄️~Denis ~🌟📍 |
| 215472711347686 | 2025-01-03 18:21 | 454.6 | admin_initiated | open | Your iPhone 13 Pro Max Rear Camera Repair |
| 215472711487144 | 2025-01-04 11:51 | 453.8 | admin_initiated | open | Conversation with JP Abbey |
| 215472711332975 | 2025-01-04 12:47 | 453.8 | admin_initiated | open | Your Enquiry with iCorrect |
| 215472711489829 | 2025-01-04 16:23 | 453.6 | admin_initiated | open | Conversation with Hadeer Mohiey 🦌 |
| 215472711490182 | 2025-01-05 23:46 | 452.3 | admin_initiated | open | Conversation with Instagram Direct User niyaaa.02 |
| 215472711490534 | 2025-01-06 03:36 | 452.2 | admin_initiated | open | Conversation with Instagram Direct User billyjoe18new |
| 215472711491074 | 2025-01-06 16:56 | 451.6 | admin_initiated | open | Conversation with Ricky Singh Panesar |
| 215472711491471 | 2025-01-06 21:58 | 451.4 | admin_initiated | open | Conversation with Lindacpl Brownheo |
| 215472711491844 | 2025-01-07 09:18 | 450.9 | admin_initiated | open | Conversation with Instagram Direct User ssssaa9938 |

## Section 7: Recommendations

- First-response target: drive the median below `10.7h` and the p75 below `30.6h`.
- Coverage gaps: weakest reply-rate days are `Monday, Saturday`; slowest hours cluster around `05:00, 01:00, 23:00, 21:00` London time.
- Process improvement: add explicit queue ownership for pricing/quote, refund/complaint, and social conversations because those are the cleanest leakage buckets.
- Process improvement: close the loop on waiting-on-customer conversations with automated 24h/72h nudges to reduce silent-customer drift and stale backlog.
- Process improvement: review repeat-contact customers weekly and tag root causes so recurring issues turn into fixes rather than extra inbound load.
- Help Center: activate it only with focused launch content first. Start with pricing/quote FAQs, booking/reschedule, repair-status expectations, warranty/returns, and payment/invoice answers because those themes already recur in live volume.

## Evidence Files

- Recent conversation export: `/home/ricky/data/exports/system-audit-2026-03-31/intercom/conversations-recent-normalized-2026-04-03.jsonl`
- Recent pagination meta: `/home/ricky/data/exports/system-audit-2026-03-31/intercom/conversations-recent-pages-2026-04-03.json`
- Recent conversation details: `/home/ricky/data/exports/system-audit-2026-03-31/intercom/conversations-recent-details-2026-04-03.jsonl`
- Recent conversation detail meta: `/home/ricky/data/exports/system-audit-2026-03-31/intercom/conversations-recent-details-meta-2026-04-03.json`
- Current open conversation export: `/home/ricky/data/exports/system-audit-2026-03-31/intercom/conversations-open-normalized-2026-04-03.jsonl`
- Current open pagination meta: `/home/ricky/data/exports/system-audit-2026-03-31/intercom/conversations-open-pages-2026-04-03.json`
- Contact and ticket count summary: `/home/ricky/data/exports/system-audit-2026-03-31/intercom/contact-ticket-counts-2026-04-03.json`
- Full metrics summary JSON: `/home/ricky/data/exports/system-audit-2026-03-31/intercom/full-metrics-summary-2026-04-03.json`
- Admins export: `/home/ricky/data/exports/system-audit-2026-03-31/intercom/admins-live-2026-04-03.json`
- Teams export: `/home/ricky/data/exports/system-audit-2026-03-31/intercom/teams-live-2026-04-03.json`
- Ticket types export: `/home/ricky/data/exports/system-audit-2026-03-31/intercom/ticket-types-live-2026-04-03.json`
