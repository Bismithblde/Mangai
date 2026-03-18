# Supabase Auth (Google + Email Verification)

This project contains a working frontend and backend auth flow using:

- Next.js App Router
- Supabase SSR clients (`@supabase/ssr`)
- Google OAuth sign-in
- Email/password authentication
- Email verification

## 1. Configure Supabase

1. Create a Supabase project.
2. In Supabase Dashboard, enable Google provider:
   - Auth -> Providers -> Google
   - Add your Google OAuth Client ID and Secret
3. In Auth -> Providers -> Email, enable email provider and Confirm email.
4. Add redirect URLs in Supabase Auth settings:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/auth/confirm`
5. In Auth -> Email Templates -> Confirm signup, set the link URL to:
   - `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/`

## 2. Environment Variables

Copy `.env.example` to `.env.local` and set values:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

If your project still uses legacy keys, use `NEXT_PUBLIC_SUPABASE_ANON_KEY` as fallback.

## 3. Install and Run

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.

## 4. Auth Flow Included

- `/login`: Starts Google OAuth with Supabase
- `/auth/callback`: Exchanges OAuth code for a session (server route)
- `/auth/confirm`: Verifies email confirmation tokens and creates a session
- `/protected`: Example protected page (server-checked)
- `/auth/signout`: Signs out and clears session
- `proxy.ts`: Refreshes session cookies via Supabase on requests

## Notes

- Middleware refresh prevents stale auth cookies in SSR routes.
- Protected routes use server-side user checks via Supabase.
