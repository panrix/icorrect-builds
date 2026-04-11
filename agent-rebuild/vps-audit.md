# VPS Audit

Date: 2026-04-04  
Audit window: 2026-04-04 around 08:58-09:05 UTC  
Scope: read-only audit of current VPS runtime state, configs, build directories, OpenClaw state, and major data usage.

## A. Infrastructure Audit

### A1. Summary

- RAM: 30 GiB total, 4.8 GiB used, 25 GiB available.
- Root disk: 75 GiB total, 51 GiB used, 22 GiB free, 71% used.
- Uptime: 4 days, 4:05 at capture time. CPU count: 16.
- Largest top-level directories under `/home/ricky`: `builds` 4.7G, `paperclip` 820M, `data` 541M, `mission-control-v2` 139M, `backups` 125M.
- Largest build directories: `elek-board-viewer` 4.4G, `intake-system` 139M, `backmarket` 56M.
- Largest OpenClaw agent directories: `main` 166M, `backmarket` 59M.
- User systemd services: 13 running, 0 failed, 8 inactive/dead.
- Docker: one running `n8n` container on port `5678`; one cached image using 1.65G disk.
- Nginx: `default`, `intake-form`, `marketing-intel`, `mission-control`, `n8n`, and `paperclip` present; two `mission-control.backup-*` files are also in `sites-enabled` and are included by `nginx.conf`.
- OpenClaw: gateway healthy, 17 agents listed, one enabled cron job (`Morning Inbox Triage`) in `error` state.

### A2. Command Outputs

#### `free -h`

```text
               total        used        free      shared  buff/cache   available
Mem:            30Gi       4.8Gi        11Gi        43Mi        15Gi        25Gi
Swap:          2.0Gi       195Mi       1.8Gi
```

#### `df -h`

```text
Filesystem      Size  Used Avail Use% Mounted on
tmpfs           3.1G  1.8M  3.1G   1% /run
efivarfs        256K   45K  207K  18% /sys/firmware/efi/efivars
/dev/sda1        75G   51G   22G  71% /
tmpfs            16G  1.4M   16G   1% /dev/shm
tmpfs           5.0M     0  5.0M   0% /run/lock
/dev/sda15      253M  146K  252M   1% /boot/efi
tmpfs           3.1G   68K  3.1G   1% /run/user/1000
```

#### `uptime`

```text
 08:58:03 up 4 days,  4:05,  3 users,  load average: 0.37, 0.40, 0.38
```

#### `nproc`

```text
16
```

#### `du -sh /home/ricky/*/`

```text
276K	/home/ricky/Claude-SOPs-for-iCorrect/
8.0K	/home/ricky/Downloads/
125M	/home/ricky/backups/
4.7G	/home/ricky/builds/
80K	/home/ricky/config/
541M	/home/ricky/data/
1.1M	/home/ricky/kb/
27M	/home/ricky/logs/
139M	/home/ricky/mission-control-v2/
5.1M	/home/ricky/n8n-data/
72K	/home/ricky/open-claw-research-setup/
820M	/home/ricky/paperclip/
28K	/home/ricky/shared-docs/
4.9M	/home/ricky/snap/
8.6M	/home/ricky/worktrees/
```

#### `du -sh /home/ricky/.openclaw/agents/*/`

```text
16M	/home/ricky/.openclaw/agents/alex-cs/
3.4M	/home/ricky/.openclaw/agents/arlo-website/
59M	/home/ricky/.openclaw/agents/backmarket/
228K	/home/ricky/.openclaw/agents/build-orchestrator/
192K	/home/ricky/.openclaw/agents/codex-builder/
192K	/home/ricky/.openclaw/agents/codex-reviewer/
17M	/home/ricky/.openclaw/agents/customer-service/
8.7M	/home/ricky/.openclaw/agents/diagnostics/
166M	/home/ricky/.openclaw/agents/main/
21M	/home/ricky/.openclaw/agents/marketing/
17M	/home/ricky/.openclaw/agents/operations/
9.2M	/home/ricky/.openclaw/agents/parts/
68K	/home/ricky/.openclaw/agents/pm/
3.6M	/home/ricky/.openclaw/agents/slack-jarvis/
19M	/home/ricky/.openclaw/agents/systems/
8.6M	/home/ricky/.openclaw/agents/team/
13M	/home/ricky/.openclaw/agents/website/
```

#### Extra: `du -sh /home/ricky/builds/*/ /home/ricky/builds/.[!.]*/ | sort -h`

```text
8.0K	/home/ricky/builds/.claude/
8.0K	/home/ricky/builds/inventory-system/
8.0K	/home/ricky/builds/whisper-api/
12K	/home/ricky/builds/intercom-agent/
12K	/home/ricky/builds/intercom/
12K	/home/ricky/builds/templates/
12K	/home/ricky/builds/website-conversion/
24K	/home/ricky/builds/bm-scripts/
24K	/home/ricky/builds/research/
28K	/home/ricky/builds/hiring/
36K	/home/ricky/builds/voice-notes/
40K	/home/ricky/builds/data-architecture/
48K	/home/ricky/builds/qa-system/
48K	/home/ricky/builds/repair-analysis/
52K	/home/ricky/builds/scripts/
56K	/home/ricky/builds/telephone-inbound/
60K	/home/ricky/builds/marketing-intelligence/
104K	/home/ricky/builds/documentation/
124K	/home/ricky/builds/server-config/
148K	/home/ricky/builds/intake-notifications/
216K	/home/ricky/builds/quote-wizard/
332K	/home/ricky/builds/data/
392K	/home/ricky/builds/webhook-migration/
520K	/home/ricky/builds/xero-invoice-automation/
544K	/home/ricky/builds/agents/
668K	/home/ricky/builds/agent-rebuild/
752K	/home/ricky/builds/team-audits/
4.7M	/home/ricky/builds/system-audit-2026-03-31/
5.3M	/home/ricky/builds/pricing-sync/
11M	/home/ricky/builds/.git/
11M	/home/ricky/builds/monday/
12M	/home/ricky/builds/llm-summary-endpoint/
14M	/home/ricky/builds/icorrect-shopify-theme/
16M	/home/ricky/builds/voice-note-pipeline/
19M	/home/ricky/builds/icloud-checker/
21M	/home/ricky/builds/royal-mail-automation/
24M	/home/ricky/builds/buyback-monitor/
30M	/home/ricky/builds/icorrect-parts-service/
56M	/home/ricky/builds/backmarket/
139M	/home/ricky/builds/intake-system/
4.4G	/home/ricky/builds/elek-board-viewer/
```

#### `systemctl --user list-units --type=service --state=running`

```text
  UNIT                         LOAD   ACTIVE SUB     DESCRIPTION
  bm-grade-check.service       loaded active running BM Grade Check Webhook Service (SOP 03)
  bm-payout.service            loaded active running BM Payout Webhook Service (SOP 03b)
  bm-shipping.service          loaded active running BM Shipping Confirmation Webhook Service (SOP 09)
  dbus.service                 loaded active running D-Bus User Message Bus
  flexbv-headless.service      loaded active running FlexBV headless Xvfb/Openbox session
  icloud-checker.service       loaded active running iCloud Checker Webhook Service
  icorrect-parts.service       loaded active running iCorrect Parts Deduction Service
  intake-form.service          loaded active running iCorrect Intake Form Preview
  llm-summary.service          loaded active running LLM Summary Endpoint for Monday.com updates
  openclaw-gateway.service     loaded active running OpenClaw Gateway (v2026.2.2-3)
  status-notifications.service loaded active running Monday Status Notification Service (status4 → Intercom)
  telephone-inbound.service    loaded active running Telephone Inbound Slack Server
  voice-note-worker.service    loaded active running Voice Note Pipeline (Slack -> Whisper -> Monday.com)
```

#### `systemctl --user list-units --type=service --state=failed`

