# Known Risks

## Auth dependency: `@neondatabase/auth@0.3.0-beta` (pre-release)

**Status:** accepted, May 2026.

### What
The entire login / signup / session-validation flow depends on
`@neondatabase/auth` (Neon Auth, powered internally by Better Auth).
The package is pinned to **exactly `0.3.0-beta`** in
`artifacts/scriptloop/package.json` (no caret, no range).

### Why this is a risk
There is no GA / stable release line for this package on npm — the
`latest` dist-tag points at `0.3.0-beta`, and the only other versions
published are `0.1.0-beta.x` and `0.2.0-beta.1`. Beta libraries can
ship breaking changes or critical bugfixes between minor versions, and
public signups depend on this one.

### Why we accept it for now
1. There is no stable alternative published — switching to a different
   provider (Clerk, raw Better Auth, etc.) is a much larger task than
   the scope of this audit and was explicitly called out as out of
   scope.
2. The version is **exactly pinned**, so a `pnpm install` will not
   silently bump us into a newer beta with unknown behavior.
3. The surface we use is small: `createAuthClient`,
   `BetterAuthReactAdapter`, the `<AuthView>` component, and the
   server-side `GET /api/auth/get-session` endpoint that
   `netlify/functions/_lib/session.ts` calls. A regression in any of
   these would fail loudly in our smoke flow (sign up → sign in →
   `/dashboard` → sign out).

### Upgrade plan
- Watch `npm view @neondatabase/auth dist-tags` for a non-beta
  `latest` (anything that does not contain `-beta`, `-rc`, `-alpha`).
- When one appears, bump `package.json` to the new pinned version,
  re-run `pnpm install`, and re-run the auth smoke flow below.
- If the upstream changes the package name or merges back into
  `better-auth`, treat that as a separate migration task — do not do
  it as part of a routine dependency bump.

### Smoke flow to re-run after any auth bump
1. Sign up a new user at `/sign-up`.
2. Sign out, then sign in at `/sign-in` with the same credentials.
3. Confirm `/dashboard` loads and shows the user's scripts.
4. Hit a protected API directly without a cookie
   (`curl $URL/api/scripts`) — must return 401.
5. Sign out and confirm `/dashboard` redirects back to `/sign-in`.
