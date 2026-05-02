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

## Local Development

1. Copy `.env.template` to `.env` and fill in all values:
   ```
   cp .env.template .env
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Push DB schema to Neon:
   ```
   npm run db:push
   ```

4. Run locally with Netlify CLI (recommended — runs functions + Vite together):
   ```
   npx netlify dev
   ```
   Or Vite only (auth API calls will fail locally — fine for UI work):
   ```
   npm run dev
   ```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `VITE_NEON_AUTH_URL` | Neon Auth URL from Console → Auth → Configuration |
| `ELEVENLABS_API_KEY` | ElevenLabs API key |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 S3-compatible access key |
| `R2_SECRET_ACCESS_KEY` | R2 secret key |
| `R2_BUCKET_NAME` | R2 bucket name (default: `scriptloop`) |
| `R2_PUBLIC_URL` | R2 public URL (e.g. `https://pub-xxx.r2.dev`) |

## Deploy to Netlify

The repo is already connected. Set all env vars above in Netlify → Site settings → Environment variables, then push to trigger a deploy.

## Database Migrations

```
npm run db:push       # push schema directly (dev/staging)
npm run db:generate   # generate migration files
npm run db:migrate    # apply migrations
```

> Note: The `neon_auth` schema (users_sync table) is managed by Neon Auth automatically — do not include it in migrations.

## Project Structure

```
src/
  lib/
    auth-client.ts  - Neon Auth browser client (createAuthClient)
    elevenlabs.ts   - ElevenLabs client
    r2.ts           - R2 upload helper
  db/
    schema.ts       - Drizzle schema (references neon_auth.users_sync + scripts table)
    index.ts        - Neon connection
  pages/
    LoginPage.tsx   - Sign-in via AuthView
    RegisterPage.tsx - Sign-up via AuthView
    DashboardPage.tsx
  components/ui/    - shadcn/ui components
netlify/
  functions/
    scripts.ts      - Scripts CRUD (/api/scripts/*)
    storage.ts      - R2 presign (/api/storage/presign)
```
