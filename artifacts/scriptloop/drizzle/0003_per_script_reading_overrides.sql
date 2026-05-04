-- Per-script reading preference overrides.
--
-- Adds a nullable jsonb column on scripts. NULL means "fall back to the
-- user-level preferences in user_preferences.reading"; a populated object
-- means the script opts into its own full reading style. Reading surfaces
-- (Zen Mode, Progressive memorization view) prefer the per-script value
-- when present.
--
-- Hardened against an out-of-sync ledger where 0000_baseline is
-- recorded as applied but the baseline DDL never actually ran. We
-- inline-recreate everything this migration depends on — the
-- neon_auth schema + user table (referenced by scripts.user_id) and
-- the scripts table itself — using IF NOT EXISTS / DO-block guards
-- that make every recreate a no-op on a healthy DB. The trailing
-- ADD COLUMN IF NOT EXISTS is the actual schema change this
-- migration owns.
CREATE SCHEMA IF NOT EXISTS "neon_auth";
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "neon_auth"."user" (
        "id" uuid PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "email" text NOT NULL,
        "emailVerified" boolean NOT NULL,
        "image" text,
        "createdAt" timestamp with time zone NOT NULL,
        "updatedAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scripts" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" uuid NOT NULL,
        "title" text NOT NULL,
        "content" text NOT NULL,
        "audio_url" text,
        "audio_source" text,
        "voice_id" text,
        "loop_gap_seconds" integer DEFAULT 2,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
        ALTER TABLE "scripts" ADD CONSTRAINT "scripts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "neon_auth"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
        WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TABLE "scripts" ADD COLUMN IF NOT EXISTS "reading_overrides" jsonb;
