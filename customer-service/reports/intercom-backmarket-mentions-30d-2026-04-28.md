# Intercom Back Market Mentions — 30 Day Read-only Audit

Generated: `2026-04-28T04:21:22.703Z`
Window: `2026-03-29T00:00:00Z` through `2026-04-28T04:13:00Z`
Mode: READ ONLY — Intercom search/detail reads only; no send/close/assign/tag/update/mutation.

## Search strategy

- Used existing Intercom credentials from `/home/ricky/config/api-keys/.env` without printing secrets.
- Queried `POST /conversations/search` for conversations with `updated_at` inside the window.
- Fetched each matching conversation via read-only `GET /conversations/{id}`.
- Scanned source + conversation parts whose timestamps were inside the window.
- Match variants: `backmarket`, `back market`, `@backmarket`, `backmarket.com`, `notification.backmarket`, `BackBot`.

## Counts

- Updated conversations scanned: **634** (API total: 634)
- Message/source parts scanned: **10285**
- Conversations with Back Market-related matches: **6**
- INCIDENTAL_OR_NEEDS_MANUAL_CHECK: **5**
- GENUINE_BACK_MARKET_OPERATIONAL: **1**

## Compact match list

| Class | Conversation | Updated | Latest relevant msg | Sender | Subject | Snippet / reason |
|---|---|---|---|---|---|---|
| INCIDENTAL_OR_NEEDS_MANUAL_CHECK | [215474058223463](https://app.intercom.com/a/inbox/pt6lwaq6/inbox/conversation/215474058223463) | 2026-04-27T14:49:39.000Z | 2026-04-27T14:49:39.000Z | Support <admin@icorrect.co.uk> | Return cancelation | Back Market mention in message body/author metadata: Hi Ajm, Thank you for getting in touch. No problem at all, we've informed Back Market. Thanks for letting us know.  Kind regards, Michael |
| INCIDENTAL_OR_NEEDS_MANUAL_CHECK | [215473982356491](https://app.intercom.com/a/inbox/pt6lwaq6/inbox/conversation/215473982356491) | 2026-04-27T14:53:25.000Z | 2026-04-22T17:01:12.000Z | Support <admin@icorrect.co.uk> |  | Back Market mention in message body/author metadata: Hi Hannah, That makes sense, we agree with you. You’re welcome to come and collect the device tomorrow. In terms of replacements, we don’t currently have a catalogue on our website. We mainly sell through Back Market, which doesn’t really allow us to showcase stock in that way. That said, we do have devices available that we can sell directly as well. At the moment, we have a couple of options ready to go: MacBook Pro 2020 (M1), 8GB RAM, 256GB SSD, silver, fair aesthetic cond […] |
| INCIDENTAL_OR_NEEDS_MANUAL_CHECK | [215473972409184](https://app.intercom.com/a/inbox/pt6lwaq6/inbox/conversation/215473972409184) | 2026-04-20T07:47:09.000Z | 2026-04-20T07:47:09.000Z | Support <admin@icorrect.co.uk> | Leading Supplier for refurbish customers on Backmarket | Back Market in subject/title: Leading Supplier for refurbish customers on Backmarket |
| INCIDENTAL_OR_NEEDS_MANUAL_CHECK | [215473855975225](https://app.intercom.com/a/inbox/pt6lwaq6/inbox/conversation/215473855975225) | 2026-04-20T07:42:23.000Z | 2026-04-17T14:59:50.000Z | Amal Singh |  | Back Market mention in message body/author metadata: Dam honesty I found a 16 plus on back market brand new basically and put mine for a trade in of £202 for the 15 pro max |
| GENUINE_BACK_MARKET_OPERATIONAL | [215473807861557](https://app.intercom.com/a/inbox/pt6lwaq6/inbox/conversation/215473807861557) | 2026-04-10T14:26:36.000Z | 2026-04-07T14:00:29.000Z | No reply <merchant.no-reply@backmarket.com> | Your Buyback - Late Response rate doesn’t meet our quality standards | Back Market sender/domain/BackBot: Your Buyback - Late Response rate doesn’t meet our quality standards |
| INCIDENTAL_OR_NEEDS_MANUAL_CHECK | [215473456369844](https://app.intercom.com/a/inbox/pt6lwaq6/inbox/conversation/215473456369844) | 2026-04-21T16:56:11.000Z | 2026-04-07T13:44:22.000Z | Support <admin@icorrect.co.uk> | Your iPhone Repair with iCorrect | Back Market mention in message body/author metadata: Hi Antonio, Thank you for your call.  We'll proceed with the data recovery repair shortly and confirm once the backup is done. In the meantime, here's Back Market's trade-in website as advised: https://www.backmarket.co.uk/en-gb/buyback/home  Kind regards, Michael |

## Limitations

- Search base is conversations with `updated_at` in the window; an older conversation with a hidden/non-updating message timestamp would not appear, but Intercom normally updates conversations when messages/parts are added.
- Classification is rule-based: Back Market notification/domain/order/counteroffer/customer-care messages are flagged operational; generic body mentions are flagged incidental/manual-check.
- Intercom API body snippets may omit attachments; this audit checks text/HTML bodies and metadata only.

## Artifacts

- JSON: `/home/ricky/builds/customer-service/reports/intercom-backmarket-mentions-30d-2026-04-28.json`
- CSV: `/home/ricky/builds/customer-service/reports/intercom-backmarket-mentions-30d-2026-04-28.csv`
