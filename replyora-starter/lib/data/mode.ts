/**
 * Data mode flag.
 *
 * LIVE (Supabase) when the public Supabase env vars are present; otherwise MOCK
 * (seed data for local dev). Set NEXT_PUBLIC_USE_MOCK=1 to force mock even when
 * Supabase is configured. This is what keeps the Coastal Glow demo out of the
 * live app — a real signed-in user reads their own (empty) workspace.
 */
export const USE_SUPABASE: boolean =
  process.env.NEXT_PUBLIC_USE_MOCK === "1"
    ? false
    : Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      );

/** Absolute app URL — used for OAuth redirects so they work on Vercel. */
export const APP_URL: string =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3100";
