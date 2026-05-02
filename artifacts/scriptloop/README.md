# ScriptLoop

Production memorization tool. Loop your scripts, memorize with audio.

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS + shadcn/ui
- React Router v6 + TanStack Query
- Drizzle ORM + Neon (PostgreSQL)
- Neon Auth (powered by Better Auth) — email/password
- Cloudflare R2 (audio storage)
- ElevenLabs (text-to-speech)
- Netlify (hosting + serverless functions)
- Sentry (error tracking, optional)
- Plausible Analytics (cookie-less analytics, optional)

## Local Development

1. Copy `.env.template` to `.env` and fill in all values:
   ```
   cp .env.template .env
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Apply DB migrations to your dev Neon branch:
   ```
   npm run db:migrate
   ```
   (For throwaway iteration on your own branch only, you can use
   `npm run db:push:dev` to skip generating a migration file. Never
   point it at prod — see [`MIGRATIONS.md`](./MIGRATIONS.md).)

4. Run locally with Netlify CLI (recommended — runs functions + Vite together):
   ```
   npx netlify dev
   ```
   Or Vite only (auth API calls will fail locally — fine for UI work):
   ```
   npm run dev
   ```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | yes | Neon PostgreSQL connection string |
| `VITE_NEON_AUTH_URL` | yes | Neon Auth URL from Console → Auth → Configuration |
| `ELEVENLABS_API_KEY` | yes | ElevenLabs API key |
| `R2_ACCOUNT_ID` | yes | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | yes | R2 S3-compatible access key |
| `R2_SECRET_ACCESS_KEY` | yes | R2 secret key |
| `R2_BUCKET_NAME` | yes | R2 bucket name (default: `scriptloop`) |
| `R2_PUBLIC_URL` | yes | R2 public URL (e.g. `https://pub-xxx.r2.dev`) |
| `VITE_SENTRY_DSN` | no | Sentry DSN for the React app. Code no-ops if missing. Safe to expose publicly. |
| `SENTRY_DSN` | no | Sentry DSN for the Netlify functions. Can be the same value as `VITE_SENTRY_DSN` (one project) or a separate Node project's DSN. |
| `VITE_PLAUSIBLE_DOMAIN` | no | Plausible domain (e.g. `scriptloop.app`). Plausible script is only injected in production builds. |

## Deploy to Netlify

The repo is already connected. Set all env vars above in Netlify → Site settings → Environment variables, then push to trigger a deploy.

## Database Migrations

Schema changes are versioned SQL files under [`drizzle/`](./drizzle).
The Netlify build runs `db:migrate` automatically before the new code
goes live, so a deploy can never land on an out-of-date database.

```
npm run db:generate   # diff schema.ts -> new SQL file under drizzle/
npm run db:migrate    # apply pending migrations to $DATABASE_URL
npm run db:check      # validate the journal/snapshot for drift
npm run db:push:dev   # dev-only: shortcut that skips writing a migration
```

See [`MIGRATIONS.md`](./MIGRATIONS.md) for the full workflow, the
expand/contract rule (every migration must keep the previous code
version working), and the per-environment `DATABASE_URL` setup.

> Note: The `neon_auth` schema is managed by Neon Auth automatically —
> the baseline migration declares its `user` table with `IF NOT EXISTS`
> only so the FK from `scripts.user_id` resolves on a fresh database.
> Do not add migrations that alter `neon_auth.user`.

## Production Hardening (Phase 8)

### Rate limiting

Audio generation is limited to **20 requests per user per hour** at the
serverless-function layer. Counters live in the `rate_limits` table (per-user,
per-route, hourly bucket) and are atomically incremented via Postgres
`ON CONFLICT`, so concurrent function invocations stay correct.

When the limit is exceeded the API returns:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: <seconds>
Content-Type: application/json