```text
  UNIT LOAD ACTIVE SUB DESCRIPTION

0 loaded units listed.
```

#### `systemctl --user list-units --type=service --state=inactive`

```text
  UNIT                             LOAD      ACTIVE   SUB  DESCRIPTION
  boardview-cleanup.service        loaded    inactive dead Cleanup old boardview screenshots and logs
  dirmngr.service                  loaded    inactive dead GnuPG network certificate management daemon
  gpg-agent.service                loaded    inactive dead GnuPG cryptographic agent and passphrase cache
  keyboxd.service                  loaded    inactive dead GnuPG public key management service
  launchpadlib-cache-clean.service loaded    inactive dead Clean up old files in the Launchpadlib cache
  pk-debconf-helper.service        loaded    inactive dead debconf communication service
  snapd.session-agent.service      loaded    inactive dead snapd user session agent
● systemd-remount-fs.service       not-found inactive dead systemd-remount-fs.service
```

#### Extra: user service unit-file states

```text
UNIT FILE                                        STATE     PRESET
bm-grade-check.service                           enabled   enabled
bm-payout.service                                enabled   enabled
bm-shipping.service                              enabled   enabled
boardview-cleanup.service                        static    -
flexbv-headless.service                          enabled   enabled
icloud-checker.service                           enabled   enabled
icorrect-parts.service                           enabled   enabled
intake-form.service                              enabled   enabled
llm-summary.service                              enabled   enabled
marketing-intelligence-api.service               disabled  enabled
openclaw-gateway.service                         enabled   enabled
status-notifications.service                     enabled   enabled
telephone-inbound.service                        enabled   enabled
voice-note-worker.service                        enabled   enabled
```

#### `ss -tlnp`

```text
State  Recv-Q Send-Q Local Address:Port  Peer Address:PortProcess                                       
LISTEN 0      4096   127.0.0.53%lo:53         0.0.0.0:*                                                 
LISTEN 0      511        127.0.0.1:3100       0.0.0.0:*    users:(("node",pid=1371,fd=53))              
LISTEN 0      4096         0.0.0.0:5678       0.0.0.0:*                                                 
LISTEN 0      511          0.0.0.0:4175       0.0.0.0:*                                                 
LISTEN 0      5            0.0.0.0:4174       0.0.0.0:*    users:(("python3",pid=1445,fd=3))            
LISTEN 0      511        127.0.0.1:18791      0.0.0.0:*    users:(("openclaw-gatewa",pid=1724057,fd=24))
LISTEN 0      2048       127.0.0.1:8001       0.0.0.0:*    users:(("python3",pid=1205,fd=13))           
LISTEN 0      128        127.0.0.1:8003       0.0.0.0:*    users:(("python3",pid=1456,fd=4))            
LISTEN 0      511        127.0.0.1:8004       0.0.0.0:*    users:(("node",pid=1446,fd=21))              
LISTEN 0      511        127.0.0.1:8010       0.0.0.0:*    users:(("node",pid=779011,fd=21))            
LISTEN 0      511        127.0.0.1:8011       0.0.0.0:*    users:(("node",pid=1439,fd=21))              
LISTEN 0      511        127.0.0.1:8012       0.0.0.0:*    users:(("node",pid=1440,fd=21))              
LISTEN 0      511        127.0.0.1:8013       0.0.0.0:*    users:(("node",pid=1441,fd=21))              
LISTEN 0      511        127.0.0.1:8014       0.0.0.0:*    users:(("node",pid=772194,fd=21))            
LISTEN 0      4096         0.0.0.0:22         0.0.0.0:*                                                 
LISTEN 0      511          0.0.0.0:80         0.0.0.0:*                                                 
LISTEN 0      511          0.0.0.0:443        0.0.0.0:*                                                 
LISTEN 0      4096         0.0.0.0:631        0.0.0.0:*                                                 
LISTEN 0      200        127.0.0.1:54329      0.0.0.0:*    users:(("postgres",pid=2236,fd=9))           
LISTEN 0      511          0.0.0.0:18789      0.0.0.0:*    users:(("openclaw-gatewa",pid=1724057,fd=22))
LISTEN 6      5            0.0.0.0:3000       0.0.0.0:*    users:(("python3",pid=926717,fd=3))          
LISTEN 0      4096      127.0.0.54:53         0.0.0.0:*                                                 
LISTEN 0      4096            [::]:5678          [::]:*                                                 
LISTEN 0      200            [::1]:54329         [::]:*    users:(("postgres",pid=2236,fd=8))           
LISTEN 0      4096            [::]:22            [::]:*                                                 
LISTEN 0      511             [::]:80            [::]:*                                                 
LISTEN 0      4096            [::]:631           [::]:*                                                 
LISTEN 0      511                *:3001             *:*    users:(("node",pid=1444,fd=24))              
```

#### Port mapping summary

| Port | Listener | Runtime owner | Observed reference |
|---|---|---|---|
| 80/443 | Nginx | system service | enabled sites |
| 5678 | Docker container | `n8n` | `n8n` site |
| 4175 | Nginx | intake-form frontend listener | `intake-form` site |
| 4174 | Python HTTP server | `intake-form.service` | `intake-form` site backend |
| 3001 | Node | `icorrect-parts.service` | `mission-control` `/parts-webhook` |
| 8001 | `uvicorn` | manual process | `marketing-intel` site |
| 8003 | Python | `telephone-inbound.service` | `mission-control` `/slack/` and `/webhook/icloud-check/slack-interact` |
| 8004 | Node | `llm-summary.service` | `mission-control` `/api/summarize-updates` |
| 8010 | Node | `icloud-checker.service` | `mission-control` iCloud routes and BM counter-offer route |
| 8011 | Node | `bm-grade-check.service` | `mission-control` grade-check webhook |
| 8012 | Node | `bm-payout.service` | `mission-control` payout webhook |
| 8013 | Node | `bm-shipping.service` | `mission-control` shipping webhook |
| 8014 | Node | `status-notifications.service` | `mission-control` status-notification webhook |
| 18789 | Node | `openclaw-gateway.service` | OpenClaw gateway |
| 18791 | Node | `openclaw-gateway.service` | OpenClaw internal listener |
| 3100 | Node | manual `paperclip` backend | `paperclip` site |
| 54329 | Postgres | manual embedded DB for `paperclip` | used by `paperclip` backend |
| 3000 | Python | orphan/manual `xero_auth2.py` | no direct config reference found |
| 8002 | none | no listener | `mission-control` `/api/` still proxies here |

#### `ps aux --sort=-%mem | head -30`

The raw capture included the current Codex audit command line as one of the entries; that line is omitted below to keep the report legible. Everything else is preserved.

