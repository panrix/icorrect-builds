# iCorrect Marketing Intelligence Platform — Full Build Spec

**Author:** Marketing Agent
**Date:** 11 February 2026
**Purpose:** Replace £5,000-20,000/year of marketing SaaS with a self-hosted, agent-integrated intelligence platform
**Target Builder:** Claude Code / Engineering Agent

---

## Architecture Overview

A modular data collection and reporting platform that scrapes, stores, analyses, and alerts on marketing data across all channels. Designed for one business location initially, scaling to multiple locations globally.

### Core Components
1. **Scraper Engine** — Headless browser (Playwright) + HTTP requests for data collection
2. **Data Store** — PostgreSQL (or SQLite for MVP) with time-series data
3. **Report Generator** — HTML/JS dashboard served locally
4. **Alert System** — Webhooks to OpenClaw agents on significant changes
5. **Scheduler** — Cron-based job runner for automated collection
6. **API Layer** — REST API for agents to query data programmatically

### Tech Stack (Recommended)
- **Language:** Python 3.12+ (rich scraping ecosystem, data analysis libraries)
- **Browser Automation:** Playwright (handles all major browsers, stealth mode available)
- **Database:** PostgreSQL (time-series queries, JSON columns for flexible schema) — SQLite acceptable for MVP
- **Dashboard:** Lightweight HTML + Chart.js or D3.js (no heavy frontend framework needed)
- **Scheduler:** System cron or APScheduler
- **Alerting:** HTTP POST to OpenClaw webhook endpoint

---

## PHASE 1: Rank Tracking + Site Health
**Priority:** CRITICAL — this is the foundation
**Estimated Build:** 1-2 weeks
**Storage Estimate:** ~50MB/year for one location, 10 keywords, weekly scans

### 1.1 Google Maps Local Rank Tracker

**What it does:**
Creates a geo-grid around a business location, searches Google Maps for target keywords at each grid point, records the business's ranking position.

**Data Collection:**
- Input: Business name, Place ID, centre coordinates (lat/lng), grid size, radius, list of keywords
- For each grid point × keyword combination:
  - Open Google Maps in headless browser
  - Set location to grid point coordinates (via geolocation override in Playwright)
  - Search for keyword (e.g., "MacBook repair")
  - Parse the local pack results (the list of businesses shown)
  - Record: keyword, grid_point_lat, grid_point_lng, rank_position (1-20 or "not found"), top_3_competitors, timestamp

**Configuration for iCorrect:**
```json
{
  "business": {
    "name": "iCorrect",
    "place_id": "TBD - lookup from Google",
    "centre": { "lat": 51.5178, "lng": -0.1417 },  // 12 Margaret Street, London W1W 8JQ
    "domain": "icorrect.co.uk"
  },
  "grid": {
    "size": "7x7",          // 49 data points per scan
    "radius_km": 5,         // 5km radius around business
    "spacing": "even"       // evenly distributed points
  },
  "keywords": [
    "MacBook repair",
    "MacBook repair London",
    "Apple repair London",
    "MacBook screen repair",
    "MacBook logic board repair",
    "iPhone repair London",
    "iPad repair London",
    "liquid damage MacBook",
    "MacBook data recovery",
    "Apple Watch repair London"
  ],
  "schedule": "weekly",     // every Monday 6am UTC
  "device": "mobile"        // mobile user agent (most repair searches are mobile)
}
```

**Database Schema:**
```sql
CREATE TABLE local_rank_scans (
    id SERIAL PRIMARY KEY,
    scan_id UUID NOT NULL,           -- groups all points from one scan
    business_id VARCHAR(50) NOT NULL,
    keyword VARCHAR(255) NOT NULL,
    grid_lat DECIMAL(10,7) NOT NULL,
    grid_lng DECIMAL(10,7) NOT NULL,
    rank_position INTEGER,           -- NULL if not found in top 20
    total_results INTEGER,
    competitors JSONB,               -- top 5 results at this point
    scanned_at TIMESTAMP NOT NULL,
    device VARCHAR(10) DEFAULT 'mobile',
    location_id VARCHAR(50)          -- for multi-location support later
);

CREATE INDEX idx_local_rank_keyword ON local_rank_scans(keyword, scanned_at);
CREATE INDEX idx_local_rank_scan ON local_rank_scans(scan_id);
```

