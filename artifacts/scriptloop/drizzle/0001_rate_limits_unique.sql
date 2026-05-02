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
-- Made idempotent + dup-safe so it can be applied to production where
-- ON CONFLICT may have been silently failing and leaving duplicate
-- (user_id, route, window_start) rows behind:
--   1. Sum the duplicates' counts into the lowest-id row.
--   2. Delete the now-redundant duplicates.
--   3. ADD CONSTRAINT inside a DO block so a re-run is a no-op when the
--      constraint is already present.

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
