# Backend Notes

## Environment Contract

Create `backend/.env` for local development or use `/home/ricky/config/api-keys/.env` via `EnvironmentFile` in systemd for deployed runs.

Required variables:

- `PORT`: backend listen port
- `NODE_ENV`: runtime environment
- `MONDAY_APP_TOKEN`: Monday GraphQL API token
- `INTERCOM_ACCESS_TOKEN`: Intercom API token
- `OPENAI_API_KEY`: OpenAI API token for LLM summaries
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service-role key

## Current Phase 0 State

- Express + TypeScript scaffold is in place.
- All plan-defined routes exist with mocked adapters and in-memory persistence.
- Health endpoint is covered by a real Vitest + Supertest test.
- Live Monday, Intercom, Supabase, and OpenAI integrations are not wired yet.

## Team Auth Requirement

The `/team` route is protected at nginx, not in the Node app. Use basic auth for `/team` only.

See [`deploy/nginx/intake-system.conf`](../deploy/nginx/intake-system.conf) for the deployment template.