```text
USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
ricky      11362  0.9  2.6 1697648 854656 ?      Ss   Mar31  59:39 tmux new -s codex
ricky    1450831  0.9  1.7 12210488 568772 pts/2 Sl+  Apr03  15:46 claude
ricky     118701  0.2  1.5 1038880 488436 pts/11 Sl+  Mar31  14:06 /usr/lib/node_modules/@openai/codex/node_modules/@openai/codex-linux-x64/vendor/x86_64-unknown-linux-musl/codex/codex
ricky    1724057  1.5  1.4 22694008 468368 ?     Ssl  06:41   2:07 openclaw-gateway
ricky      13158  0.2  1.1 756024 356452 pts/6   Sl+  Mar31  16:38 /usr/lib/node_modules/@openai/codex/node_modules/@openai/codex-linux-x64/vendor/x86_64-unknown-linux-musl/codex/codex
ricky       1968  0.1  0.7 22379396 241200 ?     Sl   Mar31   7:05 node /usr/local/bin/n8n
ricky       1371  0.1  0.7 66124340 231448 ?     Sl   Mar31   8:56 /usr/bin/node --require /home/ricky/paperclip/node_modules/.pnpm/tsx@4.21.0/node_modules/tsx/dist/preflight.cjs --import file:///home/ricky/paperclip/node_modules/.pnpm/tsx@4.21.0/node_modules/tsx/dist/loader.mjs src/index.ts
ricky     835636 29.2  0.6 2847888 203996 ?      Sl   Apr01 1341:46 /opt/flexbv -D /home/ricky/builds/elek-board-viewer/data/boardview_state/runtime_xdg/FlexBV5/ddi/ddi6eaa35eeb266eee4b645aad57e627ffa
ricky     835564  0.0  0.5 2871432 177464 ?      Ssl  Apr01   3:00 /opt/flexbv/flexbv -x 1600 -y 900 -i /home/ricky/builds/elek-board-viewer/schematics/A2681 820-02536/PJM-MLB.brd
ricky      11415  0.5  0.4 552008 154928 pts/0   Sl+  Mar31  32:31 /usr/lib/node_modules/@openai/codex/node_modules/@openai/codex-linux-x64/vendor/x86_64-unknown-linux-musl/codex/codex
ricky     118320  0.0  0.3 515528 120084 pts/9   Sl+  Mar31   1:14 /usr/lib/node_modules/@openai/codex/node_modules/@openai/codex-linux-x64/vendor/x86_64-unknown-linux-musl/codex/codex
ricky     779011  0.0  0.3 11835072 118080 ?     Ssl  Apr01   0:10 /usr/bin/node src/index.js
ricky       2759  0.0  0.3 21709056 117820 ?     Sl   Mar31   5:18 node --disallow-code-generation-from-strings --disable-proto=delete /usr/local/lib/node_modules/n8n/node_modules/.pnpm/@n8n+task-runner@file+packages+@n8n+task-runner_@opentelemetry+api@1.9.0_@opentelemetry_eb51b38615a039445701c88b088f88d0/node_modules/@n8n/task-runner/dist/start.js
ricky      56194  0.1  0.3 543456 115276 pts/8   Sl+  Mar31   7:34 /usr/lib/node_modules/@openai/codex/node_modules/@openai/codex-linux-x64/vendor/x86_64-unknown-linux-musl/codex/codex
ricky    1724074  0.0  0.3 331472 100828 ?       Sl   06:41   0:03 /home/ricky/.local/share/pipx/venvs/browser-use/bin/python /home/ricky/.local/bin/browser-use --mcp
ricky     772194  0.0  0.3 11812804 99140 ?      Ssl  Apr01   0:08 /usr/bin/node index.js
root         555  0.0  0.2 132876 96052 ?        S<s  Mar31   0:50 /usr/lib/systemd/systemd-journald
ricky       1444  0.0  0.2 11813008 92168 ?      Ssl  Mar31   0:07 /usr/bin/node src/index.js
root        1363  0.0  0.2 2579444 84388 ?       Ssl  Mar31   0:58 /usr/bin/dockerd -H fd:// --containerd=/run/containerd/containerd.sock
ricky       1441  0.0  0.2 11805600 83400 ?      Ssl  Mar31   0:02 /usr/bin/node index.js
ricky     834498  0.3  0.2 220048 80952 ?        S    Apr01  17:16 Xvfb :99 -screen 0 1920x1080x24
ricky       1439  0.0  0.2 11804468 79640 ?      Ssl  Mar31   0:02 /usr/bin/node index.js
ricky       1542  0.1  0.2 1255456 78180 ?       Ssl  Mar31   7:01 PM2 v6.0.14: God Daemon (/home/ricky/.pm2)
root        1202  0.0  0.2 943052 73352 ?        Ssl  Mar31   5:51 /usr/bin/python3 /usr/bin/fail2ban-server -xf start
ricky    1724110  0.0  0.2 1025300 69160 ?       Sl   06:41   0:00 node /home/ricky/.openclaw/mcp-servers/pdf-tools/server.js
ricky       1208  0.0  0.1 1045872 61588 ?       Ssl  Mar31   0:00 node /home/ricky/paperclip/server/node_modules/.bin/../tsx/dist/cli.mjs src/index.ts
ricky       1446  0.0  0.1 1015652 61572 ?       Ssl  Mar31   0:01 /usr/bin/node server.js
ricky       1440  0.0  0.1 1015644 61448 ?       Ssl  Mar31   0:01 /usr/bin/node index.js
```

#### `ps aux --sort=-%cpu | head -20`

The raw capture included the current Codex audit process. That line is omitted below.

```text
USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
ricky     835636 29.2  0.6 2847888 203996 ?      Sl   Apr01 1341:46 /opt/flexbv -D /home/ricky/builds/elek-board-viewer/data/boardview_state/runtime_xdg/FlexBV5/ddi/ddi6eaa35eeb266eee4b645aad57e627ffa
ricky       1465  1.6  0.1  42488 34136 ?        Ss   Mar31 100:59 /usr/bin/python3 -u /home/ricky/builds/voice-note-pipeline/voice-note-worker.py
ricky    1724057  1.5  1.4 22694008 468368 ?     Ssl  06:41   2:07 openclaw-gateway
ricky      11362  0.9  2.6 1697648 854656 ?      Ss   Mar31  59:39 tmux new -s codex
ricky    1450831  0.9  1.7 12210488 568772 pts/2 Sl+  Apr03  15:46 claude
ricky      11415  0.5  0.4 552008 154928 pts/0   Sl+  Mar31  32:31 /usr/lib/node_modules/@openai/codex/node_modules/@openai/codex-linux-x64/vendor/x86_64-unknown-linux-musl/codex/codex
ricky     834498  0.3  0.2 220048 80952 ?        S    Apr01  17:16 Xvfb :99 -screen 0 1920x1080x24
ricky      13158  0.2  1.1 756024 356452 pts/6   Sl+  Mar31  16:38 /usr/lib/node_modules/@openai/codex/node_modules/@openai/codex-linux-x64/vendor/x86_64-unknown-linux-musl/codex/codex
ricky     118701  0.2  1.5 1038880 488436 pts/11 Sl+  Mar31  14:06 /usr/lib/node_modules/@openai/codex/node_modules/@openai/codex-linux-x64/vendor/x86_64-unknown-linux-musl/codex/codex
ricky       2160  0.1  0.0 1239884 15200 ?       Sl   Mar31   9:42 /home/ricky/paperclip/node_modules/.pnpm/@esbuild+linux-x64@0.27.3/node_modules/@esbuild/linux-x64/bin/esbuild --service=0.27.3 --ping
ricky       1423  0.1  0.0 1241164 16720 ?       Sl   Mar31   9:37 /home/ricky/paperclip/node_modules/.pnpm/@esbuild+linux-x64@0.27.3/node_modules/@esbuild/linux-x64/bin/esbuild --service=0.27.3 --ping
ricky       1205  0.1  0.1 159492 48936 ?        Ssl  Mar31   9:32 /usr/bin/python3 -m uvicorn api.main:app --host 127.0.0.1 --port 8001 --log-level info
root        1288  0.1  0.1 2384604 48948 ?       Ssl  Mar31   9:00 /usr/bin/containerd
ricky       1371  0.1  0.7 66124340 231448 ?     Sl   Mar31   8:56 /usr/bin/node --require /home/ricky/paperclip/node_modules/.pnpm/tsx@4.21.0/node_modules/tsx/dist/preflight.cjs --import file:///home/ricky/paperclip/node_modules/.pnpm/tsx@4.21.0/node_modules/tsx/dist/loader.mjs src/index.ts
ricky      56194  0.1  0.3 543456 115276 pts/8   Sl+  Mar31   7:34 /usr/lib/node_modules/@openai/codex/node_modules/@openai/codex-linux-x64/vendor/x86_64-unknown-linux-musl/codex/codex
ricky       1968  0.1  0.7 22379396 241200 ?     Sl   Mar31   7:05 node /usr/local/bin/n8n
ricky       1542  0.1  0.2 1255456 78180 ?       Ssl  Mar31   7:01 PM2 v6.0.14: God Daemon (/home/ricky/.pm2)
```

