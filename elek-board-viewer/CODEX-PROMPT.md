# Build Task: FlexBV Headless Board Viewer for Elek

You are building a headless board-viewing service on an Ubuntu VPS. The service lets an AI agent called "Elek" look up electronic components on Apple MacBook logic board schematics and return annotated screenshots to repair technicians via Telegram.

Follow the plan exactly. Do not skip phases. Do not improvise architecture — the plan has been QA'd twice.

---

## VPS State (verified 2026-03-28)

### Paths

| What | Path |
|------|------|
| **Project root (build here)** | `/home/ricky/builds/elek-board-viewer/` |
| **Elek agent workspace** | `/home/ricky/.openclaw/agents/diagnostics/workspace/` |
| **Schematics directory** | `/home/ricky/builds/elek-board-viewer/schematics/` |
| **FlexBV archive** | `/home/ricky/.openclaw/agents/diagnostics/workspace/FlexBV-5.1383-linux-00Y705628M9082135.tgz` |
| **FlexBV binary (inside archive)** | `FlexBV-5.1383-linux/flexbv` (lowercase) |
| **FlexBV PDF tool (inside archive)** | `FlexBV-5.1383-linux/fbvpdf` |
| **Elek TOOLS.md** | `/home/ricky/.openclaw/agents/diagnostics/workspace/TOOLS.md` |
| **Elek CLAUDE.md** | `/home/ricky/.openclaw/agents/diagnostics/workspace/CLAUDE.md` |

### Runtime user

Everything runs as `ricky`. Elek runs as `ricky`. Loginctl linger is enabled. systemd user services persist after logout.

### Already installed

- Xvfb (`/usr/bin/Xvfb`)
- Python 3

### NOT installed (install in Phase 1)

- xdotool
- imagemagick
- x11-utils
- openbox
- wmctrl
- xvfb is installed but confirm the package is complete

### Display :99

Available. Nothing using it.

---

## Board Inventory (authoritative mapping to verify against the workspace)

### Single-Revision Models

| Folder Name | Board # | .brd Codename | .brd Filename | Chip |
|-------------|---------|---------------|---------------|------|
| `A2179 820-01958` | 820-01958 | — | 820-01958.brd | Intel |
| `A2251 820-01949-A` | 820-01949-A | — | 820-01949-A.brd | Intel |
| `A2289 820-01987` | 820-01987 | — | 820-01987.brd | Intel |
| `A2337 820-02016` | 820-02016 | — | 820-02016.brd | M1 |
| `A2681 820-02536` | 820-02536 | PJM-MLB | PJM-MLB.brd | M2 |
| `A2780 820-02652` | 820-02652 | J416 | J416.brd | M3 Pro/Max (shared board) |
| `A2918 820-02757` | 820-02757 | — | 820-02757.brd | M3 |
| `A3113 820-03286` | 820-03286 | — | 820-03286.brd | M4 |
| `A3114 820-03285` | 820-03285 | — | 820-03285.brd | M4 Pro |

Note on A2338: treat `A2338` as a multi-revision model in the index. The M1 folder `A2338 820-02020` and the M2 folder `A2338 M2 820-02773` are both revisions of the same logical model. When addressed as just `A2338`, it should resolve to the M2 default revision.

Note on A2780: Single .brd file (J416) but TWO PDF schematics: `J416-C.pdf` (Max) and `J416-S.pdf` (Pro). Both PDFs should be indexed.

### Multi-Revision Models

#### A2338 — MacBook Pro 13" (M1 / M2)

| Folder Name | Board # | Codename | Chip | Default? |
|-------------|---------|----------|------|----------|
| `A2338 820-02020` | 820-02020 | — | M1 | No |
| `A2338 M2 820-02773` | 820-02773 | — | M2 | **Yes** |

Different chip generations. Default is M2.

#### A2442 — MacBook Pro 14" 2021 (M1 Pro / M1 Max)

| Folder Name | Board # | Codename | Chip | Default? |
|-------------|---------|----------|------|----------|
| `A2442 820-02098` | 820-02098 | J314-BTR | M1 Pro | **Yes** |
| `A2442 820-02443` | 820-02443 | J314-CTO | M1 Max | No |

