-- shift-bot schema
-- All week_start values are London local Monday dates (YYYY-MM-DD).

CREATE TABLE IF NOT EXISTS shifts (
    week_start     TEXT     NOT NULL,
    tech_id        TEXT     NOT NULL,
    tech_short     TEXT     NOT NULL,
    color_id       TEXT     NOT NULL,
    day            TEXT     NOT NULL,
    start_time     TEXT,
    end_time       TEXT,
    is_off         INTEGER  NOT NULL CHECK (is_off IN (0, 1)),
    gcal_event_id  TEXT,
    submitted_at   TEXT     NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    PRIMARY KEY (week_start, tech_id, day),
    CHECK (day IN ('mon','tue','wed','thu','fri','sat','sun')),
    CHECK (
      (is_off = 1 AND start_time IS NULL AND end_time IS NULL)
      OR
      (is_off = 0 AND start_time IS NOT NULL AND end_time IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_shifts_week ON shifts(week_start);
CREATE INDEX IF NOT EXISTS idx_shifts_tech ON shifts(week_start, tech_id);

CREATE TABLE IF NOT EXISTS job_runs (
    job_name     TEXT     NOT NULL,
    week_start   TEXT     NOT NULL,
    completed_at TEXT     NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    PRIMARY KEY (job_name, week_start),
    CHECK (job_name IN ('fri_nudge','sun_chase','mon_sync','mon_summary'))
);
