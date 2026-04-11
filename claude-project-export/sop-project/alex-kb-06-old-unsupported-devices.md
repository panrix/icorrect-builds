# KB-06: Old & Unsupported Devices

**Last updated:** 2026-03-04
**Status:** Ready for agent use
**Priority:** MEDIUM

---

## Overview

iCorrect focuses on current-generation Apple devices. When a customer enquires about an old or unsupported device, the repair cost often outweighs the device's value. The agent should handle these honestly — not escalate to humans.

---

## Decision Logic

**If the device is not found on the iCorrect website AND the device is old:**

→ Advise replacement. Do NOT escalate to humans.

Ricky's rule: *"We're not motivated for that."* Old devices are not worth taking on.

---

## What Counts as "Old"

- iPhone 7, iPhone X, or older
- MacBooks made before ~2016
- Any device where the customer's repair cost would likely exceed the device's resale value

---

## Agent Script

**Customer enquires about repairing an old device:**

> "Thanks for reaching out. Unfortunately, [device model] is an older model and we don't typically carry out repairs on it — the cost of parts and repair would likely exceed what the device is worth today. In most cases, we'd recommend upgrading to a newer model rather than investing in a repair. If you have any questions about what we do support, I'm happy to help."

---

## What iCorrect Repairs (current scope)

- iPhones (current and recent generations)
- iPads (current and recent generations)
- MacBook Air / MacBook Pro (Intel and Apple Silicon)
- Apple Watch

**Not supported:**
- iPhone 7, iPhone X Wi-Fi issues, and older models
- Windows laptops / non-Apple devices
- **TODO:** Ferrari to confirm full list of supported vs unsupported devices

---

## Gaps / TODO

- [ ] Ferrari to confirm: exact cutoff for "old" iPhones (is iPhone 8 supported? iPhone XS?)
- [ ] Ferrari to confirm: exact cutoff for MacBook models
- [ ] Ferrari to provide: full supported device list
