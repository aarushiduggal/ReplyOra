import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import type { Database } from "@/types/db";

/**
 * Refreshes the Supabase auth session and protects the dashboard.
 * - Not configured (local mock): no-op, everything is open.
 * - Configured (live): refresh session; redirect unauthenticated users away
 *   from /dashboard to /login, and authenticated users away from /login|/signup.
 *
 * Follows the @supabase/ssr guide: no logic between createServerClient and
 * getUser(); always propagate the response cookies.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Mock mode (no Supabase env) — the app runs as an always-signed-in demo.
  if (!url || !anonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: CookieOptions }[],
      ) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // IMPORTANT: revalidates the token. Do not add logic before this.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Staff portal: only platform_admins may reach /admin or /api/admin.
  // Everyone else → 404 (existence not revealed). First of three enforcement
  // layers — also the /admin layout and each /api/admin handler re-check.
  const isAdminPath =
    path === "/admin" ||
    path.startsWith("/admin/") ||
    path.startsWith("/api/admin");
  if (isAdminPath) {
    if (!user) {
      if (path.startsWith("/api/admin")) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      return NextResponse.redirect(loginUrl);
    }
    let isAdmin = false;
    try {
      // is_platform_admin() is from 0002 (not in the generated Database types).
      const { data } = await supabase.rpc("is_platform_admin" as never, {} as never);
      isAdmin = data === true;
    } catch {
      isAdmin = false;
    }
    if (!isAdmin) {
      if (path.startsWith("/api/admin")) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return new NextResponse(null, { status: 404 });
    }
  }

  if (!user && (path.startsWith("/dashboard") || path.startsWith("/onboarding"))) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  if (user && (path === "/login" || path === "/signup")) {
    const dashUrl = request.nextUrl.clone();
    dashUrl.pathname = "/clients";
    return NextResponse.redirect(dashUrl);
  }

  return supabaseResponse;
}
