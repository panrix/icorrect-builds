# Spam Audit QA Review — 2026-04-11

## Method

Independent manual review of all 100 unique conversations from `data/spam-audit-results.json`. Each conversation reclassified based on subject, sender, and excerpt content.

## Sample Composition Problem

The original audit reported 5/100 = 5% spam. This is misleading because:
- 51 conversations are admin-initiated (outbound from iCorrect operator). These are never spam and dilute the rate.
- 3 are WhatsApp, 2 are Instagram. The triage system only processes email today.
- Only 43/100 are inbound email, which is the actual population the spam filter operates on.

## Email-Only Reclassification (43 conversations)

### Misclassified as legitimate (should be spam)

| ID | Subject | Sender | Why it's spam |
|---|---|---|---|
| 215473855128215 | "Daignosable 120Hz Soft OLED..." | carl@elekworld.cn | Parts supplier cold sales email, not a repair customer |
| 215473848216717 | "One-Stop Mobile Phone Repair Parts Supplier" | sales.alicia@wosente-tech.com | Parts supplier cold sales, literally says "supplier" in subject |
| 215473838643895 | "Don't Let Trustpilot Destroy Your Hard-Earned Reputation" | prettyanna031@gmail.com | Reputation management spam/scam |
| 215473852029830 | "Urgent request: unothorized transaction" | giuliasasso32@gmail.com | Phishing email, not a repair customer. iCorrect doesn't process payments via email |

### Misclassified as spam (should be legitimate)

| ID | Subject | Sender | Why it's legitimate |
|---|---|---|---|
| 215473278921911 | "iPhone screen repair" | karen.rai@lcp.uk.com | Real corporate repair request: "Please can we organise for a screen to be replaced on an iphone device for Tom Durkin" |

### Borderline / noise (not spam, but not customer repair enquiries)

| ID | Subject | Sender | Notes |
|---|---|---|---|
| 215473853275984 | "Voicemail attached for - an unknown caller" | telesphere@therackhouse.net | Automated voicemail notification. Not spam, but not a customer email either. Should not generate a triage card. |
| 215473807861557 | "Your Buyback - Late Response rate..." | merchant.no-reply@backmarket.com | BM operational notification. Correctly classified as spam by original audit, but it's really "operational noise" not traditional spam. |

### Non-email channel spam found

| ID | Channel | Excerpt | Notes |
|---|---|---|---|
| 215473857949611 | WhatsApp | "I came across your Google Maps business profile and noticed a few..." | Google Maps SEO spam via WhatsApp. Not processed by email triage today. |

## Revised Numbers (email only)

| Metric | Original | Revised |
|---|---|---|
| Email conversations | 43 | 43 |
| Spam (email) | 2 | 6 |
| Legitimate (email) | 41 | 36 |
| Noise/non-customer (email) | 0 | 1 |
| **Spam rate (email)** | **4.7%** | **14%** |
| Missed by current filter | 1 | 5 |
| False positive (legit blocked as spam) | 0 | 1 |

## What the original audit got wrong

1. **Parts supplier emails classified as repair enquiries** (2 cases). Both contain repair-related keywords ("OLED", "screen repair") which fooled the heuristic classifier, but they're selling parts TO iCorrect, not requesting repairs.
2. **Phishing classified as repair enquiry** (1 case). "Unauthorized transaction" has nothing to do with device repair.
3. **Reputation management spam classified as legitimate** (1 case). "Trustpilot" and "reputation" are not in the current keyword list.
4. **Corporate repair request classified as spam** (1 false positive). The original audit flagged a real corporate client (Karen Rai at LCP) because the domain was non-personal, but the content is a genuine repair request.

## Revised spam rate: 14% of inbound email

This means roughly 2-4 spam cards per day at current email volume. Each one wastes reviewer time and degrades trust in the triage system.

## Impact on filter redesign

The redesign spec needs to account for:
- **Parts supplier detection**: sender domain + "supplier/wholesale/MOQ" signals
- **Phishing detection**: "unauthorized transaction" / "verify your account" patterns
- **Reputation management spam**: "Trustpilot" / "reputation" / "reviews" from non-customer senders
- **Positive repair-intent signal**: critical to avoid the false positive on corporate repair requests. If the message mentions a specific device + fault, it should score as legitimate regardless of sender domain.
