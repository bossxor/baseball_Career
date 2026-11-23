-- One durable season run per owned save. Existing save state and receipts are preserved.
CREATE TABLE IF NOT EXISTS season_jobs (
  save_id text PRIMARY KEY REFERENCES game_saves(id) ON DELETE CASCADE,
  run_id text NOT NULL CONSTRAINT season_jobs_run_id_check CHECK (length(run_id) > 0),
  request_id text NOT NULL CONSTRAINT season_jobs_request_id_check CHECK (length(request_id) > 0),
  status text NOT NULL DEFAULT 'RUNNING' CONSTRAINT season_jobs_status_check CHECK (status IN ('RUNNING', 'STOPPED', 'FAILED')),
  next_expected_revision bigint NOT NULL CONSTRAINT season_jobs_revision_check CHECK (next_expected_revision >= 0),
  step_ordinal integer NOT NULL DEFAULT 0 CONSTRAINT season_jobs_step_check CHECK (step_ordinal >= 0),
  stop_reason text,
  progress jsonb NOT NULL DEFAULT '{"seasonKey":null,"phase":null,"completedGames":0,"scheduledGames":0}'::jsonb
    CONSTRAINT season_jobs_progress_check CHECK (jsonb_typeof(progress) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS season_jobs_run_id_uidx ON season_jobs (run_id);
