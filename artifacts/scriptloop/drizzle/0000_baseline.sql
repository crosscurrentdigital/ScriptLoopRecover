-- Baseline migration for ScriptLoop.
--
-- This migration is intentionally idempotent (CREATE ... IF NOT EXISTS,
-- DO $$ ... EXCEPTION WHEN duplicate_object $$) so that it can be applied
-- safely to:
--   1. A fresh database that has never seen ScriptLoop tables, AND
--   2. The existing production database that was provisioned with
--      `drizzle-kit push` before versioned migrations were adopted.
--
-- Future migrations should be plain DDL — only this baseline needs the
-- IF NOT EXISTS dance.
--
-- The `neon_auth.user` table is managed by Neon Auth, not by us. We
-- declare it here only so the FK from `scripts.user_id` exists. On any
-- real database it will already be present and the IF NOT EXISTS will
-- make this a no-op.

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
CREATE TABLE IF NOT EXISTS "rate_limits" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"route" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
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
