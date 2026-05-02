import * as Sentry from "@sentry/node";

let initialized = false;

function ensureInit() {
  if (initialized) return;
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    initialized = true;
    return;
  }
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "production",
    tracesSampleRate: 0,
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
