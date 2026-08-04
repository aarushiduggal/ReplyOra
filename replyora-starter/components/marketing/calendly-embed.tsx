"use client";

import Script from "next/script";

/**
 * Calendly inline embed. Renders the official inline widget and loads Calendly's
 * widget.js lazily. Pass the agency's scheduling link as `url`.
 */
export function CalendlyEmbed({ url }: { url: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-oxblood/15 bg-cream">
      <div
        className="calendly-inline-widget"
        data-url={url}
        style={{ minWidth: "320px", height: "700px" }}
      />
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="lazyOnload"
      />
    </div>
  );
}
