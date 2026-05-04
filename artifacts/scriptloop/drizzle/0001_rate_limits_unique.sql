-- Add the unique constraint that rateLimits.checkAndIncrement() relies on.
--
-- The handler calls
--   .onConflictDoUpdate({ target: [user_id, route, window_start], ... })
-- which compiles to
--   INSERT ... ON CONFLICT (user_id, route, window_start) DO UPDATE ...
-- Postgres requires a matching UNIQUE (or exclusion) constraint on those
-- columns or the upsert raises:
--   ERROR: there is no unique or exclusion constraint matching the
--   ON CONFLICT specification
-- The original baseline migration created the table without this
-- constraint, so this migration backfills it.
--
-- Hardened to be safe against three states:
--   1. A healthy DB where rate_limits exists with data: dedup any
--      duplicate (user_id, route, window_start) tuples that may have
--      accumulated, then add the constraint.
--   2. A healthy DB where rate_limits already has the constraint: the
--      ALTER inside the DO block catches duplicate_object and no-ops.
--   3. An out-of-sync ledger where __drizzle_migrations records
--      0000_baseline as applied but baseline DDL never actually ran
--      (so rate_limits is missing): the leading CREATE TABLE IF NOT
--      EXISTS recreates rate_limits with the same definition baseline
--      uses, the dedup steps then run against an empty table (no-op),
--      and the constraint is added. This guarantees the deploy ends
--      with a usable rate_limits in place rather than silently
--      "applying" the migration against nothing.

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
WITH dups AS (
  SELECT user_id, route, window_start,
         MIN(id) AS keep_id,
         SUM(count)::int AS total
  FROM "rate_limits"
  GROUP BY user_id, route, window_start
  HAVING COUNT(*) > 1
)
UPDATE "rate_limits" rl
SET count = d.total
FROM dups d
WHERE rl.id = d.keep_id;
--> statement-breakpoint
DELETE FROM "rate_limits" rl
USING (
  SELECT user_id, route, window_start, MIN(id) AS keep_id
  FROM "rate_limits"
  GROUP BY user_id, route, window_start
  HAVING COUNT(*) > 1
) d
WHERE rl.user_id = d.user_id
  AND rl.route = d.route
  AND rl.window_start = d.window_start
  AND rl.id <> d.keep_id;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "rate_limits"
    ADD CONSTRAINT "rate_limits_user_route_window_unique"
    UNIQUE ("user_id", "route", "window_start");
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;
