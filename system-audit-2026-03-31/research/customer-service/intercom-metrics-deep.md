# Intercom Deep Metrics Analysis

Generated from live read-only Intercom API data on 2026-04-02 UTC.

## Scope And Method

- API pull: workspace all-time inventory `30,982` conversations, detailed recent-window export `3,408` conversations since `2025-10-01`, and full current open-queue export `2,113` conversations, `3` admins, `1` teams.
- Pagination: direct cursor pagination via `POST /conversations/search` with `pagination.per_page=150` and `pages.next.starting_after` until exhaustion. The recent-window export reported `3,409` conversations across `23` pages; the current open queue reported `2,114` conversations across `15` pages.
- Note on live-data drift: `total_count` moved slightly while the export was running, so the report metrics use the unique normalized conversation IDs actually captured in the finished pull.
- Addressable inbound subset: reactive conversations excluding clearly proactive/admin-initiated threads and clearly automated status-notification messages.
- Response metric: Intercom `statistics.time_to_admin_reply` and `statistics.first_admin_reply_at`.
- Close metric: Intercom `statistics.time_to_last_close`.
- Business-hours proxy for the out-of-hours section: Derived proxy: Mon-Thu 09:30-17:30 and Fri 10:00-17:30 Europe/London, taken from the live status-notification template copy in /home/ricky/builds/monday/services/status-notifications/templates.js. Weekends treated as out of hours.
- Limitation: Intercom search/list responses expose reply timestamps but not the first human replier ID, so the admin/team response table uses assignee ownership proxy (`admin_assignee_id` / `team_assignee_id`) rather than verified first-replier identity.

## 1. Conversation Volume Over Time

- Last six full London calendar months covered here: `2025-10` to `2026-03`.
- Total-volume trend over those six months: `growing`.
- Addressable-inbound trend over those six months: `newly_active`.

| Month | All Conversations | Addressable Inbound |
| --- | --- | --- |
| 2025-10 | 544 | 0 |
| 2025-11 | 545 | 0 |
| 2025-12 | 505 | 0 |
| 2026-01 | 890 | 464 |
| 2026-02 | 473 | 341 |
| 2026-03 | 423 | 275 |

Top raw source/channel counts by month:

| Source | 6-Month Count | 2025-10 | 2025-11 | 2025-12 | 2026-01 | 2026-02 | 2026-03 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| admin_initiated | 2,228 | 544 | 545 | 505 | 393 | 103 | 138 |
| email | 929 | 0 | 0 | 0 | 375 | 311 | 243 |
| conversation | 122 | 0 | 0 | 0 | 89 | 32 | 1 |
| instagram | 64 | 0 | 0 | 0 | 26 | 14 | 24 |
| whatsapp | 37 | 0 | 0 | 0 | 7 | 13 | 17 |

Derived intake/pattern counts by month:

| Derived Category | 6-Month Count | 2025-10 | 2025-11 | 2025-12 | 2026-01 | 2026-02 | 2026-03 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| admin_initiated_other | 2,061 | 523 | 531 | 495 | 374 | 64 | 74 |
| email | 697 | 0 | 0 | 0 | 222 | 264 | 211 |
| shopify | 212 | 0 | 0 | 1 | 108 | 39 | 64 |
| messenger_chat | 122 | 0 | 0 | 0 | 89 | 32 | 1 |
| warranty | 93 | 11 | 5 | 5 | 32 | 25 | 15 |
| instagram | 64 | 0 | 0 | 0 | 26 | 14 | 24 |
| whatsapp | 36 | 0 | 0 | 0 | 7 | 13 | 16 |
| payment | 33 | 3 | 5 | 2 | 11 | 10 | 2 |

## 2. Response Time Analysis

Monthly first-response metrics on the addressable inbound subset:

| Month | Sample | Replied | Reply Rate | Median | P75 |
| --- | --- | --- | --- | --- | --- |
| 2025-10 | 0 | 0 | n/a | n/a | n/a |
| 2025-11 | 0 | 0 | n/a | n/a | n/a |
| 2025-12 | 0 | 0 | n/a | n/a | n/a |
| 2026-01 | 464 | 121 | 26.1% | 19.32h | 63.77h |
| 2026-02 | 341 | 95 | 27.9% | 19.22h | 45.87h |
| 2026-03 | 275 | 149 | 54.2% | 12.29h | 24.31h |
| 2026-04 | 16 | 0 | 0.0% | n/a | n/a |

