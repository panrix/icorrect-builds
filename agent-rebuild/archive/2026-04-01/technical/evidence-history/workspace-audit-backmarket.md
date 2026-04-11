# Workspace Audit: BackMarket Agent

**Path:** `/home/ricky/.openclaw/agents/backmarket/workspace/`
**Audit Date:** 2026-02-26
**Total Files (excl .git):** 76
**Total Size (excl .git):** ~5.2 MB

---

## File Inventory

### Core Agent Files

| File | Size | Type | Verdict | v3 Destination | Tokens (est) |
|------|------|------|---------|----------------|---------------|
| SOUL.md | 3,680 | Agent identity | KEEP | SOUL.md (root) | ~920 |
| MEMORY.md | 5,164 | Auto-generated Supabase memory | KEEP | MEMORY.md (root) | ~1,290 |
| MEMORY-legacy.md | 7,196 | Old MEMORY.md from pre-v2 era | DELETE | n/a | ~1,800 |
| CLAUDE-legacy.md | 11,506 | Old CLAUDE.md with workspace rules | DELETE | n/a (superseded by AGENTS.md) | ~2,876 |
| SOUL-legacy.md | 5,071 | Old SOUL.md from single-agent era | DELETE | n/a (current SOUL.md is better) | ~1,268 |
| AGENTS.md | 7,869 | Workspace bootstrap/session rules | KEEP | AGENTS.md (root) | ~1,967 |
| TOOLS.md | 4,191 | BM API auth, headers, usage patterns | KEEP | TOOLS.md (root) | ~1,048 |
| USER.md | 247 | Ricky profile | KEEP | USER.md (root) | ~62 |
| IDENTITY.md | 261 | Agent identity metadata | KEEP | IDENTITY.md (root) | ~65 |
| HEARTBEAT.md | 168 | Empty heartbeat (no tasks) | KEEP | HEARTBEAT.md (root) | ~42 |
| ISSUES.md | 7,959 | Operational issues tracker (8 issues) | KEEP | data/issues.md | ~1,990 |
| .gitignore | 349 | Git config | KEEP | .gitignore (root) | ~87 |
| .openclaw/workspace-state.json | 74 | OpenClaw state | KEEP | .openclaw/ | ~19 |

### SOPs (docs/SOPs/) -- 7 SOPs + 2 Reference Files

| File | Size | Type | Quality | Verdict | v3 Destination | Tokens (est) |
|------|------|------|---------|---------|----------------|---------------|
| SOP-tradein.md | 9,604 | Trade-in SOP (T1-T8) | GOOD -- detailed, API-correct, step-by-step | KEEP | sops/SOP-tradein.md | ~2,401 |
| SOP-pricing.md | 5,251 | Pricing methodology SOP | GOOD -- Supabase-first, Ricky-approval gate | KEEP | sops/SOP-pricing.md | ~1,313 |
| SOP-listing.md | 5,786 | Listing creation SOP | GOOD -- pre-listing checklist, SKU format, UUID discovery | KEEP | sops/SOP-listing.md | ~1,447 |
| SOP-sales.md | 4,266 | Order acceptance & shipping SOP | GOOD -- covers S1-S6 | KEEP | sops/SOP-sales.md | ~1,067 |
| SOP-aftersales.md | 2,847 | Counter-offers, returns, disputes | PARTIAL -- marked "BEING BUILT OUT" | KEEP | sops/SOP-aftersales.md | ~712 |
| SOP-daily.md | 2,648 | Daily operations routine | GOOD -- morning check, Tuesday cutoff | KEEP | sops/SOP-daily.md | ~662 |
| SOP-errors.md | 3,119 | Error recovery playbook | GOOD -- ERR-1 through ERR-5 | KEEP | sops/SOP-errors.md | ~780 |
| README.md | 2,686 | SOP index/table of contents | KEEP | sops/README.md | ~672 |
| REF.md | 9,550 | API endpoints, board IDs, product UUIDs | KEEP | sops/REF.md | ~2,388 |

**SOP Assessment:** All 7 SOPs found. Quality is generally good -- written for agent execution, not human reference. SOP-aftersales is incomplete (flagged by agent itself). SOPs are dated Feb 22-24 2026, indicating active maintenance. No hallucinated content detected -- API endpoints match documented patterns, Monday board IDs are consistent.

### Docs (docs/)

