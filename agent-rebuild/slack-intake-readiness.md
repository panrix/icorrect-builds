# Slack Intake Notifications: Spec Verification + Build Readiness

Verification run: 2026-04-06 UTC

Evidence used:
- Live Typeform API
- Live Slack API
- Live Monday GraphQL API
- Live n8n Cloud API
- `https://mc.icorrect.co.uk/api/summarize-updates/health`
- Local docs in `/home/ricky/builds/intake-notifications/`
- `/home/ricky/kb/monday/main-board.md`

## 1. Typeform ID Verification

| Flow | Spec value(s) | Live result | Verdict |
|---|---|---|---|
| Collection | `vslvbFQr` | Form exists: `Collection Form`. Hidden fields: `monday_id,email`. Enabled webhook: `https://icorrect.app.n8n.cloud/webhook/collection-form-webhook`. | Confirmed |
| Drop-Off | `nNUHw0cK` | Form exists: `Drop-Off Form (booked appointment)`. Hidden fields: `monday_id,email`. Enabled webhook: `https://icorrect.app.n8n.cloud/webhook/dropoff-form-webhook`. | Confirmed |
| Walk-In | `LtNyVqVN` in `REBUILD-BRIEF.md`; `Rr3rhcXc` in `00-MASTER-PLAN.md` and `02-walk-in-no-appointment.md` | Both forms exist. `LtNyVqVN` is the live-wired form and has an enabled n8n webhook to `walkin-typeform-trigger/webhook`. `Rr3rhcXc` exists as `iCorrect Walk-In (v2)` but currently has no webhooks. | Spec conflict. `LtNyVqVN` matches current live workflow; `Rr3rhcXc` matches the richer 2026-03-31 field spec but is not wired live. |
| Enquiry | `NOt5ys9r` | Form exists: `Enquiry Form`. No webhooks configured. Still only 2 fields: name + brief description. No email field. No branching. | ID confirmed, build prerequisites not complete |
| Router | `dvbfUytG` | Form exists: `Drop off, collection or enquiry?`. No webhooks configured. | Confirmed |

### Typeform details that matter for build readiness

- Collection and Drop-Off already have the hidden fields the rebuild expects: `monday_id` and `email`.
- Enquiry has not yet been updated to the branched structure described in `04-enquiry.md`.
- The 2026-04-02 scope change is not fully reflected in the 2026-03-31 spec set:
  - `02-walk-in-no-appointment.md` correctly marks pricing as removed.
  - `00-MASTER-PLAN.md` still says pricing is a hard rule.
  - `04-enquiry.md` still requires pricing for Branch B.

## 2. Monday Column ID Verification

Live board checked: `349212843`

| Column ID | Live title | In spec / KB | Verdict |
|---|---|---|---|
| `service` | Service | Spec expects Service | Confirmed |
| `status4` | Status | Spec expects repair status | Confirmed |
| `status` | Client | Spec and KB say client type | Confirmed |
| `dup__of_quote_total` | Paid | Spec expects paid amount | Confirmed |
| `status_14` | Case | Spec expects case/accessories source | ID confirmed, business meaning still needs operator confirmation |
| `color_mkse6rw0` | Problem (Repair) | Spec expects repair problem flag | Confirmed |
| `color_mkse6bhk` | Problem (Client) | Spec expects client problem flag | Confirmed |
| `text_mm087h9p` | Intercom ID | Spec expects Intercom conversation ID | Confirmed |
| `link1` | Ticket | Spec expects Intercom link | Confirmed |
| `text5` | Email | Spec expects email | Confirmed |
| `color_mkzmbya2` | Source | Spec expects source / Shopify detection | Confirmed |
| `text8` | Passcode | Not called out clearly in the spec set, but this is the live passcode column | Confirmed |
| `text368` | Walk-in Notes | Spec refers to Walk-in Notes generically | Confirmed |
| `date4` | Received | Spec refers to Received Date generically | Confirmed |
| `passcode` | Street Name/Number | KB already warns this is not the device passcode column | Confirmed mismatch risk |

### Monday findings

- The live schema matches the key IDs used for enrichment.
- The spec is wrong where it implies `text5` might be email and phone. `text5` is Email only.
- No live column titled `Phone` was found in the board-wide title check. The intake modal cannot be built safely until the real phone column ID is identified.
- The passcode ambiguity is real:
  - `text8` = device passcode
  - `passcode` = Street Name/Number
- `status_14` definitely exists as `Case`, but the collection spec itself questions whether that column truly means "accessories left by customer". The ID is valid; the business meaning is not fully verified.

### Monday group IDs used in the rebuild brief

All group IDs checked in the live board and confirmed:

| Group ID | Live title |
|---|---|
| `new_group34086` | Awaiting Collection |
| `group_mkwkapa6` | Quality Control |
| `new_group70029` | Today's Repairs |
| `new_group77101__1` | New Orders |
| `new_group34198` | Incoming Future |

## 3. Slack Channel ID Verification

Checked with both `SLACK_BOT_TOKEN` and `SLACK_USER_TOKEN`.

| Channel ID | Live name | Archived? | Verdict |
|---|---|---|---|
| `C09G72DRZC7` | `collection-form-responses` | No | Confirmed |
| `C09GW4LNBL7` | `appointment-form-responses` | No | Confirmed |
| `C05KVLV2R6Z` | `walk-in-form-responses` | No | Confirmed |

