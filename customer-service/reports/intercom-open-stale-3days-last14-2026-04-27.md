# Intercom Stale Open Conversations — Last 14 Days Filter

Generated: `2026-04-27T08:09:51.590635+00:00`
Source artifact: `/home/ricky/builds/customer-service/reports/intercom-open-stale-3days-2026-04-27.json`
Mode: READ ONLY — existing artifacts only; no Intercom/API/external calls.

## Interpretation

The prompt field name was blank in this handoff. I inferred `waiting_since` because the original audit criterion was `state=open` and `waiting_since` older than 72h. This filters the same stale set to rows where `waiting_since` falls within the last 14 days of the original audit generation time.

- Original generation time: `2026-04-27T07:54:55.000Z`
- Last-14 window start: `2026-04-13T07:54:55Z`
- Last-14 window end: `2026-04-27T07:54:55Z`
- Filter field: `waiting_since`

## Findings

- Matching recent stale conversations: **26**
- Unread: **25**
- No admin reply recorded: **12**
- Prior admin reply recorded: **14**

### By assignee

- Support: 26

### By team

- Support: 21
- (no team): 5

## Conversations

| ID | Assignee/team | Customer | Subject | Waiting since | Age | Last customer msg | Last admin reply | Link |
|---|---|---|---|---|---:|---|---|---|
| 215473797836196 | Support/Support | Faisal Iqbal <iphysal@gmail.com> | <p>Re: Your Repair with iCorrect</p> | 2026-04-13T11:43:29.000Z | 332.2h / 13.8d | 2026-04-13T11:43:29.000Z | 2026-04-13T11:32:49.000Z | https://app.intercom.com/a/inbox/pt6lwaq6/inbox/conversation/215473797836196 |
| 215473886407862 | Support/Support | Marcus Ervin <ervinlm@gmail.com> | <p>Fwd: Import Duty Payment Alert</p> | 2026-04-13T13:28:46.000Z | 330.4h / 13.8d | 2026-04-13T13:28:46.000Z |  | https://app.intercom.com/a/inbox/pt6lwaq6/inbox/conversation/215473886407862 |
| 215473250582569 | Support/Support | Michael Ferrari Test <michael.f@icorrect.co.uk> | <p>Contact Form: Birju Ravaliya - iPad Pro 12.9 4th Gen (2020) [1772046902974]</p> | 2026-04-14T13:46:09.000Z | 306.1h / 12.8d | 2026-04-14T13:46:09.000Z | 2026-04-14T11:40:34.000Z | https://app.intercom.com/a/inbox/pt6lwaq6/inbox/conversation/215473250582569 |
| 215473878088789 | Support/Support | Michael Ferrari Test <michael.f@icorrect.co.uk> | <p>Contact Form: Jason Hill - iPhone 12 Pro [1776028325340]</p> | 2026-04-15T11:04:36.000Z | 284.8h / 11.9d | 2026-04-15T11:04:36.000Z | 2026-04-15T11:02:36.000Z | https://app.intercom.com/a/inbox/pt6lwaq6/inbox/conversation/215473878088789 |
| 215473658989581 | Support/Support | Alex <operator+pt6lwaq6@intercom.io> |  | 2026-04-15T14:41:28.000Z | 281.2h / 11.7d | 2026-04-15T14:41:28.000Z | 2026-04-15T13:57:22.000Z | https://app.intercom.com/a/inbox/pt6lwaq6/inbox/conversation/215473658989581 |
| 215473901242611 | Support/Support | Michael Ferrari Test <michael.f@icorrect.co.uk> | <p>Quote Request: Aaryan Makhija - iPhone 13</p> | 2026-04-15T16:11:04.000Z | 279.7h / 11.7d | 2026-04-15T16:11:04.000Z | 2026-04-15T16:09:07.000Z | https://app.intercom.com/a/inbox/pt6lwaq6/inbox/conversation/215473901242611 |
| 215473059241874 | Support/Support | Alex <operator+pt6lwaq6@intercom.io> |  | 2026-04-16T10:46:50.000Z | 261.1h / 10.9d | 2026-04-16T10:46:50.000Z | 2026-04-16T10:35:38.000Z | https://app.intercom.com/a/inbox/pt6lwaq6/inbox/conversation/215473059241874 |
| 215473685535127 | Support/Support | Michael Ferrari Test <michael.f@icorrect.co.uk> | <p>Contact Form: Adebiyi - MacBook Pro 14” ‘M3 &amp; M3 Pro /Max’ A2918, A2992 (2023) [1774789525733]</p> | 2026-04-16T15:17:16.000Z | 256.6h / 10.7d | 2026-04-16T15:17:16.000Z | 2026-04-16T14:49:21.000Z | https://app.intercom.com/a/inbox/pt6lwaq6/inbox/conversation/215473685535127 |
| 215473911749208 | Support/Support | Stephen Ward <stephenandrewward1972@gmail.com> | <p>2017 iMac upgrade</p> | 2026-04-16T15:17:51.000Z | 256.6h / 10.7d | 2026-04-16T15:17:51.000Z | 2026-04-15T16:22:33.000Z | https://app.intercom.com/a/inbox/pt6lwaq6/inbox/conversation/215473911749208 |
| 215473926163114 | Support/Support | Harvey Williams-Fairley <harvey@hwfpht.co.uk> | <p>MacBook 2021 Screen Repair - Harvey Williams-Fairley</p> | 2026-04-16T16:55:41.000Z | 255h / 10.6d | 2026-04-16T16:55:41.000Z | 2026-04-16T16:17:15.000Z | https://app.intercom.com/a/inbox/pt6lwaq6/inbox/conversation/215473926163114 |
| 215473954966450 | Support/Support | Michael Ferrari Test <michael.f@icorrect.co.uk> | <p>Contact Form: ricky - MacBook Pro 16” ‘M4 Max’ A3186 (2024) [1776422909677]</p> | 2026-04-17T10:48:52.000Z | 237.1h / 9.9d | 2026-04-17T10:48:52.000Z |  | https://app.intercom.com/a/inbox/pt6lwaq6/inbox/conversation/215473954966450 |
| 215473955615371 | Support/Support | Michael Ferrari <michael.f@icorrect.co.uk> | <p>Contact Form: Ricky - iPhone 13 Pro Max [1776426732974]</p> | 2026-04-17T11:52:31.000Z | 236h / 9.8d | 2026-04-17T11:52:31.000Z |  | https://app.intercom.com/a/inbox/pt6lwaq6/inbox/conversation/215473955615371 |
| 215473985166707 | Support/Support | No-reply-aws <no-reply-aws@amazon.com> | <p>[Case 177666106600814] New correspondence added</p> | 2026-04-20T04:58:08.000Z | 170.9h / 7.1d | 2026-04-20T04:58:09.000Z |  | https://app.intercom.com/a/inbox/pt6lwaq6/inbox/conversation/215473985166707 |
| 215473985167026 | Support/Support | No-reply-aws <no-reply-aws@amazon.com> | <p>Amazon Web Services: You have opened a new Support case: 177666106600814</p> | 2026-04-20T04:58:14.000Z | 170.9h / 7.1d | 2026-04-20T04:58:15.000Z |  | https://app.intercom.com/a/inbox/pt6lwaq6/inbox/conversation/215473985167026 |
| 215473986323729 | Support/Support | TeleSphere VPBX <telesphere@therackhouse.net> | <p>[TeleSphere]: Voicemail attached for - an unknown caller (423@900)</p> | 2026-04-20T07:40:03.000Z | 168.2h / 7d | 2026-04-20T07:40:03.000Z |  | https://app.intercom.com/a/inbox/pt6lwaq6/inbox/conversation/215473986323729 |
| 215473278921911 | Support/Support | Karen Rai <karen.rai@lcp.uk.com> | <p>iPhone screen repair</p> | 2026-04-20T08:12:37.000Z | 167.7h / 7d | 2026-04-20T08:12:37.000Z | 2026-04-17T15:59:58.000Z | https://app.intercom.com/a/inbox/pt6lwaq6/inbox/conversation/215473278921911 |
| 215473985167080 | Support/Support | No-reply-aws <no-reply-aws@amazon.com> | <p>RE:[CASE 177666106600814] SES: Production Access</p> | 2026-04-20T08:31:54.000Z | 167.4h / 7d | 2026-04-20T08:31:54.000Z | 2026-04-20T06:00:29.000Z | https://app.intercom.com/a/inbox/pt6lwaq6/inbox/conversation/215473985167080 |
| 215473988632950 | Support/Support | Gabor Kovacs <csiga1974@yahoo.co.uk> | <p>Re: Your iPhone 3 Diagnostics with iCorrect</p> | 2026-04-20T11:43:45.000Z | 164.2h / 6.8d | 2026-04-20T11:43:44.000Z |  | https://app.intercom.com/a/inbox/pt6lwaq6/inbox/conversation/215473988632950 |
| 215474001606931 | Support | Debjani Mitra <d.mitra@gosh.camden.sch.uk> | <p>Fw: IPad repair request</p> | 2026-04-21T07:44:54.000Z | 144.2h / 6d | 2026-04-21T07:44:55.000Z |  | https://app.intercom.com/a/inbox/pt6lwaq6/inbox/conversation/215474001606931 |
| 215474002827937 | Support | Audley House <audleyhouse@boutique.co> | <p>Guest</p> | 2026-04-21T10:17:44.000Z | 141.6h / 5.9d | 2026-04-21T10:17:44.000Z |  | https://app.intercom.com/a/inbox/pt6lwaq6/inbox/conversation/215474002827937 |
| 215474015555805 | Support | No-reply-aws <no-reply-aws@amazon.com> | <p>[Case 177666106600814] New correspondence added</p> | 2026-04-22T03:03:25.000Z | 124.9h / 5.2d | 2026-04-22T03:03:26.000Z |  | https://app.intercom.com/a/inbox/pt6lwaq6/inbox/conversation/215474015555805 |
| 215473497122440 | Support/Support | Ruth Davies <itsupport@st-james.southwark.sch.uk> | <p>Screen repair on ipad</p> | 2026-04-22T08:31:26.000Z | 119.4h / 5d | 2026-04-22T08:31:26.000Z | 2026-04-17T14:24:39.000Z | https://app.intercom.com/a/inbox/pt6lwaq6/inbox/conversation/215473497122440 |
| 215474019374983 | Support | mailout@arbor-education.finance <mailout@arbor-education.finance> | <p>RemittanceAdvice-22/04/2026</p> | 2026-04-22T11:57:40.000Z | 116h / 4.8d | 2026-04-22T11:57:41.000Z |  | https://app.intercom.com/a/inbox/pt6lwaq6/inbox/conversation/215474019374983 |
| 215474023332623 | Support | No-reply-aws <no-reply-aws@amazon.com> | <p>RE:[CASE 177666106600814] SES: Production Access</p> | 2026-04-22T16:00:23.000Z | 111.9h / 4.7d | 2026-04-22T16:00:24.000Z |  | https://app.intercom.com/a/inbox/pt6lwaq6/inbox/conversation/215474023332623 |
| 215473904574173 | Support/Support | Alex <operator+pt6lwaq6@intercom.io> |  | 2026-04-22T16:36:39.000Z | 111.3h / 4.6d | 2026-04-22T16:36:39.000Z | 2026-04-22T12:15:41.000Z | https://app.intercom.com/a/inbox/pt6lwaq6/inbox/conversation/215473904574173 |
| 215473958592345 | Support/Support | Alex <operator+pt6lwaq6@intercom.io> |  | 2026-04-23T15:50:42.000Z | 88.1h / 3.7d | 2026-04-23T15:50:42.000Z | 2026-04-23T15:09:24.000Z | https://app.intercom.com/a/inbox/pt6lwaq6/inbox/conversation/215473958592345 |

## Artifacts

- JSON: `/home/ricky/builds/customer-service/reports/intercom-open-stale-3days-last14-2026-04-27.json`
- CSV: `/home/ricky/builds/customer-service/reports/intercom-open-stale-3days-last14-2026-04-27.csv`
