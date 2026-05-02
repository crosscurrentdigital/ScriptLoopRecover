import * as Sentry from "@sentry/react";

let initialized = false;

export function initSentry(): void {
  if (initialized) return;
  initialized = true;
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  });
}

export const SentrySDK = Sentry;
