// Netlify Scheduled Function — every 15 minutes, ask the app to publish any
// posts whose scheduled time has passed. Keeps publishing logic in the Next
// app (Neon + provider tokens); this just pings the secured endpoint.
//
// Netlify auto-schedules any function that exports `config.schedule`.
export const config = { schedule: "*/15 * * * *" };

export default async function handler() {
  const base = process.env.URL || process.env.NEXT_PUBLIC_APP_URL || "";
  if (!base) return new Response("no base url", { status: 200 });
  try {
    await fetch(`${base}/api/social/publish-due`, {
      method: "POST",
      headers: { "x-cron-secret": process.env.CRON_SECRET || "" },
    });
  } catch {
    // best-effort; next tick retries
  }
  return new Response("ok", { status: 200 });
}