## 4. n8n Workflow Verification

| Workflow ID | Live name | Active | Trigger type | Verdict |
|---|---|---|---|---|
| `FB83t0dN0PNlEOpd` | Collection Form → Enriched Slack Notification | `true` | Webhook `collection-form-webhook` | Still exists |
| `lTHrOPUnD6naN28p` | Drop-Off Appointment → Enriched Slack Notification | `true` | Webhook `dropoff-form-webhook` | Still exists |
| `kDfU2wWWv207T24J` | Walk-In Typeform → Intercom + Monday | `true` | Typeform trigger on `LtNyVqVN` | Still exists |

Notes:
- The broken n8n estate has not been removed yet. The live flows are still in place.
- Collection and Drop-Off are webhook-driven n8n workflows.
- Walk-In is still driven by the older live Typeform-triggered workflow on `LtNyVqVN`.
- No live webhook is currently attached to `Rr3rhcXc`, so that form is not the active trigger today.

## 5. Existing Code In `builds/intake-notifications/`

Present:
- Markdown specs and notes
- Local JSON workflow exports for collection:
  - `collection-workflow.json`
  - `complete-collection-workflow.json`
  - `minimal-workflow.json`

Missing:
- `package.json`
- `server.js`
- `src/`
- any Node service scaffold

Additional note:
- `REBUILD-BRIEF.md` says the full n8n workflow exports are in `/tmp/n8n-collection-workflow.json` and `/tmp/n8n-dropoff-workflow.json`, but those files were not present during this verification run.
- Reusable code does exist outside this folder in `/home/ricky/builds/llm-summary-endpoint/server.js`.

## 6. Node.js Dependency Readiness

Minimum dependencies for the rebuild service:

| Dependency | Why |
|---|---|
| `express` | webhook endpoints for Typeform and service health |
| `@slack/web-api` | post Slack messages and update them later |
| `openai` | inline LLM summary replacement for the current port-8004 dependency, if absorbed into the new service |

Recommended but not strictly mandatory:

| Dependency | Why |
|---|---|
| `dotenv` | local/dev startup convenience; production can keep using `EnvironmentFile` |
| `zod` | payload validation for Typeform and internal config |
| `pino` | structured logs for webhook failures and Slack/Monday/API errors |

Not required as external packages if the runtime is modern Node:

- Monday client SDK: GraphQL can be done with native `fetch`
- Typeform client SDK: REST calls can be done with native `fetch`
- signature verification helpers: Node `crypto` is enough

Only needed if Slack buttons/modals are implemented in the same service during early phases:

- `@slack/bolt`

## 7. Credential / Service Prerequisites

Present in `/home/ricky/config/api-keys/.env`:
- `MONDAY_APP_TOKEN`
- `OPENAI_API_KEY`
- `SLACK_BOT_TOKEN`
- `SLACK_USER_TOKEN`
- `TYPEFORM_API_TOKEN`
- `N8N_CLOUD_API_TOKEN`

Missing:
- `TYPEFORM_SECRET`

LLM summary endpoint status:
- `https://mc.icorrect.co.uk/api/summarize-updates/health` returned `{"status":"ok","model":"gpt-4o-mini"}` during this run.

Interpretation:
- Missing `TYPEFORM_SECRET` is not a blocker if the brief's rule is followed exactly: implement signature verification only if a secret is available.

## 8. Build Readiness Checklist

### Confirmed

- Collection Typeform ID `vslvbFQr` is correct and live.
- Drop-Off Typeform ID `nNUHw0cK` is correct and live.
- Slack channel IDs for collection, appointment, and walk-in are correct.
- Core Monday enrichment columns used by the current spec are still valid.
- Monday group IDs used for lookups in the rebuild brief are still valid.
- The three referenced n8n workflows still exist and are active.
- Collection and Drop-Off forms already carry the hidden fields `monday_id` and `email`.
- The existing LLM summary endpoint is reachable and healthy.

### Needs checking before implementation is safe

- Decide the walk-in source of truth:
  - `LtNyVqVN` is the live-wired form today.
  - `Rr3rhcXc` is the richer v2 form in the 2026-03-31 spec set.
- Identify the real Monday phone column ID. The spec is not accurate enough to build the intake write-back safely.
- Confirm whether `status_14` should be treated as "accessories to return" or only as a generic case field.
- Reconcile pricing scope across the spec set. The 2026-04-02 scope removal conflicts with parts of the 2026-03-31 documents.

### Missing before Phase 1 can start

- There is no Node service scaffold yet in `builds/intake-notifications/`.
- The enquiry form is not yet updated for email + branching, so Enquiry is not build-ready.

### Not blockers for Phase 1 collection cleanup, but still worth noting

- `TYPEFORM_SECRET` is missing.
- The `/tmp/n8n-collection-workflow.json` and `/tmp/n8n-dropoff-workflow.json` paths referenced in `REBUILD-BRIEF.md` are absent.

## 9. Overall Readiness Call

Phase 1 can start for Collection cleanup and the shared service foundation.

It should not start as a full four-flow build without first resolving three spec mismatches:
- walk-in form ID (`LtNyVqVN` vs `Rr3rhcXc`)
- phone column mapping
- pricing being removed from scope in current direction but still required in parts of the 2026-03-31 spec set

The current live estate is still usable as a reference source because the n8n workflows, Typeform forms, Slack channels, and Monday schema are all reachable and mostly intact.
