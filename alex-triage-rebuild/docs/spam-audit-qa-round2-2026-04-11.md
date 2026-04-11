# Spam Audit QA Round 2 — 2026-04-11

## Method

Third-pass manual review of all 43 email-sourced conversations. Aggressive classification: anything that should NOT become a triage card is classified as spam or noise.

## Classification Key
- **SPAM**: unsolicited commercial email, cold outreach, parts suppliers, SEO, marketing, phishing, reputation management
- **NOISE**: automated system notifications that aren't customer messages (voicemail alerts, BM operational notices, internal outbound admin messages, automated quote-sent notifications). Should not generate triage cards.
- **LEGIT**: real person asking about repair of their own device, following up, complaining, or corporate client arranging repair for staff

## Full Classification Table

| # | ID | Subject (first 60 chars) | Sender | Class | Reasoning |
|---|---|---|---|---|---|
| 1 | 215473865619328 | Budget Planning 📘 | steve.itservices0150@hotmail.com | SPAM | SEO pitch hidden behind deceptive subject |
| 2 | 215473861265140 | Camera Ring Falling Out | elaisatizakariah123@gmail.com | LEGIT | Real customer, iPhone 15 Pro camera ring issue |
| 3 | 215473861221369 | Contact Form: Zak E - iPhone 15 Pro | michael.f@icorrect.co.uk | NOISE | Duplicate of #2. Internal forwarded contact form for same customer. Triage should use the customer's direct email, not this. |
| 4 | 215473789131495 | Re: Your Warranty Repair with iCorrect | info@musicalmovements.co.uk | LEGIT | Real customer, MacBook Pro warranty follow-up |
| 5 | 215473310505742 | Battery Replacement 2019 16 Inch MacBook Pro | jason@meetmabel.com | LEGIT | Real returning customer, MacBook battery |
| 6 | 215473685535127 | Contact Form: Adebiyi - MacBook Pro 14" | michael.f@icorrect.co.uk | NOISE | Internal forwarded contact form. Customer enquiry exists separately. |
| 7 | 215473833459459 | Quote Request: Owen - MacBook Pro 16" | michael.f@icorrect.co.uk | NOISE | Automated quote-sent notification. Quote already emailed to customer. Not a triage item. |
| 8 | 215473647077609 | Contact Form: Jeremy Scott - iPad Pro 12.9" | michael.f@icorrect.co.uk | NOISE | Internal forwarded contact form |
| 9 | 215473848837722 | Contact Form: Daniel Peters - iPad 11th Gen | michael.f@icorrect.co.uk | NOISE | Internal forwarded contact form |
| 10 | 215473794365328 | Liebman RE ipad | elpeleq@gmail.com | LEGIT | Real customer, iPad Pro charging port |
| 11 | 215473839160617 | Quote Request: Rae - MacBook Pro 16" | michael.f@icorrect.co.uk | NOISE | Automated quote-sent notification |
| 12 | 215473856125900 | Re: Your Tickets ticket #88719516 | ali.kubba@hotmail.com | LEGIT | Real customer, MacBook collection follow-up |
| 13 | 215473829574785 | Liam MacBook repair | liamvking@gmail.com | LEGIT | Real customer, MacBook + phone issues |
| 14 | 215473711014812 | MacBook Battery Replacement Enquiry | janetonabanjo@hotmail.co.uk | LEGIT | Real customer, MacBook battery |
| 15 | 215473853275984 | [TeleSphere]: Voicemail attached for - an unknown caller | telesphere@therackhouse.net | NOISE | Automated voicemail notification, not a customer email |
| 16 | 215473807861557 | Your Buyback - Late Response rate doesn't meet our quality | merchant.no-reply@backmarket.com | NOISE | BM operational notification. Not a customer message. |
| 17 | 215473648465313 | Contact Form: Oliver Curtis - iPhone 14 Pro Max | michael.f@icorrect.co.uk | NOISE | Internal forwarded contact form |
| 18 | 215473855128215 | Daignosable 120Hz Soft OLED, No Unknown Parts Message | carl@elekworld.cn | SPAM | Parts supplier cold sales email from China |
| 19 | 215473850742476 | iPhone XS Max | j.a.summerhill@outlook.com | LEGIT | Real customer, OLED screen replacement enquiry |
| 20 | 215473852029830 | Urgent request: unothorized transaction | giuliasasso32@gmail.com | SPAM | Phishing email about "unauthorized transaction" |
| 21 | 215473852802697 | iPad repair | gerardlaboisne@icloud.com | LEGIT | Real customer, old iPad won't start |
| 22 | 215473698506354 | Contact Form: Charlie Worsley - MacBook Pro 14" | michael.f@icorrect.co.uk | NOISE | Internal forwarded contact form |
| 23 | 215473700286509 | Contact Form: James Summerhill - iPhone 14 Pro | michael.f@icorrect.co.uk | NOISE | Internal forwarded contact form |
| 24 | 215473614230937 | Re: Your Repair with iCorrect | bronte.schwier@gmail.com | LEGIT | Real customer, warranty complaint about screen |
| 25 | 215473848216717 | One-Stop Mobile Phone Repair Parts Supplier | sales.alicia@wosente-tech.com | SPAM | Parts supplier cold sales email |
| 26 | 215473526683969 | Contact Form: Marcus Ervin - MacBook Pro 14-inch | michael.f@icorrect.co.uk | NOISE | Internal forwarded contact form |
| 27 | 215472862153240 | New customer message on 28 January 2026 at 10:07 | mailer@shopify.com | NOISE | Shopify contact form relay. Automated notification, not direct customer email. |
| 28 | 215473827271756 | MacBook Air M2 | mark@sopure.co.uk | LEGIT | Real customer, display connector issue from YouTube video |
| 29 | 215473821236520 | Refund | chrisdove04@gmail.com | LEGIT | Real customer, complaint about battery service |
| 30 | 215472797244257 | Re: Your Repair with iCorrect | erman@zenmail.co.uk | LEGIT | Real customer, proceeding with repair |
| 31 | 215473838643895 | Don't Let Trustpilot Destroy Your Hard-Earned Reputation | prettyanna031@gmail.com | SPAM | Reputation management spam |
| 32 | 215473828667086 | An iMac issue | jarryjar@icloud.com | LEGIT | Real customer, iMac M1 issue |
| 33 | 215473814207819 | Re: MacBook Repair with iCorrect | francisomede@gmail.com | LEGIT | Real customer, proceeding with MacBook repair |
| 34 | 215473398075629 | Problem repeat MacBook | khadersmd246@gmail.com | LEGIT | Real customer, repeat issue after repair |
| 35 | 215473797836196 | Re: Your Repair with iCorrect | iphysal@gmail.com | LEGIT | Real customer, warranty complaint about display lines |
| 36 | 215473278921911 | iPhone screen repair | karen.rai@lcp.uk.com | LEGIT | Real corporate client arranging repair for staff member |
| 37 | 215473456369844 | Your iPhone Repair with iCorrect | admin@icorrect.co.uk | NOISE | Outbound admin email from iCorrect to customer. Not inbound. |
| 38 | 215473821962305 | Re: Your Repair with iCorrect | bronte.schwier@gmail.com | LEGIT | Real customer, warranty dispute follow-up |
| 39 | 215473833690943 | Quote Request: Natalie Bremseth - MacBook Pro 14" | michael.f@icorrect.co.uk | NOISE | Automated quote-sent notification |
| 40 | 215473783065696 | Contact Form: Nicolas Rotta - MacBook Pro 13" | michael.f@icorrect.co.uk | NOISE | Internal forwarded contact form |
| 41 | 215473800593948 | Contact Form: marcus mittee - iPhone 15 | michael.f@icorrect.co.uk | NOISE | Internal forwarded contact form |
| 42 | 215473789509751 | Contact Form: David Robinson - iPhone 11 Pro | michael.f@icorrect.co.uk | NOISE | Internal forwarded contact form |
| 43 | 215473610825781 | Contact Form: Niki Freeman - iPad Pro 12.9 3rd Gen | michael.f@icorrect.co.uk | NOISE | Internal forwarded contact form |

