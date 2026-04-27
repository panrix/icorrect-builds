# Back Market private-API capability docs — for iCorrect

These three docs describe what BM's seller-portal backend lets you do **directly via HTTP**, bypassing the UI. Every capability listed here is something we could automate or wire into iCorrect's pipeline today, no extra credentials needed (your normal signed-in Chrome session is the auth).

The discovery story and the technical "how to call these" pattern are in `~/Developer/browser-harness/domain-skills/backmarket/api-discovery.md`. **These docs answer "what is *possible*?"** — read them as a menu of automation options.

| Doc | What it covers | iCorrect relevance |
|---|---|---|
| **[seller-experience.md](./seller-experience.md)** | Listings, pricing, orders, drafts, sales metrics, finance, insights, mailbook, onboarding, seller info — 60 endpoints | **High.** This is your day-to-day operations surface. Most automation wins live here. |
| [payout-experience.md](./payout-experience.md) | KYB (Know Your Business), business details, stakeholders, document uploads, payout submission — 13 endpoints | **Low/medium.** One-time setup territory. Useful if you ever expand to a new BM market or restructure. |
| [seller-chat.md](./seller-chat.md) | BM's seller-side chat agent (admin & conversation endpoints) — 5 endpoints | **Low.** Not the customer-facing chat. Looks like an internal tool / agent for sellers. |

## How to read these

Each doc groups endpoints by **capability area** rather than by raw URL. For each capability you'll see:

- **What it does** — plain English
- **Endpoint(s)** — the HTTP call shape
- **What you can change / read** — the actual fields
- **iCorrect use cases** — concrete things this would unlock for you, ranked by likely value

**🟢 = high-leverage / frequently used**
**🟡 = situational**
**🔴 = setup-time only or low-frequency**

## The big finding

Yesterday's discovery: **BM ships a documented OpenAPI 3.1 spec for these services.** That means:

- Every field, every parameter, every error code is machine-readable.
- We can generate type-safe client code from the specs (TypeScript/Python) if we want.
- We can detect when BM ships breaking changes by diffing the spec against a committed copy.
- The full inventory is at `/home/ricky/builds/backmarket/api-specs/` — three OpenAPI JSON files plus a consolidated inventory.

## What to do with this

1. **Skim each doc.** Mark capabilities you'd use.
2. **For each marked one**, ask: "is this currently a manual workflow for me or my team?"
3. **The intersection** — manual workflow + automatable via API + frequent — is your priority list for what to wire up.
4. Tell me which ones you want and I'll script them with the same safety contract as the SKU canary (GET-before, mutate, GET-after, diff, fail loud on unexpected).
