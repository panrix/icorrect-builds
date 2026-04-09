# Email Triage Validation — 2026-04-09

## Scope

Email triage only. Quote triage excluded from live validation. Live posting remains disabled unless `ALEX_ENABLE_LIVE_POSTING=1`.

## Test cases

### fresh-monday-match — Fresh Intercom email enquiry with valid Monday match

- Pass: PASS
- Decision: post
- Customer: Liam Jones <liam.jones@example.com>
- Previous repairs: No previous repair history.
- Monday item: Liam Jones - MacBook Pro 13
- Monday link: https://icorrect.monday.com/boards/349212843/pulses/1111
- Latest message excerpt: Hi, just checking if there is any update on my MacBook Pro repair please.
- Draft reply quality: Hi Liam,  Thank you for your message. I am checking the latest status for you now and I will come back to you with an update shortly.  Kind regards, Alex

### returning-customer-history — Fresh email from returning customer with previous repairs visible

- Pass: PASS
- Decision: post
- Customer: Sarah Malik <sarah.malik@example.com>
- Previous repairs: 2025-11-03: iPhone 12 Screen | 2026-02-14: iPhone 13 Battery
- Monday item: Sarah Malik - iPhone 13
- Monday link: https://icorrect.monday.com/boards/349212843/pulses/2222
- Latest message excerpt: Hi, my iPhone is having charging issues again. Can you let me know the next step?
- Draft reply quality: Hi Sarah,  Thank you for your message. The price for this repair is Quote pending — device in diagnostics. If you would like to go ahead, please let me know and I will confirm the next steps.  Kind regards, Alex

### history-no-monday — Fresh email with no Monday match but repair history present

- Pass: PASS
- Decision: post
- Customer: Oliver Grant <oliver.grant@example.com>
- Previous repairs: 2025-09-20: MacBook Air 13 Liquid Damage
- Monday item: None
- Monday link: None
- Latest message excerpt: Hello, I used you before and now my MacBook battery drains very quickly.
- Draft reply quality: Hi Oliver,  Thank you for your message. The price for this repair is From £129. If you would like to go ahead, please let me know and I will confirm the next steps.  Kind regards, Alex

### weak-pricing-data — Fresh email with weak/no pricing data

- Pass: PASS
- Decision: post
- Customer: Nina Patel <nina.patel@example.com>
- Previous repairs: No previous repair history.
- Monday item: None
- Monday link: None
- Latest message excerpt: Hi, my iPad has no power after liquid damage. Could you tell me the cost?
- Draft reply quality: Hi Nina,  Thank you for your message. The price for this repair is Not in catalogue — diagnostic needed. If you would like to go ahead, please let me know and I will confirm the next steps.  Kind regards, Alex

### stale-old-quote-excluded — Old resolved quote or stale historical item that must be excluded

- Pass: PASS
- Decision: exclude_stale
- Customer: Amjad <amjad@example.com>
- Previous repairs: No previous repair history.
- Monday item: None
- Monday link: None
- Latest message excerpt: Thanks, happy to proceed with the quote from last year.
- Draft reply quality: Excluded

### already-processed-no-resurface — Already-processed conversation that must not resurface

- Pass: PASS
- Decision: exclude_already_processed
- Customer: Eva Brooks <eva.brooks@example.com>
- Previous repairs: No previous repair history.
- Monday item: None
- Monday link: None
- Latest message excerpt: Hi, just confirming what time I can collect my device today.
- Draft reply quality: Excluded

## Summary

- Passed: 6/6
- Failed: 0/6
- Go/No-Go: GO only when all tests pass and live posting remains gated behind `ALEX_ENABLE_LIVE_POSTING=1`.