#### `docker ps -a`

```text
CONTAINER ID   IMAGE       COMMAND                  CREATED       STATUS      PORTS                                         NAMES
2da2fe80677e   n8nio/n8n   "tini -- /docker-ent…"   8 weeks ago   Up 4 days   0.0.0.0:5678->5678/tcp, [::]:5678->5678/tcp   n8n
```

#### `docker images`

```text
IMAGE              ID             DISK USAGE   CONTENT SIZE   EXTRA
n8nio/n8n:latest   a9beb0dcaa54       1.65GB          241MB   U
```

#### `crontab -l`

```text
# OpenClaw health check - every 15 minutes
*/15 * * * * /home/ricky/.openclaw/scripts/health-check.sh 2>> /tmp/openclaw/cron-errors.log

# Log rotation - compress after 2 days, delete compressed after 14 days
0 4 * * * find /tmp/openclaw -name '*.log' -mtime +2 ! -name '*.gz' -exec gzip {} \; 2>/dev/null
0 4 * * * find /tmp/openclaw -name '*.log.gz' -mtime +14 -delete 2>/dev/null

# Reap leaked Chrome/Whisper processes
*/15 * * * * /home/ricky/.openclaw/scripts/chrome-reaper.sh

# Xero token keep-alive — Wed 21:00 UTC
0 21 * * 3 bash /home/ricky/config/xero_refresh.sh >> /home/ricky/logs/cron/xero_refresh.log 2>&1

# Parts usage update — Monday 06:00 UTC
0 6 * * 1 python3 /home/ricky/.openclaw/agents/parts/workspace/scripts/update_usage_columns.py >> /home/ricky/.openclaw/agents/parts/workspace/logs/usage_update.log 2>&1

# BM buyback weekly pipeline - Monday 05:00 UTC
0 5 * * 1 /home/ricky/builds/buyback-monitor/run-weekly.sh

# BM sent-orders detection — daily 06:00 UTC
0 6 * * * cd /home/ricky/builds/backmarket && /usr/bin/node scripts/sent-orders.js --live >> /home/ricky/logs/cron/sent-orders.log 2>&1

# SOP 08: Sale detection — hourly 07-17 UTC weekdays, 08/12/16 UTC weekends
0 7-17 * * 1-5 cd /home/ricky/builds/backmarket && /usr/bin/node scripts/sale-detection.js >> /home/ricky/logs/cron/sale-detection.log 2>&1
0 8,12,16 * * 6,0 cd /home/ricky/builds/backmarket && /usr/bin/node scripts/sale-detection.js >> /home/ricky/logs/cron/sale-detection.log 2>&1

# SOP 09: Dispatch labels — 07:00 and 12:00 UTC weekdays
0 7 * * 1-5 cd /home/ricky/builds/royal-mail-automation && /usr/bin/node dispatch.js >> /home/ricky/logs/cron/dispatch.log 2>&1
0 12 * * 1-5 cd /home/ricky/builds/royal-mail-automation && /usr/bin/node dispatch.js >> /home/ricky/logs/cron/dispatch.log 2>&1
# BM board housekeeping — daily 07:30 UTC Mon–Fri
30 7 * * 1-5 cd /home/ricky/builds/backmarket && /usr/bin/node scripts/board-housekeeping.js >> /home/ricky/logs/cron/board-housekeeping.log 2>&1

# Sync Claude CLI OAuth token to OpenClaw - every 15 minutes
*/15 * * * * /home/ricky/.openclaw/scripts/sync-token.sh >> /tmp/openclaw/token-sync.log 2>&1

# BM buyback daily pipeline — 05:00 UTC (replaces OpenClaw cron)
0 5 * * * /home/ricky/builds/buyback-monitor/run-daily.sh >> /home/ricky/logs/buyback/cron.log 2>&1
```

#### `ls -la /etc/nginx/sites-enabled/`

```text
total 28
drwxr-xr-x 2 root root 4096 Mar 31 02:31 .
drwxr-xr-x 8 root root 4096 Mar 31 02:37 ..
lrwxrwxrwx 1 root root   34 Feb  4 03:56 default -> /etc/nginx/sites-available/default
lrwxrwxrwx 1 root root   38 Mar 10 06:37 intake-form -> /etc/nginx/sites-available/intake-form
lrwxrwxrwx 1 root root   42 Feb 11 07:05 marketing-intel -> /etc/nginx/sites-available/marketing-intel
-rw-r--r-- 1 root root 6582 Mar 30 11:35 mission-control
-rw-r--r-- 1 root root 3397 Mar 24 07:03 mission-control.backup-20260324
-rw-r--r-- 1 root root 6256 Mar 25 06:24 mission-control.backup-20260325-bm-cutover
lrwxrwxrwx 1 root root   30 Feb  4 04:04 n8n -> /etc/nginx/sites-available/n8n
lrwxrwxrwx 1 root root   36 Mar 31 02:31 paperclip -> /etc/nginx/sites-available/paperclip
```

#### Nginx site mapping

| Site file | Host / listen | What it serves or proxies to | Status |
|---|---|---|---|
| `default` | `80 default_server` | Static `/var/www/html` | active |
| `intake-form` | `4175` | Proxies `127.0.0.1:4174` | active |
| `marketing-intel` | `mi.icorrect.co.uk` | Static `/home/ricky/mi-dashboard/dist`; `/api`, `/docs`, `/health` proxy to `127.0.0.1:8001` | active |
| `mission-control` | `mc.icorrect.co.uk` | Static `/home/ricky/mission-control-v2/dashboard/dist`; BM webhooks to `8011/8012/8013/8010`; iCloud/Slack to `8003/8010`; status notifications to `8014`; parts webhook to `3001`; summarize endpoint to `8004`; `/api/` to `127.0.0.1:8002` | active but `/api/` backend missing |
| `mission-control.backup-20260324` | `mc.icorrect.co.uk` | Backup copy in `sites-enabled`; includes same root | included by wildcard |
| `mission-control.backup-20260325-bm-cutover` | `mc.icorrect.co.uk` | Backup copy in `sites-enabled`; includes same root and older proxy map | included by wildcard |
| `n8n` | `n8n.icorrect.co.uk` | Proxies `localhost:5678` | active |
| `paperclip` | `paperclip.icorrect.co.uk` | Proxies `127.0.0.1:3100` | active |

#### Nginx include confirmation

```text
/etc/nginx/nginx.conf:60:	include /etc/nginx/sites-enabled/*;
```

#### `openclaw health`

```text
Telegram: ok (@RickysJarvis_bot) (75ms)
Slack: ok (225ms)
Agents: main (default), team, backmarket, systems, website, parts, marketing, slack-jarvis, pm, operations, customer-service, alex-cs, arlo-website, diagnostics, build-orchestrator, codex-reviewer, codex-builder
Heartbeat interval: 1h (main)
Session store (main): /home/ricky/.openclaw/agents/main/sessions/sessions.json (66 entries)
- agent:main:telegram:direct:1611042131 (2m ago)
- agent:main:main (24m ago)
- agent:main:cron:50e63428-39a6-4765-88bb-38922fdd50fa (238m ago)
- agent:main:cron:50e63428-39a6-4765-88bb-38922fdd50fa:run:fdd98650-3728-4d5f-8414-21894c78f161 (238m ago)
- agent:main:cron:50e63428-39a6-4765-88bb-38922fdd50fa:run:de7f1a55-23a1-484e-824f-ac6f736621a5 (1219m ago)
```

#### `openclaw cron list`

