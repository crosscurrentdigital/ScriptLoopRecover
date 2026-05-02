import { textToSpeech } from "../../../src/lib/elevenlabs";
import { uploadBufferToR2 } from "../../../src/lib/r2-server";

export const MAX_TEXT_LENGTH = 2000;

const MPEG_BITRATE_TABLE: Record<string, (number | null)[]> = {
  "1-1": [
    null, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448,
    null,
  ],
  "1-2": [
    null, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384, null,
  ],
  "1-3": [
    null, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, null,
  ],
  "2-1": [
    null, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256, null,
  ],
  "2-2": [
    null, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, null,
  ],
  "2-3": [
    null, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, null,
  ],
};

const DEFAULT_BITRATE_BPS = 128_000;
const WORDS_PER_SECOND_FALLBACK = 2.5;

function readMp3Bitrate(buf: Uint8Array): number | null {
  const limit = Math.min(buf.length - 4, 8192);
  for (let i = 0; i < limit; i++) {
    if (buf[i] === 0xff && (buf[i + 1] & 0xe0) === 0xe0) {
      const versionBits = (buf[i + 1] >> 3) & 0x03;
      const layerBits = (buf[i + 1] >> 1) & 0x03;
      const bitrateIndex = (buf[i + 2] >> 4) & 0x0f;

      if (versionBits === 1 || layerBits === 0 || bitrateIndex === 0xf) {
        continue;
      }

      const versionKey =
        versionBits === 3 ? "1" : versionBits === 2 ? "2" : null;
      const layerKey =
        layerBits === 3 ? "1" : layerBits === 2 ? "2" : layerBits === 1 ? "3" : null;
      if (!versionKey || !layerKey) continue;

      const table = MPEG_BITRATE_TABLE[`${versionKey}-${layerKey}`];
      const kbps = table?.[bitrateIndex];
      if (kbps) return kbps * 1000;
    }
  }
  return null;
}

export function estimateDurationSeconds(
  audioBytes: Uint8Array,
  text: string,
): number {
  const bitrate = readMp3Bitrate(audioBytes) ?? DEFAULT_BITRATE_BPS;
  const fromBytes = (audioBytes.byteLength * 8) / bitrate;

  if (Number.isFinite(fromBytes) && fromBytes > 0.05) {
    return Math.round(fromBytes * 10) / 10;
  }

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const fallback = wordCount / WORDS_PER_SECOND_FALLBACK;
  return Math.round(Math.max(fallback, 0.1) * 10) / 10;
}

/**
 * Returns an error message if the ElevenLabs / R2 environment is not fully
 * configured, or null if everything required is set.
 */
export function checkAudioConfig(): string | null {
  if (!process.env.ELEVENLABS_API_KEY) {
    return "ElevenLabs is not configured";
  }
  const missingR2 = [
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET_NAME",
    "R2_PUBLIC_URL",
  ].filter((name) => !process.env[name]);
  if (missingR2.length > 0) {
    return `R2 storage is not configured: missing ${missingR2.join(", ")}`;
  }
  return null;
}

export interface GeneratedAudio {
  audioBytes: Uint8Array;
  publicUrl: string;
  durationSeconds: number;
}

export class AudioPipelineError extends Error {
  status: number;
  stage: "tts" | "upload";
  constructor(message: string, status: number, stage: "tts" | "upload") {
    super(message);
    this.name = "AudioPipelineError";
    this.status = status;
    this.stage = stage;
  }
}

/**
 * Generate audio via ElevenLabs and upload it to R2. Throws
 * {@link AudioPipelineError} on failure so callers can map to HTTP responses
 * and capture telemetry. Does NOT touch the database — callers are
 * responsible for persistence (intentional, so create-with-audio can defer
 * the row insert until after upload succeeds).
 */
export async function generateAndUploadAudio(args: {
  apiKey: string;
  userId: string;
  text: string;
  voiceId: string;
}): Promise<GeneratedAudio> {
  let audioBuffer: ArrayBuffer;
  try {
    audioBuffer = await textToSpeech(args.apiKey, {
      text: args.text,
      voiceId: args.voiceId,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Text-to-speech failed";
    throw new AudioPipelineError(msg, 502, "tts");
  }

  const audioBytes = new Uint8Array(audioBuffer);
  const key = `audio/${args.userId}/${Date.now()}-generated.mp3`;

  let publicUrl: string;
  try {
    const result = await uploadBufferToR2(audioBytes, key, "audio/mpeg");
    publicUrl = result.publicUrl;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "R2 upload failed";
    throw new AudioPipelineError(msg, 502, "upload");
  }

  const durationSeconds = estimateDurationSeconds(audioBytes, args.text);

  return { audioBytes, publicUrl, durationSeconds };
}
