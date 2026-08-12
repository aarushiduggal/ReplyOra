import "server-only";

/**
 * fetch that resolves to null if it takes longer than `ms`. Dashboard pages
 * (Grid, Reports) await the Meta/Graph API during SSR, so a slow Graph response
 * would otherwise stall the whole page load. We race rather than use
 * AbortSignal so Next's fetch cache (`next: { revalidate }`) still applies —
 * once warm, the call is instant and never hits this timeout.
 */
export async function fetchOrTimeout(
  url: string,
  init: RequestInit = {},
  ms = 3500,
): Promise<Response | null> {
  return Promise.race([
    fetch(url, init).catch(() => null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}
