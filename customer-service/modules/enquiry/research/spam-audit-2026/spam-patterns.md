# Spam/Noise Pattern Review

Generated from 2060 conversations created on or after 2026-01-01T00:00:00Z.

## Pattern Table

| Pattern ID | Bucket | Field | Regex | Matches | Precision | Score | Notes |
| --- | --- | --- | --- | ---: | ---: | ---: | --- |
| shopify_mailer | automated | sender_email | `^mailer@shopify\.com$` | 102 | 100.0% | 102.0 | Shopify automated mailer sender |
| generic_noreply_sender | automated | sender_email | `\b(?:no-?reply|noreply|do-?not-?reply)\b` | 97 | 100.0% | 97.0 | Generic no-reply sender |
| telesphere_sender | automated | sender_email | `telesphere` | 50 | 100.0% | 50.0 | Telesphere voicemail sender |
| telesphere_voicemail_subject | automated | subject | `\[telesphere\]|voicemail attached` | 50 | 100.0% | 50.0 | Voicemail notification subject |
| seo_pitch_text | spam | combined_text | `\b(?:seo|backlinks?|guest post|domain authority|link insertion|organic traffic)\b` | 15 | 100.0% | 15.0 | SEO outreach language |
| marketing_pitch_text | spam | combined_text | `\b(?:lead generation|grow your business|boost your sales|social media promotion|instagram followers)\b` | 7 | 100.0% | 7.0 | Broad marketing spam language |
| backmarket_noreply_sender | automated | sender_email | `\b(?:no-?reply|noreply)@(?:.+\.)?backmarket\.com\b` | 6 | 100.0% | 6.0 | Back Market no-reply mailbox |
| otp_or_verification_text | automated | combined_text | `verification code|one-time password|otp` | 1 | 100.0% | 1.0 | One-time code or verification notification |
| cold_outreach_text | spam | combined_text | `\b(?:partnership opportunity|would love to connect|are you the right person|on behalf of my client|reseller opportunity)\b` | 1 | 100.0% | 1.0 | Cold outreach wording |
| newsletter_sender | spam | sender_email | `\b(?:sales|marketing|newsletter)@` | 1 | 100.0% | 1.0 | Cold outreach mailbox |

## Recommended Regex Additions For `lib/noise-filter.js` Review

1. `\b(?:no-?reply|noreply|do-?not-?reply)\b` on `sender_email` → automated (97 matches, 100.0% precision)
1. `telesphere` on `sender_email` → automated (50 matches, 100.0% precision)
1. `\[telesphere\]|voicemail attached` on `subject` → automated (50 matches, 100.0% precision)
1. `\b(?:seo|backlinks?|guest post|domain authority|link insertion|organic traffic)\b` on `combined_text` → spam (15 matches, 100.0% precision)
1. `\b(?:lead generation|grow your business|boost your sales|social media promotion|instagram followers)\b` on `combined_text` → spam (7 matches, 100.0% precision)

## Notes

- Precision is measured against the final four-way classification, not against the deterministic first pass alone.
- Patterns are intentionally documented here instead of modifying `lib/noise-filter.js` directly.
- Search results did not include conversation parts, so precision is based on the source message only.
