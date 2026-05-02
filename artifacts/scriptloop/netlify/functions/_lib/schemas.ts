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

export const createScriptSchema = z.object({
  title: trimmed(MAX_TITLE_LENGTH),
  content: z.string().min(1).max(MAX_TEXT_LENGTH),
  loopGapSeconds: loopGapSchema.optional(),
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
    audioUrl: z.string().url().max(2048).optional(),
    audioSource: z.string().max(64).optional(),
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
const SAFE_CONTENT_TYPE = /^[A-Za-z0-9.+\-/]+$/;

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
