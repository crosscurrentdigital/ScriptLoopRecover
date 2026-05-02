import {
  pgTable,
  pgSchema,
  text,
  serial,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";

const neonAuthSchema = pgSchema("neon_auth");

export const usersSync = neonAuthSchema.table("users_sync", {
  rawId: text("raw_id").primaryKey(),
  name: text("name"),
  email: text("email"),
  createdAt: timestamp("created_at"),
  deletedAt: timestamp("deleted_at"),
  updatedAt: timestamp("updated_at"),
});

export const scripts = pgTable("scripts", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => usersSync.rawId, { onDelete: "cascade" }),
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