BTR = Base Tier = Pro. CTO = Configure To Order = Max.

#### A2485 — MacBook Pro 16" 2021 (M1 Pro / M1 Max)

| Folder Name | Board # | Codename | Chip | Default? |
|-------------|---------|----------|------|----------|
| `A2485 820-02100` | 820-02100 | J316-EVTs | M1 Pro | **Yes** |
| `A2485 820-02382` | 820-02382 | J316-EVTc | M1 Max | No |

EVTs = EVT Standard = Pro. EVTc = EVT Custom = Max.

#### A2779 — MacBook Pro 14" 2023 (M3 Pro / M3 Max)

| Folder Name | Board # | Codename | Chip | Default? |
|-------------|---------|----------|------|----------|
| `A2779 820-02841` | 820-02841 | J414-S | M3 Pro | **Yes** |
| `A2779 820-02655` | 820-02655 | J414-C | M3 Max | No |

S = Standard = Pro. C = Custom = Max.

### Alias Rules

Each board should be findable by:
1. Model number: `A2442`
2. Board number: `820-02098`
3. Codename (if it has one): `J314-BTR`, `PJM-MLB`, `J416`

Alias collisions between different models = hard failure. Collisions between revisions of the same model = resolve to default revision.

### Codename Suffix Convention

| Suffix Pattern | Chip |
|----------------|------|
| `-BTR`, `-S`, `-EVTs` (standard/base) | Pro |
| `-CTO`, `-C`, `-EVTc` (custom/CTO) | Max |

Add a `chip` field to each revision in `board_index.json`.

---

## Elek's Current TOOLS.md

This is what Elek's TOOLS.md currently looks like. You will ADD a board viewer section to it in Phase 8.

```markdown
# TOOLS.md — Elek (Diagnostics)

## Monday.com API
- **Board ID**: 349212843 (iCorrect main board)
- **API**: `https://api.monday.com/v2` (GraphQL)
- **Token**: `/home/ricky/config/api-keys/.env` → `MONDAY_APP_TOKEN`
- **Key columns**: `status` (client type), `status24` (repair type), `color_mkwr7s1s` (ammeter reading)

## Key Paths
- **Schematics**: `schematics/` in workspace
- **Fault flows**: `knowledge/{board-model}/`
- **Case data**: `data/cases/`
- **API keys**: `/home/ricky/config/api-keys/.env`
- **Shared KB**: `kb/` (symlink to /home/ricky/kb/)

## Telegram
- **Group**: iCorrect Diagnostics
- **Bot**: Elek (@icorrect_diagnosticbot)

## Credentials
All keys in `/home/ricky/config/api-keys/.env`.
- **Monday.com**: `MONDAY_APP_TOKEN`
```

## Elek's Current CLAUDE.md Section 6 (Schematics)

This section is outdated — it says ".brd files cannot be parsed". After your build, update this section to reflect that .brd files CAN now be queried via board_lookup.py.

```markdown
## 6. Schematics

Schematics are stored at `schematics/{board-model}/` in the workspace.
- PDF schematics can be read directly
- .brd files (Cadence Allegro) cannot be parsed — use OpenBoardView for physical component locations
- Each board model gets its own directory
- Reference docs (power-on flows, etc.) go in `schematics/reference/`

