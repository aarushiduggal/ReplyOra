import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/db";

/**
 * Browser-side Supabase client (anon key). Use in Client Components.
 * Only ever sees data the signed-in user is allowed to via RLS.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
