# ScriptLoop Workspace

## Overview

pnpm workspace monorepo using TypeScript. The primary artifact is ScriptLoop — a production memorization tool.

## ScriptLoop Stack

- **Framework**: Vite + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Routing**: React Router v6
- **Data fetching**: TanStack Query
- **Auth**: Neon Auth (`@neondatabase/auth@0.3.0-beta`, email/password). Pinned to a beta — see `artifacts/scriptloop/KNOWN_RISKS.md`.
- **Database**: Drizzle ORM + Neon (PostgreSQL)
- **Storage**: Cloudflare R2 + AWS S3 SDK
- **Audio**: ElevenLabs
- **Hosting**: Netlify (functions + static)

## CRITICAL CONSTRAINTS

- NO Replit database, Replit auth, or Replit hosting
- All env vars must come from `.env` (copy `.env.template`)
- Netlify functions handle all server-side logic
- `/src` code must remain browser-compatible

## Key Commands

- `pnpm --filter @workspace/scriptloop run dev` — dev server (Vite only, no functions)
- `pnpm --filter @workspace/scriptloop run build` — production build
- `pnpm --filter @workspace/scriptloop run db:generate` — generate a new SQL migration from `src/db/schema.ts`
- `pnpm --filter @workspace/scriptloop run db:migrate` — apply pending migrations to `$DATABASE_URL` (this is what the Netlify build runs)
- `pnpm --filter @workspace/scriptloop run db:push:dev` — dev-only escape hatch that skips writing a migration file. **Never point this at prod.** See `artifacts/scriptloop/MIGRATIONS.md`.
- `pnpm --filter @workspace/scriptloop run test` — run vitest smoke + authorization tests once
- `pnpm --filter @workspace/scriptloop run test:watch` — vitest watch mode

## Tests