**Available schematics** (update as Ricky adds more):
- `schematics/reference/` — M1 power-on flow PDF
```

---

## Architecture (mandatory — do not deviate)

### Four Layers

1. **Board Catalog** — `build_board_index.py` scans schematics dir, produces `board_index.json`
2. **Parser** — `brd_parser.py` decodes .brd files for component metadata. Parser failure MUST NOT block screenshot mode.
3. **FlexBV Runtime** — Xvfb + Openbox run as a systemd user service. FlexBV is managed by the controller script, NOT by systemd.
4. **CLI** — `board_lookup.py` is the only interface. Returns JSON on stdout. Logs go to files.

### Runtime Ownership (critical)

- **systemd** owns Xvfb and Openbox only. Service name: `flexbv-headless.service`
- **`flexbv_controller.py`** owns the FlexBV process. It starts, stops, and restarts FlexBV.
- Do NOT put FlexBV inside the systemd service. The two restart mechanisms will fight.

### Display

- `Xvfb :99 -screen 0 1920x1080x24`
- Export `DISPLAY=:99` everywhere.

### Screenshot

- Use ImageMagick `import -window <window_id> output.png` to capture the FlexBV window.
- Do NOT use `scrot`. Do NOT use fixed coordinates.
- Get window ID dynamically via `xdotool search`.

### Concurrency

- One FlexBV instance. Serialize all requests with a blocking file lock (`fcntl`).
- Lock timeout: 60 seconds. Error code: `lock_timeout`.

### State File

- `data/boardview_state/runtime.json` is a CACHE, not the source of truth.
- Every request must verify the live process before trusting cached state.

---

## Build Phases

### Phase 1: Headless Runtime

1. `sudo apt update && sudo apt install -y xdotool imagemagick x11-utils openbox wmctrl`
2. Extract FlexBV: `sudo mkdir -p /opt/flexbv && sudo tar -xzf <archive> -C /opt/flexbv --strip-components=1`
3. Verify: `/opt/flexbv/flexbv --help` or similar — confirm it runs.
4. Check shared library deps: `ldd /opt/flexbv/flexbv`
5. If ImageMagick policy blocks PNG operations, fix `/etc/ImageMagick-6/policy.xml`.
6. Create systemd user service at `~/.config/systemd/user/flexbv-headless.service`:
   - Starts Xvfb on :99
   - Starts Openbox on :99
   - Does NOT start FlexBV (controller handles that)
   - `Restart=on-failure`
   - Logs to `data/boardview_logs/flexbv-session.log`
7. `systemctl --user daemon-reload && systemctl --user enable --now flexbv-headless.service`
8. Verify: `DISPLAY=:99 xdpyinfo` should show display info.
9. **HARD GATE — FlexBV search discovery:**
   - Launch FlexBV manually: `DISPLAY=:99 /opt/flexbv/flexbv -i <any .brd file> &`
   - Find the window: `DISPLAY=:99 xdotool search --name FlexBV` (or try `--name flexbv`, `--class flexbv`)
   - Discover the component search method:
     - Try `Ctrl+F` for search dialog
     - Try `F3` for find
     - Try `Edit > Find` menu path
     - Try `Ctrl+G` for go-to-component
     - Check if FlexBV has a `--search` CLI flag
   - Document: what shortcut opens search, what the dialog looks like, what happens on found vs not-found
   - **Record this in the plan before proceeding to Phase 4. If no search method exists, stop and report.**

### Phase 2: Repo Scaffolding

Create these directories inside `/home/ricky/builds/elek-board-viewer/`:

```
scripts/
data/
data/screenshots/
data/boardview_logs/
data/boardview_state/
systemd/
```

### Phase 3: Board Catalog

Build `scripts/build_board_index.py`:
- Scan `/home/ricky/builds/elek-board-viewer/schematics/` for `.brd` files
- Use the board inventory tables above as the source of truth for model names, board numbers, codenames, chips, and defaults
- Output `data/board_index.json` with this shape:

```json
{
  "A2681": {
    "default_revision": "820-02536",
    "revisions": {
      "820-02536": {
        "board_path": "/home/ricky/builds/elek-board-viewer/schematics/A2681 820-02536/PJM-MLB.brd",
        "pdf_paths": ["/home/ricky/builds/elek-board-viewer/schematics/A2681 820-02536/A2681_Schematic.pdf"],
        "folder": "/home/ricky/builds/elek-board-viewer/schematics/A2681 820-02536",
        "codename": "PJM-MLB",
        "chip": "M2",
        "aliases": ["A2681", "820-02536", "PJM-MLB"]
      }
    }
  },
  "A2442": {
    "default_revision": "820-02098",
    "revisions": {
      "820-02098": {
        "board_path": "...",
        "pdf_paths": ["..."],
        "folder": "...",
        "codename": "J314-BTR",
        "chip": "M1 Pro",
        "aliases": ["A2442", "820-02098", "J314-BTR"]
      },
      "820-02443": {
        "board_path": "...",
        "pdf_paths": ["..."],
        "folder": "...",
        "codename": "J314-CTO",
        "chip": "M1 Max",
        "aliases": ["A2442", "820-02443", "J314-CTO"]
      }
    }
  }
}
```

Rules:
- All model keys uppercase
- `pdf_paths` is an array (A2780 has two PDFs per revision)
- `codename` is null if the .brd filename is just a board number
- `chip` field is mandatory for every revision
- Alias collisions between different models = script fails with error
- Run the script and verify all discovered board directories are indexed

### Phase 4: .brd Parser

Build `scripts/brd_parser.py`. The .brd files are XOR-encoded binary. Try XOR key `0x20` first; if that doesn't produce readable text, try other common keys or detect the key from the header.

Required API:
```python
class BoardData: ...
def load_board(path: str) -> BoardData: ...
def find_component(board: BoardData, name: str) -> Component | None: ...
def find_net(board: BoardData, net_name: str) -> list[Pin]: ...
def list_components(board: BoardData) -> list[str]: ...
def get_component_center(board: BoardData, name: str) -> dict | None: ...
```

Rules:
- Case-insensitive component lookup
- Preserve original component naming in output
- Return structured errors, never crash
- Parser failure MUST NOT block screenshot mode
- Run parser against all indexed revisions, output a report showing parse success/partial/failure and component count per board

### Phase 5: FlexBV Controller

Build `scripts/flexbv_controller.py`. This module owns the FlexBV process lifecycle.

Required functions:
- `ensure_runtime()` — verify Xvfb is up, FlexBV process exists, window exists
- `get_window_id()` — find FlexBV window via xdotool
- `focus_window()` — focus the FlexBV window
- `restart_runtime_if_dead()` — kill dead FlexBV, relaunch
- `load_board(board_path)` — kill FlexBV, relaunch with `-i <board_path>`, wait for window
- `search_component(name)` — execute the Phase 1-discovered search interaction
- `capture_window_png(output_path)` — `import -window <id> <path>`
- `annotate_image(input_path, output_path, label)` — add red text label via ImageMagick `convert`

Runtime check sequence (every request):
1. Confirm DISPLAY=:99 is reachable
2. Confirm FlexBV process exists (check PID)
3. Confirm FlexBV window exists (xdotool search)
4. Focus window
5. If any check fails → restart once → retry once → structured error on second failure

Board loading:
- Same board + healthy window = skip restart
- Different board = kill FlexBV, relaunch with `-i <new_board_path>`, wait for window

State file at `data/boardview_state/runtime.json`:
```json
{"pid": 12345, "window_id": "0x1234", "loaded_board": "/path/to/file.brd", "last_started_at": "...", "last_success_at": "..."}
```
Always verify live process before trusting this file.

Screenshot naming: `{timestamp}_{board}_{component}_{raw|annotated}.png`

### Phase 6: Agent CLI

Build `scripts/board_lookup.py` — the ONLY script Elek calls.

```bash
# Default (screenshot mode)
python3 scripts/board_lookup.py A2681 C8430

