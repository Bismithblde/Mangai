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
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-start justify-center gap-5 p-8 sm:p-12">
      <h1 className="text-3xl font-semibold tracking-tight">Protected Page</h1>
      <p className="text-sm text-zinc-600">
        Only signed-in users can open this route.
      </p>
      <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm">
        Authenticated user id: {user.id}
      </p>
      <Link href="/" className="text-sm text-zinc-700 underline">
        Back to home
      </Link>
    </main>
  );
}
