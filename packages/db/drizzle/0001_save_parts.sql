-- Additive migration; old JSONB saves remain readable. No data is rewritten here.
ALTER TABLE game_saves ADD COLUMN IF NOT EXISTS state_format text NOT NULL DEFAULT 'JSONB';
CREATE TABLE IF NOT EXISTS game_save_parts (
  save_id text NOT NULL REFERENCES game_saves(id) ON DELETE CASCADE,
  revision bigint NOT NULL CHECK (revision >= 0),
  part integer NOT NULL CHECK (part >= 0),
  payload text NOT NULL,
  sha256 text NOT NULL,
  PRIMARY KEY (save_id, revision, part)
);
