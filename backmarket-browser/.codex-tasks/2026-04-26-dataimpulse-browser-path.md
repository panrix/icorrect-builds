TASK: Investigate and prepare residential-proxy-backed Back Market browser path using current proxy supply.

Context:
- Ricky approved direction: “Let’s go with a residential/proxy backed browser path. Can you find our current supply for this?”
- Current supply found by Jarvis: DataImpulse. Env host is `PROXY_SERVER=gw.dataimpulse.com` in `/home/ricky/config/api-keys/.env`; credentials are `PROXY_USER` and `PROXY_PASS`.
- Existing spec-checker uses this proxy in `/home/ricky/builds/icloud-checker/src/apple-specs.js` via Playwright `browser.newContext({ proxy: PROXY })`.
- Previous Back Market seller portal VPS path failed pre-login with Back Market accounts/Cloudflare. Reports:
  - /home/ricky/builds/backmarket-browser/REPORT-READONLY-PORTAL-CANARY-2026-04-26-034401.md
  - /home/ricky/builds/backmarket-browser/REPORT-SKU-PORTAL-HARNESS-PATH-2026-04-26.md

Goal:
- Produce a safe, read-only residential-proxy browser canary plan/script for Back Market seller portal.
- Prefer browser-harness if practical; otherwise use Playwright with the same DataImpulse proxy pattern.
- Do not perform live BM portal mutations.

Hard safety requirements:
- Do not print proxy username/password or any credentials.
- Do not send customer messages, save listings, edit SKU, refund, accept/reject returns, or mutate portal state.
- If you run a canary, it must be read-only: open login/portal, capture access state, screenshot, title/url, and blocker if any.
- If login/email code is required and unavailable, stop and report the exact handoff needed.
- Use a dedicated browser profile/output directory under /home/ricky/builds/backmarket-browser/data/; do not pollute random user browser profiles.

Tasks:
1. Confirm current proxy supply from env and docs without exposing secrets.
2. Inspect existing backmarket-browser harness code/reports.
3. Add or draft a repeatable read-only DataImpulse proxy canary script if missing.
4. Optionally run the canary only up to a non-mutating access check.
5. Write next-step recommendation for making this durable.

Output:
- Write report: /home/ricky/builds/backmarket-browser/REPORT-DATAIMPULSE-PROXY-BROWSER-PATH-2026-04-26.md
- If code/script is added, include path and usage.
- Include top “Summary for Ricky”: provider, env keys, whether canary ran, result/blocker, recommended next step.

When completely finished, run:
openclaw system event --text "Done: Codex investigated DataImpulse residential-proxy Back Market browser path" --mode now
