import {
  pgTable,
  pgSchema,
  text,
  serial,
  timestamp,
  integer,
  uuid,
  boolean,
} from "drizzle-orm/pg-core";

const neonAuthSchema = pgSchema("neon_auth");

export const authUser = neonAuthSchema.table("user", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull(),
});

export const scripts = pgTable("scripts", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => authUser.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  audioUrl: text("audio_url"),
  audioSource: text("audio_source"),
  voiceId: text("voice_id"),
  loopGapSeconds: integer("loop_gap_seconds").default(2),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Script = typeof scripts.$inferSelect;
export type InsertScript = typeof scripts.$inferInsert;

export const rateLimits = pgTable("rate_limits", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull(),
  route: text("route").notNull(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
  count: integer("count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type RateLimit = typeof rateLimits.$inferSelect;
