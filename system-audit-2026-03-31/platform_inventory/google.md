# Google APIs

## Access

- `Observed`: Google access is partially live and split across multiple refresh tokens.
- `config/.env`:
  - `JARVIS_GOOGLE_REFRESH_TOKEN` refresh succeeds
  - `EDGE_GOOGLE_REFRESH_TOKEN` is missing
- `config/api-keys/.env`:
  - both `JARVIS_GOOGLE_REFRESH_TOKEN` and `EDGE_GOOGLE_REFRESH_TOKEN` are present
  - Edge refresh succeeds from this file

Evidence exports:
- `/home/ricky/data/exports/system-audit-2026-03-31/google/jarvis-tokeninfo.json`
- `/home/ricky/data/exports/system-audit-2026-03-31/google/jarvis-searchconsole-sites.json`
- `/home/ricky/data/exports/system-audit-2026-03-31/google/jarvis-calendar-list.json`
- `/home/ricky/data/exports/system-audit-2026-03-31/google/jarvis-drive-files.json`
- `/home/ricky/data/exports/system-audit-2026-03-31/google/jarvis-ga-account-summaries.json`
- `/home/ricky/data/exports/system-audit-2026-03-31/google/edge-refresh-from-api-keys.json`
- `/home/ricky/data/exports/system-audit-2026-03-31/google/edge-tokeninfo-from-api-keys.json`
- `/home/ricky/data/exports/system-audit-2026-03-31/google/edge-searchconsole-sites-from-api-keys.json`
- `/home/ricky/data/exports/system-audit-2026-03-31/google/edge-drive-files-from-api-keys.json`
- `/home/ricky/data/exports/system-audit-2026-03-31/google/edge-ga-account-summaries.json`

## Jarvis Token From `config/.env`

- `Observed`: token refresh succeeds.
- `Observed`: token scopes are:
  - `analytics.readonly`
  - `calendar`
  - `gmail.readonly`
  - `webmasters.readonly`
  - `youtube.readonly`
- `Observed`: Search Console returns `1` site entry:
  - `sc-domain:icorrect.co.uk` with `siteFullUser`
- `Observed`: Calendar returns `1` calendar list item.
- `Observed`: Google Analytics Admin returns account summary:
  - account `227019412`
  - display name `iCorrect`
  - property `312689874`
  - property display name `www.icorrect.co.uk`
- `Observed`: Drive list fails with `403 insufficientPermissions`.

## Edge Token From `config/api-keys/.env`

- `Observed`: token refresh succeeds when sourced from `config/api-keys/.env`.
- `Observed`: token scopes include:
  - `analytics.readonly`
  - `drive.readonly`
  - `indexing`
  - `webmasters`
  - `webmasters.readonly`
  - `youtube.readonly`
- `Observed`: Search Console returns `2` site entries:
  - `https://www.icorrect.co.uk/`
  - `sc-domain:icorrect.co.uk`
  - both with `siteOwner`
- `Observed`: Drive file list succeeds and sampled file is:
  - `IT Fast Laptops - Trade Pricing`
- `Observed`: Google Analytics Admin returns account summary:
  - account `27501710`
  - display name `ICORRECT`
  - property `353983768`
  - property display name `ICORRECT - GA4`

## Cross-System Role

- Search Console and GA are active website/marketing/system-observability surfaces.
- Jarvis token appears better aligned to Search Console, Calendar, and Gmail-oriented workflows.
- Edge token appears better aligned to Search Console, Drive, and GA4 access.

## Observed Risks

- Shared docs describing Jarvis Drive/Sheets access do not match the live Jarvis token in `config/.env`.
- The missing Edge refresh token in `config/.env` means an agent using only the supposed primary env file will incorrectly conclude that part of Google access is unavailable.

## Open Threads

- verify whether Sheets access exists on any live Google refresh token
- map which automations actually use Jarvis versus Edge Google identity
