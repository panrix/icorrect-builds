# Codex Build Brief: Intake System

**Project:** iCorrect Intake System — Client Form + Team Intake View
**Location:** `/home/ricky/builds/intake-system/`
**Owner:** Ricky (remote, UTC+8)
**Orchestrator:** Claude Code (will QA your output)

---

## What You're Building

A custom intake system that replaces Typeform (client-facing) and n8n→Slack notifications (team-facing) for iCorrect, an Apple repair shop in London.

Two interfaces, one backend:
1. **Client form** — iPad kiosk at reception. Customers fill it in when they arrive. Replaces 4 Typeforms.
2. **Team intake view** — iPad for front-desk staff (Andres). Shows incoming intakes, lets operator verify details and complete intake. Replaces Slack notifications.
3. **Backend API** — Node.js + Express. Connects to Monday.com (operational backbone), Supabase (data layer), Intercom (customer comms), and OpenAI (LLM summaries).

---

## Read These First (in order)

1. **`plan.md`** — The canonical build plan. Everything you need is here: four client flows, all API contracts, persistence model, phase gates, acceptance criteria. This is your source of truth.
2. **`FORM-FLOW.md`** — Definitive flow spec for the client form. Every screen, every field, every branching rule.
3. **`SPEC.md`** — Business context, hard gates, Monday column mappings. Sections 9-10 are superseded by plan.md.
4. **`DESIGN-SPEC.md`** — Brand identity, colours, typography, UX principles.
5. **`QA-PLAN-REVIEW-SIGNOFF.md`** — Final QA signoff. Confirms the plan is ready to execute.

Also useful:
- **`react-form/`** — Existing React prototype. Useful as a code seed but needs major rework (linear step model → branching flow engine). `npm run build` and `npm run lint` both pass.
- **`device-flows/*.md`** — Detailed diagnostic decision trees per device type.
- **`/home/ricky/builds/llm-summary-endpoint/server.js`** — Working LLM summary code to absorb into the backend.
- **`/home/ricky/builds/intake-notifications/REBUILD-BRIEF.md`** — Verified Monday column IDs, lookup queries, name matching logic.

---

## How To Work

### 1. Create your task list first

Before writing any code, read `plan.md` fully and create a task list that maps to the plan's phases and sub-phases. The plan has:

- **Phase 0:** Foundation (0A-0F) — backend scaffold, Supabase schema, shared types, API contracts, auth, tests
- **Phase 1:** Client form walk-in flow (1A-1D) — flow engine rewrite, walk-in UI, design overhaul, data model
- **Pre-Phase-2 checkpoint:** Resolve blockers (Intercom email, phone column, SPEC.md section 4)
- **Phase 2:** Remaining flows + backend integration (2A-2D) — appointment, collection, enquiry, live backend
- **Phase 3:** Team intake view (3A-3D) — queue, detail, operator actions, completion gates
- **Phase 4:** Validation + cutover (4A-4B) — tests, live rehearsal, switch

Break each sub-phase into concrete implementation tasks. Mark them off as you complete them.

### 2. Work through one phase at a time

Do not skip ahead. Each phase has acceptance criteria in the plan — meet them before moving on.

### 3. Use subagents for parallel independent work

When tasks are independent (e.g., backend scaffold and client flow engine are separate codebases), spawn subagents to work in parallel. Good candidates:
- Phase 0: backend scaffold (subagent 1) + client flow engine design (subagent 2) can run in parallel
- Phase 2: appointment flow UI + collection flow UI + enquiry flow UI are independent
- Phase 3: team view components can be built in parallel once the API layer exists

### 4. QA your own output at each phase gate

After completing each phase:
1. Run `npm run build` and `npm run lint` — both must pass
2. Run any tests you've written
3. Check the phase's acceptance criteria from `plan.md` one by one
4. Write a brief QA note documenting what passes and what doesn't
5. Only proceed to the next phase if all criteria pass

### 5. Commit after each phase

Create a git commit after each phase completes and passes QA. Use descriptive commit messages.

---

## Key Technical Decisions (already made)

These are settled. Do not revisit them.

| Decision | Choice |
|----------|--------|
| Backend stack | Node.js + Express + TypeScript |
| Client form | React + TypeScript + Vite + Tailwind + Framer Motion |
| Team view | Same React app, `/team` route |
| Data layer | Supabase (intake sessions) + Monday.com (source of truth) |
| Real-time | Supabase Realtime (team view live updates) |
| Auth (team view) | nginx basic auth |
| Concurrency | Optimistic via `version` column + 409 Conflict |
| Walk-in Monday group | Today's Repairs (`new_group70029`) |
| Enquiry Monday group | New Orders (`new_group77101__1`) |
| Collection lookup | Staff-assisted (no backend lookup in v1) |
| Pilot strategy | Direct cutover (no parallel run with Typeform) |
| Status enum | `submitted → in_progress → completed \| declined \| cancelled` |
| Domain | `intake.icorrect.co.uk` |
| Business timezone | `Europe/London` (not UTC) |

---

## Critical Implementation Notes

