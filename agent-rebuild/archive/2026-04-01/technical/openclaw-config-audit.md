# OpenClaw Configuration Audit

**Audited**: 2026-02-26
**Config version**: `lastTouchedVersion` 2026.2.15 (last touched 2026-02-17T17:27:38Z)
**Wizard last run**: 2026-02-16 (`doctor` command, version 2026.2.14)

---

## 1. Agent Registry

### 1.1 Active Agents in Config (14 entries)

| # | Agent ID | Display Name | Model | Workspace Override | agentDir Override |
|---|----------|-------------|-------|--------------------|-------------------|
| 1 | `main` | Jarvis | **(defaults -- Opus 4.6 via gateway)** | No (uses default) | No |
| 2 | `team` | Team Jarvis | `claude-sonnet-4-6` | Yes | Yes |
| 3 | `backmarket` | BM Jarvis | `anthropic/claude-sonnet-4-6` | Yes | Yes |
| 4 | `systems` | Sys Jarvis | `anthropic/claude-sonnet-4-6` | Yes | Yes |
| 5 | `website` | Web Jarvis | `claude-sonnet-4-6` | Yes | Yes |
| 6 | `parts` | Parts Jarvis | `claude-sonnet-4-6` | Yes | Yes |
| 7 | `marketing` | Marketing Jarvis | `anthropic/claude-sonnet-4-6` | Yes | Yes |
| 8 | `slack-jarvis` | Slack Jarvis | `anthropic/claude-sonnet-4-6` | Yes | Yes |
| 9 | `pm` | PM Jarvis | `anthropic/claude-sonnet-4-6` | Yes | Yes |
| 10 | `qa-plan` | QA Plan | `anthropic/claude-sonnet-4-6` | Yes | Yes |
| 11 | `qa-code` | QA Code | `anthropic/claude-sonnet-4-6` | Yes | Yes |
| 12 | `qa-data` | QA Data | `anthropic/claude-sonnet-4-6` | Yes | Yes |
| 13 | `operations` | Ops Jarvis | `anthropic/claude-sonnet-4-6` | Yes | Yes |
| 14 | `customer-service` | CS Jarvis | `anthropic/claude-sonnet-4-6` | Yes | Yes |

### 1.2 Model Format Inconsistency

Two different model string formats are in use:
- **Without prefix**: `claude-sonnet-4-6` (team, website, parts)
- **With prefix**: `anthropic/claude-sonnet-4-6` (backmarket, systems, marketing, slack-jarvis, pm, qa-plan, qa-code, qa-data, operations, customer-service)

Both may work, but this is inconsistent and could cause issues if OpenClaw validates model strings differently.

### 1.3 Main Agent Has No Explicit Model

The `main` agent has no `model` field -- it relies on whatever the gateway default is. MEMORY.md says it should be Opus 4.6, but this is not explicitly set in the config.

### 1.4 Agent Directories on Disk (20 dirs)

```
backmarket/          customer-service/    finance-archived/    finn/
main/                marketing/           operations/          parts/
pm/                  processes/           qa-code/             qa-data/
qa-plan/             schedule-archived/   slack-jarvis/        systems/
team/                website/
```

**Orphaned directories** (exist on disk but NOT in agent list):
- `finance-archived/` -- correctly archived, no config entry
- `finn/` -- retired, no config entry. Not cleaned up with `-archived` suffix.
- `processes/` -- retired, no config entry. Not cleaned up with `-archived` suffix.
- `schedule-archived/` -- correctly archived, no config entry

### 1.5 Missing `schedule` Agent

The `schedule` agent is listed in `tools.agentToAgent.allow` but does NOT exist in `agents.list`. This means agent-to-agent routing to `schedule` will either silently fail or error.

---

## 2. Telegram Bindings

| Agent ID | Telegram Chat ID | Binding Type |
|----------|-----------------|--------------|
| `team` | `-1003708695596` | group |
| `backmarket` | `-1003888456344` | group |
| `systems` | `-1003664343993` | group |
| `website` | `-1003782026238` | group |
| `operations` | `-1003336872091` | group |
| `parts` | `-1003661034075` | group |
| `customer-service` | `-1003729373199` | group |
| `marketing` | `-1003356921530` | group |
| `pm` | `-1003773048973` | group |

