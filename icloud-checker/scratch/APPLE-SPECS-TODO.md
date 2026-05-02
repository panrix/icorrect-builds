# Apple Specs Integration — TODO

## Status: Ready to integrate

## What Works
- Apple Self Service Repair scraper: 100% success on 22 devices
- Returns: model, colour, chip, CPU, GPU, RAM, storage
- M1+ only — Intel returns "unsupported" instantly
- Results cached (serial → specs never change)
- Proxy: DataImpulse US residential ($0.001/lookup)

## Integration Plan
1. On serial entry (BM, M1+): run Apple spec lookup alongside SickW
2. Query BM Board (3892194968) for customer's claimed specs
3. Compare actual vs claimed
4. Post Monday comment with confirmed specs + mismatch flags
5. Slack alert if mismatches detected

## BM Board Columns (3892194968)
- `lookup` — Device (mirror)
- `text` — Model Number
- `mirror` — Colour (mirror)
- `status__1` — RAM
- `color2` — SSD
- `status7__1` — CPU
- `status8__1` — GPU
- `text5__1` — Intel Specs

## Main Board Link
- `board_relation5` — links main board item to BM board item
- `text_mky01vb4` — BM Trade-in ID (order public ID)

## Apple findMy ≠ iCloud Lock
- Tested 6 devices: findMy returns false for ALL (locked and unlocked)
- Apple's findMy field is NOT reliable for iCloud status
- Must keep SickW ($0.04/check) for iCloud
