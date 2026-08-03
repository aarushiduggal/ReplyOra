import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";
import { USE_SUPABASE } from "@/lib/data/mode";

export async function middleware(request: NextRequest) {
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
