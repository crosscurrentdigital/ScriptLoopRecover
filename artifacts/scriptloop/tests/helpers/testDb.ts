import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "../../src/db/schema";

/**
 * In-process PostgreSQL (pglite, wasm) used by integration tests so the
 * real Drizzle query builder, WHERE clauses, FK constraints, and SQL
 * type coercion are exercised. Each test file gets its own instance via
 * the vi.mock("../../src/db/index", () => makeTestDb()) pattern.
 */
export async function makeTestDb() {
  const client = new PGlite();
  const db = drizzle(client, { schema });

  // Bootstrap schema. We can't use the migration runner here because it
  // depends on a __drizzle_migrations table layout that pglite doesn't
  // need; the baseline SQL is idempotent and minimal.
  await client.exec(`
    CREATE SCHEMA IF NOT EXISTS "neon_auth";

    CREATE TABLE IF NOT EXISTS "neon_auth"."user" (
      "id" uuid PRIMARY KEY NOT NULL,
      "name" text NOT NULL,
      "email" text NOT NULL,
      "emailVerified" boolean NOT NULL,
      "image" text,
      "createdAt" timestamp with time zone NOT NULL,
      "updatedAt" timestamp with time zone NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "rate_limits" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" uuid NOT NULL,
      "route" text NOT NULL,
      "window_start" timestamp with time zone NOT NULL,
      "count" integer DEFAULT 0 NOT NULL,
      "created_at" timestamp with time zone DEFAULT now(),
      "updated_at" timestamp with time zone DEFAULT now(),
      CONSTRAINT rate_limits_user_route_window UNIQUE (user_id, route, window_start)
    );

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
      "updated_at" timestamp DEFAULT now(),
      CONSTRAINT scripts_user_id_fk FOREIGN KEY ("user_id")
        REFERENCES "neon_auth"."user"("id") ON DELETE CASCADE
    );
  `);

  return { db, client };
}

export async function truncateAll(client: PGlite): Promise<void> {
  await client.exec(
    `TRUNCATE TABLE "scripts", "rate_limits", "neon_auth"."user" RESTART IDENTITY CASCADE;`,
  );
}

export async function seedUser(
  client: PGlite,
  id: string,
  name = "Test User",
): Promise<void> {
  await client.query(
    `INSERT INTO "neon_auth"."user" ("id","name","email","emailVerified","createdAt","updatedAt")
     VALUES ($1,$2,$3,true,now(),now())`,
    [id, name, `${name.replace(/\s+/g, "").toLowerCase()}@test.example`],
  );
}
