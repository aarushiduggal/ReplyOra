"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

type CalendlyGlobal = {
  initInlineWidget: (opts: { url: string; parentElement: HTMLElement }) => void;
};

/**
 * Calendly inline embed. We initialise the widget EXPLICITLY (rather than
 * relying on the script's auto-init), so it also renders on client-side
 * navigation — where the cached script never re-scans the page and the embed
 * would otherwise show a blank card.
 */
export function CalendlyEmbed({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement>(null);

  function init() {
    const c = (window as unknown as { Calendly?: CalendlyGlobal }).Calendly;
    if (c && ref.current && ref.current.childElementCount === 0) {
      c.initInlineWidget({ url, parentElement: ref.current });
    }
  }

  // If the script is already loaded (client-side nav to this page), init on mount.
  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return (
    <div className="overflow-hidden rounded-2xl border border-stone/20 bg-white">
      <div
        ref={ref}
        className="calendly-inline-widget"
        style={{ minWidth: "320px", height: "700px" }}
      />
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="afterInteractive"
        onLoad={init}
      />
    </div>
  );
}
