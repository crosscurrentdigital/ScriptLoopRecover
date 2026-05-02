import { sql } from "drizzle-orm";
import { db } from "../../../src/db/index";
import { rateLimits } from "../../../src/db/schema";

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  limit: number;
  retryAfterSeconds: number;
}

const HOUR_MS = 60 * 60 * 1000;

function bucketStart(now = Date.now()): Date {
  return new Date(Math.floor(now / HOUR_MS) * HOUR_MS);
}

/**
 * Atomically increment the per-user, per-route counter for the current hour
 * window. Returns whether the call should be allowed.
 *
 * The ON CONFLICT path makes this safe under concurrent invocations from
 * multiple Netlify function instances (no shared in-memory state).
 */
export async function checkAndIncrement({
  userId,
  route,
  limit = 20,
}: {
  userId: string;
  route: string;
  limit?: number;
}): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = bucketStart(now);

  const [row] = await db
    .insert(rateLimits)
    .values({
      userId,
      route,
      windowStart,
      count: 1,
    })
    .onConflictDoUpdate({
      target: [rateLimits.userId, rateLimits.route, rateLimits.windowStart],
      set: {
        count: sql`${rateLimits.count} + 1`,
        updatedAt: new Date(),
      },
    })
    .returning({ count: rateLimits.count });

  const count = row?.count ?? 1;
  const windowEnds = windowStart.getTime() + HOUR_MS;
  const retryAfterSeconds = Math.max(1, Math.ceil((windowEnds - now) / 1000));

  return {
    allowed: count <= limit,
    count,
    limit,
    retryAfterSeconds,
  };
}

export function rateLimitResponse(
  result: RateLimitResult,
): Response {
  const minutes = Math.ceil(result.retryAfterSeconds / 60);
  const message = `You've hit the hourly limit of ${result.limit} audio generations. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
  return new Response(
    JSON.stringify({
      error: "rate_limited",
      message,
      retryAfterSeconds: result.retryAfterSeconds,
      limit: result.limit,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfterSeconds),
      },
    },
  );
}
