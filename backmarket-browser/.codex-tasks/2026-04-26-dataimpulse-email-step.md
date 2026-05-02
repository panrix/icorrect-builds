TASK: Run the next read-only DataImpulse Back Market login canary step: enter seller email and stop at next auth blocker.

Context:
- Ricky approved proceeding with browser automation next step.
- DataImpulse is confirmed as the residential proxy provider.
- Use URL exactly: https://backmarket.co.uk/bo-seller/
- Expected first login step asks for email address: jarvis@icorrect.co.uk
- Existing report/script:
  - /home/ricky/builds/backmarket-browser/REPORT-DATAIMPULSE-PROXY-BROWSER-PATH-2026-04-26.md
  - /home/ricky/builds/backmarket-browser/scripts/run-dataimpulse-portal-canary.js
  - /home/ricky/builds/backmarket-browser/lib/dataimpulse-proxy-canary.js
- Current env has PROXY_SERVER/PROXY_USER/PROXY_PASS and BM_PORTAL_EMAIL, but BM_PORTAL_PASSWORD is absent.

Goal:
- Extend or run the DataImpulse canary to navigate to https://backmarket.co.uk/bo-seller/, enter email jarvis@icorrect.co.uk if the email form appears, submit/continue only that email step, then stop at the next auth blocker.

Hard safety requirements:
- Read-only/auth-flow only. No seller portal mutation.
- Do NOT enter a password unless BM_PORTAL_PASSWORD exists and the task explicitly confirms it is safe to use. If absent, stop at password prompt.
- Do NOT attempt customer replies, listing edits, Save clicks, returns/refunds/warranty actions, or any portal mutation.
- Do NOT print proxy credentials, password, cookies, auth tokens, or email-code values.
- If an email verification code is requested, stop and report the code handoff needed. Do not scrape mailbox unless separately approved.
- Use dedicated profile/output dirs under /home/ricky/builds/backmarket-browser/data/.

Output:
- Update/add a report under /home/ricky/builds/backmarket-browser/REPORT-DATAIMPULSE-EMAIL-STEP-CANARY-2026-04-26.md
- Include: requested URL, final redacted URL, page title, state after email submission, screenshot/checkpoint paths, exact blocker, next handoff.
- Add/update script/tests if useful. Run tests if changed.
- Commit intentional code/docs changes in /home/ricky/builds/backmarket-browser only if safe and scoped.

When completely finished, run:
openclaw system event --text "Done: Codex ran DataImpulse BM email-step browser canary" --mode now
