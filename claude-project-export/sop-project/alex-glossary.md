# iCorrect Domain Glossary

Terms used internally at iCorrect that you need to know before handling customer conversations or repair queries.

---

## Repair Types & Issues

### Flexgate
Failure of the display flex cable in MacBook Pro models (primarily 2016–2019). The ribbon cable connecting the screen to the logic board runs along the bottom of the display and cracks with repeated hinge use. Symptoms: stage light effect, display flicker when lid is opened past a certain angle, lines or bright patches at the bottom of the screen. **This is a cable repair, not a screen replacement.**

### Dustgate
Dust infiltrating the MacBook display assembly and settling between the backlight and LCD panel, causing uneven backlight (cloudy/hazy appearance). Primarily affects 2017–2018 MacBook Pro. **This is a backlight contamination repair, not a screen replacement.**

### Stage Light Effect
The visual symptom of Flexgate — semicircular bright spots appear along the bottom edge of the MacBook display, resembling stage spotlights. Caused by the backlight bleeding through the cracked flex cable area. Correct repair: Flexgate/display cable repair.

### Ghost Touch
A touchscreen (iPhone or iPad) registering phantom inputs with no user interaction. Caused by a faulty screen digitizer, a loose connector, or liquid damage affecting the touch layer. Correct repair: usually screen replacement; diagnostic needed if liquid damage suspected.

### Kernel Panic
A macOS system crash that forces an automatic reboot, usually showing an error: "Your computer restarted because of a problem." Can be caused by hardware (failing RAM, logic board fault, overheating) or software (driver conflict, OS corruption). Always requires a diagnostic to identify the root cause.

### Board-Level Repair
Component-level repair of the MacBook logic board using a microscope and specialist soldering equipment. iCorrect repairs the board itself rather than replacing it — this is their specialist capability. Most repair shops replace the entire board (expensive) or say it can't be fixed. iCorrect fixes what others won't.

### BGA Rework
Ball Grid Array soldering — a specialist process for reballing or resoldering chips on the logic board. Requires microscope-level precision. Handled by Safan (senior technician).

### Logic Board
The main circuit board of a Mac (equivalent to a motherboard in a PC). Contains the CPU, GPU (in Intel models), RAM, SSD controller, and other core components.

### T-Con Board
Timing Controller board — controls the screen panel's signal processing. Roni is researching a process to upgrade Intel-based MacBook screens by replacing the T-Con board with one compatible with Apple Silicon panels.

### Diagnostic
Assessment of a device to identify the fault before a repair is carried out. iCorrect's diagnostic fee is **£49**. Always £49 — never quote £99 (legacy Fin error).

---

## Turnaround Tiers

### Standard
Default turnaround. Varies by device: iPhone repairs ~2-4 hours; MacBook repairs 2-3 working days; iPad/Apple Watch 2-3 working days.

### Fast (MacBook Apple Silicon Screen only)
24-hour turnaround. Uplift: +£79 on the base repair price.

### Fastest (MacBook Apple Silicon Screen only)
4-hour turnaround (same day). Uplift: +£149 on the base repair price.

### Express Diagnostic (MacBook)
24-hour diagnostic turnaround. Uplift: +£79.

---

## Service Delivery Terms

### Walk-in / Drop-off
Customer brings their device to the iCorrect office in person. Address: 12 Margaret Street, London W1W 8JQ. Opening hours: Mon–Thu 9:30am–5:30pm, Fri 10am–5:30pm.

### Courier / Postal
Customer ships their device to iCorrect. Return shipping included. +£20 surcharge.

### Collection
iCorrect collects the device from the customer. Details on availability and charges: see KB-04 (pending Ferrari input).

### On-site / Enterprise
iCorrect visits customer premises. Corporate/enterprise clients only — not available for standard repairs.

---

## Business Terms

### VCCP
iCorrect's corporate client — an advertising agency. Managed on a dedicated Monday.com board (ID: 30348537). Corporate items follow naming format: `VCCP [Employee Name]`.

### Apple Silicon
MacBooks using M-series chips: M1, M2, M3, M4. All MacBooks manufactured from late 2020 onwards. Different repair paths and pricing tiers vs Intel models.

### Intel
MacBooks using Intel CPUs — manufactured before late 2020. Some turnaround tiers (Fast/Fastest) are not available for Intel models.

### A-number
The model identifier printed on the bottom of a MacBook (e.g. A2338, A2442). Used as the definitive identifier for model-specific repair eligibility and turnaround tier.

### Back Market (BM)
iCorrect's primary sales and trade-in channel — approximately 60% of revenue. BM charges 10% on both the buy side (trade-ins) and sell side (refurbished devices). All BM platform communications route to Ferrari directly.

### Buyback / Trade-in
Back Market's device buying program. Customers send their device to iCorrect via BM, who pays them. iCorrect refurbishes and resells.

### BuyBack Cap
BM's mechanism for penalising sellers who have poor metrics (high counter-offer rate, late processing). Limits the number of trade-in orders iCorrect can receive.

### Counter-offer Rate
The percentage of BM buyback orders where iCorrect counter-offers a lower price due to condition mismatch. Must stay below 18% — exceeding this damages seller score.

### Seller Score
BM's metric for seller quality. Affected by: late response rate, late processing rate, counter-offer rate, return rate. Poor seller score = capacity caps and account risk.

---

## Systems

### Monday.com
Primary project management and repair tracking system. Main board ID: 349212843. Search always by email (`text5`), not name.

### Intercom
Customer communication platform. Ferrari and Alex handle the inbox. Conversation link format: `https://app.intercom.com/a/inbox/pt6lwaq6/inbox/conversation/{id}`.

### Xero
Accounting and invoicing system. No agent API access yet — invoice queries go to Ferrari.

### Shopify
iCorrect's ecommerce platform. Store: `i-correct-final.myshopify.com`. Orders, product catalogue, and booking flow live here.

### Fin (Fin.ai)
Intercom's AI agent. Was handling customer emails until Feb 21 2026. **Disabled.** All conversations now handled manually by Ferrari. Finn had consistent issues: wrong repairs quoted, silent escalations, Back Market emails buried.

### PostHog
Analytics and session recording platform. Project ID: 296651. Used for UX/funnel data. Configured Mar 4 (commit f0393ff).

---

## People

### Safan (Saf)
Lead repair technician. Board-level specialist — handles diagnostics and logic board repair. Fastest repairer on the team.

### Misha (Mykhailo)
Lead refurbishment technician. Leads MacBook screen refurbishment. Also informally supervises Andreas.

### Roni
Quality control lead and parts manager. Final person to see every device before it leaves iCorrect. Also running T-Con board research.

### Ferrari (Michael Ferrari)
Client services, remote in Italy. First point of escalation for all CS and website work. Weekdays 8:30am–6pm GMT.

### Ricky
Owner and remote director, based in Bali (UTC+8). Final authority on pricing, corporate decisions, complaints, and anything Ferrari cannot resolve.

---

*Source: shared/TEAM.md, shared/COMPANY.md, customer-service/workspace/docs/knowledge-base/, customer-service/workspace/docs/finn-audit/, customer-service/workspace/docs/SOPs/intercom-handling.md, backmarket/workspace/MEMORY.md*
*Last updated: 2026-03-10*
