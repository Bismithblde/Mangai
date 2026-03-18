import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );

        response = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isLoginRoute = pathname === "/login";
  const isSignupRoute = pathname === "/signup";
  const isAuthRoute = pathname.startsWith("/auth");
  const isPublicEntryRoute = isLoginRoute || isSignupRoute;

  if (!user && !isPublicEntryRoute && !isAuthRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = "";

    const redirectResponse = NextResponse.redirect(redirectUrl);
    response.cookies.getAll().forEach(({ name, value }) => {
      redirectResponse.cookies.set(name, value);
    });

    return redirectResponse;
  }

  if (user && isPublicEntryRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.search = "";

    const redirectResponse = NextResponse.redirect(redirectUrl);
    response.cookies.getAll().forEach(({ name, value }) => {
      redirectResponse.cookies.set(name, value);
    });

    return redirectResponse;
  }

  return response;
}
