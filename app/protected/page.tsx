import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProtectedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f3f6f1] px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-[#d4f0cd] blur-3xl" />
        <div className="absolute -right-16 bottom-6 h-72 w-72 rounded-full bg-[#dfe8ff] blur-3xl" />
      </div>

      <section className="relative w-full max-w-3xl rounded-3xl border border-[#d6e2d3] bg-[#f9fcf7] p-7 shadow-[0_20px_50px_rgba(25,56,38,0.12)] sm:p-10">
        <span className="inline-flex rounded-full border border-[#cad9c8] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#5d7467]">
          Protected
        </span>

        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-[#173328]">
          Secure area
        </h1>
        <p className="mt-3 text-base text-[#637b6d]">
          This route is visible only when the server confirms an active session.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-[#d7e3d4] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#617a6c]">
              Authenticated user id
            </p>
            <p className="mt-2 break-all font-mono text-sm text-[#1f382d]">
              {user.id}
            </p>
          </article>

          <article className="rounded-2xl border border-[#d7e3d4] bg-[#edf7e6] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#617a6c]">
              Session mode
            </p>
            <p className="mt-2 text-sm font-semibold text-[#1f382d]">
              SSR + middleware refresh
            </p>
          </article>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-[#a5e37d] px-5 py-2 text-sm font-semibold text-[#1e3d30] transition hover:bg-[#94d66f]"
          >
            Back to home
          </Link>
          <span className="text-sm text-[#647d6e]">
            Only signed-in users can open this route.
          </span>
        </div>
      </section>
    </main>
  );
}
