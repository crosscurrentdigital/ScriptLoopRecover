import { sql } from "drizzle-orm";
import { db } from "../../src/db/index";
import { withSentry, captureFunctionError } from "./_lib/sentry";

const ROUTE = "scheduled /cleanup-rate-limits";
const RETENTION_DAYS = 7;

const handler = async (_req: Request): Promise<Response> => {
  const cutoff = new Date(
    Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000,
  );

  try {
    // Use a CTE so we get only the affected-row count back, not every deleted
    // row's id. Cheaper on a first run after significant accumulation.
    const rows = (await db.execute(sql`
      WITH deleted AS (
        DELETE FROM rate_limits
        WHERE window_start < ${cutoff}
        RETURNING 1
      )
      SELECT count(*)::int AS deleted FROM deleted
    `)) as unknown as Array<{ deleted: number }>;

    const summary = {
      deleted: rows[0]?.deleted ?? 0,
      cutoff: cutoff.toISOString(),
      retentionDays: RETENTION_DAYS,
    };

    console.log(
      `[cleanup-rate-limits] deleted ${summary.deleted} rate_limits row(s) with window_start < ${summary.cutoff}`,
    );

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    captureFunctionError(err, { route: ROUTE });
    console.error("[cleanup-rate-limits] failed:", err);
    return new Response(
      JSON.stringify({
        error: "cleanup_failed",
        message: err instanceof Error ? err.message : String(err),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

export default withSentry(ROUTE, handler);

export const config = {
  schedule: "@daily",
};
