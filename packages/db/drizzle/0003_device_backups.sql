-- Device snapshots owned by an account, separate from server-authoritative game saves.
CREATE TABLE IF NOT EXISTS device_backups (
  owner_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  id text NOT NULL,
  mode save_mode NOT NULL,
  revision bigint NOT NULL CONSTRAINT device_backups_revision_check CHECK (revision > 0),
  phase text NOT NULL,
  summary jsonb NOT NULL CONSTRAINT device_backups_summary_check CHECK (jsonb_typeof(summary) = 'object'),
  part_count integer NOT NULL CONSTRAINT device_backups_part_count_check CHECK (part_count >= 0),
  content_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, id)
);

CREATE INDEX IF NOT EXISTS device_backups_owner_created_idx ON device_backups (owner_id, created_at, id);

CREATE TABLE IF NOT EXISTS device_backup_parts (
  owner_id text NOT NULL,
  backup_id text NOT NULL,
  part integer NOT NULL CONSTRAINT device_backup_parts_part_check CHECK (part >= 0),
  payload text NOT NULL,
  PRIMARY KEY (owner_id, backup_id, part),
  FOREIGN KEY (owner_id, backup_id) REFERENCES device_backups(owner_id, id) ON DELETE CASCADE
);