### 2.1 Agents WITHOUT Telegram Bindings
- `main` -- uses DMs (default fallback), correct
- `qa-plan`, `qa-code`, `qa-data` -- internal agents, no Telegram, correct by design
- `slack-jarvis` -- bound to Slack channel only, correct

### 2.2 Activity Log Group
The `agent-activity-logger` hook posts to `-1003896233105` (hardcoded in handler.js, not in config bindings). This is fine since it is not an agent binding.

---

## 3. Slack Binding

```json
{
  "agentId": "slack-jarvis",
  "match": { "channel": "slack" }
}
```

Catches ALL Slack traffic. No group/channel filtering.

---

## 4. Gateway Settings

| Setting | Value | Notes |
|---------|-------|-------|
| Port | `18789` | |
| Mode | `local` | |
| Bind | `lan` | Listens on LAN interface, not just localhost |
| Auth mode | `token` | 48-char hex token |
| Tailscale | `off` | |

### 4.1 Control UI

```json
"controlUi": {
  "allowedOrigins": [
    "http://localhost:18789",
    "http://127.0.0.1:18789",
    "http://46.225.53.159:18789"
  ]
}
```

All HTTP (not HTTPS). The public IP origin (`46.225.53.159:18789`) means the control UI is accessible from the public internet if port 18789 is open. This is a security concern -- the only protection is the gateway auth token.

---

## 5. Defaults (Applied to All Agents)

### 5.1 Workspace
- Default workspace: `/home/ricky/.openclaw/agents/main/workspace` -- only `main` uses this; all others override.

### 5.2 Memory and Context
| Setting | Value |
|---------|-------|
| `memorySearch.enabled` | `true` |
| `contextPruning.mode` | `cache-ttl` |
| `contextPruning.ttl` | `12h` |
| `bootstrapTotalMaxChars` | `45000` |

### 5.3 Compaction
| Setting | Value |
|---------|-------|
| `compaction.mode` | `safeguard` |
| `memoryFlush.enabled` | `true` |
| `memoryFlush.softThresholdTokens` | `4000` |
| `memoryFlush.systemPrompt` | "Session nearing compaction. Store durable memories now." |
| `memoryFlush.prompt` | "Write any lasting notes to memory/YYYY-MM-DD.md; reply with NO_REPLY if nothing to store." |

**MISMATCH**: `softThresholdTokens` is `4000` in the config, but MEMORY.md says it should be `20000`. One of these is wrong. At 4000 tokens, compaction fires very early -- likely too aggressive.

### 5.4 Concurrency
| Setting | Value |
|---------|-------|
| `maxConcurrent` | `6` |
| `subagents.maxConcurrent` | `8` |

### 5.5 Heartbeat
- `every`: `1h`

### 5.6 Sandbox
- `browser.enabled`: `true`

---

## 6. Messaging Settings

| Setting | Value | Notes |
|---------|-------|-------|
| `inbound.debounceMs` | `3000` | Default debounce |
| `byChannel.telegram` | `3000` | Telegram-specific debounce |
| `ackReactionScope` | `group-mentions` | Only react to mentions in groups |

### 6.1 Session Settings
| Setting | Value |
|---------|-------|
| `dmScope` | `per-channel-peer` |
| `agentToAgent.maxPingPongTurns` | `2` |

---

## 7. Channels

### 7.1 Telegram
| Setting | Value |
|---------|-------|
| Bot name | "Jarvis" |
| Enabled | `true` |
| DM policy | `pairing` |
| Group policy | `open` |
| Require mention in groups | `false` (wildcard `*`) |
| Stream mode | `partial` |

**Consideration**: `requireMention: false` for ALL groups means every message in every linked group triggers the bot. This is likely intentional but expensive -- every casual message burns API credits.

### 7.2 Slack
| Setting | Value |
|---------|-------|
| Mode | `socket` |
| Enabled | `true` |
| DM policy | `open` |
| Group policy | `allowlist` |
| Allow from | `["*"]` (wildcard) |
| User token read-only | `true` |

---

## 8. Hooks

### 8.1 Internal Hooks (all enabled)