## Summary

| Classification | Count | % of 43 |
|---|---|---|
| LEGIT | 20 | 47% |
| NOISE | 18 | 42% |
| SPAM | 5 | 12% |
| **Should NOT become a triage card (spam + noise)** | **23** | **53%** |

## Key Finding

**Over half the email conversations in the sample should not generate triage cards.**

The 14% spam rate from the prior review was measuring only traditional spam. When you add noise (internal forwarded forms, automated quote notifications, voicemail alerts, BM operational emails, outbound admin messages), the "should not be triaged" rate jumps to 53%.

## Noise Breakdown

| Type | Count |
|---|---|
| michael.f Contact Form forwards | 11 |
| michael.f Quote Request notifications | 3 |
| Voicemail notification | 1 |
| BM operational notification | 1 |
| Shopify form relay | 1 |
| Outbound admin email | 1 |

The biggest source of noise is the `michael.f@icorrect.co.uk` Contact Form and Quote Request emails. These are internal system-generated messages: the contact form creates both a direct customer email AND a forwarded internal copy. The triage system should use the customer's direct email, not the internal forward. Quote Request emails are notifications that a quote has already been sent; they are not new triage items.

## Disagreements with Prior QA Review

| ID | Prior classification | This classification | Reasoning |
|---|---|---|---|
| 3, 6, 8, 9, 17, 22, 23, 26, 40, 41, 42, 43 | Legitimate | NOISE | Contact Form forwards from michael.f are internal duplicates |
| 7, 11, 39 | Legitimate | NOISE | Quote Request notifications are automated, not triage items |
| 15 | Noise (agreed) | NOISE | Voicemail notification |
| 16 | Spam | NOISE | BM notification is operational noise, not traditional spam |
| 27 | Legitimate | NOISE | Shopify mailer relay, not direct customer email |
| 37 | Legitimate | NOISE | Outbound admin email, not inbound |

## Revised Recommendation

The filter needs two layers:
1. **Spam filter**: catch SEO, parts suppliers, phishing, reputation management (5/43 = 12%)
2. **Noise filter**: exclude internal forwards (michael.f Contact Forms, Quote Requests), automated notifications (voicemail, BM, Shopify mailer), outbound admin messages (18/43 = 42%)

Combined, these would prevent 23 of 43 email conversations from becoming triage cards, cutting reviewer workload roughly in half.

### Quick wins for noise filtering
- Exclude sender `michael.f@icorrect.co.uk` when subject starts with "Contact Form:" or "Quote Request:"
- Exclude sender `admin@icorrect.co.uk` (outbound admin)
- Exclude sender `mailer@shopify.com`
- Exclude sender domains: `telesphere`, `backmarket.com` with `no-reply`
- These 4 rules alone would eliminate 16 of the 18 noise conversations
