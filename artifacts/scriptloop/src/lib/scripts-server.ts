import { and, eq } from "drizzle-orm";
import { db } from "../db/index";
import { scripts, type Script } from "../db/schema";

export async function getScriptForUser(
  scriptId: number,
  userId: string,
): Promise<Script | null> {
  const [row] = await db
    .select()
    .from(scripts)
    .where(and(eq(scripts.id, scriptId), eq(scripts.userId, userId)));
  return row ?? null;
}

export interface AttachAudioArgs {
  scriptId: number;
  userId: string;
  audioUrl: string;
  voiceId: string;
  audioSource?: string;
}

export async function attachAudioToScript(
  args: AttachAudioArgs,
): Promise<Script | null> {
  const [updated] = await db
    .update(scripts)
    .set({
      audioUrl: args.audioUrl,
      voiceId: args.voiceId,
      audioSource: args.audioSource ?? "elevenlabs",
      updatedAt: new Date(),
    })
    .where(
      and(eq(scripts.id, args.scriptId), eq(scripts.userId, args.userId)),
    )
    .returning();
  return updated ?? null;
}
