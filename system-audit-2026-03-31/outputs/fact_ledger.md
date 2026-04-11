# Fact Ledger

Format: `fact_id | label | statement | source | evidence | notes`

- `F-001 | Observed | Primary credential source is /home/ricky/config/.env | /home/ricky/config/README.md | states all keys are in one master file | config/api-keys/.env is a compatibility path`
- `F-002 | Observed | mission-control-v2 is retained for reference and is not the active runtime | /home/ricky/README.md | directory layout + rules section | treat as historical/reference unless live evidence proves otherwise`
- `F-003 | Observed | Back Market is approximately 60% of revenue and should be treated as the dominant operational and revenue channel | /home/ricky/.openclaw/shared/COMPANY.md | revenue streams table | reinforced by /home/ricky/builds/backmarket/README.md`
- `F-004 | Observed | Monday.com is the operational backbone of the business | /home/ricky/.openclaw/shared/COMPANY.md | tools and systems table | also stated in PROBLEMS.md`
- `F-005 | Observed | There are no fully documented SOPs across the business, and this is considered a critical problem internally | /home/ricky/.openclaw/shared/PROBLEMS.md | section 1 | BM SOPs are a partial exception within their domain`
- `F-006 | Observed | Monday.com's current structure has workflow limitations and is expected to be cleaned before deeper automation builds | /home/ricky/.openclaw/shared/PROBLEMS.md; /home/ricky/builds/monday/target-state.md | Monday limitations section + target-state design principles | implies current-state/target-state gap`
- `F-007 | Observed | BM operations have 12 SOPs mapped to scripts or services, with some steps still manual | /home/ricky/builds/backmarket/README.md | SOP table | SOP 04, 10, 11, 12 show manual/not built components`
- `F-008 | Observed | Live BM-related VPS services are documented on ports 8010-8013 behind mc.icorrect.co.uk | /home/ricky/builds/backmarket/README.md | services table | includes icloud-checker, bm-grade-check, bm-payout, bm-shipping`
- `F-009 | Observed | Main Monday board ID is 349212843 and BM Devices board ID is 3892194968 | /home/ricky/.openclaw/shared/CREDENTIALS.md; /home/ricky/builds/backmarket/README.md | Monday and boards sections | parts board also documented as 985177480`
- `F-010 | Observed | Monday, Intercom, Shopify, Supabase, and n8n Cloud are reachable via safe auth checks performed on 2026-03-31 | command checks executed in shell | auth tests returned success | detailed commands logged in discovery_log.md`
- `F-011 | Observed | Shopify API credentials are documented as read-only and should not be used for writes | /home/ricky/.openclaw/shared/CREDENTIALS.md | Shopify section | important safety constraint`
- `F-012 | Observed | Xero refresh tokens rotate on every call and require careful handling | /home/ricky/.openclaw/shared/CREDENTIALS.md | Xero section | avoid unnecessary auth tests`
- `F-013 | Observed | BM profitability analysis shows NFU and NFC grades are materially more attractive than FC in the current data set | /home/ricky/builds/buyback-monitor/docs/PROFITABILITY-FINDINGS.md | grade performance and strategic implications sections | needs connection to live bid/flow systems`
- `F-014 | Observed | Current BM process includes Slack notifications, Monday updates, serial-triggered checks, and BM API actions | /home/ricky/builds/agent-rebuild/backmarket/BM-PROCESS-CURRENT-STATE.md | stages 1-9 | needs cross-check against live code and workflows`
- `F-015 | Observed | Monday flow traces show distinct walk-in, mail-in, diagnostic, BM, and corporate paths with repeated pause and comms states | /home/ricky/builds/monday/repair-flow-traces.md | traced journeys and anomalies | supports journey mapping`
- `F-016 | Observed | INDEX.md's reference to backmarket/docs/buyback-optimisation-strategy.md is currently broken; only a historical file exists | /home/ricky/builds/INDEX.md + filesystem check | path missing in current docs folder | do not use as primary current evidence`
