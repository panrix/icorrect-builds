TASK: Run approved headful Back Market auth handoff. AUTH ONLY / READ ONLY.

Approval from Ricky: APPROVE, in response to the proposed approval wording:
"Approve headful Back Market auth handoff. Agent may launch an operator-visible DataImpulse browser, I may solve Cloudflare if it appears, and agent may use approved mailbox-code retrieval for the Back Market login code. Stop at dashboard. No listing edits, no Save, no portal mutations."

Context:
- Password works: prior canary accepted BM_PORTAL_PASSWORD and reached /2fa/email.
- Mailbox-code runner was later blocked before /2fa/email by Cloudflare human verification on accounts.backmarket.co.uk.
- Need headful/operator-visible browser path so Cloudflare can be solved manually if it appears, then continue auth and stop at dashboard.

Hard scope:
- AUTH ONLY / READ ONLY.
- Launch operator-visible/headful Chromium through DataImpulse with the dedicated portal profile.
- Navigate to https://backmarket.co.uk/bo-seller/
- If Cloudflare appears and cannot be safely/operator-solved by the visible browser, pause and report handoff instructions. Do not bypass programmatically.
- Enter stored BM_PORTAL_EMAIL / BM_PORTAL_PASSWORD only after auth pages are visible.
- If /2fa/email appears, use approved mailbox-code retrieval path to fetch only latest Back Market code for jarvis@icorrect.co.uk, enter it, then stop.
- Stop when dashboard/listings landing is reached.
- Do not open listing details.
- No Save, no listing edits, no inventory/price/publication changes, no customer messages, no returns/refunds/warranty actions.
- Do not print password, code, cookies, tokens, or sensitive auth URLs.

Output:
- Write report: /home/ricky/builds/backmarket-browser/REPORT-HEADFUL-CLOUDFLARE-AUTH-HANDOFF-2026-04-26.md
- Include screenshot/checkpoint paths, final state, whether Cloudflare appeared, whether operator action is needed, whether dashboard reached, and safety confirmation.

If blocked waiting for human Cloudflare action:
- Keep browser/session alive if safe and report exact instructions for Jarvis/Ricky.
- Do not spin/retry aggressively.
