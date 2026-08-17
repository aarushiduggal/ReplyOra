import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";
import { USE_SUPABASE } from "@/lib/data/mode";

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Safety net: a Google OAuth response (code + iss=accounts.google.com) must
  // land on the Auth.js callback (/api/auth/callback/google). A stale or cached
  // Google authorization can replay an OLD redirect (e.g. straight to /clients)
  // — which would render a signed-out dashboard page and 500. Detect that stray
  // callback anywhere other than /api/auth and bounce it to /login for a clean
  // retry instead of crashing the app.
  if (
    !pathname.startsWith("/api/auth") &&
    searchParams.get("code") &&
    (searchParams.get("iss") ?? "").includes("accounts.google.com")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "?authstale=1";
    return NextResponse.redirect(url);
  }

  // Supabase (Vercel) needs its session cookie refreshed here. Auth.js
  // (Netlify/Neon) uses stateless JWT cookies and guards routes via
  // getCurrentUser() → redirect in server components, so no refresh is needed.
  if (USE_SUPABASE) return await updateSession(request);
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (svg/png/jpg/jpeg/gif/webp)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
