-- Hardened against an out-of-sync ledger where 0000_baseline is
-- recorded as applied but the baseline DDL never actually ran. We
-- inline-recreate everything this migration's FK depends on (the
-- neon_auth schema + user table, mirroring baseline's own definition)
-- so the FK ADD CONSTRAINT can succeed even on a broken-ledger DB.
-- On a healthy DB the IF NOT EXISTS / DO-block guards make every
-- recreate a no-op.
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
CREATE TABLE IF NOT EXISTS "user_preferences" (
        "user_id" uuid PRIMARY KEY NOT NULL,
        "reading" jsonb,
        "updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
        ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "neon_auth"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
        WHEN duplicate_object THEN NULL;
END $$;