# Explicit revision
python3 scripts/board_lookup.py A2681:820-02536 C8430

# Metadata only (no GUI)
python3 scripts/board_lookup.py A2681 C8430 --info-only

# Skip annotation
python3 scripts/board_lookup.py A2681 C8430 --no-annotate
```

JSON success (stdout only):
```json
{
  "status": "ok",
  "board": "A2681",
  "revision": "820-02536",
  "chip": "M2",
  "component": "C8430",
  "board_path": "/abs/path/file.brd",
  "screenshot_path": "/abs/path/annotated.png",
  "raw_screenshot_path": "/abs/path/raw.png",
  "parser_status": "ok",
  "pins": [],
  "nets": [],
  "warnings": []
}
```

JSON error (stdout only):
```json
{
  "status": "error",
  "error_code": "component_not_found",
  "message": "Component C8430 was not found on board A2681 (820-02536, M2)",
  "board": "A2681",
  "revision": "820-02536",
  "component": "C8430",
  "warnings": []
}
```

Error codes: `board_not_found`, `component_not_found`, `parser_failed`, `runtime_unavailable`, `window_not_found`, `search_failed`, `screenshot_failed`, `lock_timeout`

Rules:
- JSON only on stdout. All logs/diagnostics to files.
- Exit 0 on success, non-zero on error.
- Normalize input (uppercase, strip spaces) but preserve original in output.
- If model has multiple revisions and none specified, use `default_revision` and include it in response.
- File lock (fcntl) around entire request lifecycle. Timeout: 60s.

### Phase 7: Logging & Cleanup

- `data/boardview_logs/requests.log` — one JSON line per request (timestamp, board, revision, component, mode, parser_status, duration_ms, status, error_code)
- `data/boardview_logs/flexbv-controller.log` — controller debug output
- Keep last 20 failed screenshots
- Add a cron entry or simple cleanup script for screenshots older than 7 days

### Phase 8: Agent Integration

Update Elek's docs at `/home/ricky/.openclaw/agents/diagnostics/workspace/`:

**Add to TOOLS.md:**
```markdown
## Board Viewer (FlexBV)
- **Command**: `python3 /home/ricky/builds/elek-board-viewer/scripts/board_lookup.py <board> <component>`
- **Revision syntax**: `A2442:820-02443` targets M1 Max specifically
- **Modes**: default (screenshot), `--info-only` (metadata only), `--no-annotate` (raw screenshot)
- **Output**: JSON on stdout with `screenshot_path` for the image to send
- **Boards**: see `data/board_index.json` for the full indexed inventory
- **Examples**:
  ```bash
  python3 /home/ricky/builds/elek-board-viewer/scripts/board_lookup.py A2681 C8430
  python3 /home/ricky/builds/elek-board-viewer/scripts/board_lookup.py A2442:820-02443 C8430
  python3 /home/ricky/builds/elek-board-viewer/scripts/board_lookup.py A2681 C8430 --info-only
  ```
