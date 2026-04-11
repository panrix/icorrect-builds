# Email Triage Validation — 2026-04-11

## Scope

Email triage only. Quote triage excluded from live validation. Live posting remains disabled unless `ALEX_ENABLE_LIVE_POSTING=1`.
This fixture pack does not prove a fresh live Telegram post, SQLite `telegram_message_id` persistence for a newly posted card, or checkpoint advancement in the real runtime.

## Hard Guards

- Freshness window: 14 days
- Email-only intake: non-email conversations are excluded before drafting/posting.
- Processed-state dedupe: existing Telegram-reviewed or sent conversations are excluded from repost.
- Historical quote noise: stale/last-year quote threads are excluded.

## Test cases

### fresh-monday-match — Fresh Intercom email enquiry with valid Monday match

- Pass: PASS
- Expected outcome: decision=post, type=active_repair, mondayMatched=true, hasPastRepairs=false, price~£289
- Actual outcome: decision=post, type=active_repair, mondayMatched=true, hasPastRepairs=false, price=£289 (from repair)
- Customer: Liam Jones <liam.jones@example.com>
- Previous repairs: No previous repair history.
- Monday item: Liam Jones - MacBook Pro 13
- Monday link: https://icorrect.monday.com/boards/349212843/pulses/1111
- Latest message excerpt: Hi, just checking if there is any update on my MacBook Pro repair please.
- Draft reply quality: Hi Liam,  Thank you for your message. Monday currently shows Repaired. The current expected date on our side is 2026-04-10.  Kind regards, Alex

### returning-customer-history — Fresh email from returning customer with previous repairs visible

- Pass: PASS
- Expected outcome: decision=post, type=active_repair, mondayMatched=true, hasPastRepairs=true
- Actual outcome: decision=post, type=active_repair, mondayMatched=true, hasPastRepairs=true, price=Quote pending — device in diagnostics
- Customer: Sarah Malik <sarah.malik@example.com>
- Previous repairs: 2025-11-03: iPhone 12 Screen | 2026-02-14: iPhone 13 Battery
- Monday item: Sarah Malik - iPhone 13
- Monday link: https://icorrect.monday.com/boards/349212843/pulses/2222
- Latest message excerpt: Hi, my iPhone is having charging issues again. Can you let me know the next step?
- Draft reply quality: Hi Sarah,  Thank you for your message. Monday currently shows Diagnostics. I will confirm the latest timing with the workshop and update you shortly.  Kind regards, Alex

### history-no-monday — Fresh email with no Monday match but repair history present

- Pass: PASS
- Expected outcome: decision=post, type=new_enquiry, mondayMatched=false, hasPastRepairs=true, price~£129
- Actual outcome: decision=post, type=new_enquiry, mondayMatched=false, hasPastRepairs=true, price=From £129
- Customer: Oliver Grant <oliver.grant@example.com>
- Previous repairs: 2025-09-20: MacBook Air 13 Liquid Damage
- Monday item: None
- Monday link: None
- Latest message excerpt: Hello, I used you before and now my MacBook battery drains very quickly.
- Draft reply quality: Hi Oliver,  Thank you for your message. The price for this repair is From £129. If you would like to go ahead, please let me know and I will confirm the next steps.  Kind regards, Alex

### weak-pricing-data — Fresh email with weak/no pricing data

- Pass: PASS
- Expected outcome: decision=post, type=new_enquiry, mondayMatched=false, hasPastRepairs=false, price~Diagnostics
- Actual outcome: decision=post, type=new_enquiry, mondayMatched=false, hasPastRepairs=false, price=Diagnostics recommended
- Customer: Nina Patel <nina.patel@example.com>
- Previous repairs: No previous repair history.
- Monday item: None
- Monday link: None
- Latest message excerpt: Hi, my iPad has no power after liquid damage. Could you tell me the cost?
- Draft reply quality: Hi Nina,  Thank you for your message. We would need to complete a diagnostic first to provide accurate pricing for this repair. If you would like to proceed with that, please let me know and I will confirm the next steps.  Kind regards, Alex

### stale-old-quote-excluded — Old resolved quote or stale historical item that must be excluded

- Pass: PASS
- Expected outcome: decision=exclude_stale
- Actual outcome: decision=exclude_stale
- Customer: Amjad <amjad@example.com>
- Previous repairs: No previous repair history.
- Monday item: None
- Monday link: None
- Latest message excerpt: Thanks, happy to proceed with the quote from last year.
- Draft reply quality: Excluded

### quote-automation-excluded — Internal quote automation email must stay out of email triage

- Pass: PASS
- Expected outcome: decision=exclude_historical_quote
- Actual outcome: decision=exclude_historical_quote
- Customer: Customer Example <customer@example.com>
- Previous repairs: No previous repair history.
- Monday item: None
- Monday link: None
- Latest message excerpt: New quote emailed to customer@example.com with quote total £249 after diagnostic complete.
- Draft reply quality: Excluded

### already-processed-no-resurface — Already-processed conversation that must not resurface

- Pass: PASS
- Expected outcome: decision=exclude_already_processed
- Actual outcome: decision=exclude_already_processed
- Customer: Eva Brooks <eva.brooks@example.com>
- Previous repairs: No previous repair history.
- Monday item: None
- Monday link: None
- Latest message excerpt: Hi, just confirming what time I can collect my device today.
- Draft reply quality: Excluded

## Summary

- Passed: 7/7
- Failed: 0/7
- Go/No-Go: `NO-GO` for any immediate ready-for-restart claim. These fixture cases passed, but QA acceptance for end-to-end live posting is still unproven.
- Required for `GO`: one controlled live run after deploy must land a new Telegram card in thread `774`, persist a new `telegram_message_id` in SQLite, and advance the relevant checkpoint beyond `2026-04-08T07:46:02.522Z` / `2026-04-09T08:50:43.530Z`.
