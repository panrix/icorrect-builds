# Monday.com — building board automations

Custom-recipe automation builder on a board (`monday.com/boards/<board_id>`). Rebuilding ~80 automations on a fresh board is the canonical use case. Coordinate clicks pass through, but the picker dropdowns are virtualized React lists with CSS-modules class names — selectors fight you. Read this before scripting bulk creation.

## URL patterns

- Board: `https://<workspace>.monday.com/boards/<board_id>` — no query needed.
- Automations panel does not have its own route — it overlays the board page; the board URL stays the same while the modal is open. Closing it returns you to the board view automatically.

## Entry point — opening the automations panel

The "Automate" button is in the board's top-right toolbar. The Automations modal opens as a full-page React overlay (not a route change). Inside the modal:

- **Create** tab — recipe gallery + custom builder.
- **Manage** tab — list of all existing automations, with active toggle and `...` menu per row. **This is where you verify a freshly created automation is live.**

To build a one-off custom automation (not from a recipe), scroll the Create tab to "Custom Automations" → "Create custom automation". You land on the sentence builder: **"When [trigger]. Then [action]"**.

## Sentence-builder pattern

The builder is a fill-in-the-blank sentence with underlined placeholder tokens (e.g. `[status]`, `[column]`, `[date value]`). Every placeholder is a click target that opens a *different* picker dropdown. The pattern is identical for each:

1. `click(x, y)` on the underlined placeholder.
2. A dropdown appears below it with a search box at the top and option rows below.
3. Either type to filter, or scroll/click directly.
4. Click the row → dropdown closes, placeholder is replaced with the value.

When all placeholders are filled, the **Create automation** button at the bottom-left ungreys (becomes solid blue). Clicking it saves and returns you to the Manage tab with the new automation ACTIVE by default.

**No name field exists.** Monday auto-names the automation from the resolved sentence (e.g. `"When Repair Status changes to Received, set item Received to today"`). You can rename later via the row's `...` menu in the Manage tab.

## Stable selectors

Monday ships obfuscated CSS-module classnames (`_optionContainer_h3udq_4`), which rotate on build. Avoid them. Selectors that hold up:

- Dropdown options: `[role=menuitem]` *or* `[class*="option"]` — search both, the picker uses both depending on type. Filter by `textContent.trim() === '<exact label>'`.
- Buttons (Create automation, Keep building, Discard changes): `button` with exact `textContent.trim()` match.
- Manage-tab rows: don't try to find a specific row by selector — they're virtualized. Filter `document.querySelectorAll('*')` for elements containing the automation's sentence text and short text length, then read `getBoundingClientRect()` to drive coordinate clicks.

## Multi-span label trap

Picker rows render their labels split across multiple text nodes (icon span, name span, sometimes a badge span). A query like `querySelector('span').textContent === 'Repair Status'` returns nothing. Aggregate at the row level instead:

```js
[...document.querySelectorAll('[role=menuitem], [class*="option"]')]
  .find(el => el.textContent.trim() === 'Repair Status')
```

`textContent` (vs `innerText`) concatenates all descendants, which is what you want.

## Status-column picker — the "+ Add new column" trap

When the trigger is "status changes to X", the first placeholder (the status column) opens a picker listing every status column on the board. iCorrect's v2 board has 6: Repair, QC, Comms, Trade-in, Pause Reason, Shipping. Below the list is **"+ Add new column"**. Typing "Repair" filters to Repair-related rows but the "+ Add new column" row stays at the bottom of the filtered list and **looks identical to a result row**. Hit-detect it once and you'll open the Column Center modal mid-build, which is hard to escape (see next).

Always prefer JS-located coordinates over typed-then-clicked-by-eye for this picker:

```js
// Returns the click point for the exact row
[...document.querySelectorAll('[role=menuitem], [class*="option"]')]
  .find(el => el.textContent.trim() === 'Repair Status')
  .getBoundingClientRect()
```

## Escape from Column Center without losing automation state

If you accidentally open Column Center (or any other modal) from inside the automation builder, **do not press Escape blindly** — Escape on the empty backdrop triggers `Discard unsaved changes?` and clicking `Discard changes` wipes everything you've built. Instead:

1. Find the Column Center close button: `document.querySelector('.ReactModal__Content button[aria-label="Close"]')` (or any X icon inside `.ReactModal__Content`). Read its bounding rect, click it.
2. If the discard prompt does appear, click **Keep building** (NOT Escape) — locate by `button` with `textContent.trim() === 'Keep building'`.

## Date-value picker — "Today" is a fixed option

For "set [date column] to [date value]", the date-value picker is a small dropdown with `Today` as the first highlighted option, followed by board-derived values ("Item's received", "Item's deadline", "Item's booking time"). Click `Today` directly. The dropdown does not always auto-close on selection — pressing Escape inside the date dropdown re-triggers the discard prompt. Click outside the dropdown (e.g. on the sentence area) to close it instead.

## Verification — Manage tab

After clicking Create automation:

- The view auto-switches to Manage → Automations sub-tab.
- The new row appears at the top with the toggle ON (blue).
- "Updated" reads "Xsec ago".
- "Owner" shows the agent that created it (the logged-in user's avatar).

Verify with a screenshot of the Manage tab — the toggle state and the sentence text together confirm the automation is both saved and active.

## Bulk-creation pacing

For ~80 automations:

- The picker dropdowns hydrate from a websocket payload that lags the click by 200-400ms. After every placeholder click, `wait(0.5)` before the next interaction — without it, you get empty pickers that look like the click missed.
- After clicking `Create automation`, the Manage tab takes ~2-3s to fully populate (a spinner shows briefly). `wait(3)` before screenshotting for verification.

## What NOT to capture here

- Recipe-template IDs from the Create gallery (`Status changes to something → set date`). They're visible only when you hover the cards; the IDs in the URL aren't documented and rotate. Stick to the custom-builder path — it always works.
- Internal API endpoints — Monday's GraphQL API exists and is documented separately at `developer.monday.com`. If you have an API token, prefer that over UI scripting for bulk work; this skill exists for the no-token-available case (e.g. piloting on the user's signed-in browser).
