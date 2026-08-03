/**
 * Lightweight analytics + CTA conversion tracking.
 *
 * Uses Plausible (privacy-friendly, no cookie banner) when configured via
 * NEXT_PUBLIC_PLAUSIBLE_DOMAIN — the script is loaded in the root layout. If
 * not configured, track() is a no-op, so it's safe locally and in the prototype.
 *
 * // TODO: swap/extend for GA4 if preferred — keep this call-site API stable.
 */

declare global {
  interface Window {
    plausible?: (
      event: string,
      opts?: { props?: Record<string, string | number | boolean> },
    ) => void;
  }
}

export function track(
  event: string,
  props?: Record<string, string | number | boolean>,
): void {
  if (typeof window === "undefined") return;
  if (typeof window.plausible === "function") {
    window.plausible(event, props ? { props } : undefined);
  } else if (process.env.NODE_ENV !== "production") {
    // Visible during local dev so you can confirm events fire.
    // eslint-disable-next-line no-console
    console.debug("[track]", event, props ?? {});
  }
}
