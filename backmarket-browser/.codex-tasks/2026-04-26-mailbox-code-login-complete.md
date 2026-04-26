TASK: Complete Back Market login using mailbox-code retrieval. AUTH ONLY / READ ONLY.

Approval from Ricky:
"Approve mailbox-code retrieval for Backmarket login only."

Context:
- Password-stage canary succeeded: BM_PORTAL_PASSWORD was accepted.
- Current blocker: Back Market requested email verification code at /2fa/email.
- Need to retrieve the current code for jarvis@icorrect.co.uk using approved mailbox settings, enter it into the active login flow, and stop at dashboard.

Hard scope:
- AUTH ONLY.
- Read only mailbox access: retrieve only the latest relevant Back Market verification/login code email for jarvis@icorrect.co.uk.
- Do not inspect unrelated emails beyond what is needed to find the latest Back Market code.
- Do not print code, password, mailbox credentials, cookies, or tokens in logs/report.
- Browser: enter code only, then stop at dashboard/listings landing confirmation.
- No listing detail opens, no Save clicks, no edits, no inventory/price/publication changes, no customer messages, no returns/refunds/warranty actions.

Implementation guidance:
- Use existing DataImpulse portal canary scripts/profile if possible.
- Re-run login if needed: portal URL -> email -> password -> email code.
- Find code via available IMAP/SMTP/mailbox env/settings in local config. Use read-only IMAP if available; SMTP is send-only, so do not misuse it.
- If mailbox access is unavailable or code not found, stop and report blocker.
- If code expired, trigger a fresh code only through the login flow if already required; do not spam repeated sends.

Output:
- Write report: /home/ricky/builds/backmarket-browser/REPORT-DATAIMPULSE-MAILBOX-CODE-LOGIN-2026-04-26.md
- Include:
  - mailbox retrieval attempted yes/no
  - code found yes/no, without printing code
  - code entered yes/no
  - dashboard reached yes/no
  - blocker if any
  - screenshot/checkpoint paths
  - safety confirmation: no portal mutation

After completion:
- Do not start URL capture or SKU-change agents yet. Jarvis will decide next phase.