{
  "error": "rate_limited",
  "message": "You've hit the hourly limit of 20 audio generations…",
  "retryAfterSeconds": 1234,
  "limit": 20
}
```

The frontend's `ApiError` parses both the JSON body and the `Retry-After`
header, so toasts can show a friendly message.

To **manually reset** a user's hourly window during testing:

```sql
DELETE FROM rate_limits WHERE user_id = '<user-id>';
```

#### Automatic cleanup of old `rate_limits` rows

Because `rate_limits` inserts one row per `(user, route, hour)` bucket, the
table would otherwise grow forever. A scheduled Netlify function purges old
rows so the table stays small and the per-request `ON CONFLICT` upsert stays
fast.

- **Function**: `netlify/functions/cleanup-rate-limits.ts`
- **Schedule**: `@daily` (runs once every 24h via Netlify Scheduled Functions)
- **What it does**: `DELETE FROM rate_limits WHERE window_start < now() - interval '7 days'`
- **Idempotent**: safe to run any number of times — re-runs simply find no
  rows to delete.
- **Logged**: each run logs `[cleanup-rate-limits] deleted N rate_limits row(s) with window_start < <ISO cutoff>` to the function log, and any failure is reported to Sentry via `withSentry` / `captureFunctionError`.

You can also invoke it manually for an ad-hoc purge:

```
curl -X POST https://<your-site>/.netlify/functions/cleanup-rate-limits
```

### Character limits (defense in depth)

Scripts are capped at **2,000 characters** at three layers:

1. The `<textarea>` enforces `maxLength={2000}` and shows a live
   `n / 2000` counter (red at the limit).
2. The Save / Generate buttons are disabled when over the limit.
3. The Netlify functions (`/api/scripts` POST/PUT and
   `/api/generate-audio`) re-validate and return a structured 400:
   ```json
   { "error": "too_long", "message": "Scripts are limited to 2000 characters." }
   ```

### Error tracking — Sentry

- **Frontend** (`@sentry/react`): initialised in `src/main.tsx` from
  `VITE_SENTRY_DSN`. The `ErrorBoundary` reports React errors to Sentry
  with their component stack.
- **Backend** (`@sentry/node`): every Netlify function is wrapped with
  `withSentry(route, handler)` (see `netlify/functions/_lib/sentry.ts`),
  which captures thrown errors and any 5xx responses. ElevenLabs / R2
  failures explicitly call `captureFunctionError`.
- Both DSNs are no-op if unset — Sentry stays disabled in dev unless you
  opt in.

**Verify in production:**

1. Visit `/dashboard?sentry-test=1` and click the floating "Throw test
   error" button → the boundary renders and a new issue appears in
   Sentry within ~30s.
2. Hit a function with a deliberately bad payload that causes a 500
   (e.g. wrong R2 creds in a staging env) → Sentry receives it tagged
   `route=/api/generate-audio`.

### Analytics — Plausible

Plausible is loaded **at runtime** from `src/lib/plausible.ts`, gated on
`import.meta.env.PROD && VITE_PLAUSIBLE_DOMAIN`. This keeps dev sessions
out of analytics and avoids shipping the script when the domain isn't
configured. Plausible's default script auto-tracks SPA route changes —
no per-route hook is needed.

### Empty / error states

- `<NetworkErrorState>` is reused across the dashboard and detail page
  for "couldn't load" failures, with a Try-again button.
- The audio player has an `onError` fallback panel ("Audio failed to
  load — try regenerating") with a Try-again button.
- The script editor surfaces inline errors and a Retry button on the
  submit error card.

### Legal pages

`/privacy` and `/terms` are public routes (rendered without the app
chrome) and linked from the auth pages and the protected app footer.
Update the "last updated" date in `PrivacyPage.tsx` /
`TermsPage.tsx` whenever the policy changes.

### Tests

ScriptLoop ships with Vitest-based smoke, authorization, and integration
tests under [`tests/`](./tests). Run them with:

```
pnpm --filter @workspace/scriptloop run test         # one-shot
pnpm --filter @workspace/scriptloop run test:watch   # watch mode
```

Layout:

- **`tests/api/`** — fast handler-level tests for `netlify/functions/*`
  with the database, session, rate-limiter, and audio pipeline mocked via
  `vi.mock`. Cover 401 on every protected route, validation (missing
  fields, oversized content, wrong-type voiceId/text), 429 wiring, and
  the atomic `POST /api/scripts/with-audio` happy + failure paths.
- **`tests/integration/`** — exercises the same handlers against a real
  in-process Postgres ([PGlite](https://pglite.dev)) wired through
  `drizzle-orm/pglite`. Real WHERE clauses, FK constraints, and the
  rate-limit `ON CONFLICT DO UPDATE` upsert run here, so these tests
  would fail if a handler dropped its `userId` scope or if the limiter
  stopped denying the 21st call in a one-hour window.
- **`tests/app/`** — React Testing Library smoke for `RequireAuth` /
  `PublicRoute` redirects, with `@/lib/auth-client` mocked to drive
  `useSession` state.

Only ElevenLabs and R2 are stubbed in integration tests — the database
and rate-limit logic are real.

### Feature freeze

A feature freeze is in effect at **21:00**. Any change after the freeze
should be a blocker fix only.

## Project Structure

```
src/
  lib/
    auth-client.ts  - Neon Auth browser client (createAuthClient)
    elevenlabs.ts   - ElevenLabs client
    r2.ts           - R2 upload helper
    sentry.ts       - Browser Sentry init (env-gated)
    plausible.ts    - Runtime Plausible script injection (prod-only)
    api.ts          - React Query hooks + ApiError
  db/
    schema.ts       - Drizzle schema (scripts, rate_limits, users_sync ref)
    index.ts        - Neon connection
  pages/
    LoginPage.tsx
    RegisterPage.tsx
    DashboardPage.tsx
    ScriptEditorPage.tsx
    ScriptDetailPage.tsx
    PrivacyPage.tsx
    TermsPage.tsx
  components/
    ui/                  - shadcn/ui components
    AudioPlayer.tsx      - <audio> with loop + error fallback
    NetworkErrorState.tsx
    Footer.tsx
    SentryTestTrigger.tsx (only renders with ?sentry-test=1)
netlify/
  functions/
    _lib/
      session.ts        - getSession + jsonResponse helpers
      sentry.ts         - withSentry wrapper + captureFunctionError
      rateLimit.ts      - checkAndIncrement + 429 Response builder
    scripts.ts          - Scripts CRUD (/api/scripts/*)
    generate-audio.ts   - ElevenLabs + R2 + DB attach (rate-limited)
    audio.ts            - /api/audio/voices, /api/audio/generate guard
    storage.ts          - R2 presign (/api/storage/presign)
    cleanup-rate-limits.ts - Scheduled (@daily) purge of rate_limits rows older than 7 days
```
