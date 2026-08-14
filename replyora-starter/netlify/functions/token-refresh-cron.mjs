// Netlify Scheduled Function — once a day, refresh Instagram long-lived tokens
// nearing their ~60-day expiry. Keeps the OAuth logic in the Next app (Neon +
// provider tokens); this just pings the secured endpoint.
//
// Netlify auto-schedules any function that exports `config.schedule`.
// 03:17 UTC daily — off the hour so it doesn't pile onto other crons.
export const config = { schedule: "17 3 * * *" };

export default async function handler() {
  const base = process.env.URL || process.env.NEXT_PUBLIC_APP_URL || "";
  if (!base) return new Response("no base url", { status: 200 });
  try {
    await fetch(`${base}/api/social/refresh-tokens`, {
      method: "POST",
      headers: { "x-cron-secret": process.env.CRON_SECRET || "" },
    });
  } catch {
    // best-effort; tomorrow's tick retries (tokens have weeks of headroom)
  }
  return new Response("ok", { status: 200 });
}
