import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const cleanNext = next.startsWith("/") ? next : "/";
      return NextResponse.redirect(new URL(cleanNext, requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=oauth_callback_failed", requestUrl.origin));
}