import { z, type ZodSchema, type ZodIssue } from "zod";
import { jsonResponse } from "./session";

export const MAX_TEXT_LENGTH = 2000;
export const MAX_TITLE_LENGTH = 100;

const trimmed = (max: number) =>
  z.string().trim().min(1).max(max);

export const voiceIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/, "voiceId must be alphanumeric");

export const loopGapSchema = z.number().int().min(0).max(60);

export const scriptIdParamSchema = z.coerce
  .number()
  .int()
  .positive();

// Audio sources we accept from clients. "elevenlabs" is the legacy
// label still written by the AI pipeline (`attachAudioToScript`); "ai"
// is accepted as a forward-compatible alias. "user" is for self-recorded
// audio uploaded via the presigned R2 PUT flow.
export const audioSourceSchema = z.enum(["ai", "elevenlabs", "user"]);

// R2 public audio URLs always live under R2_PUBLIC_URL; we don't enforce
// the host here (client trust boundary is the ownership check on the
// row + the unguessable key in the path), but we cap the length and
// require a valid URL shape so we can't be coerced into storing junk.
export const audioUrlSchema = z.string().url().max(2048);

export const createScriptSchema = z.object({
  title: trimmed(MAX_TITLE_LENGTH),
  content: z.string().min(1).max(MAX_TEXT_LENGTH),
  loopGapSeconds: loopGapSchema.optional(),
  // When the user recorded their own audio, the client uploads it to R2
  // first (via /api/storage/presign) and then creates the script row
  // with the resulting public URL. Both fields are optional and must be
  // provided together (enforced in the handler).
  audioUrl: audioUrlSchema.optional(),
  audioSource: audioSourceSchema.optional(),
});

export const createScriptWithAudioSchema = z.object({
  title: trimmed(MAX_TITLE_LENGTH),
  content: z.string().trim().min(1).max(MAX_TEXT_LENGTH),
  voiceId: voiceIdSchema,
  loopGapSeconds: loopGapSchema.optional(),
});

export const updateScriptSchema = z
  .object({
    title: trimmed(MAX_TITLE_LENGTH).optional(),
    content: z.string().min(1).max(MAX_TEXT_LENGTH).optional(),
    audioUrl: audioUrlSchema.optional(),
    audioSource: audioSourceSchema.optional(),
    voiceId: voiceIdSchema.optional(),
    loopGapSeconds: loopGapSchema.optional(),
  })
  .strict();

export const generateAudioSchema = z.object({
  text: z.string().trim().min(1).max(MAX_TEXT_LENGTH),
  voiceId: voiceIdSchema,
  scriptId: z.number().int().positive().optional(),
});

const SAFE_FILENAME = /^[A-Za-z0-9._-]+$/;
// MIME `type/subtype` with optional RFC 6838 parameters. We have to
// allow `;`, `=`, and space for things like `audio/webm;codecs=opus`
// which `MediaRecorder` returns on Chrome/Firefox; rejecting them broke
// the user-recording flow in those browsers.
const SAFE_CONTENT_TYPE = /^[A-Za-z0-9.+\-/;= ]+$/;

export const presignSchema = z.object({
  fileName: z
    .string()
    .min(1)
    .max(255)
    .regex(SAFE_FILENAME, "fileName has invalid characters"),
  contentType: z
    .string()
    .min(1)
    .max(127)
    .regex(SAFE_CONTENT_TYPE, "contentType is invalid"),
});

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
    retryAfterSeconds?: number;
  };
}

export function errorResponse(
  status: number,
  code: string,
  message: string,
  extras: { details?: unknown; headers?: Record<string, string> } = {},
): Response {
  const body: ApiErrorBody = {
    error: { code, message, ...(extras.details ? { details: extras.details } : {}) },
  };
  return jsonResponse(body, status, extras.headers ?? {});
}

function summarizeIssues(issues: ZodIssue[]): {
  message: string;
  details: { path: string; message: string }[];
} {
  const details = issues.map((i) => ({
    path: i.path.join("."),
    message: i.message,
  }));
  const first = details[0];
  const message = first
    ? first.path
      ? `Invalid ${first.path}: ${first.message}`
      : first.message
    : "Invalid request";
  return { message, details };
}

export async function parseJsonBody<T>(
  req: Request,
  schema: ZodSchema<T>,
): Promise<{ ok: true; data: T } | { ok: false; response: Response }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return {
      ok: false,
      response: errorResponse(400, "invalid_json", "Request body must be valid JSON."),
    };
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    const { message, details } = summarizeIssues(result.error.issues);
    return {
      ok: false,
      response: errorResponse(400, "invalid_request", message, { details }),
    };
  }
  return { ok: true, data: result.data };
}

export function parseParam<T>(
  value: unknown,
  schema: ZodSchema<T>,
  paramName: string,
): { ok: true; data: T } | { ok: false; response: Response } {
  const result = schema.safeParse(value);
  if (!result.success) {
    const { details } = summarizeIssues(result.error.issues);
    return {
      ok: false,
      response: errorResponse(
        400,
        "invalid_param",
        `Invalid ${paramName}.`,
        { details },
      ),
    };
  }
  return { ok: true, data: result.data };
}
