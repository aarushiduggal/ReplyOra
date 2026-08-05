import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { APP_URL } from "@/lib/data/mode";

/**
 * Auth callback — exchanges the OAuth/email code for a session, then redirects
 * into the dashboard. Uses NEXT_PUBLIC_APP_URL so it works on the Vercel domain.
 * Surfaces the real error in the URL so failures are diagnosable.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const base = APP_URL.replace(/\/$/, "");

  // The OAuth provider (via Supabase) can return an error instead of a code.
  const providerError =
    searchParams.get("error_description") || searchParams.get("error");
  if (providerError) {
    return NextResponse.redirect(
      `${base}/login?error=${encodeURIComponent(providerError)}`,
    );
  }

  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/clients";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${base}${next}`);
    }
    return NextResponse.redirect(
      `${base}/login?error=${encodeURIComponent("exchange: " + error.message)}`,
    );
  }

  return NextResponse.redirect(`${base}/login?error=no_code`);
}