**Output:**
- Heatmap grid (HTML canvas or SVG) showing rank at each point, colour-coded:
  - Green (#1-3), Yellow (#4-7), Orange (#8-10), Red (#11-20), Grey (not found)
- Week-over-week comparison: improved/declined positions highlighted
- Average rank per keyword trend line
- "Visibility score" — percentage of grid points where we rank in top 3

**Storage per scan:** ~49 points × 10 keywords = 490 rows × ~200 bytes = ~100KB per weekly scan
**Annual storage:** ~5.2MB per location

---

### 1.2 Google Organic Rank Tracker

**What it does:**
Searches Google web results for target keywords from a UK location, records icorrect.co.uk's position.

**Data Collection:**
- For each keyword:
  - Open Google in headless browser with UK locale/location
  - Search for keyword
  - Parse organic results (positions 1-100)
  - Record: keyword, rank_position, URL that ranked, featured_snippet (yes/no), page_title, timestamp
  - Also record: top 10 competitors for each keyword

**Additional Keywords (organic-specific):**
```json
[
  "MacBook repair London",
  "MacBook repair UK",
  "MacBook logic board repair",
  "MacBook liquid damage repair",
  "MacBook screen repair London",
  "iPhone repair London",
  "iPad repair London",
  "Apple Watch repair London",
  "MacBook data recovery UK",
  "can liquid damaged MacBook be fixed",
  "MacBook repair near me",
  "Apple repair specialist UK",
  "MacBook not turning on repair",
  "MacBook keyboard repair London",
  "iCorrect reviews"
]
```

**Database Schema:**
```sql
CREATE TABLE organic_rank_scans (
    id SERIAL PRIMARY KEY,
    scan_id UUID NOT NULL,
    business_id VARCHAR(50) NOT NULL,
    keyword VARCHAR(255) NOT NULL,
    rank_position INTEGER,           -- NULL if not in top 100
    url_ranked VARCHAR(500),         -- which page ranked
    featured_snippet BOOLEAN DEFAULT FALSE,
    page_title VARCHAR(500),
    serp_features JSONB,             -- PAA, images, videos, ads present
    competitors JSONB,               -- top 10 results
    device VARCHAR(10) DEFAULT 'mobile',
    search_location VARCHAR(100),     -- "London, UK" / "United Kingdom"
    scanned_at TIMESTAMP NOT NULL
);
```

**Output:**
- Position tracking chart per keyword over time
- Winners/losers this week (biggest position changes)
- SERP feature tracking (do we appear in People Also Ask? Image pack? Video carousel?)
- Competitor overlap analysis — who consistently outranks us?

**Storage:** ~15 keywords × 2 devices × ~300 bytes = ~9KB per scan, ~470KB/year

---

### 1.3 YouTube Search Rank Tracker

**What it does:**
Searches YouTube for target keywords, records @iCorrect channel video positions.

**Data Collection:**
- For each keyword:
  - Search YouTube
  - Parse first 50 results
  - Find any @iCorrect videos, record position
  - Record: keyword, video_id, video_title, rank_position, view_count, competitor_videos (top 10)

**Keywords:**
```json
[
  "MacBook repair",
  "MacBook logic board repair",
  "MacBook liquid damage repair",
  "iPhone repair",
  "MacBook screen repair",
  "Apple repair",
  "MacBook flexgate repair",
  "MacBook data recovery",
  "board level repair MacBook",
  "Apple Watch battery replacement"
]
```

**Database Schema:**
```sql
CREATE TABLE youtube_rank_scans (
    id SERIAL PRIMARY KEY,
    scan_id UUID NOT NULL,
    keyword VARCHAR(255) NOT NULL,
    video_id VARCHAR(20),
    video_title VARCHAR(500),
    rank_position INTEGER,
    view_count BIGINT,
    competitors JSONB,
    scanned_at TIMESTAMP NOT NULL
);
```

**Storage:** ~10KB per scan, ~520KB/year

---

### 1.4 TikTok Search Rank Tracker

**What it does:**
Searches TikTok for target keywords, records @icorrect_ video positions.

**Data Collection:**
- Same approach as YouTube but on TikTok search
- Record: keyword, video_id, rank_position, view_count, like_count, share_count

**Database Schema:**
```sql
CREATE TABLE tiktok_rank_scans (
    id SERIAL PRIMARY KEY,
    scan_id UUID NOT NULL,
    keyword VARCHAR(255) NOT NULL,
    video_id VARCHAR(30),
    video_url VARCHAR(500),
    rank_position INTEGER,
    view_count BIGINT,
    like_count INTEGER,
    share_count INTEGER,
    competitors JSONB,
    scanned_at TIMESTAMP NOT NULL
);
```

**Storage:** ~10KB per scan, ~520KB/year

---

### 1.5 Site Health Crawler

**What it does:**
Crawls icorrect.co.uk and reports on technical SEO health, broken links, page speed, and content gaps.

**Data Collection:**
- Crawl all pages on icorrect.co.uk (currently ~50-100 pages based on Shopify structure)
- For each page: status code, title tag, meta description, H1, word count, internal links, external links, images (alt tags), page load time, mobile-friendliness
- Identify: broken links (4xx), redirect chains, missing meta descriptions, duplicate titles, thin content pages, missing alt tags

**Database Schema:**
```sql
CREATE TABLE site_crawls (
    id SERIAL PRIMARY KEY,
    crawl_id UUID NOT NULL,
    url VARCHAR(500) NOT NULL,
    status_code INTEGER,
    title_tag VARCHAR(500),
    meta_description VARCHAR(500),
    h1 VARCHAR(500),
    word_count INTEGER,
    internal_links INTEGER,
    external_links INTEGER,
    images_total INTEGER,
    images_missing_alt INTEGER,
    page_load_ms INTEGER,
    mobile_friendly BOOLEAN,
    canonical_url VARCHAR(500),
    crawled_at TIMESTAMP NOT NULL
);

CREATE TABLE broken_links (
    id SERIAL PRIMARY KEY,
    crawl_id UUID NOT NULL,
    source_url VARCHAR(500),
    broken_url VARCHAR(500),
    status_code INTEGER,
    link_text VARCHAR(500),
    found_at TIMESTAMP NOT NULL
);
```

**Schedule:** Monthly (site doesn't change frequently)
**Storage:** ~100 pages × ~500 bytes = ~50KB per crawl, ~600KB/year

---

### Phase 1 Total Storage: ~7.5MB/year per location
### Phase 1 Scan Schedule:
- Local rank: Weekly (Monday 6am)
- Organic rank: Weekly (Monday 6am)
- YouTube rank: Weekly (Tuesday 6am)
- TikTok rank: Weekly (Tuesday 6am)
- Site health: Monthly (1st of month)

---

## PHASE 2: Competitive Intelligence
**Priority:** HIGH — know the battlefield before spending on ads
**Estimated Build:** 1-2 weeks
**Storage Estimate:** ~20MB/year

### 2.1 Competitor Tracker

**What it does:**
Monitors competing Apple repair businesses across Google Maps, organic search, reviews, and social media.

**Competitor Identification:**
- Scrape Google Maps for "Apple repair London" / "MacBook repair London"
- Identify top 15-20 competitors
- Track them continuously

**Data Collection per competitor:**
- Google Maps rank for shared keywords (captured in Phase 1 already)
- Google organic rank for shared keywords (captured in Phase 1 already)
- Review count and rating (Google, Trustpilot) — scraped monthly
- Social media follower counts — scraped monthly
- Website changes — monthly crawl of their homepage/key pages
- Google Ads activity — check if their ads appear for our keywords

**Database Schema:**
```sql
CREATE TABLE competitors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    google_place_id VARCHAR(100),
    google_maps_url VARCHAR(500),
    trustpilot_url VARCHAR(500),
    instagram_handle VARCHAR(100),
    tiktok_handle VARCHAR(100),
    youtube_handle VARCHAR(100),
    facebook_url VARCHAR(500),
    location_lat DECIMAL(10,7),
    location_lng DECIMAL(10,7),
    added_at TIMESTAMP NOT NULL,
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE competitor_snapshots (
    id SERIAL PRIMARY KEY,
    competitor_id INTEGER REFERENCES competitors(id),
    google_rating DECIMAL(2,1),
    google_review_count INTEGER,
    trustpilot_rating DECIMAL(2,1),
    trustpilot_review_count INTEGER,
    instagram_followers INTEGER,
    tiktok_followers INTEGER,
    youtube_subscribers INTEGER,
    facebook_followers INTEGER,
    website_title VARCHAR(500),
    website_description VARCHAR(1000),
    has_google_ads BOOLEAN,
    ad_copy_sample TEXT,
    snapped_at TIMESTAMP NOT NULL
);
```

**Output:**
- Competitor comparison dashboard: us vs them on every metric
- Alert when a competitor gains >50 reviews in a month
- Alert when a competitor starts running Google Ads
- Quarterly competitive landscape report

**Storage:** ~20 competitors × 12 months × ~1KB = ~240KB/year

---

### 2.2 Google Ads Intelligence (Pre-Spend Research)

**What it does:**
Before we spend a penny on Google Ads, understand the landscape: who's advertising, what copy they use, estimated CPCs.

**Data Collection:**
- For each target keyword, search Google and check:
  - How many ads appear? (0-4 top, 0-3 bottom)
  - Who's advertising? (business names, domains)
  - What ad copy are they using? (headlines, descriptions, extensions)
  - What landing pages do they point to?
- Cross-reference with competitor list

**Database Schema:**
```sql
CREATE TABLE ad_intelligence (
    id SERIAL PRIMARY KEY,
    scan_id UUID NOT NULL,
    keyword VARCHAR(255) NOT NULL,
    position VARCHAR(20),            -- 'top_1', 'top_2', 'bottom_1', etc.
    advertiser_domain VARCHAR(255),
    advertiser_name VARCHAR(255),
    headline_1 VARCHAR(100),
    headline_2 VARCHAR(100),
    headline_3 VARCHAR(100),
    description_1 VARCHAR(200),
    description_2 VARCHAR(200),
    display_url VARCHAR(255),
    landing_page_url VARCHAR(500),
    extensions JSONB,                -- sitelinks, callouts, etc.
    is_competitor BOOLEAN,
    scanned_at TIMESTAMP NOT NULL
);
```

**Schedule:** Bi-weekly
**Storage:** ~15 keywords × ~10 ads × ~500 bytes = ~75KB per scan, ~2MB/year

---

### 2.3 Citation Tracker (Local SEO)

**What it does:**
Checks that iCorrect is listed consistently across all major UK business directories. Inconsistent NAP (Name, Address, Phone) hurts local SEO.

**Directories to check:**
```json
[
  "Google Business Profile",
  "Apple Maps (Maps Connect)",
  "Bing Places",
  "Yelp UK",
  "Yell.com",
  "Thomson Local",
  "FreeIndex",
  "Cylex UK",
  "Scoot",
  "192.com",
  "Hotfrog UK",
  "Brown Book",
  "Central Index",
  "Foursquare",
  "Facebook",
  "TrustPilot"
]
```

**Data Collection per directory:**
- Listed? (yes/no)
- Business name as listed
- Address as listed
- Phone as listed
- Website URL as listed
- Consistency score (matches our canonical info?)

**Database Schema:**
```sql
CREATE TABLE citation_scans (
    id SERIAL PRIMARY KEY,
    scan_id UUID NOT NULL,
    directory_name VARCHAR(100) NOT NULL,
    directory_url VARCHAR(500),
    is_listed BOOLEAN,
    listed_name VARCHAR(255),
    listed_address TEXT,
    listed_phone VARCHAR(50),
    listed_website VARCHAR(500),
    name_match BOOLEAN,
    address_match BOOLEAN,
    phone_match BOOLEAN,
    website_match BOOLEAN,
    consistency_score DECIMAL(3,2),   -- 0.00-1.00
    scanned_at TIMESTAMP NOT NULL
);
```

**Schedule:** Monthly
**Storage:** ~16 directories × ~300 bytes × 12 months = ~58KB/year

---

### Phase 2 Total Storage: ~2.5MB/year
### Phase 2 Scan Schedule:
- Competitor snapshots: Monthly
- Ad intelligence: Bi-weekly
- Citation checks: Monthly

---

## PHASE 3: Content & Social Intelligence
**Priority:** MEDIUM-HIGH — drives content strategy
**Estimated Build:** 2-3 weeks
**Storage Estimate:** ~50MB/year (social media data is more verbose)

### 3.1 Social Analytics Aggregator

**What it does:**
Pulls performance metrics from all social platforms into one unified view.

**Data Collection per platform:**

**Instagram (@icorrect_):**
- Account-level: followers, following, total posts (weekly snapshot)
- Per-post (last 30 posts): likes, comments, saves, shares, views (for Reels), post type, caption, hashtags, posted_at
- Best performing content identification

**TikTok (@icorrect_):**
- Account-level: followers, following, total likes (weekly snapshot)
- Per-video (last 30 videos): views, likes, comments, shares, saves, posted_at, description, hashtags, sound used
- Viral detection (views > 2× average)

**YouTube (@iCorrect):**
- Channel-level: subscribers, total views, video count (weekly snapshot)
- Per-video (last 30): views, likes, comments, watch_time (if available from public page), published_at, title, description, tags
- Shorts vs long-form performance split

**Facebook (/icorrectuk/):**
- Page-level: followers, likes (weekly snapshot)
- Per-post (last 30): reactions, comments, shares, post type

**LinkedIn (once created):**
- Page-level: followers (weekly snapshot)
- Per-post: impressions, reactions, comments, shares

**Database Schema:**
```sql
CREATE TABLE social_account_snapshots (
    id SERIAL PRIMARY KEY,
    platform VARCHAR(20) NOT NULL,    -- instagram, tiktok, youtube, facebook, linkedin
    handle VARCHAR(100) NOT NULL,
    followers INTEGER,
    following INTEGER,
    total_posts INTEGER,
    total_likes BIGINT,               -- TikTok total likes
    total_views BIGINT,               -- YouTube total views
    snapped_at TIMESTAMP NOT NULL
);

CREATE TABLE social_posts (
    id SERIAL PRIMARY KEY,
    platform VARCHAR(20) NOT NULL,
    post_id VARCHAR(100) NOT NULL,
    post_url VARCHAR(500),
    post_type VARCHAR(20),            -- reel, image, carousel, video, short, story
    caption TEXT,
    hashtags JSONB,
    views BIGINT,
    likes INTEGER,
    comments INTEGER,
    shares INTEGER,
    saves INTEGER,
    engagement_rate DECIMAL(5,2),
    posted_at TIMESTAMP,
    scraped_at TIMESTAMP NOT NULL,
    UNIQUE(platform, post_id)
);

CREATE INDEX idx_social_posts_platform ON social_posts(platform, posted_at);
```

**Output:**
- Cross-platform dashboard: followers, engagement, growth rate per platform
- Content performance leaderboard: top 10 posts across all platforms this month
- Best posting day/time analysis
- Content type analysis: which format gets most engagement per platform
- Follower growth trend lines
- Engagement rate benchmarks

**Schedule:** Weekly (account snapshots), daily (new post tracking)
**Storage:** ~500 posts/year × ~1KB + weekly snapshots = ~5MB/year

---

### 3.2 Content Gap Analyser

**What it does:**
Discovers what questions people are searching about Apple repair that we haven't answered with content (blog, video, or social).

**Data Collection:**
- For each seed keyword, scrape:
  - Google Autocomplete suggestions (type keyword, capture dropdown)
  - Google "People Also Ask" boxes
  - Google "Related Searches" at page bottom
  - YouTube autocomplete suggestions
  - TikTok search suggestions
  - Reddit threads (search r/macbookrepair, r/applehelp, r/mac, etc.)
  - Quora questions
- Cross-reference against our existing content (blog posts, video titles, social captions)
- Identify gaps: questions with search demand but no iCorrect content

**Database Schema:**
```sql
CREATE TABLE content_opportunities (
    id SERIAL PRIMARY KEY,
    query VARCHAR(500) NOT NULL,
    source VARCHAR(50),               -- google_autocomplete, paa, related, youtube, tiktok, reddit, quora
    seed_keyword VARCHAR(255),
    estimated_volume VARCHAR(20),      -- high/medium/low based on source frequency
    competition VARCHAR(20),           -- high/medium/low
    content_exists BOOLEAN DEFAULT FALSE,
    existing_content_url VARCHAR(500),
    recommended_format VARCHAR(50),    -- blog, video, reel, tiktok
    priority_score INTEGER,            -- calculated: volume × (1 - competition) × relevance
    discovered_at TIMESTAMP NOT NULL,
    actioned BOOLEAN DEFAULT FALSE,
    actioned_at TIMESTAMP
);
```

**Output:**
- Prioritised content calendar: "write/film THIS next" ranked by opportunity
- Gap analysis: what competitors cover that we don't
- Question clusters: related questions grouped into single content pieces
- Format recommendations: this question is best answered as video vs blog vs social

**Schedule:** Monthly discovery scan
**Storage:** ~500-1000 opportunities tracked, ~500KB/year

---

### 3.3 Review Aggregator & Sentiment Engine

**What it does:**
Pulls all reviews from all platforms into one view with sentiment analysis and alerting.

**Platforms:**
- Trustpilot (icorrect.co.uk)
- Google Business reviews
- Facebook page reviews
- Yelp (if listed)
- Apple Maps (if listed)

**Data Collection per review:**
- Platform, reviewer name, rating, review text, date, response (if any)
- Sentiment analysis: positive/neutral/negative
- Theme extraction: what specific aspect are they praising/complaining about? (speed, communication, price, quality, "fixed what Apple couldn't")
- Named staff mentions (Ricky, Michael, Angela, Adil)

**Database Schema:**
```sql
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    platform VARCHAR(50) NOT NULL,
    review_id VARCHAR(100),
    reviewer_name VARCHAR(255),
    rating DECIMAL(2,1),
    review_text TEXT,
    sentiment VARCHAR(10),            -- positive, neutral, negative
    themes JSONB,                     -- ['communication', 'quality', 'apple_cant_fix', 'speed']
    staff_mentioned JSONB,            -- ['Michael', 'Ricky']
    response_text TEXT,
    responded BOOLEAN DEFAULT FALSE,
    review_date DATE,
    scraped_at TIMESTAMP NOT NULL,
    UNIQUE(platform, review_id)
);

CREATE TABLE review_summaries (
    id SERIAL PRIMARY KEY,
    period VARCHAR(20),               -- '2026-02', '2026-W06'
    total_reviews INTEGER,
    avg_rating DECIMAL(2,1),
    positive_count INTEGER,
    neutral_count INTEGER,
    negative_count INTEGER,
    top_themes JSONB,
    new_vs_previous INTEGER,          -- growth in review count
    summarised_at TIMESTAMP NOT NULL
);
```

**Alerts:**
- New negative review (≤3 stars) → immediate alert to Marketing agent
- Review velocity change → alert if reviews drop significantly
- New 5-star review with detailed text → flag as content opportunity

**Output:**
- Review dashboard: total count, average rating, sentiment split per platform
- Theme analysis: word cloud + frequency chart of what customers mention
- Staff leaderboard: who gets mentioned most positively
- "Content goldmine" list: reviews with the best quotes for social content
- Monthly review health report

**Schedule:** Daily check for new reviews
**Storage:** ~200-400 reviews/year × ~500 bytes = ~200KB/year

---

### Phase 3 Total Storage: ~6MB/year
### Phase 3 Scan Schedule:
- Social snapshots: Weekly
- New post tracking: Daily
- Content gap discovery: Monthly
- Review checking: Daily

---

## PHASE 4: Brand & Market Monitoring
**Priority:** MEDIUM — enhances decision-making
**Estimated Build:** 1-2 weeks
**Storage Estimate:** ~10MB/year

### 4.1 Brand Mention Monitor

**What it does:**
Tracks mentions of "iCorrect" across the web — forums, Reddit, news, blogs, social media.

**Sources to monitor:**
- Reddit (r/macbookrepair, r/applehelp, r/mac, r/london, r/techsupport, r/mobilerepair)
- Twitter/X (search "iCorrect")
- Google News ("iCorrect")
- General Google search ("iCorrect" -site:icorrect.co.uk)
- Tech forums (MacRumors, iFixit community)
- UK forums (MoneySavingExpert, Mumsnet — people ask for repair recommendations)

**Database Schema:**
```sql
CREATE TABLE brand_mentions (
    id SERIAL PRIMARY KEY,
    source VARCHAR(100),              -- reddit, twitter, news, forum
    source_url VARCHAR(500),
    author VARCHAR(255),
    mention_text TEXT,
    sentiment VARCHAR(10),
    context VARCHAR(50),              -- recommendation, complaint, question, news
    is_competitor_mention BOOLEAN,    -- do they also mention a competitor?
    discovered_at TIMESTAMP NOT NULL,
    actioned BOOLEAN DEFAULT FALSE,
    action_taken TEXT
);
```

**Alerts:**
- Negative mention → immediate alert
- Someone asking for repair recommendations (opportunity to be mentioned/recommended)
- Press coverage → amplify on social

**Schedule:** Daily
**Storage:** ~500 mentions/year × ~500 bytes = ~250KB/year

---

### 4.2 Market Opportunity Scanner (Expansion Planning)

**What it does:**
For any target city, estimates market size and competitive landscape for Apple repair services.

**Data Collection per city:**
- Google Maps: how many Apple repair shops? Names, ratings, review counts
- Google search volume proxies: number of ads shown, autocomplete suggestions
- Population data (public datasets)
- Existing iCorrect customer data from that area (courier orders — if we can access)

**Database Schema:**
```sql
CREATE TABLE market_scans (
    id SERIAL PRIMARY KEY,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(50) NOT NULL,
    centre_lat DECIMAL(10,7),
    centre_lng DECIMAL(10,7),
    population INTEGER,
    competitor_count INTEGER,
    avg_competitor_rating DECIMAL(2,1),
    avg_competitor_reviews INTEGER,
    top_competitor VARCHAR(255),
    google_ads_present BOOLEAN,
    ad_count_avg DECIMAL(3,1),
    estimated_demand VARCHAR(20),     -- high/medium/low
    market_saturation VARCHAR(20),    -- high/medium/low
    opportunity_score INTEGER,        -- calculated composite
    competitors JSONB,                -- full list with details
    scanned_at TIMESTAMP NOT NULL
);
```

**Target cities (initial scan list):**
```json
[
  "London", "Manchester", "Birmingham", "Leeds", "Edinburgh", "Glasgow",
  "Bristol", "Liverpool", "Newcastle", "Oxford", "Cambridge", "Brighton",
  "Dubai", "Abu Dhabi", "Singapore", "Sydney", "Melbourne",
  "New York", "Los Angeles", "San Francisco"
]
```

**Output:**
- Market opportunity heatmap: UK map with city scores
- Global expansion ranking: best markets to enter next
- Competitive density analysis per city
- Decision support: "Manchester has 12 competitors averaging 3.8 stars — opportunity to enter as premium provider"

**Schedule:** Quarterly (or on-demand before expansion decisions)
**Storage:** ~20 cities × ~2KB = ~40KB per scan, ~160KB/year

---

### Phase 4 Total Storage: ~500KB/year
### Phase 4 Scan Schedule:
- Brand mentions: Daily
- Market opportunity: Quarterly / on-demand

---

## PHASE 5: Unified Dashboard & Agent Integration
**Priority:** HIGH (but depends on Phases 1-4 data)
**Estimated Build:** 1-2 weeks
**Storage Estimate:** Negligible (reads existing data)

### 5.1 Unified Marketing Dashboard

**What it does:**
Single HTML dashboard combining all data from Phases 1-4.

**Dashboard Sections:**
1. **Executive Summary** — Overall health score, key metrics, alerts
2. **Rankings** — Google Maps heatmap, organic positions, YouTube/TikTok ranks
3. **Social** — Follower counts, engagement rates, top content
4. **Reviews** — Rating trends, sentiment, new reviews
5. **Competitors** — Comparison table, movement alerts
6. **Content Pipeline** — Gaps identified, content created, content scheduled
7. **Expansion** — Market opportunity scores per city

**Features:**
- Date range selector (this week / month / quarter / year)
- CSV/PDF export for any view
- Shareable public URLs for specific reports (password-protected)
- Dark mode (because why not)

### 5.2 Agent API

**What it does:**
REST API that any OpenClaw agent can query to get marketing data.

**Endpoints:**
```
GET /api/rankings/local?keyword=X&date=Y        → local rank data
GET /api/rankings/organic?keyword=X              → organic rank trend
GET /api/rankings/youtube?keyword=X              → YouTube rank
GET /api/social/overview                          → all platform stats
GET /api/social/posts?platform=X&sort=engagement  → top posts
GET /api/reviews/recent?days=7                    → recent reviews
GET /api/reviews/alerts                           → negative reviews needing response
GET /api/competitors/compare                      → us vs them
GET /api/content/gaps?priority=high               → content opportunities
GET /api/mentions/recent                          → brand mentions
GET /api/health/site                              → latest site crawl results
GET /api/markets/scan?city=X                      → market opportunity
```

**Agent Integration Examples:**
- **Marketing agent (me):** Query rankings weekly, adjust content strategy based on position changes
- **Website agent:** Receive site health alerts, fix broken links, optimise slow pages
- **Content creation:** Get prioritised content gap list, produce content against it
- **Customer service agents:** Get alerted on new negative reviews, draft responses

### 5.3 Alert & Notification System

**Alert types and routing:**
```json
{
  "alerts": [
    {
      "type": "negative_review",
      "condition": "rating <= 3",
      "urgency": "high",
      "notify": ["marketing_agent", "ricky_telegram"]
    },
    {
      "type": "rank_drop",
      "condition": "position_change >= 5 AND direction = 'down'",
      "urgency": "medium",
      "notify": ["marketing_agent"]
    },
    {
      "type": "competitor_ad_started",
      "condition": "competitor.has_google_ads = true AND competitor.had_google_ads_last_scan = false",
      "urgency": "medium",
      "notify": ["marketing_agent"]
    },
    {
      "type": "brand_mention_negative",
      "condition": "sentiment = 'negative'",
      "urgency": "high",
      "notify": ["marketing_agent", "ricky_telegram"]
    },
    {
      "type": "new_content_opportunity",
      "condition": "priority_score >= 80",
      "urgency": "low",
      "notify": ["marketing_agent"]
    },
    {
      "type": "site_health_issue",
      "condition": "broken_links > 0 OR page_load_ms > 3000",
      "urgency": "medium",
      "notify": ["website_agent"]
    }
  ]
}
```

---

## Total Storage Summary

| Phase | Annual Storage (1 location) | Annual Storage (20 locations) |
|-------|---------------------------|-------------------------------|
| Phase 1: Rankings + Site Health | 7.5 MB | 100 MB |
| Phase 2: Competitive Intel | 2.5 MB | 50 MB |
| Phase 3: Content & Social | 6 MB | 20 MB* |
| Phase 4: Brand & Market | 0.5 MB | 5 MB |
| Phase 5: Dashboard | ~0 | ~0 |
| **Total** | **~16.5 MB/year** | **~175 MB/year** |

*Social data doesn't multiply linearly with locations — one set of social accounts serves all.

**This is trivially small.** Even at 20 global locations, we're talking about 175MB/year. A single YouTube video is larger than our entire annual data store.

---

## Scraping Considerations

**Rate Limiting Strategy:**
- Never more than 1 request per 3 seconds to any single platform
- Randomised delays between requests (3-10 seconds)
- Rotate user agents
- Use residential proxy if needed later (for now, direct is fine at our scale)
- Schedule scans during off-peak hours (early morning UK time)

**Anti-Detection:**
- Playwright stealth mode (playwright-extra with stealth plugin)
- Real browser fingerprints
- Random mouse movements and scroll patterns
- Session persistence (cookies, login state) where helpful

**Failure Handling:**
- Retry with exponential backoff (3 attempts)
- If blocked, log and alert — don't hammer
- Partial scan results are still valuable — store what we got

**Legal:**
- All data scraped is publicly visible information
- We're checking our own business rankings — same as searching Google manually
- Review data is public
- Competitor data is public listings
- No terms of service violations at our scale

---

## Recommended Build Order

```
Phase 1.1 → Google Maps Local Rank Tracker     (WEEK 1)
Phase 1.2 → Google Organic Rank Tracker         (WEEK 1)
Phase 1.5 → Site Health Crawler                 (WEEK 2)
Phase 1.3 → YouTube Rank Tracker                (WEEK 2)
Phase 1.4 → TikTok Rank Tracker                 (WEEK 2)
Phase 3.3 → Review Aggregator                   (WEEK 3) ← high value, low complexity
Phase 2.1 → Competitor Tracker                   (WEEK 3)
Phase 5.1 → Dashboard (MVP)                      (WEEK 4) ← visualise what we have so far
Phase 3.1 → Social Analytics                     (WEEK 5)
Phase 2.2 → Ad Intelligence                      (WEEK 5)
Phase 3.2 → Content Gap Analyser                 (WEEK 6)
Phase 2.3 → Citation Tracker                     (WEEK 6)
Phase 4.1 → Brand Mention Monitor                (WEEK 7)
Phase 4.2 → Market Opportunity Scanner            (WEEK 7)
Phase 5.2 → Agent API                            (WEEK 8)
Phase 5.3 → Alert System                         (WEEK 8)
```

**MVP in 4 weeks. Full platform in 8 weeks.**

---

## Questions for Claude Code / Engineering

1. **Database choice:** PostgreSQL preferred for time-series queries and JSONB support. SQLite acceptable for MVP if simpler to deploy. Preference?
2. **Deployment:** Run on the same server as OpenClaw? Separate VPS? Docker container?
3. **Browser sessions:** Can we get a persistent Playwright instance that stays warm, or cold-start each scan?
4. **Proxy needs:** At our current scale (weekly scans, one location, ~15 keywords), do we need proxies? Probably not initially.
5. **Dashboard hosting:** Local only, or accessible remotely? If remote, auth needed.
6. **Integration:** What's the best way for this platform to push alerts to OpenClaw agents? Webhook? Direct API?

---

*Spec complete. Ready for engineering review and build.*
