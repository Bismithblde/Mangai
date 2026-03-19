---
description: "Use when editing Next.js App Router auth pages, auth routes, Supabase clients, or session middleware in this project. Provides preferred redirect, session, error-handling, and auth UI patterns."
name: "Next.js Supabase Auth Conventions"
applyTo:
  - "app/**/page.tsx"
  - "app/**/route.ts"
  - "lib/supabase/**/*.ts"
  - "proxy.ts"
---
# Next.js Supabase Auth Preferences

- Prefer the existing Supabase helpers from `lib/supabase/client.ts`, `lib/supabase/server.ts`, and `lib/supabase/middleware.ts` rather than introducing duplicate client factories.
- For OAuth providers, prefer `/auth/callback` as the redirect target and let the server route exchange the code for a session.
- For email-password login and signup, clear old UI errors before each request and return early on failure.
- Prefer server-side auth checks for protected pages and redirects instead of client-only guards.
- Keep auth callback and email confirmation routes minimal: validate inputs, perform Supabase exchange or verification, then redirect.
- Preserve the current route contract when possible:
  - `/login` starts auth
  - `/auth/callback` exchanges OAuth code
  - `/auth/confirm` verifies email token hashes
  - `/auth/signout` clears session
  - `/protected` requires an authenticated server user
- Keep user-visible auth errors friendly and actionable, and avoid exposing internal stack details.
- Reuse existing navigation behavior (`window.location.assign` in client components, `redirect(...)` in server contexts) unless asked to refactor globally.
- For auth pages, prefer the current UI language already used in this repo:
  - centered auth card layout with generous spacing
  - soft blue surfaces, borders, and hover states
  - clear form labels and one primary action per section
  - concise inline feedback for info and error states
