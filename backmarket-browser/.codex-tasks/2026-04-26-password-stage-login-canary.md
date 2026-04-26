TASK: Run Back Market password-stage login canary for Jarvis. READ-ONLY AUTH ONLY.

Context:
- Ricky explicitly approved checking whether Jarvis can log into Back Market using the stored password and seeing whether Back Market then asks for email login/code.
- Password is stored in env as BM_PORTAL_PASSWORD. Do not print it.
- Existing DataImpulse path already reaches Back Market seller auth and stops at password_required.
- Goal now: enter email + password, then stop at next auth state.

Hard rules:
- AUTH ONLY. READ ONLY.
- Do not enter seller portal workflows beyond confirming login state.
- Do not click Save, edit listings, change inventory/price/publication, send customer messages, touch returns/refunds/warranty, or mutate anything.
- If email code/2FA is requested, STOP and report exact blocker. Do not retrieve mailbox/code unless separately approved.
- If login succeeds into seller portal, capture a safe dashboard/navigation screenshot and stop. Do not open listing details yet.
- Do not print secrets or cookies/tokens.

Use existing scripts if available:
- DataImpulse provider/env: PROXY_SERVER / PROXY_USER / PROXY_PASS
- Email: BM_PORTAL_EMAIL or jarvis@icorrect.co.uk
- Password: BM_PORTAL_PASSWORD
- Portal URL: https://backmarket.co.uk/bo-seller/

Outputs:
- Write report: /home/ricky/builds/backmarket-browser/REPORT-DATAIMPULSE-PASSWORD-STAGE-CANARY-2026-04-26.md
- Include screenshots/checkpoint paths if captured.
- Include Jarvis paste-ready summary:
  - login attempted yes/no
  - password accepted yes/no/unknown
  - next blocker: email_code_required / logged_in / password_rejected / captcha / other
  - whether seller portal dashboard was reached
  - safety confirmation: no portal mutation

After completion, do not run the URL capture or SKU-change agents yet. This task is only to confirm auth state.