```text
ID                                   Name                     Schedule                         Next       Last       Status    Target    Agent ID   Model               
c312f008-b422-4e73-83cf-82b8034b7a04 Morning Inbox Triage     cron 0 7 * * * @ UTC (exact)     in 22h     2h ago     error     isolated  alex-cs    -
```

#### `openclaw agents list`

```text
Agents:
- main (default)
  Identity: 🎯 Jarvis (IDENTITY.md)
  Workspace: ~/.openclaw/agents/main/workspace
  Agent dir: ~/.openclaw/agents/main/agent
  Model: anthropic/claude-opus-4-6
  Routing rules: 1
  Routing: default (no explicit rules)
- team
  Identity: 👥 Team Jarvis (IDENTITY.md)
  Workspace: ~/.openclaw/agents/team/workspace
  Agent dir: ~/.openclaw/agents/team/agent
  Model: anthropic/claude-sonnet-4-6
  Routing rules: 1
- backmarket
  Identity: Hugo (IDENTITY.md)
  Workspace: ~/.openclaw/agents/backmarket/workspace
  Agent dir: ~/.openclaw/agents/backmarket/agent
  Model: anthropic/claude-sonnet-4-6
  Routing rules: 1
- systems
  Identity: 🛠 Sys Jarvis (IDENTITY.md)
  Workspace: ~/.openclaw/agents/systems/workspace
  Agent dir: ~/.openclaw/agents/systems/agent
  Model: anthropic/claude-sonnet-4-6
  Routing rules: 1
- website
  Identity: 📊 Website (IDENTITY.md)
  Workspace: ~/.openclaw/agents/website/workspace
  Agent dir: ~/.openclaw/agents/website/agent
  Model: anthropic/claude-sonnet-4-6
  Routing rules: 1
- parts
  Identity: 📦 Parts Jarvis (IDENTITY.md)
  Workspace: ~/.openclaw/agents/parts/workspace
  Agent dir: ~/.openclaw/agents/parts/agent
  Model: anthropic/claude-sonnet-4-6
  Routing rules: 1
- marketing
  Identity: 📈 Marketing Jarvis (IDENTITY.md)
  Workspace: ~/.openclaw/agents/marketing/workspace
  Agent dir: ~/.openclaw/agents/marketing/agent
  Model: anthropic/claude-sonnet-4-6
  Routing rules: 1
- slack-jarvis
  Identity: Slack Jarvis (IDENTITY.md)
  Workspace: ~/.openclaw/agents/slack-jarvis/workspace
  Agent dir: ~/.openclaw/agents/slack-jarvis/agent
  Model: anthropic/claude-sonnet-4-6
  Routing rules: 1
- pm
  Identity: PM Jarvis (IDENTITY.md)
  Workspace: ~/.openclaw/agents/pm/workspace
  Agent dir: ~/.openclaw/agents/pm/agent
  Model: anthropic/claude-sonnet-4-6
  Routing rules: 1
- operations
  Identity: Ops Jarvis (IDENTITY.md)
  Workspace: ~/.openclaw/agents/operations/workspace
  Agent dir: ~/.openclaw/agents/operations/agent
  Model: anthropic/claude-sonnet-4-6
  Routing rules: 1
- customer-service
  Identity: 📬 CS Jarvis (IDENTITY.md)
  Workspace: ~/.openclaw/agents/customer-service/workspace
  Agent dir: ~/.openclaw/agents/customer-service/agent
  Model: anthropic/claude-sonnet-4-6
  Routing rules: 1
- alex-cs
  Identity: Alex (IDENTITY.md)
  Workspace: ~/.openclaw/agents/alex-cs/workspace
  Agent dir: ~/.openclaw/agents/alex-cs/agent
  Model: anthropic/claude-sonnet-4-6
  Routing rules: 2
- arlo-website
  Identity: Arlo (IDENTITY.md)
  Workspace: ~/.openclaw/agents/arlo-website/workspace
  Agent dir: ~/.openclaw/agents/arlo-website/agent
  Model: anthropic/claude-sonnet-4-6
  Routing rules: 1
- diagnostics
  Identity: Elek (IDENTITY.md)
  Workspace: ~/.openclaw/agents/diagnostics/workspace
  Agent dir: ~/.openclaw/agents/diagnostics/agent
  Model: anthropic/claude-sonnet-4-6
  Routing rules: 1
- build-orchestrator
  Identity: 🏗️ Build Orchestrator (IDENTITY.md)
  Workspace: ~/.openclaw/agents/build-orchestrator/workspace
  Agent dir: ~/.openclaw/agents/build-orchestrator/agent
  Model: anthropic/claude-sonnet-4-6
  Routing rules: 0
- codex-reviewer
  Identity: 🧪 Codex Reviewer (IDENTITY.md)
  Workspace: ~/.openclaw/agents/codex-reviewer/workspace
  Agent dir: ~/.openclaw/agents/codex-reviewer/agent
  Model: openai-codex/gpt-5.4
  Routing rules: 0
- codex-builder
  Identity: 🔧 Codex Builder (IDENTITY.md)
  Workspace: ~/.openclaw/agents/codex-builder/workspace
  Agent dir: ~/.openclaw/agents/codex-builder/agent
  Model: openai-codex/gpt-5.4
  Routing rules: 0
Routing rules map channel/account/peer to an agent. Use --bindings for full rules.
Channel status reflects local config/creds. For live health: openclaw channels status --probe.
```

### A3. Additional Runtime Checks

#### Key service state detail

| Unit | ActiveState | SubState | UnitFileState | MainPID |
|---|---|---|---|---:|
| `bm-grade-check.service` | active | running | enabled | 1439 |
| `bm-payout.service` | active | running | enabled | 1440 |
| `bm-shipping.service` | active | running | enabled | 1441 |
| `flexbv-headless.service` | active | running | enabled | 834492 |
| `icloud-checker.service` | active | running | enabled | 779011 |
| `icorrect-parts.service` | active | running | enabled | 1444 |
| `intake-form.service` | active | running | enabled | 1445 |
| `llm-summary.service` | active | running | enabled | 1446 |
| `marketing-intelligence-api.service` | inactive | dead | disabled | 0 |
| `openclaw-gateway.service` | active | running | enabled | 1724057 |
| `status-notifications.service` | active | running | enabled | 772194 |
| `telephone-inbound.service` | active | running | enabled | 1456 |
| `voice-note-worker.service` | active | running | enabled | 1465 |
| `boardview-cleanup.service` | inactive | dead | static | 0 |

#### PM2

```text
┌────┬───────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name              │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼───────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ icorrect-parts    │ default     │ N/A     │ cluster │ 1753187  │ 0      │ 705… │ waiting … │ 0%       │ 0b       │ ricky    │ disabled │
└────┴───────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
```

#### Manual process provenance checks

```text
PID 1205 started Tue Mar 31 04:52:52 2026: /usr/bin/python3 -m uvicorn api.main:app --host 127.0.0.1 --port 8001 --log-level info
PID 1208 started Tue Mar 31 04:52:52 2026: node /home/ricky/paperclip/server/node_modules/.bin/../tsx/dist/cli.mjs src/index.ts
PID 1371 started Tue Mar 31 04:52:53 2026: /usr/bin/node --require /home/ricky/paperclip/node_modules/.pnpm/tsx@4.21.0/node_modules/tsx/dist/preflight.cjs --import file:///home/ricky/paperclip/node_modules/.pnpm/tsx@4.21.0/node_modules/tsx/dist/loader.mjs src/index.ts
PID 926717 started Wed Apr  1 07:08:30 2026: python3 /tmp/xero_auth2.py
```

## B. Code / Scripts Audit

### B1. `/home/ricky/builds/` Directory Audit

