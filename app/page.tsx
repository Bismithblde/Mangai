import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-start justify-center gap-6 p-8 sm:p-12">
      <h1 className="text-3xl font-semibold tracking-tight">Supabase Google Auth</h1>

      {user ? (
        <>
          <p className="text-base text-zinc-600">Signed in as {user.email}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/protected"
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
            >
              Open protected page
            </Link>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium"
              >
                Sign out
              </button>
            </form>
          </div>
        </>
      ) : (
        <>
          <p className="text-base text-zinc-600">You are currently signed out.</p>
          <Link
            href="/login"
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
          >
            Continue with Google
          </Link>
        </>
      )}

      <p className="text-sm text-zinc-500">
        This app uses Supabase SSR auth with middleware-based session refresh.
      </p>
    </main>
  );
}