- Current month in scope: `2026-04` (partial month-to-date through `2026-04-02`).
- `2026-04` MTD: sample `16`, reply rate `0.0%`, median `n/a`, p75 `n/a`.
- Trailing 3 full months (`2026-01, 2026-02, 2026-03`) average: median `16.95h`, p75 `44.65h`, reply rate `36.0%`.
- Trailing 6 full months (`2025-10, 2025-11, 2025-12, 2026-01, 2026-02, 2026-03`) average: median `16.95h`, p75 `44.65h`, reply rate `36.0%`.

First-response by channel, last six full months:

| Channel | Sample | Replied | Reply Rate | Median | P75 |
| --- | --- | --- | --- | --- | --- |
| email | 810 | 279 | 34.4% | 17.32h | 44.83h |
| chat | 122 | 43 | 35.2% | 9.34h | 27.34h |
| instagram | 64 | 18 | 28.1% | 15.33h | 32.39h |
| warranty | 43 | 16 | 37.2% | 19.53h | 65.59h |
| whatsapp | 35 | 6 | 17.1% | 22.05h | 132.14h |
| phone | 6 | 3 | 50.0% | 8.30h | 34.68h |

First-response by admin assignee ownership proxy, last six full months:

| Admin | Volume | Replied | Reply Rate | Median | P75 |
| --- | --- | --- | --- | --- | --- |
| Support | 809 | 365 | 45.1% | 16.36h | 43.07h |
| Alex | 263 | 0 | 0.0% | n/a | n/a |
| Unassigned | 8 | 0 | 0.0% | n/a | n/a |

First-response by team assignee ownership proxy, last six full months:

| Team | Volume | Replied | Reply Rate | Median | P75 |
| --- | --- | --- | --- | --- | --- |
| Unassigned | 577 | 125 | 21.7% | 19.22h | 63.50h |
| Support | 503 | 240 | 47.7% | 15.41h | 25.77h |

## 3. Resolution Analysis

Median time to final close by month on the addressable inbound subset:

| Month | Sample | Closed | Median | P75 |
| --- | --- | --- | --- | --- |
| 2025-10 | 0 | 0 | n/a | n/a |
| 2025-11 | 0 | 0 | n/a | n/a |
| 2025-12 | 0 | 0 | n/a | n/a |
| 2026-01 | 464 | 380 | 0.65h | 50.07h |
| 2026-02 | 341 | 194 | 0.29h | 20.00h |
| 2026-03 | 275 | 117 | 17.19h | 33.89h |
| 2026-04 | 16 | 3 | 6.82h | 8.94h |

- Currently open / unresolved conversations: `2,113`.
- Open conversations with no human reply recorded: `1,398`.
- Open addressable inbound conversations created out of hours with no human reply: `69`.

Open age distribution:

| Age Bucket | Open Count |
| --- | --- |
| <1d | 12 |
| 1-6d | 66 |
| 7-29d | 219 |
| 30-89d | 610 |
| 90d+ | 1,206 |

- Addressable inbound conversations with no human reply across the detailed recent window: `731`.
- Of those, `AI-participated`: `449`; `no AI participation`: `282`.

## 4. Coverage Analysis

- Response rate on addressable inbound conversations across the last six full months: `33.8%` (`365` replied of `1,080` conversations).
- Out-of-hours addressable inbound conversations with no human reply in the last six full months: `368`.
- Business-hours assumption used here: Derived proxy: Mon-Thu 09:30-17:30 and Fri 10:00-17:30 Europe/London, taken from the live status-notification template copy in /home/ricky/builds/monday/services/status-notifications/templates.js. Weekends treated as out of hours.

Admins handling the most addressable inbound volume in the last six full months:

| Admin | Owned Volume |
| --- | --- |
| Support | 809 |
| Alex | 263 |
| Unassigned | 8 |

Patterns in unanswered / slow-response conversations, last six full months:

| Channel | Sample | Reply Rate | Median | P75 |
| --- | --- | --- | --- | --- |
| whatsapp | 35 | 17.1% | 22.05h | 132.14h |
| instagram | 64 | 28.1% | 15.33h | 32.39h |
| email | 810 | 34.4% | 17.32h | 44.83h |
| chat | 122 | 35.2% | 9.34h | 27.34h |
| warranty | 43 | 37.2% | 19.53h | 65.59h |

Leakage-heavy derived categories, last six full months:

| Category | Sample | Unanswered | Reply Rate | Median | P75 |
| --- | --- | --- | --- | --- | --- |
| whatsapp | 35 | 29 | 17.1% | 22.05h | 132.14h |
| instagram | 64 | 46 | 28.1% | 15.33h | 32.39h |
| email | 674 | 454 | 32.6% | 16.80h | 30.29h |
| messenger_chat | 122 | 79 | 35.2% | 9.34h | 27.34h |
| warranty | 43 | 27 | 37.2% | 19.53h | 65.59h |
| quote | 16 | 10 | 37.5% | 2.50h | 34.73h |
| shopify | 106 | 64 | 39.6% | 47.03h | 75.38h |
| phone | 6 | 3 | 50.0% | 8.30h | 34.68h |

- Proactive vs reactive across the detailed recent window (`2025-10-01` onward): `2,310` proactive, `1,098` reactive.
- Proactive vs reactive over the last six full months: `2,298` proactive, `1,082` reactive.
- Status-notification pattern count: `25` in the recent window, `25` in the last six full months.
- Quote-related conversation pattern count: `17` in the recent window, `16` in the last six full months.
- Payment/invoice-related conversation pattern count: `34` in the recent window, `33` in the last six full months.
- Status notifications are overwhelmingly automated outbound comms. They are real customer-facing traffic, but they should not be treated as missed-response leakage in the same way as inbound enquiries.

## 5. Cross-Reference With Audit

- Ferrari audit reference in the existing repo: roughly `30%` human reply rate and about `£150k/year` lost to unanswered communications.
- Current live Intercom data supports the existence of a real comms leakage problem if the focus is the addressable inbound subset: last-six-full-month reply rate is `33.8%`, with `715` unanswered addressable inbound conversations in that window and median first response `16.36h`.
- That said, the live six-month-plus-open pull is only slightly better than a literal `30%` reply-rate baseline, not a clean rebuttal of the older audit. The operational leakage pattern is still clearly present.
- Annualising the last-six-full-month unanswered count implies roughly `1,430` unanswered addressable inbound conversations per year at the current run-rate.
- To support a literal `£150k/year` leakage claim from unanswered conversations alone, each unanswered conversation would need to be worth about `£104.90` in lost annualised value at the current run-rate.
- Intercom data alone cannot prove the revenue quantum without conversion and order-value linkage, but it can test whether the operational leakage pattern is still severe enough to make the claim plausible.
- On current evidence the audit claim is directionally valid about operational leakage, and its older `30%` reply-rate baseline is broadly consistent with the current six-month Intercom performance rather than far away from it.
- Worst current leakage categories are the channels and derived categories with the lowest reply coverage and slowest p75 in the tables above. Those are the best-supported places to focus remediation first.

## Evidence Files

- Recent-window normalized conversation export: `/home/ricky/data/exports/system-audit-2026-03-31/intercom/conversations-recent-normalized-2026-04-02.jsonl`
- Recent-window raw page export: `/home/ricky/data/exports/system-audit-2026-03-31/intercom/conversations-recent-pages-2026-04-02.jsonl`
- Open-queue normalized conversation export: `/home/ricky/data/exports/system-audit-2026-03-31/intercom/conversations-open-normalized-2026-04-02.jsonl`
- Open-queue raw page export: `/home/ricky/data/exports/system-audit-2026-03-31/intercom/conversations-open-pages-2026-04-02.jsonl`
- All-conversation count response: `/home/ricky/data/exports/system-audit-2026-03-31/intercom/conversations-all-count-2026-04-02.json`
- Analysis summary JSON: `/home/ricky/data/exports/system-audit-2026-03-31/intercom/deep-metrics-summary-2026-04-02.json`
- Live admins export: `/home/ricky/data/exports/system-audit-2026-03-31/intercom/admins-live-2026-04-02.json`
- Live teams export: `/home/ricky/data/exports/system-audit-2026-03-31/intercom/teams-live-2026-04-02.json`