```

**Update CLAUDE.md section 6** to replace "`.brd` files cannot be parsed" with instructions to use `board_lookup.py`.

### Phase 9: Verification

Run ALL of these and confirm they pass:

```bash
# Board index
python3 scripts/build_board_index.py

# Info-only mode
python3 scripts/board_lookup.py A2681 C8430 --info-only

# Screenshot mode
python3 scripts/board_lookup.py A2681 C8430

# Explicit revision
python3 scripts/board_lookup.py A2442:820-02443 C8430

# Missing component
python3 scripts/board_lookup.py A2681 NONEXISTENT

# Board switch
python3 scripts/board_lookup.py A2337 C8430

# Case normalization
python3 scripts/board_lookup.py a2681 c8430

# Repeated runs (same board, no restart)
python3 scripts/board_lookup.py A2681 C8430
python3 scripts/board_lookup.py A2681 C8430

# Cross-board round trip
python3 scripts/board_lookup.py A2337 C8430
python3 scripts/board_lookup.py A2681 C8430
```

Verify:
- [ ] systemd service is enabled and healthy after restart
- [ ] All discovered board directories are indexed in `board_index.json`
- [ ] Parser report exists
- [ ] Screenshots are actual FlexBV window captures (not blank/root display)
- [ ] JSON is valid and stdout-only
- [ ] Error cases return correct error codes
- [ ] Multi-revision default selection works
- [ ] Multi-revision explicit selection works

---

## Important Constraints

- All scripts should use `/usr/bin/env python3` shebang
- Pillow is required for image inspection, cropping, and annotation; otherwise prefer stdlib plus subprocess for xdotool/import/convert
- Lock file location: `data/boardview_state/flexbv.lock`
- All paths in board_index.json and JSON output must be absolute
- The schematics directory is READ ONLY — do not write anything into it
- Do not modify `openclaw.json` or any agent config outside Elek's workspace
