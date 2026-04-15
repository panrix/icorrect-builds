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

### contact-form-forward-included — michael.f Contact Form forward is a real customer enquiry (mis-attributed) and must be included

- Pass: PASS
- Expected outcome: decision=post, type=new_enquiry
- Actual outcome: decision=post, type=new_enquiry, mondayMatched=false, hasPastRepairs=false, price=Diagnostics recommended
- Customer: Test Customer <test@example.com>
- Previous repairs: No previous repair history.
- Monday item: None
- Monday link: None
- Latest message excerpt: New enquiry from Test Customer Email: test@example.com Phone: +447000000000 Device: iPhone - iPhone 15 Pro Fault Area: Screen
- Draft reply quality: Hi Test,  Thank you for your message. We would need to complete a diagnostic first to provide accurate pricing for this repair. If you would like to proceed with that, please let me know and I will confirm the next steps.  Kind regards, Alex

### quote-request-notification-excluded — Internal michael.f Quote Request notification must be excluded as noise

- Pass: PASS
- Expected outcome: decision=exclude_noise
- Actual outcome: decision=exclude_noise
- Customer: Owen Device: MacBook Pro 16 <email@owensutton.com>
- Previous repairs: No previous repair history.
- Monday item: None
- Monday link: None
- Latest message excerpt: New quote emailed to email@owensutton.com Name: Owen Device: MacBook Pro 16
- Draft reply quality: Excluded

### parts-supplier-excluded — Parts supplier cold email with OLED/screen keywords must be excluded as spam

- Pass: PASS
- Expected outcome: decision=exclude_non_actionable
- Actual outcome: decision=exclude_non_actionable
- Customer: Carl Parts Sales <carl@elekworld.cn>
- Previous repairs: No previous repair history.
- Monday item: None
- Monday link: None
- Latest message excerpt: Hello, friend Diagnosable Soft OLED, No Message after repair (Moq Requested) iPhone 13: US$39.11 iPhone 13 Pro 120Hz: US$43.15. We are a trusted supplier of service pack lcd screens.
- Draft reply quality: Excluded

### phishing-excluded — Phishing email about unauthorized transaction must be excluded as spam

- Pass: PASS
- Expected outcome: decision=exclude_non_actionable
- Actual outcome: decision=exclude_non_actionable
- Customer: Giulia Sofia <giuliasasso32@gmail.com>
- Previous repairs: No previous repair history.
- Monday item: None
- Monday link: None
- Latest message excerpt: Dear Sir or Madam, I am writing because I noticed an unauthorized transaction on my account during the last night. An amount of 179 pounds was charged.
- Draft reply quality: Excluded

### reputation-spam-excluded — Trustpilot reputation management spam must be excluded

- Pass: PASS
- Expected outcome: decision=exclude_non_actionable
- Actual outcome: decision=exclude_non_actionable
- Customer: Pretty Anna <prettyanna031@gmail.com>
- Previous repairs: No previous repair history.
- Monday item: None
- Monday link: None
- Latest message excerpt: Hi Business Owner, Your hard-earned reputation is at risk. Right now, Trustpilot is removing and flagging reviews due to stricter AI detection.
- Draft reply quality: Excluded

### seo-pitch-paraphrased-excluded — SEO pitch using errors and ranking phrasing must be excluded

- Pass: PASS
- Expected outcome: decision=exclude_non_actionable
- Actual outcome: decision=exclude_non_actionable
- Customer: Steve Stoce <steve.itservices0150@hotmail.com>
- Previous repairs: No previous repair history.
- Monday item: None
- Monday link: None
- Latest message excerpt: Hello, Your website has several SEO and technical errors that may be affecting its ranking. I have an audit report ready for you.
- Draft reply quality: Excluded

### corporate-repair-not-blocked — Business domain sender with specific device + fault must NOT be excluded (repair intent protects it)

- Pass: PASS
- Expected outcome: decision=post, type=new_enquiry
- Actual outcome: decision=post, type=new_enquiry, mondayMatched=false, hasPastRepairs=false, price=Diagnostics recommended
- Customer: Karen Rai <karen.rai@lcp.uk.com>
- Previous repairs: No previous repair history.
- Monday item: None
- Monday link: None
- Latest message excerpt: Hi iCorrect, Please can we organise for a screen to be replaced on an iPhone device for Tom Durkin. Tom will be in London from 11am.
- Draft reply quality: Hi Karen,  Thank you for your message. We would need to complete a diagnostic first to provide accurate pricing for this repair. If you would like to proceed with that, please let me know and I will confirm the next steps.  Kind regards, Alex

## Summary

- Passed: 14/14
- Failed: 0/14
- Go/No-Go: `NO-GO` for any immediate ready-for-restart claim. These fixture cases passed, but QA acceptance for end-to-end live posting is still unproven.
- Required for `GO`: one controlled live run after deploy must land a new Telegram card in thread `774`, persist a new `telegram_message_id` in SQLite, and advance the relevant checkpoint beyond `2026-04-08T07:46:02.522Z` / `2026-04-09T08:50:43.530Z`.