### Flow engine (Phase 1A)
The existing prototype uses a fixed `STEPS` array with linear `next/back`. This **must** be replaced with a flow-aware routing system. See `plan.md` Phase 1A for the design. Steps are keyed by ID, each flow defines its step sequence, conditional steps are handled in the flow definition.

### Persistence model (Phase 0C)
`intake_sessions` is the canonical record. `form_data` JSONB is the authoritative snapshot of all form answers. There is no `intake_responses` table — it was explicitly dropped. See `plan.md` section 0C for the full schema including status enum, version column, and idempotency key.

### API contracts (Phase 0E)
Every endpoint is fully defined in `plan.md` section 0E with request body, response body, error cases, status codes, and transition rules. Do not deviate from these contracts. There are 8 endpoints total.

### Monday integration
All column IDs and group IDs are verified live (see `plan.md` Verified References section). Use the Monday GraphQL API with native `fetch` — no SDK needed. Reuse the lookup query patterns from `/home/ricky/builds/intake-notifications/REBUILD-BRIEF.md`.

### LLM summary
Absorb the working code from `/home/ricky/builds/llm-summary-endpoint/server.js`. Key functions: `stripHtml`, `shouldSkip`, `formatUpdates`, `buildPrompt`, `callOpenAI`. Increase timeout from 5s to 15s.

### Credentials
All API keys are in `/home/ricky/config/api-keys/.env`. The backend service will use `EnvironmentFile` in its systemd unit to load these. For local dev, use `dotenv`.

### Monday group lifecycle
- Walk-in (Flow B): item created in Today's Repairs. Complete only updates `status4`.
- Appointment (Flow A): item already in Incoming Future. Complete moves to Today's Repairs + updates `status4`.
- Collection (Flow C): no Monday mutation on complete (staff handles).
- Enquiry (Flow D): item created in New Orders. No complete action.

### Design
The form must look premium — Apple Store quality. See `DESIGN-SPEC.md` for brand colours, typography, and UX principles. The current prototype is functional but generic. The redesign should make it feel like a natural extension of an Apple repair experience.

---

## File Structure Target

```
builds/intake-system/
├── plan.md                     ← canonical build plan (read-only)
├── FORM-FLOW.md                ← flow spec (read-only)
├── SPEC.md                     ← business spec (read-only)
├── DESIGN-SPEC.md              ← brand spec (read-only)
├── QA-PLAN-REVIEW-SIGNOFF.md   ← plan signoff (read-only)
├── package.json                ← monorepo root (workspaces)
├── shared/
│   └── types.ts                ← shared types (IntakeFormData, MondayItem, API contracts)
├── frontend/                   ← React app (client form + team view)
│   ├── package.json
│   ├── vite.config.ts
│   ├── src/
│   │   ├── App.tsx
│   │   ├── flows/              ← flow definitions and step registry
│   │   ├── steps/              ← step components (shared + flow-specific)
│   │   ├── components/         ← reusable UI components (cards, buttons, inputs)
│   │   ├── team/               ← team view components (queue, detail, actions)
│   │   ├── hooks/              ← useFlow, useSupabaseRealtime, etc.
│   │   ├── lib/                ← API client, pricing lookup
│   │   └── assets/             ← device icons, logo
│   └── tests/                  ← Playwright tests
├── backend/
│   ├── package.json
│   ├── src/
│   │   ├── server.ts           ← Express entry point
│   │   ├── routes/             ← route handlers per endpoint
│   │   ├── adapters/           ← MondayAdapter, IntercomAdapter, LLMSummaryAdapter
│   │   ├── services/           ← intake service (business logic)
│   │   └── middleware/         ← error handling, logging
│   └── tests/                  ← Vitest tests
├── react-form/                 ← old prototype (reference only, do not modify)
├── device-flows/               ← diagnostic decision trees (reference)
├── flows/                      ← operator flow docs (reference)
└── pricing-data.json           ← static pricing JSON (copy from react-form/)
```

Note: the existing `react-form/` directory is the old prototype. Build the new frontend in `frontend/` as a clean start, referencing the old code for patterns but not inheriting its linear step model. Keep `react-form/` intact as reference.

---

## What NOT To Do

- Do not modify `plan.md`, `FORM-FLOW.md`, `SPEC.md`, or `DESIGN-SPEC.md` — these are locked specs
- Do not use FastAPI or Python — backend is Node.js + Express + TypeScript
- Do not build a separate `intake_responses` table — form data lives in `form_data` JSONB
- Do not build collection lookup — it's staff-assisted in v1
- Do not build photo capture, voice notes, diagnostic branching, or BM trade-in flow — out of scope
- Do not use `allow_origins=["*"]` in production CORS
- Do not hardcode credentials — use environment variables
- Do not use any Monday.com SDK — use native `fetch` with GraphQL
- Do not deviate from the API contracts in `plan.md` section 0E
- Do not skip phase gates — each phase must pass its acceptance criteria before the next begins

---

## When You're Done

After completing all phases, produce a final build report:
1. What was built (list of deliverables)
2. What passes (test results, lint, build)
3. What was simplified vs the plan
4. What needs manual verification (nginx config, DNS, Supabase migration, systemd setup)
5. Any compromises or known issues

This report will be reviewed by Claude Code (the orchestrator) before deployment.
