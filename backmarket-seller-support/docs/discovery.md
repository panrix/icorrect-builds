# backmarket-seller-support — discovery

Site: `https://backmarket.my.site.com/ssc/s/`
Investigated: 2026-04-26
Authenticated session (Ricky's signed-in Chrome) used throughout. **READ-ONLY**.

## Verdict

- **Salesforce Experience Cloud (Lightning Communities)**, Aura framework
- App identifier: `siteforce:communityApp`
- Path prefix: `/ssc`
- API max version: **v66.0** (server supports v31..v66; v60 used in observed traffic)
- LWR/LWC migration: **NOT done yet** — still on legacy Aura
- Auth: `sid` cookie + per-page `aura.token` (JWT, HS256). No CSRF beyond the body-embedded token.

## Endpoint surface (top hits)

Full schema in [`api-inventory.json`](./api-inventory.json). Key endpoints:

| Purpose | Endpoint |
|---|---|
| List REST API versions | `GET /services/data/` |
| Knowledge article list (capped, ~11) | `GET /services/data/v60.0/support/knowledgeArticles` |
| Single article metadata (capped set) | `GET /services/data/v60.0/support/knowledgeArticles/{id\|UrlName}` |
| Data category groups | `GET /services/data/v60.0/support/dataCategoryGroups?sObjectName=KnowledgeArticleVersion` |
| Full category tree (52 cats) | `GET /services/data/v60.0/support/dataCategoryGroups/Seller_Support_Knowledge/dataCategories/All?sObjectName=KnowledgeArticleVersion` |
| **Site search (PRIMARY enumerator)** | `POST /ssc/s/sfsites/aura?...&getItems=1` (descriptor: `ScopedResultsDataProviderController/ACTION$getItems`) |
| **Article body (Details__c HTML)** | `POST /ssc/s/sfsites/aura?...&getRecordWithFields=1` (descriptor: `aura://RecordUiController/ACTION$getRecordWithFields`) |
| UrlName → version id | `POST /ssc/s/sfsites/aura?...&getArticleVersionId=1` |
| Featured topic list (9 home tiles) | NavigationMenuDataProvider `getNavigationMenu` |
| Topic → top-5 articles (capped) | `ssc_FaqController.getTopic` (custom Apex via `aura://ApexActionController/ACTION$execute`) |

REST `/sobjects/` and `/query` endpoints return **401 INVALID_SESSION_ID** for the community user — this `sid` is community-scoped and lacks general API access. Do not waste time on SOQL.

## Auth pattern

- Session cookie `sid` (HTTP-only, set on `backmarket.my.site.com`) carries community auth.
- Aura POSTs require **all four** form fields: `message`, `aura.context`, `aura.pageURI`, `aura.token`.
- `aura.token` lives at `window.Aura.initConfig.token` and the `fwuid` at `window.Aura.initConfig.context.fwuid`. Re-read both on every fresh page load. (Token did not appear to time-out short-term during this run, but assume per-day rotation.)
- Required Aura context shape: `{mode:'PROD', fwuid:..., app:'siteforce:communityApp', loaded: {<APPLICATION key>: <hash>}, dn:[], globals:{}, uad:true}`.

## Content structure

Two parallel taxonomies — both are exposed and don't fully overlap:

1. **Topics** (Salesforce ManagedTopic) — 9 top-level topic-groups (the home-page tiles), each with 3-8 sub-topics. Sub-topics carry article assignments (`TopicAssignment`). **144 articles** are reachable via `getTopic` (capped at top-5 per leaf).
2. **Data categories** (Salesforce DataCategory) — 1 group `Seller_Support_Knowledge` with 52 categories. The REST list endpoint returns only ~11 articles for the current user regardless of category param (org has access tagged differently per channel/profile).

The complete enumerable set is **only reachable via the site-search Aura action** — see "Content catalog stats" below.

The 9 top-level topic groups:

```
Getting started with Back Market
News & Information About Back Market
Quality & Sales
Products & Listings
CCBM - Orders & After Sales
Finance, Legal & Tax
Trade-In
Back Market Services
Integration & Connection
```

Article body HTML lives in custom Knowledge field `Knowledge__kav.Details__c` (rich-text). The standard REST endpoint exposes `layoutItems[]` which only contains metadata, NOT the body — that's why the body extraction must go through the Aura `getRecordWithFields` call.

ID systems to keep straight:
- `kA0...` = `KnowledgeArticleId` (the master article id, used by REST `support/knowledgeArticles`)
- `ka0...` = `KnowledgeArticleVersion.Id` (the per-version id, used by Aura `getRecordWithFields` and search `record.Id`)
- They are different objects. Don't pass one to an endpoint expecting the other.

## Content catalog stats

- **Articles enumerated: 242** (full coverage achievable via search seeds — first stop-word seed `'the'` returned 241/242 alone, confirming search is exhaustive for this user's permissioned set).
- Date range: 2022 → 2026. Year breakdown: 2022=24, 2023=39, 2024=13, 2025=79, 2026=87.
- Total topics: 9 top-level + 49 leaf sub-topics.
- Top topic-groups by article count (via topic walk; capped at top-5 per leaf, so under-counts):

```
27  Quality & Sales
21  Products & Listings
20  CCBM - Orders & After Sales
19  Finance, Legal & Tax
19  Trade-In
15  Getting started with Back Market
11  Integration & Connection
10  News & Information About Back Market
 6  Back Market Services
```

- All articles have `Language: en_GB` for this user. The article object supports translations (active codes seen: en_GB, fr, en_US, ja, en_AU) but only en_GB exposed to current user.
- ~96% have `Summary: null`; rely on `Title` + first paragraph of `Details__c`.

Full catalog: [`content-catalog.json`](./content-catalog.json). Per-article JSON files (one per article, includes full HTML body): [`articles/`](./articles/).

## Sample article schema

```jsonc
{
  "id": "ka0aT000000PxPtQAK",                              // KnowledgeArticleVersion.Id
  "articleNumber": "000001114",
  "title": "Legal guidelines - Warranties & Withdrawal",
  "urlName": "Legal-guidelines-Warranties-Withdrawal",
  "url": "https://backmarket.my.site.com/ssc/s/article/Legal-guidelines-Warranties-Withdrawal",
  "language": "en_GB",
  "summary": null,
  "lastPublishedDate": "2026-03-18T09:22:20Z",
  "createdDate": "2021-10-21T14:41:53Z",
  "knowledgeArticleId": "kA03X000000SGqrSAG",
  "topics": [
    {"parent": "CCBM - Orders & After Sales", "topic": "Warranty & Withdrawal", "topicId": "0TO..."}
  ],
  "bodyHtml": "<p>...rich text HTML, ~6-30KB typical...</p>",
  "bodyExcerpt": "In this guide, we will briefly summarize how legal guaranties..."
}
```

## Risks / unknowns

- **Aura token stability across days** — not yet observed; the JWT carries an `iat` but `exp:0`. If extracts run from cron, refresh by reloading any `/ssc/s/` page first and re-reading `window.Aura.initConfig.token`.
- **fwuid changes on Salesforce framework upgrades.** Hard-coding it will break on the next SF release (~3x/year). Always re-sniff.
- **REST `support/knowledgeArticles` floor.** It returns only ~11 articles regardless of params. Mechanism unclear — likely tied to a `Channel` setting on each article (Csp/Pkb/App) or a profile-level "Knowledge Article Public Access" permission. Don't rely on REST for full enumeration.
- **getTopic caps at 5 articles per leaf.** No pagination param found. Search is the only authoritative enumerator.
- **Two non-callable Apex classes** (`ssc_KnowledgeController`, `ssc_HomeController`) exist but reject methods we tried — possibly intended for admin or different community profile. Worth a re-probe if access changes.
- **Attachments / file embeds inside articles** are linked as `/ssc/file-asset/...` URLs. Those were not downloaded (they range from icons to potentially larger files; per safety rules under 10KB only — skipped wholesale).
- **Translations**: only en_GB seen; if iCorrect needs other markets' SOPs, the same article ids likely have translated versions reachable by passing different `Accept-Language` to REST or `Language` filter on search.

## Skill recommendation — `domain-skills/backmarket-seller-support/extract.md`

Should contain:

1. **Bootstrap function** that reads `window.Aura.initConfig.token` and `.context.fwuid` from any `/ssc/s/*` page. Refresh on stale-token errors.
2. **Helper `aura_apex(classname, method, params)`** wrapping `aura://ApexActionController/ACTION$execute`.
3. **Helper `aura_get_record(recordId, fields)`** wrapping `getRecordWithFields`. Supports a batch variant taking a list of `recordIds`.
4. **Enumerator `list_articles()`** that calls the search endpoint with seed terms `['the','a','of','and','to']` and a high `pageSize`, dedupes by `record.Id`, and returns the full set (≥242 in current snapshot). Document that any single common stop-word seed gets effectively the full list.
5. **`fetch_article_body(version_id)`** + **`fetch_article_by_url_name(urlName)`** (the latter chains `getArticleVersionId` → `getRecordWithFields`).
6. **`list_topics()`** that fetches `getNavigationMenu` and walks `getTopic` for each top-level topic id, building the topic-tree.
7. **Field constants block** — pin: object `Knowledge__kav`, body field `Details__c`, version-id key prefix `ka0`, master-id key prefix `kA0`, category group `Seller_Support_Knowledge`.
8. **Caveats section** — REST `support/knowledgeArticles` is misleading (capped to ~11), `getTopic` capped to 5/leaf, ALWAYS use search to enumerate.
9. **Hard rule**: read-only. No POSTs to Case create, FeedItem, Voting, Notifications. Skill must explicitly disclaim writes.
10. **Refresh strategy**: re-run extract weekly via cron; diff `lastPublishedDate` to detect updated SOPs (87 articles published in 2026 already — Back Market actively maintains this base).
