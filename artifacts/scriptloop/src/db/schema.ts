import {
  pgTable,
  pgSchema,
  text,
  serial,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";

const neonAuthSchema = pgSchema("neon_auth");

export const authUser = neonAuthSchema.table("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email"),
  emailVerified: text("email_verified"),
  image: text("image"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const scripts = pgTable("scripts", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
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
