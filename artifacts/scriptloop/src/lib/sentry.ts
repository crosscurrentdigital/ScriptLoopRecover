import * as Sentry from "@sentry/react";

let initialized = false;

/**
 * Privacy posture: generated audio lives at a public, unguessable R2 URL
 * (see `replit.md` → Audio privacy posture). The browser carries those URLs
 * in <audio src> elements, so they could leak into Sentry breadcrumbs (DOM
 * snapshots, fetch breadcrumbs, console logs). We redact anything matching
 * our R2 public base before it leaves the browser.
 */
// The browser doesn't have direct access to R2_PUBLIC_URL, so we match by
// path shape instead. Server keys are always
// `audio/<userId>/<timestamp>-<filename>.<ext>` (see r2-server.ts and
// storage.ts), which is distinctive enough to avoid false positives.
const AUDIO_URL_RE =
  /https?:\/\/[^\s"'<>)]+\/audio\/[A-Za-z0-9_-]+\/\d+-[^\s"'<>)]+/gi;

function scrubAudioUrls(value: string): string {
  return value.replace(AUDIO_URL_RE, "[redacted-audio-url]");
}

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
    beforeBreadcrumb: (bc) => {
      if (bc.message) bc.message = scrubAudioUrls(bc.message);
      if (bc.data) {
        for (const k of Object.keys(bc.data)) {
          const v = bc.data[k];
          if (typeof v === "string") bc.data[k] = scrubAudioUrls(v);
        }
      }
      return bc;
    },
    beforeSend: (event) => {
      if (event.message) event.message = scrubAudioUrls(event.message);
      for (const ex of event.exception?.values ?? []) {
        if (ex.value) ex.value = scrubAudioUrls(ex.value);
      }
      return event;
    },
  });
}

export const SentrySDK = Sentry;