| Hook | Trigger | Purpose |
|------|---------|---------|
| `session-memory` | Built-in | Manages session memory (50 messages retained) |
| `command-logger` | Built-in | Logs commands |
| `supabase-bootstrap` | `agent:bootstrap` | Injects BOOTSTRAP.md with: mandatory save-fact instructions, 20 recent memory facts, memory summaries, unread inter-agent messages. Also writes heartbeat. |
| `dependency-check` | `agent:bootstrap` | Checks Supabase connectivity at session start. If unreachable: injects hard-block message, alerts Systems Jarvis Telegram group. Also writes health file to `/tmp/agent-health/`. |
| `supabase-memory` | `command:new` | On session end: writes `last_completed` heartbeat to Supabase. (Misnamed -- it is really a session-end heartbeat writer, not a memory sync.) |
| `agent-activity-logger` | `agent:bootstrap` + `command:new` | Logs session start/end to `agent_activity` table in Supabase AND posts to Telegram activity group. |

### 8.2 Hook File Locations
```
/home/ricky/.openclaw/hooks/supabase-bootstrap/handler.js
/home/ricky/.openclaw/hooks/agent-activity-logger/handler.js
/home/ricky/.openclaw/hooks/supabase-memory/handler.js
/home/ricky/.openclaw/hooks/dependency-check/handler.js
```

### 8.3 Hook Issues

1. **`supabase-memory` is misnamed**: It does not sync memory -- it writes a heartbeat on session end. The actual memory sync is done by `sync-memory-to-supabase.py` via cron.

2. **`supabase-bootstrap` still instructs agents to use `save-fact.py`**: MEMORY.md documents that agents ignore this bash CLI instruction and prefer writing to `memory/*.md` files instead. The instruction wastes bootstrap token budget (~500 chars).

3. **`dependency-check` writes to `/tmp/agent-health/`**: Health files in /tmp are ephemeral and will be lost on reboot. Per security rules, backups/state should not go in /tmp.

4. **Bot token hardcoded** in `health-check.sh` script AND referenced via env in hooks -- inconsistent approach.

5. **`dependency-check` alerts go to Systems Jarvis group** (`-1003664343993`), not a dedicated alerts channel.

---

## 9. Plugins

### 9.1 Enabled
| Plugin | Status | Notes |
|--------|--------|-------|
| `telegram` | Enabled | Core messaging |
| `slack` | Enabled | Core messaging |
| `openclaw-mcp-adapter` | Enabled | Browser automation via browser-use MCP |

### 9.2 MCP Adapter Config
- **Transport**: stdio
- **Command**: `/home/ricky/.local/bin/browser-use --mcp`
- **Headless**: true
- **Proxy**: DataImpulse (gw.dataimpulse.com:823), UK geo (`__cr.gb`)

**Security issue**: Proxy credentials (username + password) are hardcoded in the config file. These should be in an env file.

### 9.3 Plugin Install
- `openclaw-mcp-adapter` v0.1.1, installed 2026-02-10 via npm
- Install path: `/home/ricky/.openclaw/extensions/openclaw-mcp-adapter`

---

## 10. Browser Config

| Setting | Value |
|---------|-------|
| Executable | `/home/ricky/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome` |
| Headless | `true` |
| No sandbox | `true` |
| Default profile | `openclaw` |

---

## 11. Tools / Agent-to-Agent

### 11.1 Allowed A2A Agents
```
main, operations, backmarket, team, parts, marketing,
website, systems, customer-service, qa-plan, qa-code,
qa-data, schedule, pm, slack-jarvis
```

**Issue**: `schedule` is in the allow list but is NOT a registered agent (it was retired/archived). Should be removed.

### 11.2 Media / Audio
- Whisper CLI at `/home/ricky/.local/bin/whisper` with `base` model
- Used for voice message transcription

### 11.3 Sessions
- `visibility`: `all` -- all agents can see all sessions

---

## 12. Scripts (in ~/.openclaw/scripts/)

| Script | Size | Purpose |
|--------|------|---------|
| `health-check.sh` | 2.7KB | Checks gateway status, restarts, Telegram API reachability, memory %, disk %. Alerts via Telegram DM to Ricky. Has hardcoded bot token. |
| `mc-task.sh` | 7.4KB | Mission Control task management script. |
| `sync-token.sh` | 4.7KB | Token synchronization script. Likely dead code from old token sync approach (replaced by 1-year OAuth token in systemd override). |

