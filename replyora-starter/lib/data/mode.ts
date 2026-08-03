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

/**
 * Auth.js (Milestone 2) is the auth backend when Supabase ISN'T configured and
 * an AUTH_SECRET + Neon DATABASE_URL are present — i.e. the Netlify/Neon deploy.
 * Server-only (reads non-public env); never read this from a client component.
 */
export const USE_AUTHJS: boolean =
  !USE_SUPABASE &&
  Boolean(process.env.AUTH_SECRET) &&
  Boolean(process.env.DATABASE_URL);

/**
 * Client-visible mirror of USE_AUTHJS for the login/signup form (which can't see
 * server-only env). Set NEXT_PUBLIC_HAS_AUTHJS=1 alongside AUTH_SECRET.
 */
export const HAS_AUTHJS_CLIENT: boolean =
  process.env.NEXT_PUBLIC_HAS_AUTHJS === "1";

/** Absolute app URL — used for OAuth redirects so they work on Vercel. */
export const APP_URL: string =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3100";
