# Quote Wizard Menu Builder

A Node.js script that auto-generates 4 Shopify navigation menus for the quote wizard from existing Shopify collection data.

## Overview

This script fetches all collections from the Shopify Admin API, filters them to per-model collections (excluding repair-type collections), groups them by device and model series, and generates properly structured navigation menus for the quote wizard.

## Generated Menus

- `wizard-macbook-models` - 29 MacBook models across 5 groups
- `wizard-iphone-models` - 26 iPhone models across 5 groups  
- `wizard-ipad-models` - 44 iPad models across 3 groups
- `wizard-watch-models` - 58 Apple Watch models across 3 groups

**Total: 157 model collections processed from 189 total collections**

## How It Works

### 1. Collection Filtering

The script identifies per-model collections by:
- Starting with device prefix (`macbook-`, `iphone-`, `ipad-`, `apple-watch-`)
- Ending with `-repair-prices`
- Containing model identifiers (chip versions, model numbers, years)
- **Excluding** generic repair-type collections like:
  - `macbook-screen-repair-prices`
  - `iphone-battery-repair-prices`
  - `macbook-pro-16-repair-prices` (size-only, no model)

### 2. Grouping Logic

**MacBook Groups:**
- MacBook Pro 16": patterns `macbook-pro-16`
- MacBook Pro 14": patterns `macbook-pro-14`  
- MacBook Pro 13": patterns `macbook-pro-13`
- MacBook Air 15": patterns `macbook-air-15`
- MacBook Air 13": patterns `macbook-air-13`

**iPhone Groups:**
- iPhone 16 series: `iphone-16`
- iPhone 15 series: `iphone-15`
- iPhone 14 series: `iphone-14`
- iPhone 13 series: `iphone-13`
- Older iPhones: `iphone-se`, `iphone-12`, `iphone-11`

**iPad Groups:**
- iPad Pro: `ipad-pro`
- iPad Air: `ipad-air`
- iPad + iPad Mini: `ipad-mini`, `ipad-` (catch-all)

**Apple Watch Groups:**
- Apple Watch Ultra: `apple-watch-ultra`
- Apple Watch Series: `apple-watch-series`
- Apple Watch SE: `apple-watch-se`

### 3. Sorting

Models within each group are sorted by year (newest first), with fallback to chip generation and alphabetical order.

## Usage

### Environment Setup

Requires environment variable:
```bash
SHOPIFY_ACCESS_TOKEN=your_access_token_here
```

The script automatically sources from `/home/ricky/config/api-keys/.env`.

### Running the Script

```bash
# Dry run (shows what would be created, saves JSON files)
node rebuild-wizard-menus.js --dry-run

# Live run (attempts API calls + saves JSON files)
node rebuild-wizard-menus.js
```

## Current Limitation: Menu API Access

The current Shopify access token does not include the `online_store_navigation` scope required for menu API access. The script gracefully handles this by:

1. **Detecting scope limitation** and switching to JSON export mode
2. **Generating menu JSON files** for manual import
3. **Providing clear instructions** for manual import

### Manual Import Process

1. Go to Shopify Admin → Online Store → Navigation
2. Create new menu or edit existing menu
3. Use the generated JSON structure from files like:
   - `wizard-macbook-models.json`
   - `wizard-iphone-models.json`
   - `wizard-ipad-models.json`
   - `wizard-watch-models.json`

## Rate Limiting

The script respects Shopify's 2 requests/second rate limit with 500ms delays between API calls.

## Error Handling

- **Collection fetch failures**: Tries both smart_collections and custom_collections APIs
- **Menu API failures**: Falls back to JSON generation
- **Network errors**: Retries with exponential backoff
- **Invalid collections**: Skipped with logging

## Output Files

All generated menu files follow this structure:
```json
{
  "title": "MacBook Models for Quote Wizard",
  "handle": "wizard-macbook-models",
  "links": [
    {
      "title": "MacBook Pro 16\"",
      "url": "",
      "links": [
        {
          "title": "MacBook Pro 16\" 'M4 Max' A3186 (2024) Repair Prices",
          "url": "/collections/macbook-pro-16-m4-max-a3186-2024-repair-prices",
          "links": []
        }
      ]
    }
  ]
}
```

## Maintenance

To add new models:
1. Create collection in Shopify with proper naming convention
2. Re-run this script
3. The new model will automatically appear in the appropriate group and position

## Dependencies

- Node.js
- `dotenv` package for environment variable loading
- Built-in `https` module for API requests