---

## 13. Credentials Exposure Summary

The following credentials are embedded directly in `openclaw.json`:

| Credential | Location in Config |
|-----------|-------------------|
| Telegram bot token | `channels.telegram.botToken` |
| Slack bot token | `channels.slack.botToken` |
| Slack app token | `channels.slack.appToken` |
| Slack user token | `channels.slack.userToken` |
| Gateway auth token | `gateway.auth.token` |
| DataImpulse proxy user/pass | `plugins.entries.openclaw-mcp-adapter.config` |

Additionally, `health-check.sh` has the Telegram bot token hardcoded.

**Note**: OpenClaw likely requires channel tokens in the config file by design. But the proxy credentials should be externalized, and the health-check script should reference env vars instead of hardcoding tokens.

---

## 14. V3 CHANGES NEEDED

### Critical

1. **Fix `softThresholdTokens` mismatch**: Config says `4000`, MEMORY.md says `20000`. Determine correct value and align. At 4000, compaction fires too early -- agents lose context prematurely.

2. **Remove `schedule` from `tools.agentToAgent.allow`**: Agent does not exist. Will cause routing errors or silent failures.

3. **Set explicit model for `main` agent**: Currently relies on gateway default. Should be `claude-opus-4-6` (or `anthropic/claude-opus-4-6`).

4. **Normalize model string format**: Pick ONE format -- either `claude-sonnet-4-6` or `anthropic/claude-sonnet-4-6` -- and use it consistently across all agents.

5. **Remove save-fact CLI mandate from `supabase-bootstrap`**: Agents do not use it (documented in MEMORY.md). It wastes bootstrap token budget (~500 chars). Replace with: "Save durable facts to `memory/*.md` files."

6. **Move proxy credentials out of config**: DataImpulse proxy username/password should reference env vars, not be hardcoded in `openclaw.json`.

### Important

7. **Rename `supabase-memory` hook to `session-end-heartbeat`**: Current name is misleading. It does not do memory sync -- it writes a heartbeat timestamp.

8. **Move health files out of `/tmp`**: `dependency-check` writes to `/tmp/agent-health/`. Use `/home/ricky/.openclaw/health/` or similar persistent location.

9. **Clean up orphaned agent directories**: Rename `finn/` to `finn-archived/` and `processes/` to `processes-archived/` for consistency, or delete them if no longer needed.

10. **Review `requireMention: false` for all groups**: Every message in every group triggers the bot. If some groups are high-traffic, this burns API credits. Consider per-group overrides.

11. **Audit control UI security**: The public IP (`46.225.53.159:18789`) is in `allowedOrigins` over HTTP. If port 18789 is exposed, the control UI is accessible from the internet with only a token for protection. Consider:
    - Restricting to localhost/tailscale only
    - Adding HTTPS
    - Or confirming firewall blocks port 18789 from public

12. **Remove `sync-token.sh`**: If OAuth token approach (1-year token, set in systemd override) is the current standard, this script is dead code from the old sync approach.

### Nice to Have

13. **Add `enabled: false` to retired agent entries** instead of removing them entirely -- preserves config history while preventing accidental routing.

14. **Add per-agent model overrides in a consistent location**: Currently model is set at the agent list entry level. Consider a `defaults.model` field for the Sonnet agents and explicit override only for Opus (main).

15. **Document the `schedule` agent retirement** in the config (comment or separate tracking) so future audits do not flag it again.

16. **Consider adding `finn` and `processes` to a `retired` section** in the config rather than just relying on filesystem conventions.

---

## Appendix: Raw Agent Count Summary

- **In config `agents.list`**: 14 agents
- **In `bindings`**: 10 bindings (9 Telegram + 1 Slack)
- **In `tools.agentToAgent.allow`**: 15 agent IDs (includes retired `schedule`)
- **On disk**: 20 directories (14 active + 4 archived/retired + `finn` + `processes`)
- **With Telegram groups**: 9 agents
- **Internal only (no messaging channel)**: 3 (qa-plan, qa-code, qa-data)
- **Slack only**: 1 (slack-jarvis)
- **DM fallback**: 1 (main/Jarvis)