| Directory | What it is | Git | Last modified file | Manifests / dependencies | Referenced by | Size |
|---|---|---|---|---|---|---:|
| `agent-rebuild` | Active rebuild workspace for OpenClaw cleanup/docs | no | 2026-04-04 `BRIEF-VPS-AUDIT.md` | none | none | 668K |
| `agents` | Mission Control v2 planning/build docs | no | 2026-02-23 `research.md` | none | none | 544K |
| `backmarket` | Back Market operations scripts, docs, and three live webhook services | no | 2026-04-03 `data/buy-box-check-2026-04-03.txt` | root `package.json` (`dotenv`); service packages (`express`) | systemd, crontab | 56M |
| `bm-scripts` | Sparse BM scratch/test-output directory; only reconciliation test output present | no | 2026-03-27 `test-output/reconciliation-2026-03-27.json` | none | none | 24K |
| `buyback-monitor` | Buy box monitoring and price bump automation | no | 2026-04-04 `CHANGELOG-2026-04-04.md` | `package.json` (`playwright`, `playwright-extra`, `puppeteer-extra-plugin-stealth`) | crontab; disabled OpenClaw cron payload | 24M |
| `data` | Legacy buy-box/profitability data files | no | 2026-03-23 `buy-box-check-2026-03-23.txt` | none | none | 332K |
| `data-architecture` | Stub | no | 2026-02-22 `README.md` | none | none | 40K |
| `documentation` | Documentation build tracker and docs | no | 2026-02-23 `PROGRESS.md` | none | none | 104K |
| `elek-board-viewer` | Headless FlexBV board-viewing stack for diagnostics agent | no | 2026-04-01 `data/boardview_logs/requests.log` | none | `flexbv-headless.service`; `boardview-cleanup.service` | 4.4G |
| `hiring` | Mostly empty tree; only deep staged hiring docs present | no | 2026-03-09 `docs/staged/2026-03-31/operations-coordinator-jd-v3.md` | none | none | 28K |
| `icloud-checker` | iCloud/spec-check webhook service | no | 2026-04-04 `recheck-state.json` | `package.json` (`express`, `playwright`) | `icloud-checker.service` | 19M |
| `icorrect-parts-service` | Parts deduction webhook service with SQLite DB, dashboard, and service files | yes | 2026-04-02 `data/parts.db-wal` | `package.json` (`better-sqlite3`, `dotenv`, `express`) | `icorrect-parts.service` | 30M |
| `icorrect-shopify-theme` | Shopify theme repo/assets and audit docs | yes | 2026-03-31 `docs/theme-audit-2026-03-31.md` | none | none | 14M |
| `intake-notifications` | Intake notification enrichment build/spec workspace | no | 2026-04-02 staged spec docs | none | none | 148K |
| `intake-system` | Intake form design/docs and React frontend | no | 2026-03-31 staged intake docs | `react-form/package.json` (`framer-motion`, `react`, `react-dom`, Tailwind/Vite toolchain) | `intake-form.service` | 139M |
| `intercom` | Intercom docs / cleanup notes | no | 2026-03-27 `cleanup-plan.md` | none | none | 12K |
| `intercom-agent` | Intercom agent spec stub | no | 2026-02-22 `SPEC.md` | none | none | 12K |
| `inventory-system` | Inventory system spec stub | no | 2026-02-22 `SPEC.md` | none | none | 8K |
| `llm-summary-endpoint` | Express endpoint for Monday update summarization | no | 2026-03-13 `server.js` | `package.json` (`express`) | `llm-summary.service` | 12M |
| `marketing-intelligence` | Stub build dir; not the live backend | no | 2026-02-22 `README.md` | none | none | 60K |
| `monday` | Monday-related docs and live `status-notifications` service | no | 2026-04-01 `services/status-notifications/status-notifications.service` | service `package.json` (`express`) | `status-notifications.service` | 11M |
| `pricing-sync` | Multi-phase pricing sync scripts, config, data exports, and reports | no | 2026-03-16 `reports/unmatched-items-2026-03-16.md` | none | none | 5.3M |
| `qa-system` | Stub | no | 2026-02-22 `README.md` | none | none | 48K |
| `quote-wizard` | Quote wizard menu builder | no | 2026-03-18 `rebuild-wizard-menus.js` | `package.json` (`dotenv`) | none | 216K |
| `repair-analysis` | Two Python repair analysis/profitability scripts | no | 2026-03-16 `repair_deep_dive.py` | none | none | 48K |
| `research` | Research docs and prior audit notes | no | 2026-02-24 `vps-agent-audit-2026-02-24.md` | none | none | 24K |
| `royal-mail-automation` | Royal Mail dispatch automation | yes | 2026-04-02 `dispatch.js` | `package.json` (`dotenv`, `playwright`) | crontab | 21M |
| `scripts` | Assorted support scripts; no live reference found | no | 2026-03-28 `pdf-to-images.sh` | none | none | 52K |
| `server-config` | Archived service/nginx/PM2 snapshots; not live config | no | 2026-03-24 `voice-note-worker.service` | none | none | 124K |
| `system-audit-2026-03-31` | Active system-audit research pack | no | 2026-04-04 `product-cards.md` | none | none | 4.7M |
| `team-audits` | Staff audit framework, scripts, and reports | no | 2026-03-05 `scripts/cdr_monday_matcher.py` | none | none | 752K |
| `telephone-inbound` | Python Slack telephone inbound server | no | 2026-03-31 `telephone-inbound.log` | none | `telephone-inbound.service` | 56K |
| `templates` | Spec/README templates | no | 2026-02-22 `STUB-README-TEMPLATE.md` | none | none | 12K |
| `voice-note-pipeline` | Voice note worker, state file, logs, and service file | no | 2026-04-04 `.voice-note-state.json` | none | `voice-note-worker.service` | 16M |
| `voice-notes` | Stub | no | 2026-02-22 `README.md` | none | none | 36K |
| `webhook-migration` | Webhook migration docs/workspace | no | 2026-04-01 `shopify-intercom-migration-matrix-2026-04-01.md` | none | none | 392K |
| `website-conversion` | Website conversion spec | no | 2026-02-22 `SPEC.md` | none | none | 12K |
| `whisper-api` | `transcribe.sh` helper used on-demand by OpenClaw | no | 2026-03-10 `transcribe.sh` | none | `openclaw.json` command reference | 8K |
| `xero-invoice-automation` | Xero automation build brief/scripts | yes | 2026-03-04 `fix_body_format.py` | none | none | 520K |
| `.claude` | Local Claude settings | no | 2026-03-31 `settings.local.json` | none | none | 8K |
| `.git` | Git metadata for the `/home/ricky/builds` working tree | n/a | 2026-04-02 refs update | none | none | 11M |

### B2. Git Repo Excerpts

- `icorrect-parts-service`
  - `10784c1` chore: use `MONDAY_APP_TOKEN` instead of personal token
  - `03fcffa` feat: Phase 1 parts deduction service
  - `12d0c4a` init
