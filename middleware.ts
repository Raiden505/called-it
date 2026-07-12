import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    publishableKey!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = ["/dashboard", "/matches", "/leaderboard", "/friends", "/profile", "/settings", "/onboarding"].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isProtectedRoute && !pathname.startsWith("/onboarding") && !pathname.startsWith("/profile/edit")) {
    const { data: profile } = await supabase.from("profiles").select("onboarding_completed_at").eq("id", user.id).maybeSingle();
    if (!profile?.onboarding_completed_at) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      url.search = `?next=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(url);
    }
  }

  if (user && pathname.startsWith("/onboarding")) {
    const { data: profile } = await supabase.from("profiles").select("onboarding_completed_at").eq("id", user.id).maybeSingle();
    if (profile?.onboarding_completed_at) {
      const url = request.nextUrl.clone();
      url.pathname = "/profile/edit";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/matches/:path*",
    "/leaderboard/:path*",
    "/friends/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/callback",
  ],
};
