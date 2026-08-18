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
  // A signed-in visitor is NOT a stray callback. Auth.js can land you on the
  // post-login destination with the OAuth params still on the URL, and bouncing
  // that to /login threw away a session the user had just successfully created
  // — which is exactly what made Google sign-in look permanently broken while
  // email/password worked fine. If a session cookie is present, let it through.
  const hasSession = Boolean(
    request.cookies.get("__Secure-authjs.session-token") ??
      request.cookies.get("authjs.session-token"),
  );

  const isStrayOAuth =
    !pathname.startsWith("/api/auth") &&
    Boolean(searchParams.get("code")) &&
    (searchParams.get("iss") ?? "").includes("accounts.google.com");

  // Signed in, but the URL still carries the OAuth response. Google can land a
  // (stale) authorization straight on a page like /clients instead of the
  // callback; the sign-in itself is fine, but leaving code/iss/scope on the URL
  // made the page error. Strip them and re-render the same route cleanly.
  if (hasSession && isStrayOAuth) {
    const clean = request.nextUrl.clone();
    for (const k of ["code", "iss", "scope", "authuser", "prompt", "hd", "state"]) {
      clean.searchParams.delete(k);
    }
    return NextResponse.redirect(clean);
  }

  if (
    !hasSession &&
    isStrayOAuth
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Carry the path it actually came from, so if this ever fires again we can
    // see WHERE Google landed instead of guessing.
    url.search = `?authstale=1&from=${encodeURIComponent(pathname)}`;
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
