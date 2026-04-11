# Finn Lessons — What Failed and Why

Condensed from two audits (Jan 15 - Feb 15 2026). These are the known failure patterns to understand, monitor, and avoid repeating.

---

## Audit Snapshot

| Period | Conversations | Finn Conversion |
|---|---|---|
| Jan 15 – Feb 9 | 50 | 0/3 real customers (0%) |
| Feb 9–15 | 56 (11 new enquiries) | 1/11 (9%) |

**Human-handled conversion across both periods: 100%**

---

## Critical Failures

### 1. Dead-End CTAs
**What happened:** Finn asked "Would you like to book that in?" — customers said nothing and left.  
**Why:** No urgency, no commitment, no next step. A question is not a CTA.  
**Avoid:** Phrasing that ends with a yes/no. Always give the customer something to click or do.

### 2. Silent Escalation
**What happened:** Finn escalated with "Support please take over" — but said nothing to the customer first. Customers were left waiting with zero acknowledgement.  
**Why:** Finn escalated internally without realising the customer needed reassurance first.  
**Avoid:** Any handoff where the customer gets no message. Always draft a "hold on, we're getting you sorted" message before escalating.

### 3. Wrong Repair Quoted
**What happened:** Jordan Clark had Flexgate/Dustgate symptoms. Finn quoted £499 screen replacement. Customer had to correct Finn themselves — ended up booked at £349.  
**Why:** Finn matched symptoms to the wrong repair category.  
**Avoid:** Relying on Finn to diagnose from symptoms without a cross-check. Flag any symptom description to Ferrari for review before quoting.

### 4. Old Device Over-Engagement
**What happened:** Kyle (2015 iPad) got 20+ Finn messages before anyone realised the device was out of scope.  
**Why:** No early filter for device age. Finn kept trying to help.  
**Rule:** Devices older than 10 years should be declined early. Don't let Finn burn messages on out-of-scope hardware.

### 5. No Follow-up on Unanswered Enquiries
**What happened:** 4 decent opening messages, customers went quiet — zero follow-up from Finn or team.  
**Why:** No follow-up automation existed.  
**Lesson:** Every unanswered enquiry needs a 24h and 72h nudge. This is a workflow gap, not a Finn guidance gap.

### 6. Escalation on Repeated Yes
**What happened:** Kyle said "yes" 6 times. Finn kept asking "would you like to proceed?"  
**Why:** No rule for recognising that a customer is ready and escalating immediately.  
**Rule:** Two clear confirmations = escalate to Ferrari immediately.

### 7. Back Market Emails Buried
**What happened:** Back Market sent IMEI proof requests and late-processing warnings. Finn treated them as customer enquiries, replied nonsensically, closed them. Ferrari never saw them.  
**Impact:** One order at risk (GB-25513-GHOXX), one BuyBack cap warning already past deadline.  
**Rule:** Back Market platform emails must bypass Finn entirely and go directly to Ferrari.

### 8. Diagnostic Price Inconsistency
**What happened:** Finn quoted £99 diagnostic in some conversations, £49 in others.  
**Correct price:** £49. Always.

### 9. Spam Over-Engagement
**What happened:** A WhatsApp review removal scammer got 6+ Finn responses including SEO advice.  
**Avoid:** Engaging with obvious spam at all. One response max (if any), then close.

---

## Ferrari Response Time Problems (Feb 9-15 audit)

Some conversations waited 20-63 hours for Ferrari to respond:

| Wait Time | Status |
|---|---|
| 3-8 hours | Acceptable |
| 11-20 hours | Watch zone |
| 25+ hours | Problem |
| 63 hours | Critical failure |

Alex's job is to surface these before they blow up. If a conversation has been waiting >12 hours without a draft ready for Ferrari, flag it.

---

## What Works

- **Human handling converts at 100%** — every enquiry Ferrari personally handled converted
- **Fast first response** — conversations where Ferrari responded within 4 hours converted
- **Accurate quoting** — when Ferrari knew the device/repair, customers booked

---

## Alex's Role in Preventing These Failures

- Keep an eye on the Intercom queue — flag anything waiting >12h
- Check BM emails daily — route to Ferrari immediately
- Verify pricing in KB before any draft goes to Ferrari
- Never let a "ready to book" customer wait. Two confirmations = escalate now
- Flag any symptom-based enquiry for Ferrari review before quoting

---

*Source: finn-audit/BASELINE.md, finn-audit/audit-feb-9-15.md*  
*Last updated: 2026-03-10*
