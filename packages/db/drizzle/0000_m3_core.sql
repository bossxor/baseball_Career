CREATE TYPE "public"."save_mode" AS ENUM('CAREER', 'CLUB');
CREATE TYPE "public"."allowlist_status" AS ENUM('ACTIVE', 'REVOKED');

CREATE TABLE "profiles" (
  "id" text PRIMARY KEY NOT NULL,
  "display_name" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "auth_allowed_subjects" (
  "subject" text PRIMARY KEY NOT NULL,
  "status" "allowlist_status" DEFAULT 'ACTIVE' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "game_saves" (
  "id" text PRIMARY KEY NOT NULL,
  "owner_id" text NOT NULL,
  "mode" "save_mode" NOT NULL,
  "revision" bigint DEFAULT 0 NOT NULL,
  "versions" integer DEFAULT 1 NOT NULL,
  "phase" text DEFAULT 'BOOT' NOT NULL,
  "summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "state" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone,
  CONSTRAINT "game_saves_revision_nonneg" CHECK (revision >= 0),
  CONSTRAINT "game_saves_versions_pos" CHECK (versions >= 1)
);

ALTER TABLE "game_saves" ADD CONSTRAINT "game_saves_owner_id_profiles_id_fk"
  FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;

CREATE INDEX "game_saves_owner_updated_idx" ON "game_saves" USING btree ("owner_id","updated_at" DESC);

CREATE TABLE "command_receipts" (
  "save_id" text NOT NULL,
  "command_id" text NOT NULL,
  "request_hash" text NOT NULL,
  "result" jsonb NOT NULL,
  "resulting_revision" bigint NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "command_receipts_save_id_command_id_pk" PRIMARY KEY("save_id","command_id")
);

ALTER TABLE "command_receipts" ADD CONSTRAINT "command_receipts_save_id_game_saves_id_fk"
  FOREIGN KEY ("save_id") REFERENCES "public"."game_saves"("id") ON DELETE cascade ON UPDATE no action;
