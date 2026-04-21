# Recommended Intercom Workflow

## Objective

Reduce manual review for the 635 automated and 183 spam threads found in this audit while preserving human review for real and unclear conversations.

## Blueprint

1. Create a first Intercom triage rule named `Spam Audit - Deterministic Noise`.
2. Match high-precision automated patterns first and tag them `automated` without assigning to a human inbox.
3. Match high-precision spam patterns second and tag them `spam`, then route them to a low-priority review queue or auto-close rule.
4. Leave all unmatched conversations in the main queue for agent or Fin review.
5. Add a saved view named `Audit - Unclear` filtered to `tag is unclear-review` or equivalent so short/ambiguous threads are reviewed separately.
6. Review false positives weekly, update the regex list in the audit markdown, and only then promote patterns into `lib/noise-filter.js` after human approval.

## Suggested UI Sequence

1. Inbox rule evaluates sender email, subject, tags, and body text on conversation create.
2. If an automated rule matches, tag `automated`, add note `matched deterministic noise rule`, and remove from agent queue.
3. Else if a spam rule matches, tag `spam`, add note `matched deterministic spam rule`, and route to a hidden review inbox or auto-close after a short delay.
4. Else if body is empty, apply `unclear-review` and route to a saved view for manual inspection.
5. Else keep in the standard support workflow.

## Candidate Rule Groups

- Automated: `^mailer@shopify\.com$` on `sender_email`, `\b(?:no-?reply|noreply|do-?not-?reply)\b` on `sender_email`, `telesphere` on `sender_email`, `\[telesphere\]|voicemail attached` on `subject`, `\b(?:no-?reply|noreply)@(?:.+\.)?backmarket\.com\b` on `sender_email`
- Spam: `\b(?:seo|backlinks?|guest post|domain authority|link insertion|organic traffic)\b` on `combined_text`, `\b(?:lead generation|grow your business|boost your sales|social media promotion|instagram followers)\b` on `combined_text`, `\b(?:partnership opportunity|would love to connect|are you the right person|on behalf of my client|reseller opportunity)\b` on `combined_text`, `\b(?:sales|marketing|newsletter)@` on `sender_email`

## Guardrails

- Keep deterministic rules scoped to very high precision patterns only; anything below roughly 95% precision should stay review-only.
- Do not auto-close conversations that mention active repairs, quotes, warranty, payments, or collection/delivery issues even if they look templated.
- Re-audit monthly because vendor senders and spam wording drift over time.

## Human Review Loop

1. Agent reviews the `Audit - Unclear` queue once or twice per day.
2. If the thread is legitimate, retag as `real` and move it into the normal support queue.
3. If the thread is a new spam variant, document the regex candidate in `spam-patterns.md` with an observed precision estimate before promoting it.