- `icorrect-shopify-theme`
  - `946365c` Add social proof first fold brief — trust bar for collection and page templates
  - `efdb59b` Update page speed brief — collection page 502KB & 18 eager images critical findings
  - `7700eb8` Defer jQuery CDN script to fix render-blocking on mobile (#21)
- `royal-mail-automation`
  - `1e659ca` Fix dispatch listing-id match tracking scope
  - `8916a8e` chore: use `MONDAY_APP_TOKEN` instead of personal token
  - `419762e` feat: add BM dispatch integration + refactor buy-labels for reuse
- `xero-invoice-automation`
  - `7e486f7` Phase 1: Xero Invoice Creator - n8n workflow built and active

### B3. Mission Control Paths

| Path | State | Evidence |
|---|---|---|
| `/home/ricky/mission-control/` | missing | `find` returned `No such file or directory`; no direct references found in live systemd, Nginx, `openclaw.json`, or `cron/jobs.json` |
| `/home/ricky/mission-control-v2/` | present, git repo, 139M, last modified 2026-04-01 | Nginx `mission-control` root points here; `docs/README.md` describes v2 architecture |

`mission-control-v2` details:

- Git history
  - `ad4b8e5` KPI: fix BM Orders Received — use BM API `pageSize=100` last-page approach
  - `04eb95d` KPI updater: WoW colour logic, header/width fixes, data col cleanup
  - `83fb284` Add build registry guidance for core agents
- Latest modified file
  - `2026-04-01 03:07:24 /home/ricky/mission-control-v2/agents/backmarket/CLAUDE.md`
- Manifests
  - `/home/ricky/mission-control-v2/dashboard/package.json`
  - `/home/ricky/mission-control-v2/requirements.txt`
- Direct live references found
  - `/etc/nginx/sites-enabled/mission-control`
  - `/etc/nginx/sites-enabled/mission-control.backup-20260324`
  - `/etc/nginx/sites-enabled/mission-control.backup-20260325-bm-cutover`
- Notable docs drift
  - `docs/README.md` still references `agent-trigger` and a webhook API on port `8002`; there is no installed `agent-trigger` user unit, and no listener on `127.0.0.1:8002`.

### B4. OpenClaw Hooks

| Hook | Events | What it does |
|---|---|---|
| `agent-activity-logger` | `agent:bootstrap`, `command:new` | Logs session start/end to Supabase `agent_activity` and to a Telegram activity group |
| `dependency-check` | `agent:bootstrap` | Verifies Supabase connectivity and workspace files; injects degraded-mode warning and hard-blocks on failure |
| `supabase-bootstrap` | `agent:bootstrap` | Injects memory summaries and unread messages into agent context; writes heartbeat |
| `supabase-memory` | `command:new` | Reminds agent to save facts and writes session-end heartbeat |

### B5. OpenClaw Utility Scripts

| Script | What it does | Referenced by |
|---|---|---|
| `chrome-reaper.sh` | Kills leaked `chrome` and `whisper` processes older than configured thresholds and logs reaps | crontab every 15 minutes |
| `health-check.sh` | Checks OpenClaw gateway status, restart count, Telegram API reachability, memory, and disk; sends Telegram alerts | crontab every 15 minutes |
| `mc-task.sh` | Supabase-backed task helper for OpenClaw agents (`create`, `update`, `done`, `list`, `log`) | no live cron/service reference found |
| `sync-token.sh` | Syncs Claude OAuth token into OpenClaw auth profile; validates token and restarts gateway if needed | crontab every 15 minutes |

### B6. Additional Non-`builds` Runtime Code Paths

| Path | What it is | Git | Last modified file | Dependencies | Referenced by | Size |
|---|---|---|---|---|---|---:|
| `/home/ricky/paperclip` | `paperclip` repo and runtime backend code | yes | 2026-03-31 `packages/plugins/sdk/dist/ui/index.js.map` | root `package.json`; examples: `@playwright/test`, `cross-env`, `esbuild`, `typescript`, `vitest` | Nginx `paperclip` site via port `3100` | 820M |
| `/home/ricky/.paperclip` | `paperclip` runtime data directory, including embedded Postgres instance data | n/a | live runtime data | embedded DB/runtime state | used by `paperclip` backend on `54329` | 698M |

Recent `paperclip` commits:

- `98337f5b` Merge pull request #2203 from `paperclipai/pap-1007-workspace-followups`
- `477ef78f` Address Greptile feedback on workspace reuse
- `b0e0f8cd` Merge pull request #2205 from `paperclipai/pap-1007-publishing-docs`

## C. Full Inventory

### C1. Reference Table

| Item | Type | Location | Status | Referenced By |
|---|---|---|---|---|
| `bm-grade-check.service` | service | `/home/ricky/.config/systemd/user/bm-grade-check.service` | running | systemd enabled; Nginx `mission-control` `/webhook/bm/grade-check` |
| `bm-payout.service` | service | `/home/ricky/.config/systemd/user/bm-payout.service` | running | systemd enabled; Nginx `mission-control` `/webhook/bm/payout` |
| `bm-shipping.service` | service | `/home/ricky/.config/systemd/user/bm-shipping.service` | running | systemd enabled; Nginx `mission-control` `/webhook/bm/shipping-confirmed` |
| `flexbv-headless.service` | service | `/home/ricky/.config/systemd/user/flexbv-headless.service` | running | systemd enabled |
| `icloud-checker.service` | service | `/home/ricky/.config/systemd/user/icloud-checker.service` | running | systemd enabled; Nginx `mission-control` iCloud routes |
| `icorrect-parts.service` | service | `/home/ricky/.config/systemd/user/icorrect-parts.service` | running | systemd enabled; Nginx `mission-control` `/parts-webhook` |
| `intake-form.service` | service | `/home/ricky/.config/systemd/user/intake-form.service` | running | systemd enabled; Nginx `intake-form` |
| `llm-summary.service` | service | `/home/ricky/.config/systemd/user/llm-summary.service` | running | systemd enabled; Nginx `mission-control` `/api/summarize-updates` |
| `openclaw-gateway.service` | service | `/home/ricky/.config/systemd/user/openclaw-gateway.service` | running | systemd enabled; OpenClaw runtime; `health-check.sh`; `sync-token.sh` |
| `status-notifications.service` | service | `/home/ricky/.config/systemd/user/status-notifications.service` | running | systemd enabled; Nginx `mission-control` `/webhook/monday/status-notification` |
| `telephone-inbound.service` | service | `/home/ricky/.config/systemd/user/telephone-inbound.service` | running | systemd enabled; Nginx `mission-control` `/slack/` and `/webhook/icloud-check/slack-interact` |
| `voice-note-worker.service` | service | `/home/ricky/.config/systemd/user/voice-note-worker.service` | running | systemd enabled |
| `marketing-intelligence-api.service` | service | `/home/ricky/.config/systemd/user/marketing-intelligence-api.service` | disabled / dead | Nginx `marketing-intel` expects backend semantics on `8001` |
| `boardview-cleanup.service` | service | `/home/ricky/.config/systemd/user/boardview-cleanup.service` | inactive / scheduled by timer | `boardview-cleanup.timer` |
| `boardview-cleanup.timer` | timer | `/home/ricky/.config/systemd/user/boardview-cleanup.timer` | enabled | systemd timer target |
| `systemd-remount-fs.service` | service | user unit reference only | not-found / dead | appears in `systemctl --user list-units --state=inactive` |
| `n8n` | docker container | Docker container `2da2fe80677e` | running | Nginx `n8n` site |
| `n8nio/n8n:latest` | docker image | local Docker image store | cached, 1.65G disk | Docker runtime |
| `default` | nginx config | `/etc/nginx/sites-enabled/default` | active | Nginx include |
| `intake-form` | nginx config | `/etc/nginx/sites-enabled/intake-form` | active | Nginx include |
| `marketing-intel` | nginx config | `/etc/nginx/sites-enabled/marketing-intel` | active | Nginx include |
| `mission-control` | nginx config | `/etc/nginx/sites-enabled/mission-control` | active, but `/api/` target missing | Nginx include |
| `mission-control.backup-20260324` | nginx config | `/etc/nginx/sites-enabled/mission-control.backup-20260324` | loaded duplicate file | Nginx wildcard include |
| `mission-control.backup-20260325-bm-cutover` | nginx config | `/etc/nginx/sites-enabled/mission-control.backup-20260325-bm-cutover` | loaded duplicate file | Nginx wildcard include |
| `n8n` | nginx config | `/etc/nginx/sites-enabled/n8n` | active | Nginx include |
| `paperclip` | nginx config | `/etc/nginx/sites-enabled/paperclip` | active | Nginx include |
| `openclaw health check` | cron | user crontab | active | crontab |
| `openclaw log gzip` | cron | user crontab | active | crontab |
| `openclaw log prune` | cron | user crontab | active | crontab |
| `chrome reaper` | cron | user crontab | active | crontab |
| `xero token keep-alive` | cron | user crontab | active | crontab |
| `parts usage update` | cron | user crontab | active | crontab |
| `BM buyback weekly pipeline` | cron | user crontab | active | crontab |
| `BM sent-orders detection` | cron | user crontab | active | crontab |
| `SOP 08 sale detection weekday` | cron | user crontab | active | crontab |
| `SOP 08 sale detection weekend` | cron | user crontab | active | crontab |
| `SOP 09 dispatch labels 07:00` | cron | user crontab | active | crontab |
| `SOP 09 dispatch labels 12:00` | cron | user crontab | active | crontab |
| `BM board housekeeping` | cron | user crontab | active | crontab |
| `Claude OAuth token sync` | cron | user crontab | active | crontab |
| `BM buyback daily pipeline` | cron | user crontab | active | crontab |
| `Morning Inbox Triage` | openclaw cron | `/home/ricky/.openclaw/cron/jobs.json` | enabled, error | OpenClaw scheduler |
| `session-keepalive` | openclaw cron | `/home/ricky/.openclaw/cron/jobs.json` | disabled | OpenClaw scheduler |
| `Daily 7am Bali date check` | openclaw cron | `/home/ricky/.openclaw/cron/jobs.json` | disabled | OpenClaw scheduler |
| `buyback-buy-box-monitor` | openclaw cron | `/home/ricky/.openclaw/cron/jobs.json` | disabled, superseded in file comments/payload | OpenClaw scheduler |
| `agent-activity-logger` | hook | `/home/ricky/.openclaw/hooks/agent-activity-logger` | present | OpenClaw hooks dir |
| `dependency-check` | hook | `/home/ricky/.openclaw/hooks/dependency-check` | present | OpenClaw hooks dir |
| `supabase-bootstrap` | hook | `/home/ricky/.openclaw/hooks/supabase-bootstrap` | present | OpenClaw hooks dir |
| `supabase-memory` | hook | `/home/ricky/.openclaw/hooks/supabase-memory` | present | OpenClaw hooks dir |
| `chrome-reaper.sh` | script | `/home/ricky/.openclaw/scripts/chrome-reaper.sh` | active | crontab |
| `health-check.sh` | script | `/home/ricky/.openclaw/scripts/health-check.sh` | active | crontab |
| `mc-task.sh` | script | `/home/ricky/.openclaw/scripts/mc-task.sh` | present, no live trigger found | manual use by agents |
| `sync-token.sh` | script | `/home/ricky/.openclaw/scripts/sync-token.sh` | active | crontab |
| `openclaw.json` | config | `/home/ricky/.openclaw/openclaw.json` | active | OpenClaw runtime |
| `cron/jobs.json` | config | `/home/ricky/.openclaw/cron/jobs.json` | active | OpenClaw runtime |
| `marketing-intelligence uvicorn` | process | PID `1205`, `127.0.0.1:8001` | running, manual | Nginx `marketing-intel`; matches disabled service command |
| `paperclip backend` | process | PIDs `1208`/`1371`, `127.0.0.1:3100` | running, manual | Nginx `paperclip` |
| `paperclip embedded postgres` | process | PID `2236`, `127.0.0.1:54329` | running, manual | `paperclip` backend |
| `xero_auth2.py` | process | PID `926717`, `0.0.0.0:3000` | running, orphan | no direct config/cron/service reference found |
| `PM2 daemon` | process | PID `1542` | running, stale control plane | PM2 runtime only |
| `PM2 app icorrect-parts` | process entry | PM2 list | waiting restart / duplicate | PM2 runtime only |
| `paperclip` repo | code/data | `/home/ricky/paperclip` | present, running manually via Nginx backend | Nginx `paperclip` |
| `.paperclip` runtime data | data | `/home/ricky/.paperclip` | active runtime data | `paperclip` backend |
| `mission-control-v2` | code/static root | `/home/ricky/mission-control-v2` | present, served by Nginx | `mission-control` site and backup files |
| `builds` | data/code | `/home/ricky/builds` | present, major disk user | many cron/services depend on subdirs |
| `elek-board-viewer` | data/code | `/home/ricky/builds/elek-board-viewer` | present, major disk user | `flexbv-headless.service`; `boardview-cleanup.service` |
| `intake-system` | data/code | `/home/ricky/builds/intake-system` | present, significant disk user | `intake-form.service` |
| `backmarket` | data/code | `/home/ricky/builds/backmarket` | present | three systemd services; multiple cron jobs |
| `buyback-monitor` | data/code | `/home/ricky/builds/buyback-monitor` | present | crontab; disabled OpenClaw cron payload |
| `paperclip site data` | data | `/home/ricky/paperclip` + `/home/ricky/.paperclip` | present, significant disk user | Nginx `paperclip` |
| `main agent workspace` | data | `/home/ricky/.openclaw/agents/main` | active | OpenClaw runtime |

### C2. Severity Flags

| Severity | Finding | Evidence |
|---|---|---|
| high | `mission-control` still proxies `/api/` to `127.0.0.1:8002`, but there is no listener on `8002` and no installed user service for it | Nginx config line `proxy_pass http://127.0.0.1:8002;`; `ss -tlnp` shows no `8002` listener |
| high | Orphan public listener on `0.0.0.0:3000` from `python3 /tmp/xero_auth2.py` | `ss -tlnp` shows PID `926717`; no direct reference found in systemd, Nginx, active OpenClaw config, or crontab |
| high | OpenClaw cron `Morning Inbox Triage` is enabled but currently failing | `openclaw cron list` reports `Status error`; `cron/jobs.json` records consecutive timeouts |
| medium | `marketing-intelligence-api.service` is disabled/inactive, but a matching `uvicorn` backend is still running on `127.0.0.1:8001` outside systemd | service state is `disabled/dead`; PID `1205` is live with PPID `1`; Nginx `marketing-intel` proxies to `8001` |
| medium | `paperclip` backend on `127.0.0.1:3100` is live behind Nginx but not managed by systemd or crontab | PIDs `1208`/`1371` started Mar 31; Nginx `paperclip` proxies to `3100`; no matching unit file |
| medium | PM2 is still running with stale `icorrect-parts` state while `icorrect-parts.service` is the active live service | `pm2 list` shows `icorrect-parts` `waiting restart`; systemd `icorrect-parts.service` is running on `3001` |
| medium | Two `mission-control.backup-*` files are inside `sites-enabled`, and `nginx.conf` includes `sites-enabled/*`, so they are loadable duplicate configs rather than inert archives | `/etc/nginx/nginx.conf` line 60; `ls -l /etc/nginx/sites-enabled/mission-control*` shows regular files |
| medium | Significant disk usage concentrated in a few paths | `builds` 4.7G; `elek-board-viewer` 4.4G; `paperclip` 820M; `.paperclip` 698M; `data` 541M; `intake-system` 139M; `mission-control-v2` 139M |
| low | `systemd-remount-fs.service` appears as `not-found` in the user service inactive list | `systemctl --user list-units --type=service --state=inactive` |
| low | `mission-control-v2` docs still reference `agent-trigger` and port `8002`, but the installed runtime no longer has those components | `mission-control-v2/docs/README.md`; no `agent-trigger` user service installed; no `8002` listener |
| low | Disabled historical OpenClaw jobs remain in `cron/jobs.json`, including a disabled `buyback-buy-box-monitor` job that the crontab comment says was replaced | `cron/jobs.json`; crontab comment `replaces OpenClaw cron` |
| low | `/home/ricky/builds/marketing-intelligence` is an unreferenced stub, while the live marketing backend path in the disabled service file points to the OpenClaw agent workspace instead | `builds/marketing-intelligence/README.md`; `marketing-intelligence-api.service` working directory is `~/.openclaw/agents/marketing/workspace/intelligence` |

