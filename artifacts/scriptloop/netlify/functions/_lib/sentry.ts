import * as Sentry from "@sentry/node";

let initialized = false;

/**
 * Privacy posture: generated audio is hosted on a public R2 bucket behind an
 * unguessable URL (see `replit.md` → Audio privacy posture). Leaking those
 * URLs into Sentry events would be equivalent to leaking the audio itself,
 * so we redact anything that looks like our R2 public base before send.
 */
function buildAudioUrlScrubber(): ((value: string) => string) | null {
  const base = process.env.R2_PUBLIC_URL;
  if (!base) return null;
  let host: string;
  try {
    host = new URL(base).host;
  } catch {
    return null;
  }
  // Match http(s)://<host>/<path-without-spaces-or-quotes>
  const escapedHost = host.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`https?://${escapedHost}/[^\\s"'<>)]*`, "gi");
  return (value: string) => value.replace(re, "[redacted-audio-url]");
}

function scrubEvent<T extends Sentry.Event>(
  event: T,
  scrub: (value: string) => string,
): T {
  if (event.message) event.message = scrub(event.message);
  for (const ex of event.exception?.values ?? []) {
    if (ex.value) ex.value = scrub(ex.value);
  }
  for (const bc of event.breadcrumbs ?? []) {
    if (bc.message) bc.message = scrub(bc.message);
    if (bc.data) {
      for (const k of Object.keys(bc.data)) {
        const v = bc.data[k];
        if (typeof v === "string") bc.data[k] = scrub(v);
      }
    }
  }
  return event;
}

function ensureInit() {
  if (initialized) return;
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    initialized = true;
    return;
  }
  const scrub = buildAudioUrlScrubber();
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "production",
    tracesSampleRate: 0,
    beforeSend: scrub ? (event) => scrubEvent(event, scrub) : undefined,
    beforeBreadcrumb: scrub
      ? (bc) => {
          if (bc.message) bc.message = scrub(bc.message);
          return bc;
        }
      : undefined,
  });
  initialized = true;
}

export interface CaptureOptions {
  route: string;
  userId?: string | null;
  status?: number;
}

export function captureFunctionError(
  error: unknown,
  opts: CaptureOptions,
): void {
  ensureInit();
  if (!process.env.SENTRY_DSN) return;
  try {
    Sentry.withScope((scope) => {
      scope.setTag("route", opts.route);
      if (opts.userId) scope.setUser({ id: opts.userId });
      if (opts.status !== undefined) scope.setTag("status", String(opts.status));
      if (error instanceof Error) {
        Sentry.captureException(error);
      } else {
        Sentry.captureMessage(
          typeof error === "string" ? error : JSON.stringify(error),
        );
      }
    });
  } catch {
    /* never let Sentry break a request */
  }
}

export type Handler = (req: Request) => Promise<Response> | Response;

export function withSentry(route: string, handler: Handler): Handler {
  return async (req: Request) => {
    ensureInit();
    try {
      const res = await handler(req);
      if (res.status >= 500) {
        let snippet = "";
        try {
          snippet = (await res.clone().text()).slice(0, 500);
        } catch {
          /* ignore */
        }
        captureFunctionError(
          new Error(`5xx from ${route}: ${res.status} ${snippet}`),
          { route, status: res.status },
        );
      }
      return res;
    } catch (err) {
      captureFunctionError(err, { route });
      throw err;
    }
  };
}
