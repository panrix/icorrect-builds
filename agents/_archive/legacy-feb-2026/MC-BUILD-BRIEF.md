# Mission Control (mc.icorrect.co.uk) — Build Brief

## What This Is

Mission Control is the operational dashboard for Ricky's 11-agent AI system. It currently exists as a basic Kanban board. The vision is a full operational hub for managing agents, tasks, foundation docs, SOPs, and memory across all agents.

**Live URL:** https://mc.icorrect.co.uk (behind Nginx basic auth: `ricky` / `iCorrect2026`)

---

## Current State (as of 2026-02-12)

### What's Deployed
- **Frontend:** Vite + React 19 + TypeScript + Tailwind v4 + @dnd-kit + @supabase/supabase-js
- **Database:** Supabase (managed Postgres) — project ref `rydvxdoccryqtlcrrcag`
- **Hosting:** Static `dist/` served by Nginx with SSL (certbot, auto-renews)
- **Auth:** Nginx basic auth only (no app-level auth)

### What Works
- Kanban board with 5 columns: Backlog, To Do, In Progress, Review, Done
- Drag-and-drop task movement between columns
- Agent sidebar showing all 11 agents with colored avatars
- Task cards with priority badges, agent assignment, timestamps
- Create task modal (title, description, priority, agent assignment)
- Task detail modal on click
- Activity feed (right panel) showing recent activity_log entries
- Supabase Realtime subscriptions on `tasks` and `activity_log` tables
- Light warm theme with pastel agent colors

### What's Broken / Missing
1. **Supabase RLS is "allow all"** — Anyone with the anon key can read/write/delete everything. Nginx basic auth is the only protection. Proper RLS policies need to be set up via Supabase dashboard SQL editor.
2. **Agents can't write tasks** — The SUPABASE.md shared doc had empty URL/key placeholders. **This was fixed on 2026-02-12** — all agents now have working curl commands. But no agent has actually tested writing a task yet.
3. **No filtering/search** — Can't filter tasks by agent, priority, or search by title
4. **No agent profile pages** — Clicking an agent in the sidebar does nothing
5. **No responsive design verification** — Needs testing on iPad/iPhone
6. **Sample/seed data only** — The 8 tasks in the board are seed data from schema.sql, not real tasks

### File Locations (on VPS: ricky@46.225.53.159)

```
/home/ricky/mission-control/
├── dist/                          # Built static files (served by Nginx)
├── src/
│   ├── App.tsx                    # Main app component
│   ├── main.tsx                   # Entry point
│   ├── index.css                  # Tailwind imports
│   ├── types.ts                   # TypeScript types, column/agent config
│   ├── lib/supabase.ts            # Supabase client init
│   ├── hooks/useSupabase.ts       # Data fetching + realtime hooks
│   └── components/
│       ├── KanbanBoard.tsx        # Main board layout
│       ├── KanbanColumn.tsx       # Individual column
│       ├── TaskCard.tsx           # Task card in column
│       ├── TaskModal.tsx          # Task detail modal
│       ├── CreateTaskModal.tsx    # New task creation
│       ├── ActivityFeed.tsx       # Right-side activity log
│       └── Toast.tsx              # Toast notifications
├── schema.sql                     # Supabase schema (agents, tasks, activity_log)
├── migrations/                    # Empty (migrations done via SQL editor)
├── .env                           # VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
├── package.json                   # Dependencies
└── vite.config.ts                 # Vite + React + Tailwind plugins
```

### Supabase Schema

3 tables:
- **agents** (11 rows): `id` (UUID), `agent_id` (text, unique), `display_name`, `role`, `telegram_group_id`, `status`, `created_at`
- **tasks**: `id` (UUID), `title`, `description`, `status` (backlog/todo/in_progress/review/done), `priority` (low/medium/high/urgent), `agent_id` (FK→agents), `created_by`, `due_date`, `created_at`, `updated_at`
- **activity_log**: `id` (UUID), `agent_id` (FK→agents), `task_id` (FK→tasks), `action`, `details` (JSONB), `created_at`

Realtime enabled on `tasks` and `activity_log`.

### Nginx Config
`/etc/nginx/sites-available/mission-control` — serves `dist/`, SSL, basic auth

### How to Rebuild
```bash
cd /home/ricky/mission-control
npx vite build && chmod -R o+r dist && chmod o+x dist dist/assets
```

---

## The Broader Vision

Mission Control should eventually include:
1. **Agent profiles** — Click an agent to see their status, current tasks, recent activity, memory summary, SOUL.md preview
2. **Task management** — The Kanban board (exists), plus filtering, search, bulk actions
3. **Foundation docs viewer** — Read-only view of shared docs (COMPANY.md, GOALS.md, etc.)
4. **SOP browser** — View and manage standard operating procedures
5. **Memory/context dashboard** — See what each agent remembers, manage context across agents
6. **Agent configuration** — Edit agent CLAUDE.md settings, enable/disable agents

---

## Known Landmines

- **Do NOT edit `~/.openclaw/openclaw.json`** without understanding the full binding structure
- **Do NOT restart `openclaw-gateway`** — takes all 11 agents offline
- **Do NOT modify `~/.openclaw/shared/`** without Ricky's approval — changes propagate to all agents
- **Supabase anon key is in client-side JS** (`dist/` and `.env`) — this is expected for Supabase, but RLS must be tightened before removing Nginx auth
- **The `.env` file has real credentials** — it's in `.gitignore` but the values are baked into `dist/`
- **Old backup exists** at `/home/ricky/mission-control-old-backup.tar.gz` — this was the original broader Mission Control structure before the Kanban rebuild

---

## Supabase Access

- **Project URL:** https://rydvxdoccryqtlcrrcag.supabase.co
- **Credentials env file:** `/home/ricky/config/supabase/.env` (SUPABASE_URL, SUPABASE_ANON_KEY)
- **Dashboard:** Ricky has access via browser — needed for RLS policy changes and SQL editor
- **API from VPS:**
  ```bash
  source /home/ricky/config/supabase/.env
  curl -s "${SUPABASE_URL}/rest/v1/agents?select=agent_id,display_name" \
    -H "apikey: ${SUPABASE_ANON_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"
  ```

---

## What Ricky Cares About

- Visibility into what all 11 agents are doing
- Ability to assign and track tasks across agents
- Eventually: scaling from 11 to more agents (team members getting their own agents)
- Mobile-friendly (he manages from Bali on various devices)
- Concise, clean UI — not cluttered
