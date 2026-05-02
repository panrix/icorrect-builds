# Shopify Website & E-commerce

> **Source:** Compiled from Claude.ai conversation history (Oct 2025 – Feb 2026)
> **Status:** Migration from WordPress to Shopify in progress — multiple blockers identified
> **Last updated:** 23 Feb 2026

---

## Overview

iCorrect is migrating from WordPress to Shopify. The Shopify store is built but not fully launched. Multiple tasks remain around URL cleanup, SEO migration, content audit, and automation integration.

## Shopify Store Details

| Field | Value |
|-------|-------|
| Store URL | i-correct-final.myshopify.com |
| Admin URL | https://admin.shopify.com/store/i-correct-final |
| Live domain | icorrect.co.uk |
| Current platform | WordPress (still live) |
| Custom App | "iCorrect Automation" — installed with API scopes: read_orders, write_orders, read_products, read_customers, read_inventory |

---

## Launch Blockers (as of last discussion)

### P0 (Must fix before launch)
1. **Fix product handles & URLs** — some URLs/handles are incorrect (documented in GPT conversation PDF, uploaded to Claude project)
2. **URL redirects** — map all old WordPress URLs to new Shopify URLs (301 redirects). Old URLs are flat: `icorrect.co.uk/iphone-16-repairs`. New URLs use Shopify structure: `icorrect.co.uk/collections/iphone-16-repairs`
3. **Meta information** — transfer SEO meta titles and descriptions from WordPress to Shopify via CSV
4. **Blog migration** — move all blog posts from WordPress to Shopify
5. **Collections page bug** — "View More" button not clicking on collection pages
6. **Theme consistency** — button styling inconsistent across collection pages

### P1 (Post-launch improvements)
1. **Content audit** — review top 20 product pages for accuracy
2. **YouTube content mapping** — map highest-performing videos to relevant product pages
3. **Pricing strategy** — raise prices on current site where below value
4. **Shopify → Monday automation** — automated order processing
5. **Facebook & Google pixels** — install tracking pixels
6. **Stripe payment gateway** — configure in Shopify

---

## Shopify → Monday.com Automation (Planned)

### Order Flow
Shopify order created → n8n webhook → Create Monday item → Create Intercom conversation → Store conversation link

### Column Mapping (Verified)
| Shopify Field | Monday Column | Column ID |
|--------------|---------------|-----------|
| billing_address.name | Item Name | `name` |
| email | Email | `text5` |
| shipping_address.phone / phone | Phone | `text00` |
| billing_address.company | Company | `text15` |
| shipping_address.address1 | Street | `passcode` |
| shipping_address.zip | Post Code | `text93` |
| financial_status = "paid" | Payment Status | `payment_status` → "Confirmed" |
| (auto) | Payment Method | `payment_method` → "Shopify" |
| (auto) | Status | `status4` → "New Repair" |
| (auto) | Client Type | `status` → "End User" |
| line_items[].properties "Service Type" | Service | `service` → Walk-In or Mail-In |
| line_items[].properties "Preferred Date" | Walk-In Date | `date6` |
| line_items[].title contains "Diagnostic" | Repair Type | `status24` → index 2 |
| (from Intercom) | Intercom Link | `link1` → URL, display "Fin" |

### Product Linking Issue
Products & Pricing board (2477699024) has a "Shopify ID" column (`text_mkzdte13`) but it's empty. Until populated, Ferrari manually links products after order creation.

---

## DNS & Email Migration

### Current State
- Domain DNS managed by Siteground
- Email currently hosted by Siteground
- Migrating to Google Workspace for email
- Intercom needs DNS authentication (CNAME + TXT records)

### Migration Sequence (documented)
1. Create Google Workspace accounts
2. Add Intercom DNS records to Siteground (CNAME + TXT)
3. Wait for Intercom authentication to show green
4. Switch MX records to Google
5. Wait 24-48 hours for propagation
6. Set up Gmail → Intercom routing rule for support@
7. Test thoroughly
8. Remove Zendesk DNS entries

---

## Team Assignments
| Person | Role |
|--------|------|
| Vishwa | SEO, content audit, URL fixes, blog migration, YouTube mapping |
| Developers (Slack channel) | Theme fixes, button bugs, technical issues |
| Ricky | Automation integration, strategic decisions |
| Ferrari | Product/pricing management, order processing |

---

## Verification Checklist for Jarvis

- [ ] Check current Shopify store status — is it live or still in development?
- [ ] Verify Shopify API credentials in n8n
- [ ] Check if URL redirects have been implemented
- [ ] Verify DNS status — has Google Workspace migration happened?
- [ ] Check if Intercom DNS authentication is active
- [ ] Test Shopify webhook delivery
- [ ] Verify Products & Pricing board Shopify ID column status
