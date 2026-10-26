/** Bootstrap SQL for M3 core tables (fresh DB / PGlite). */
export const M3_CORE_SQL = `
DO $$ BEGIN
  CREATE TYPE save_mode AS ENUM ('CAREER', 'CLUB');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE allowlist_status AS ENUM ('ACTIVE', 'REVOKED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS profiles (
  id text PRIMARY KEY,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS auth_allowed_subjects (
  subject text PRIMARY KEY,
  status allowlist_status NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS game_saves (
  id text PRIMARY KEY,
  owner_id text NOT NULL REFERENCES profiles(id),
  mode save_mode NOT NULL,
  revision bigint NOT NULL DEFAULT 0 CHECK (revision >= 0),
  versions integer NOT NULL DEFAULT 1 CHECK (versions >= 1),
  phase text NOT NULL DEFAULT 'BOOT',
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS game_saves_owner_updated_idx
  ON game_saves (owner_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS command_receipts (
  save_id text NOT NULL REFERENCES game_saves(id) ON DELETE CASCADE,
  command_id text NOT NULL,
  request_hash text NOT NULL,
  result jsonb NOT NULL,
  resulting_revision bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (save_id, command_id)
);

DO $$ BEGIN
  CREATE TYPE private_file_kind AS ENUM ('BACKUP', 'CHRONICLE_JSON', 'CARD_PNG');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE private_file_status AS ENUM ('READY', 'FAILED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS private_files (
  id text PRIMARY KEY,
  owner_id text NOT NULL REFERENCES profiles(id),
  save_id text REFERENCES game_saves(id) ON DELETE SET NULL,
  kind private_file_kind NOT NULL,
  status private_file_status NOT NULL DEFAULT 'READY',
  mime text NOT NULL,
  byte_size integer NOT NULL CHECK (byte_size >= 0),
  content_hash text NOT NULL,
  body text NOT NULL,
  file_name text NOT NULL,
  request_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  UNIQUE (owner_id, request_id)
);

CREATE INDEX IF NOT EXISTS private_files_owner_created_idx
  ON private_files (owner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS private_files_save_idx
  ON private_files (save_id, created_at DESC);
`;
