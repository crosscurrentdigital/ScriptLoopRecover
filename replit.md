# ScriptLoop Workspace

## Overview

pnpm workspace monorepo using TypeScript. The primary artifact is ScriptLoop — a production memorization tool.

## ScriptLoop Stack

- **Framework**: Vite + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Routing**: React Router v6
- **Data fetching**: TanStack Query
- **Auth**: Better Auth (email/password, Drizzle adapter)
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
- `pnpm --filter @workspace/scriptloop run db:push` — push schema to Neon
- `pnpm --filter @workspace/scriptloop run db:generate` — generate migration files

## Project Structure

```
artifacts/scriptloop/
  src/
    auth/
      client.ts       - Better Auth browser client
      server.ts       - Better Auth server config (Node.js only)
    db/
      schema.ts       - Drizzle schema (auth tables + scripts)
      index.ts        - Neon HTTP connection
    lib/
      elevenlabs.ts   - ElevenLabs TTS client
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
  .env.template       - Required environment variables
  .gitignore
  drizzle.config.ts
  netlify.toml
```

## Required Environment Variables

```
DATABASE_URL          - Neon PostgreSQL connection string
BETTER_AUTH_SECRET    - 32+ char random secret
BETTER_AUTH_URL       - App base URL
ELEVENLABS_API_KEY    - ElevenLabs API key
R2_ACCOUNT_ID         - Cloudflare account ID
R2_ACCESS_KEY_ID      - R2 access key
R2_SECRET_ACCESS_KEY  - R2 secret key
R2_BUCKET_NAME        - R2 bucket name
R2_PUBLIC_URL         - R2 public base URL
```

## Monorepo Tool

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm

See the `pnpm-workspace` skill for workspace structure details.