Tests live in `artifacts/scriptloop/tests/`:
- `tests/api/` — fast handler-level tests with `db`, `getSession`, `checkAndIncrement`, and the audio pipeline mocked via `vi.mock`. Cover 401 on every protected route, validation (missing fields, oversized content, wrong-type inputs), 429 wiring, and `POST /api/scripts/with-audio` failure paths.
- `tests/integration/` — same handlers running against a real in-process Postgres ([PGlite](https://pglite.dev)) via `drizzle-orm/pglite`. Real WHERE clauses, FK constraints, and the rate-limit `ON CONFLICT DO UPDATE` upsert run here. Covers cross-user 404s for GET/PUT/DELETE (with row-unchanged assertions), missing-title regression, the create→fetch happy-path round-trip with audio, and the 21st-request-denied real rate-limit scenario.
- `tests/app/` — React Testing Library smoke for `RequireAuth` / `PublicRoute` routing in a `MemoryRouter` with `@/lib/auth-client` mocked.

In integration tests, ElevenLabs, R2, and `getSession` are stubbed; the database, SQL queries, and rate-limit upserts run for real against PGlite.

## Project Structure

```
artifacts/scriptloop/
  src/
    lib/
      auth-client.ts  - Neon Auth browser client (createAuthClient + BetterAuthReactAdapter)
      elevenlabs.ts   - ElevenLabs TTS client
      r2.ts           - R2 upload helper (browser side)
      r2-server.ts    - R2 upload helper (functions side)
      api.ts          - React Query hooks + ApiError
      sentry.ts       - Browser Sentry init (env-gated)
      plausible.ts    - Runtime Plausible script injection (prod-only)
    db/
      schema.ts       - Drizzle schema (scripts, rate_limits, neon_auth.user FK ref)
      index.ts        - Neon HTTP connection
    pages/
      LoginPage.tsx            - renders Neon Auth <AuthView view="signIn">
      RegisterPage.tsx         - renders Neon Auth <AuthView view="signUp">
      DashboardPage.tsx
      ScriptEditorPage.tsx     - editor at /scripts/new and /scripts/:id/edit
      ScriptDetailPage.tsx     - read-only playback at /scripts/:id
      PrivacyPage.tsx, TermsPage.tsx
      NotFoundPage.tsx         - 404 fallback
    components/
      AudioPlayer.tsx          - shared looping <audio> with gap timer
      editor/                  - VoicePicker, CharacterCount, mockGenerateAudio
      ui/                      - shadcn/ui components
  netlify/
    functions/
      _lib/
        session.ts    - getSession() calls Neon Auth's /api/auth/get-session
        sentry.ts     - withSentry wrapper + captureFunctionError
        rateLimit.ts  - checkAndIncrement + 429 Response builder
      scripts.ts      - Scripts CRUD (/api/scripts/*)
      generate-audio.ts - ElevenLabs + R2 + DB attach (rate-limited)
      audio.ts        - /api/audio/voices + /api/audio/quota
      storage.ts      - R2 presign (/api/storage/presign)
      cleanup-rate-limits.ts - Scheduled (@daily) purge of old rate_limits rows
  .env.template       - Required environment variables
  .gitignore
  drizzle.config.ts
  netlify.toml
```

## Auth

Auth is handled end-to-end by **Neon Auth** (`@neondatabase/auth`, a
hosted Better-Auth-derived service). The browser uses
`createAuthClient(VITE_NEON_AUTH_URL, { adapter: BetterAuthReactAdapter() })`
in `src/lib/auth-client.ts`; the sign-in / sign-up screens
(`src/pages/LoginPage.tsx`, `RegisterPage.tsx`) just render Neon's
`<AuthView>` component, so credentials, the cookie, and the user row
in `neon_auth.user` are all owned upstream — there is **no** local
sessions table and no `BETTER_AUTH_SECRET` to manage.

Server-side, every Netlify function calls
`getSession(req)` from `netlify/functions/_lib/session.ts`, which
forwards the incoming `Cookie` header to
`${VITE_NEON_AUTH_URL}/api/auth/get-session` and returns
`{ userId } | null`. Handlers treat `null` as 401 and use the returned
`userId` to scope every DB query (the `scripts` table FKs into
`neon_auth.user`). Anyone touching auth: the only env var you need is
`VITE_NEON_AUTH_URL`, the dependency is pinned to the exact beta in
`KNOWN_RISKS.md`, and the smoke flow to re-run after any auth change
is documented there.

## Audio privacy posture

**Decision (Task 29, May 2026): public-by-design behind an unguessable URL.**

Generated audio is uploaded to a Cloudflare R2 bucket whose `public-read`
policy is enabled, and served via `R2_PUBLIC_URL/<key>` where the key is
`audio/<userId>/<timestamp>-<nonce>-<filename>.mp3`. The `<nonce>` is a
128-bit value from `crypto.randomUUID()` (hex, dashes stripped); the
timestamp and userId on their own are predictable, so the nonce is what
makes the URL hard to guess. Anyone who learns the URL can play the
audio without signing in.

**Why not signed, expiring URLs?** Signed URLs would require: disabling
public-read on the bucket, server-side signing on every `GET /api/scripts/:id`,
client-side URL-refresh-on-expiry inside `<audio>` (which doesn't natively
support token rotation mid-playback), and reworking the looping audio
hook. For a hobby/indie tool with 2000-char scripts and rate-limited
generation, the implementation/maintenance cost was judged higher than the
incremental privacy gain. We may revisit if the threat model changes.

**Enforcement (don't drift from this):**

- `src/lib/r2-server.ts` and `netlify/functions/storage.ts` set an
  explicit `Cache-Control: public, max-age=31536000, immutable` on every
  PUT — public caching is intentional and the comment links back here.
- `src/components/AudioPrivacyConsent.tsx` is shown in
  `ScriptEditorPage` (create) and `ScriptDetailPage` (regenerate). The
  Generate button is disabled until the user acknowledges the posture
  once per device (persisted in localStorage as
  `scriptloop:audio-privacy-ack:v1`).
- `PrivacyPage.tsx` and `TermsPage.tsx` describe the posture in plain
  language — keep them in sync if this decision ever changes.
- Sentry (both `netlify/functions/_lib/sentry.ts` and `src/lib/sentry.ts`)
  scrubs strings matching the R2 audio URL shape from events and
  breadcrumbs before send, so leaked URLs don't end up in error reports.
- Plausible Analytics is cookie-less and we do not emit any custom events
  containing audio URLs (only automatic pageviews).
- **URL rotation / leaked-URL revocation:** there is no separate "rotate"
  endpoint by design. Regenerating audio for an existing script (POST
  `/api/generate-audio` with a `scriptId`) writes a new R2 key (timestamp
  in the path), updates `scripts.audioUrl`, **and best-effort deletes the
  previous R2 object** via `deleteObjectByPublicUrl` so a leaked old URL
  stops working. The deletion is best-effort: if R2 is unreachable the
  request still succeeds (the user got their new audio) and the failure
  is captured to Sentry. `POST /api/scripts/with-audio` (initial create)
  has no previous URL to delete. Telling users to "regenerate to rotate"
  is therefore literally true at the origin — the old object is actively
  removed, not just forgotten. **Caveat:** because uploads use
  `Cache-Control: public, max-age=31536000, immutable`, browsers and CDNs
  that already cached a leaked URL may keep serving it after the origin
  object is gone. Rotation is therefore not instantaneous; the privacy
  copy is worded to reflect this. If practical revocation latency ever
  matters more than playback caching, shorten `max-age` here and in
  storage.ts.

If a future task switches to signed URLs, all of the above needs to flip
together (bucket policy off public-read, signing helper, client refresh,
copy in privacy/terms, consent component removed, cache-control to
`private`).

## Required Environment Variables

```
DATABASE_URL          - Neon PostgreSQL connection string
VITE_NEON_AUTH_URL    - Neon Auth URL (Neon Console → Auth → Configuration). Read by both the browser client (src/lib/auth-client.ts) and netlify/functions/_lib/session.ts.
ELEVENLABS_API_KEY    - ElevenLabs API key
R2_ACCOUNT_ID         - Cloudflare account ID
R2_ACCESS_KEY_ID      - R2 access key
R2_SECRET_ACCESS_KEY  - R2 secret key
R2_BUCKET_NAME        - R2 bucket name
R2_PUBLIC_URL         - R2 public base URL
VITE_SENTRY_DSN       - optional, browser Sentry DSN
SENTRY_DSN            - optional, Netlify-functions Sentry DSN
VITE_PLAUSIBLE_DOMAIN - optional, Plausible domain (prod-only)
```

There is no `BETTER_AUTH_SECRET` / `BETTER_AUTH_URL` — Neon Auth is a
hosted service, so there is nothing to sign on our side. Do not
re-introduce those vars.

## Monorepo Tool

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24

## Routing (Phase 4)

- `/sign-in`, `/sign-up` — public Neon Auth pages
- `/dashboard` — script list (protected)
- `/scripts/new` — editor in create mode (protected)
- `/scripts/:id` — read-only **detail/playback** page (protected)
- `/scripts/:id/edit` — editor in edit mode (protected)
- `*` — public 404

After saving a brand-new script, the editor redirects to `/scripts/:id/edit` so audio can be generated; once `audioUrl` exists, an "Open playback view" link sends the user to `/scripts/:id`.

## Audio pipeline (Phase 3)

`POST /api/generate-audio` accepts `{text, voiceId, scriptId?}`. With a `scriptId`, the server does an ownership check via `getScriptForUser`, generates audio with ElevenLabs, uploads to R2, then calls `attachAudioToScript` to persist `{audioUrl, audioDurationSeconds, voiceId}` and returns the updated script. The client `useGenerateAudio` mutation patches both `["scripts"]` and `["scripts", id]` caches via `setQueryData`.

## Parallel work (in flight on isolated agents)

- Task #6: dashboard rebuild (do not edit `DashboardPage.tsx` from main)
- Task #13: landing page, favicon, OG tags, footer
- Task #12, #14: progressive word hiding, mobile polish (proposed)
- **Package manager**: pnpm

See the `pnpm-workspace` skill for workspace structure details.
