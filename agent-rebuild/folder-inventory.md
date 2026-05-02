# ~/builds/ Folder Inventory

Generated: 2026-05-01
Source: Phase 6.9a scans (9 batches, 50 folders)

## Summary
- Total folders: 50
- By state: active 28, dormant 21, dead 1, unclear 0
- By canonical_status: canonical 17, draft 20, scratch 4, snapshot-of-other 9
- By suspected_owner_agent: operations 17, none 8*, backmarket 7, alex-cs 5, parts 4, team 3, arlo-website 3, main 1, diagnostics 1, marketing 1
* `none` includes fleet-meta folders; `qa-system` and `data-architecture` are borderline and explicitly flagged below for 6.9c review.

## Folders

| folder | size | state | suspected_owner | ownership_confidence | canonical_status | last_modified | purpose (1-line) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| agent-rebuild | 90M | active | none | high | draft | 2026-05-01T05:20:07+00:00 | Active rebuild workspace for the OpenClaw cleanup and KB/documentation program. It holds phase specs, audits,... |
| alex-triage-classifier-rebuild | 16K | dormant | alex-cs | high | draft | 2026-04-10 10:47:57+00:00 | Refactor brief for Alex's Intercom triage classifier. It specifies new conversation categories, pricing extraction... |
| alex-triage-rebuild | 20M | active | alex-cs | high | canonical | 2026-05-01 05:00:38+00:00 | Node-based Intercom triage and drafting workflow for Alex. It pulls conversations, enriches them with Monday and... |
| apple-ssr | 20M | active | parts | high | draft | 2026-04-29T14:35:45+00:00 | Research and build artifacts for automating Apple Self Service Repair parts lookup, order-history analysis, and... |
| backmarket | 47M | active | backmarket | high | canonical | 2026-04-30T06:31:16 | Primary Back Market operations workspace for SOPs, listing and queue automation, webhook services, operational data,... |
| backmarket-browser | 1.3G | active | backmarket | high | draft | 2026-05-01T05:21:29 | Controlled browser-ops runtime for Back Market seller-portal work that the existing API path does not cover safely,... |
| backmarket-seller-support | 4.5M | active | backmarket | high | snapshot-of-other | 2026-04-30T04:14:51 | Read-only extracted snapshot of the Back Market Seller Support Center knowledge base, including discovery notes,... |
| bm-scripts | 24K | dormant | backmarket | low | snapshot-of-other | 2026-03-27T19:01:32 | Tiny leftover folder containing a single Back Market reconciliation output JSON. It does not currently look like a... |
| buyback-monitor | 61M | active | backmarket | high | canonical | 2026-05-01T05:20:17 | Live buyback monitoring and price-management workspace for Back Market buyback listings, including sell-price... |
| claude-project-export | 1.1M | dormant | operations | medium | snapshot-of-other | 2026-04-13T14:52:58+00:00 | Exported Claude project corpus covering SOPs, business context, KB schema rules, and customer-service reference... |
| customer-service | 60M | active | alex-cs | high | snapshot-of-other | 2026-04-30 20:45:22+00:00 | Read-only customer-service audit workspace with generated Intercom and Monday reports, module logs, and archived task... |
| data | 332K | dormant | backmarket | medium | scratch | 2026-03-23 15:02:53+00:00 | Small ad hoc data drop holding a buyback profitability lookup and a manual buy-box check report for device listings.... |
| data-architecture | 40K | dormant | none | high | snapshot-of-other | 2026-02-22 05:46:49+00:00 | Parked architecture brief for a multi-layer business data model and agent access pattern centered on Supabase. It is a... |
| documentation | 104K | dormant | none | high | draft | 2026-04-13T14:53:08+00:00 | Small documentation-build staging area with a progress tracker and raw imported domain docs. It appears to support... |
| elek-board-viewer | 4.5G | active | diagnostics | high | canonical | 2026-04-23T05:00:19 | Large diagnostics workspace for Apple Silicon MacBook logic-board repair, combining headless FlexBV board-view... |
| hiring | 28K | dormant | team | high | draft | 2026-03-09T05:01:56+00:00 | Staged hiring collateral for a Technical Operations Coordinator role. The only file is a long-form job description... |
| icloud-checker | 676K | active | backmarket | high | canonical | 2026-05-01T05:06:28 | Live Express webhook service for Back Market trade-in intake that checks iCloud lock and Apple specs from a serial,... |
| icorrect-parts-service | 27M | active | parts | high | canonical | 2026-05-01 02:34:56+00:00 | Node/Express service that reacts to Monday.com board changes to deduct parts, post stock-check updates, and trigger... |
| icorrect-shopify-theme | 17M | active | arlo-website | high | canonical | 2026-04-24 01:28:15+00:00 | Primary Shopify theme repo for icorrect.co.uk, including live theme code, analytics instrumentation, conversion/SEO... |
| intake-notifications | 112K | dormant | operations | medium | draft | 2026-04-08T02:05:20 | Planning/spec workspace for replacing n8n-hosted Typeform-to-Slack intake notifications with a self-hosted Node... |
| intake-system | 3M | active | operations | high | canonical | 2026-04-23T05:00:19 | Primary rebuild of iCorrect's intake stack: a client-facing intake form, an iPad-first team CRM/intake view, and a... |
| intercom-agent | 12K | dormant | alex-cs | high | draft | 2026-02-22 05:51:18+00:00 | Consolidated spec for a future Intercom backend agent service. It describes routing, escalation, audit logging, data... |
| intercom-config | 68K | active | alex-cs | high | draft | 2026-04-29 12:00:07+00:00 | Research and strategy folder for Intercom private API deployment and inbox-view configuration. It combines endpoint... |
| inventory-system | 8.0K | dormant | parts | high | draft | 2026-02-22 05:51:34+00:00 | Single-file product spec for a reservation-first inventory operating model covering stock commitment, refurbishment,... |
| llm-summary-endpoint | 12M | active | operations | medium | canonical | 2026-04-14T05:18:00+00:00 | Minimal Node/Express service that accepts Monday.com repair updates, sends them to OpenRouter/Claude for... |
| marketing-intelligence | 88K | active | marketing | high | snapshot-of-other | 2026-04-30T05:58:51+00:00 | Stub and snapshot docs for iCorrect's self-hosted marketing intelligence platform. The local folder does not contain... |
| mobilesentrix | 24K | active | parts | high | draft | 2026-04-28 06:18:23+00:00 | Read-only discovery pack for automating Mobilesentrix UK ordering against a private Magento 1.x stack. It captures the... |
| monday | 11M | active | operations | high | canonical | 2026-04-27 14:48:40+00:00 | Primary workspace for Monday.com board rebuild assets, automation audits, schema docs, and integration scripts around... |
| mutagen-guide | 68K | active | none | high | canonical | 2026-04-28T12:38:03+00:00 | Standalone setup guide for mirroring a VPS to a local Mac with Mutagen over SSH. The folder contains an HTML source... |
| operations-system | 73M | active | operations | high | draft | 2026-04-29 13:30:26+00:00 | Working project for rebuilding iCorrect's operating system from current-state truth capture through target-state... |
| pricing-sync | 5.3M | dormant | operations | high | draft | 2026-03-16T14:26:00 | Cross-system pricing audit and sync project intended to use Shopify as source of truth and reconcile/update Monday and... |
| qa-system | 48K | dormant | none | high | snapshot-of-other | 2026-02-22 05:46:31+00:00 | Parked QA-system registry containing a reviewed plan for git-triggered QA agents and a shared build/QA logging... |
| quote-wizard | 216K | dormant | arlo-website | medium | draft | 2026-03-18 15:18:05+00:00 | Node script plus generated JSON for rebuilding Shopify quote-wizard navigation menus from collection data. It groups... |
| repair-analysis | 41K | dormant | operations | medium | scratch | 2026-03-16T01:36:48 | Two standalone Python analysis scripts for repair profitability and device-by-repair breakdowns. They look like... |
| research | 24K | dormant | none | high | draft | 2026-02-24T08:20:32+00:00 | Meta research folder for OpenClaw memory architecture and VPS/runtime audits. The contents are exploratory decision... |
| royal-mail-automation | 227K | active | operations | high | canonical | 2026-04-28T15:16:52 | Playwright-based Royal Mail label-buying automation with dispatchers for both Back Market orders and iCorrect mail-in... |
| scripts | 52K | dormant | operations | low | scratch | 2026-03-28T07:13:56+00:00 | Small utility bundle for ad hoc Back Market, Monday, and document-conversion tasks. The folder contains one... |
| server-config | 124K | active | none | high | snapshot-of-other | 2026-03-24T02:06:52+00:00 | Snapshot of VPS runtime configuration and service inventory. It captures nginx configs, systemd user units, cron,... |
| shift-bot | 175M | active | team | high | draft | 2026-04-29T13:40:47+00:00 | Node/Slack Socket Mode bot for collecting technician shifts, syncing them to a shared Google Calendar, and posting the... |
| system-audit-2026-03-31 | 6.8M | dormant | operations | medium | snapshot-of-other | 2026-04-06 14:57:16+00:00 | Frozen, evidence-backed audit pack covering operations, finance, marketing, parts, customer service, systems, team... |
| team-audits | 25M | active | team | high | canonical | 2026-04-23 09:26:13+00:00 | Active audit project for mapping each team member's work, bottlenecks, and revenue impact from verifiable system data.... |
| telephone-inbound | 76K | active | operations | medium | canonical | 2026-04-30T10:06:56+00:00 | Flask-based Slack intake server for phone calls. It opens a modal, posts call notes to `#phone-enquiries`, and can... |
| templates | 12K | dormant | none | high | canonical | 2026-02-22T05:46:19+00:00 | Template library for lightweight project scaffolding docs. It provides markdown skeletons for specs and parked/stub... |
| voice-note-pipeline | 22M | active | operations | high | canonical | 2026-05-01T05:21:37+00:00 | Python worker that watches intake-related Slack threads for audio replies, transcribes them with Whisper, and posts... |
| voice-notes | 36K | dead | main | medium | draft | 2026-02-22T05:46:55+00:00 | Stub research folder for a voice-note capture/transcription concept. It mainly preserves Otter transcript snapshots... |
| webhook-migration | 400K | dormant | operations | low | canonical | 2026-04-08T05:57:37+00:00 | Documentation workspace for two webhook migration tracks: Monday status notifications moved to a VPS service, and a... (Monday-status slice shipped; Shopify/Intercom slice unbuilt) |
| website-conversion | 12K | dormant | arlo-website | high | draft | 2026-02-22T05:57:48+00:00 | Single-spec folder for Shopify website conversion improvements on collection and product pages, with emphasis on... |
| whisper-api | 8.0K | dormant | operations | low | scratch | 2026-03-10T02:01:05+00:00 | Single bash helper that sends a local audio file to OpenAI transcription and writes a sidecar `.txt` transcript next... |
| xero-invoice-automation | 520K | active | operations | medium | draft | 2026-03-04 06:06:00+00:00 | Builder and runbook for the Monday.com to Xero draft-invoice workflow hosted in n8n Cloud. The folder contains the... |
| xero-invoice-notifications | 52K | active | operations | medium | draft | 2026-04-24 12:17:33+00:00 | Shell-based polling job for paid Xero invoices that is meant to update Monday.com and post Slack notifications on a... |

## Borderline none-tagged folders (flagged for 6.9c review)

- qa-system: suggested `operations` (after rebuild) - currently parked stub; `CLAUDE.md` flags Codex-first rebuild planned.
- data-architecture: suggested `operations` or `main` - fleet-wide Supabase schema design (operational data plane), not BM-scoped.

## Notes from scan

- `server-config`: plaintext secrets are present in `pm2-dump-formatted.json` and `pm2-dump.json`; treat the folder as sensitive config state, not a safe snapshot.
- `icloud-checker`, `icorrect-parts-service`, `team-audits`, and `marketing-intelligence` each surfaced plaintext credential or basic-auth material in local docs/env files.
- `telephone-inbound` and `voice-note-pipeline` logs contain plaintext customer names, call details, or transcript snippets; both folders carry live PII risk.
- `backmarket-browser` is 1.3G and dominated by session-bearing Chromium/CDP profile data; the newest files live inside local browser profiles.
- `elek-board-viewer` is 4.5G and heavily data-dominated; scan sampling was necessary, and several lost scripts were only inferable from surviving outputs.
- `xero-invoice-automation` and `icorrect-parts-service` both show path drift between repo configs and live runtime/service locations.
