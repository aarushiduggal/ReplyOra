import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — BYPASSES RLS.
 *
 * SERVER ONLY. Use exclusively in the public chat path (`/api/chat`, `/api/lead`)
 * and Stripe webhooks, where there is no user session. Because RLS is bypassed,
 * EVERY query made with this client MUST hard-filter by the resolved
 * `workspace_id` (resolved server-side from the assistant's public_key, never
 * from the request body).
 *
 * The `server-only` import makes the build fail if this is ever imported into a
 * Client Component, so the service-role key can never reach the browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for admin client.",
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
