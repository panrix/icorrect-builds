# Code Review: Spam & Noise Filter — 2026-04-11

## Verdict: PASS WITH MINOR NOTES

Reviewed commit `db63a33` against the round 2 audit (`docs/spam-audit-qa-round2-2026-04-11.md`).

## Verification Results

### Syntax check: PASS
`node --check lib/triage.js` clean.

### Validation: PASS
14/14 fixtures pass (7 original + 7 new spam/noise cases).

### Claim verification

| Claim | Status | Notes |
|---|---|---|
| isNoiseConversation excludes michael.f forwards | ✅ PASS | Correctly matches Contact Form: and Quote Request: prefixes |
| isNoiseConversation excludes admin@icorrect | ✅ PASS | Exact match |
| isNoiseConversation excludes mailer@shopify.com | ✅ PASS | Exact match |
| isNoiseConversation excludes BM no-reply | ✅ PASS | Checks both no-reply and backmarket.com domain |
| isNoiseConversation excludes voicemail/telesphere | ✅ PASS | Checks domain, local part, and subject patterns |
| Hard spam always blocks | ✅ PASS | Parts supplier (MOQ, service pack lcd), phishing, reputation management all bypass repair-intent |
| Soft spam protected by repair intent | ✅ PASS | sales@ sender blocked unless message has device + fault keywords |
| hasRepairIntent requires device AND fault | ✅ PASS | Both pattern arrays must match |
| Noise filter called before other checks | ✅ PASS | In evaluateEmailTriageCandidate, exclude_noise fires before freshness/staleness checks |
| Karen Rai corporate case protected | ✅ PASS | "iPhone" + "screen" + "replaced" triggers repair intent, overrides info@ soft spam |

### Edge case probes (7 targeted tests)

| Test | Result | Notes |
|---|---|---|
| Parts supplier without hard spam keywords (sales@ sender) | PASS blocked | Caught by sales@ soft spam pattern |
| Wosente supplier from real audit | PASS blocked | "trusted supplier" hard spam pattern |
| BM no-reply notification | PASS noise | Noise filter catches it |
| Shopify mailer relay | PASS noise | Noise filter catches it |
| Karen Rai corporate repair | PASS included | Repair intent protects her from info@ soft spam |
| ferrari@icorrect.co.uk not in noise list | Passes through | See notes below |
| "moq" from gmail.com customer | Passes through | See notes below |

## Minor Notes (not bugs)

### 1. icorrect.co.uk staff emails not fully covered by noise filter
The noise filter only blocks `michael.f@` and `admin@` from icorrect.co.uk. Other staff (e.g. `ferrari@icorrect.co.uk`) sending email-type conversations would pass through. In practice this is not a problem because internal staff messages arrive as `admin_initiated` source type, not `email`, and are already excluded by the `isEmailConversation` check. No code change needed.

### 2. "moq" pattern scoped to .cn domains
The hard spam pattern `() => combinedText.includes("moq") && senderEmail.includes(".cn")` only fires for Chinese domains. A parts supplier from a non-.cn domain saying "MOQ" without other hard spam keywords could slip through. In practice, the `sales@` sender pattern and other soft spam keywords (wholesale, bulk order, supplier) would likely catch these. Low risk.

### 3. Bare "moq" could theoretically match legitimate text
A customer saying "moq" (extremely unlikely in a repair context) from a non-.cn domain would not be blocked. This is correct behavior: repair intent would protect them anyway.

### 4. No fixture for voicemail/telesphere noise
The noise filter handles telesphere but there is no dedicated fixture for it. The subject-based check `subject.includes("[telesphere]") || subject.includes("voicemail attached")` is straightforward and unlikely to false-positive. Low priority to add a fixture.

## Recommendations

1. **Monitor in production for 1 week** before considering any changes. The dry run showed 82% reduction in triage candidates, which is significant.
2. **Add a telesphere fixture** if voicemail notifications are frequent enough to warrant it.
3. **Consider a catch-all icorrect.co.uk noise rule** if other staff start generating email-type conversations. Current scoping to michael.f + admin is safer to avoid false positives.
4. **Log excluded conversations** with their exclusion reason so the filter can be audited from cron logs without needing to query SQLite.

## Summary

The implementation correctly maps the round 2 audit findings into code. Hard/soft spam split is well-designed: phishing, supplier, and reputation spam are always blocked while legitimate corporate repair requests are protected by repair intent. The noise filter eliminates the largest source of wasted triage effort (michael.f internal forwards). No bugs found.