| File | Size | Type | Verdict | v3 Destination | Tokens (est) |
|------|------|------|---------|----------------|---------------|
| KNOWLEDGE-BASE.md | 8,572 | Business overview from Feb 6-9 transcripts | KEEP | research/reference/KNOWLEDGE-BASE.md | ~2,143 |
| bm-api-reference.md | 15,967 | Full BM API endpoint reference (44 endpoints) | KEEP | research/reference/bm-api-reference.md | ~3,992 |
| api-endpoints.md | 5,073 | Older API endpoint doc (from n8n flows) | MOVE | archive/ (superseded by bm-api-reference.md) | ~1,268 |
| n8n-flows-full-audit.md | 10,391 | Full audit of all n8n BM flows | KEEP | research/reference/n8n-flows-audit.md | ~2,598 |
| n8n-flows-analysis.md | 3,135 | Shorter flow analysis | MOVE | archive/ (superseded by full audit) | ~784 |
| ACTION-ITEMS.md | 3,004 | Action items from Feb 9 session | DELETE | n/a (stale -- Feb 10, most items resolved) | ~751 |
| pricing-audit-2026-02-14.md | 10,009 | Feb 14 pricing audit (808 listings) | MOVE | data/pricing-audit-2026-02-14.md | ~2,502 |
| pricing-module-plan.md | 9,133 | Build plan for pricing module | MOVE | research/reference/pricing-module-plan.md | ~2,283 |
| process-map.md | 4,744 | BM business process map | KEEP | research/reference/process-map.md | ~1,186 |
| DOC-GAPS.md | 6,563 | Documentation gap analysis | MOVE | archive/ (meta-doc, not operational) | ~1,641 |
| conversation-history.md | 25,081 | Raw Telegram transcript (Feb 6-9) | DELETE | n/a (raw transcript, context extracted to KNOWLEDGE-BASE) | ~6,270 |
| bm_analysis_feb6.md | 399 | Trade-in stats snapshot | MOVE | data/bm-analysis-feb6.md | ~100 |
| bm_sales_orders_live.csv | 14,176 | Live sales order data (CSV) | MOVE | data/bm-sales-orders.csv | ~3,544 |
| bm_tradein_orders_live.csv | 460,453 | Live trade-in order data (CSV) | MOVE | data/bm-tradein-orders.csv | ~115,113 |
| SOPs_ARCHIVED_2026-02-22.md | 32,959 | Monolithic archived SOPs (pre-split) | DELETE | n/a (superseded by individual SOP files) | ~8,240 |
| subagent-context.md | 1,435 | Sub-agent context brief | MOVE | archive/ (still references main workspace path) | ~359 |
| subagent-specs/bm-listings-spec.md | 8,898 | Spec for bm-listings sub-agent | KEEP | research/reference/bm-listings-spec.md | ~2,225 |
| tools/scraping.md | 1,979 | Web scraping tool reference | KEEP | research/reference/scraping-tools.md | ~495 |

### Shared Context (docs/shared-context/) -- DUPLICATES OF FOUNDATION DOCS

| File | Size | Type | Verdict | v3 Destination | Tokens (est) |
|------|------|------|---------|----------------|---------------|
| ricky-qa-answers.md | 8,229 | Q&A questions (NOT answers) | DELETE | n/a (duplicate, should be in foundation/) | ~2,057 |
| strategy-context.md | 4,517 | Corporate strategy excerpts | DELETE | n/a (duplicate, should be in foundation/) | ~1,129 |
| team-context.md | 12,901 | Team dynamics from transcripts | DELETE | n/a (duplicate, should be in foundation/) | ~3,225 |
| otter-transcript-insights.md | 4,217 | Process insights from transcripts | DELETE | n/a (duplicate, should be in foundation/) | ~1,054 |

### Data Files (data/ and root)

| File | Size | Type | Verdict | v3 Destination | Tokens (est) |
|------|------|------|---------|----------------|---------------|
| data/price-scrapes/ (8 files) | ~25,819 | Price scrape JSONs and audit summary | MOVE | data/price-scrapes/ | ~6,455 |
| data/product_urls.json | 1,862 | Product URL mapping | KEEP | data/product_urls.json | ~466 |
| data/scrape_targets.json | 2,757 | Scrape target config | KEEP | data/scrape_targets.json | ~689 |
| all_listings.json | 529,946 | Full BM listing dump (~810 listings) | DELETE | n/a (stale data dump from Feb 14, query API instead) | ~132,487 |
| backbox_data_complete.json | 601,241 | BackBox competitive data dump | DELETE | n/a (stale data dump from Feb 14) | ~150,310 |
| backbox_data_temp.json | 595,390 | Temp BackBox data (incomplete) | DELETE | n/a (temp file) | ~148,848 |

### Scraped HTML Files (root)

| File | Size | Type | Verdict | Tokens (est) |
|------|------|------|---------|---------------|
| scraped_84656419...html | 974,661 | Raw scraped BM product page | DELETE | ~243,665 |
| scraped_f9e55d19...html | 974,097 | Raw scraped BM product page | DELETE | ~243,524 |
| scraped_217cfd8a...html | 974,317 | Raw scraped BM product page | DELETE | ~243,579 |

### Shell Scripts (root)

| File | Size | Type | Verdict | v3 Destination | Tokens (est) |
|------|------|------|---------|----------------|---------------|
| fetch_all_listings.sh | 1,452 | Fetches all BM listings | MOVE | scripts/fetch_all_listings.sh | ~363 |
| fetch_backbox_data.sh | 2,717 | Fetches BackBox data | MOVE | scripts/fetch_backbox_data.sh | ~679 |
| fetch_backbox_data_fixed.sh | 2,948 | Fixed version of above | MOVE | scripts/fetch_backbox_data_fixed.sh | ~737 |
| fetch_listings_efficient.sh | 1,973 | Efficient listing fetcher | MOVE | scripts/fetch_listings_efficient.sh | ~493 |
| scrape_competitors.sh.DEPRECATED | 1,923 | Deprecated scraper | DELETE | n/a | ~481 |
| scrape_competitors.sh.DEPRECATED.note | 67 | Note about deprecation | DELETE | n/a | ~17 |

