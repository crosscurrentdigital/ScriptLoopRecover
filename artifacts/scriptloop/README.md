# ScriptLoop

Production memorization tool. Loop your scripts, memorize with audio.

## Stack

- Vite + React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- React Router v6 + TanStack Query
- Drizzle ORM + Neon (PostgreSQL)
- Better Auth (email/password)
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
   Or Vite only (no auth, no API):
   ```
   npm run dev
   ```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Random 32+ char secret (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | App base URL (e.g. `http://localhost:8888` locally, your Netlify URL in prod) |
| `ELEVENLABS_API_KEY` | ElevenLabs API key |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 access key |
| `R2_SECRET_ACCESS_KEY` | R2 secret key |
| `R2_BUCKET_NAME` | R2 bucket name |
| `R2_PUBLIC_URL` | R2 public URL (e.g. `https://pub-xxx.r2.dev`) |

## Deploy to Netlify

1. Push to GitHub:
   ```
   git init
   git add .
   git commit -m "Initial ScriptLoop setup"
   git remote add origin https://github.com/YOUR_USERNAME/scriptloop.git
   git push -u origin main
   ```

2. Connect the repo to Netlify and set all environment variables in Netlify's dashboard.

3. Netlify will auto-deploy on push.

## Database Migrations

Generate and apply migrations for schema changes:
```
npm run db:generate   # generate migration files
npm run db:migrate    # apply to your database
npm run db:push       # push directly (dev only)
```

## Project Structure

```
src/
  auth/
    client.ts       - Better Auth browser client
    server.ts       - Better Auth server config (used in functions)
  db/
    schema.ts       - Drizzle schema (auth tables + scripts)
    index.ts        - Neon connection
  lib/
    elevenlabs.ts   - ElevenLabs client
    r2.ts           - R2 upload helper
  pages/
    LoginPage.tsx
    RegisterPage.tsx
    DashboardPage.tsx
  components/ui/    - shadcn/ui components
netlify/
  functions/
    auth.ts         - Better Auth handler (/api/auth/*)
    scripts.ts      - Scripts CRUD (/api/scripts/*)
    storage.ts      - R2 presign (/api/storage/presign)
```
