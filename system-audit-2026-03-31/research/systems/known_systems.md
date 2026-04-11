# Known Systems

| System | Why It Is Believed To Exist | Evidence | Live Access Verified | Status |
|---|---|---|---|---|
| Monday.com | operational backbone, board IDs documented, integration scripts present | COMPANY.md, CREDENTIALS.md, backmarket/README.md | Yes | Active |
| Back Market | dominant revenue engine, SOPs and scripts mapped, BM API creds present | COMPANY.md, backmarket/README.md, BM-PROCESS-CURRENT-STATE.md | Yes | Active |
| Intercom | customer service platform with token and wrapper code | COMPANY.md, CREDENTIALS.md, local integration docs/code | Yes | Active |
| Shopify | ecommerce / website platform with read-only token and store documented | COMPANY.md, CREDENTIALS.md | Yes | Active |
| Supabase | shadow data / automation / webhook infrastructure | PROBLEMS.md, CREDENTIALS.md, local code | Yes | Active |
| n8n Cloud | automation platform with cloud token and local workflow docs | CREDENTIALS.md, integration docs | Yes | Active |
| Slack | internal team communication and automation notifications | COMPANY.md, CREDENTIALS.md, BM process docs | Yes | Active |
| Xero | live finance ledger and invoicing system with rotating refresh token, current reports, and active Monday-triggered invoice workflow | CREDENTIALS.md, xero-invoice-automation docs, active n8n workflow evidence, live Xero API exports | Yes | Active |
| PostHog | product/website analytics platform | CREDENTIALS.md, Shopify theme code | Yes | Active |
| Google APIs | Analytics, Search Console, Drive, Calendar, Sheets access documented | CREDENTIALS.md, live token exchange probes | Partial | Active, but env/scope drift present |
| Typeform | form platform with API token and Monday-linked form flows | config env, CREDENTIALS.md, monday docs, n8n workflows, live `/forms` probe | Partial | Active, but canonical env token appears stale |
| Cloudflare | DNS/security / legacy worker platform with API token | config env + CREDENTIALS.md + status-notification cutover docs | Failed: tested endpoint returned 401 | Decommissioning legacy/frontend dependency |
| Stripe | payment platform with live key present and successful invoice-style payment intents | config env + CREDENTIALS.md + live Stripe probes | Yes | Active |
| SumUp | payment platform with API key present | config env + CREDENTIALS.md + live `/v0.1/me` probe | Partial | Likely active, but canonical env key appears stale |
| Telegram | operational alerting and bot workflows | config env + local code/docs | Yes | Active |
| JARVIS email / IMAP / SMTP | operational inbox used for portal codes and messaging | config env + BM process docs + live IMAP/SMTP probes | Partial | Active, but configured SMTP port appears stale |
| SICKW | device info / iCloud check service | config env + BM process docs | Yes | Active |
| Royal Mail API | credentials present but onboarding/API subscription appears parked | config env + BM-PROCESS-CURRENT-STATE.md + failed OAuth probe | Partial | API parked; browser automation active |
| n8n Self-Hosted | self-hosted n8n instance at `n8n.icorrect.co.uk` | CREDENTIALS.md, LEARNINGS.md, live API check | Yes | Reachable but likely low-activity |
| mission-control-v2 | legacy repo containing useful integration docs and code | /home/ricky/README.md | N/A | Reference only |
| paperclip | local app with local env, no primary business creds | local .env inspection | N/A | Reference / unrelated |