### Python Scripts (scripts/)

| File | Size | Type | Verdict | v3 Destination | Tokens (est) |
|------|------|------|---------|----------------|---------------|
| analyze_pricing.py | 10,535 | Pricing analysis script | MOVE | scripts/analyze_pricing.py | ~2,634 |
| scrape_bm_product.py | 11,495 | Product scraper (Massive/ClawPod) | MOVE | scripts/scrape_bm_product.py | ~2,874 |

### Memory Files (memory/)

| File | Size | Type | Verdict | v3 Destination | Tokens (est) |
|------|------|------|---------|----------------|---------------|
| 2026-02-10.md | 661 | Onboarding notes | KEEP | memory/ | ~165 |
| 2026-02-14.md | 1,601 | Listings + pricing audit | KEEP | memory/ | ~400 |
| 2026-02-15.md | 4,741 | Price changes applied | KEEP | memory/ | ~1,185 |
| 2026-02-17.md | 1,582 | Pending actions, Tuesday cutoff | KEEP | memory/ | ~396 |
| 2026-02-20.md | 24,226 | Large -- listings/pricing status dump | KEEP (trim) | memory/ | ~6,057 |
| 2026-02-21.md | 4,795 | BM 1460 listed, BM 1117 blocked | KEEP | memory/ | ~1,199 |
| 2026-02-22.md | 7,852 | Outstanding tasks, price changes | KEEP | memory/ | ~1,963 |
| 2026-02-23.md | 4,462 | Mistakes made, lessons learned | KEEP | memory/ | ~1,116 |
| 2026-02-23-bm-stock-investigation.md | 20,523 | Raw session transcript | DELETE | n/a (session dump, not curated memory) | ~5,131 |
| 2026-02-24.md | 16,844 | Open issues, wrong device shipped | KEEP | memory/ | ~4,211 |
| 2026-02-24-bm-sku.md | 19,129 | Raw session transcript | DELETE | n/a (session dump) | ~4,782 |
| 2026-02-25-0148.md | 180 | Empty session header only | DELETE | n/a | ~45 |
| 2026-02-26-bm-colour-check.md | 20,348 | Raw session transcript | DELETE | n/a (session dump) | ~5,087 |
| qc-state.json | 383 | QC cron state tracker | KEEP | data/qc-state.json | ~96 |

---

## Summary

### Token Budget

| Category | Tokens (est) |
|----------|-------------|
| Core agent files (SOUL, MEMORY, AGENTS, TOOLS, USER, IDENTITY) | ~5,352 |
| SOPs (7 + README + REF) | ~11,442 |
| Reference docs (KEEP) | ~12,639 |
| Data files (KEEP/MOVE) | ~7,710 |
| Memory files (KEEP) | ~16,692 |
| **Total KEEP/MOVE** | **~53,835** |
| DELETE (data dumps, HTML, legacy, transcripts) | **~1,220,563** |

### What is Useful vs Clutter

**Useful (moves to v3):**
- 7 well-structured SOPs with README and REF -- this is the best SOP set in the system
- TOOLS.md with correct BM API auth patterns (3 required headers documented)
- ISSUES.md as active operational tracker
- bm-api-reference.md (44 endpoints documented)
- n8n-flows-full-audit.md
- process-map.md (business logic reference)
- bm-listings-spec.md (future sub-agent spec)
- Daily memory files with real operational context

**Clutter (3.9 MB+ of waste):**
- 3 scraped HTML files (2.9 MB) -- raw HTML dumps, completely useless as context
- 3 JSON data dumps (1.7 MB) -- stale Feb 14 data, should be queried live
- Legacy files (SOUL-legacy, MEMORY-legacy, CLAUDE-legacy) -- superseded
- Archived monolithic SOPs file (33KB)
- Raw conversation history (25KB)
- Shared-context folder (duplicate of foundation docs)
- Session transcript dumps in memory/ masquerading as memory files

### Recommendations for v3 Migration

1. **DELETE first** -- remove the 3 HTML files, 3 JSON dumps, and 3 legacy files immediately (saves 4.6 MB and ~1.2M tokens of noise)
2. **Migrate SOPs as-is** -- they are well-structured and actively maintained. SOP-aftersales needs completion.
3. **Move scripts to scripts/** -- 4 shell scripts and 2 Python scripts are scattered in root
4. **Clean memory/** -- session transcript dumps (3 files, 60KB) should not be in memory/. Real memory files are good.
5. **Consolidate API docs** -- api-endpoints.md is superseded by bm-api-reference.md
6. **Remove shared-context/** -- these are duplicates of foundation docs that should come via symlink
7. **qc-state.json should be in data/** not memory/
8. **ISSUES.md is valuable** -- consider making this a standard v3 feature across agents
