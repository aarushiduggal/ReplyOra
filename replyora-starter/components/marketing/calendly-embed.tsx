"use client";

import { useEffect, useRef } from "react";

type CalendlyGlobal = {
  initInlineWidget: (opts: { url: string; parentElement: HTMLElement }) => void;
};

const SCRIPT_SRC = "https://assets.calendly.com/assets/external/widget.js";

/**
 * Calendly inline embed. We load the script ourselves and POLL until Calendly
 * is ready, then initialise the widget explicitly. This is bulletproof across
 * fresh loads AND client-side navigation (where next/script's onLoad won't
 * re-fire and the auto-scan never runs) — the previous versions left a blank
 * card in those cases.
 */
export function CalendlyEmbed({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Ensure the script is present (append once).
    if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      const s = document.createElement("script");
      s.src = SCRIPT_SRC;
      s.async = true;
      document.body.appendChild(s);
    }

    let tries = 0;
    const timer = window.setInterval(() => {
      const c = (window as unknown as { Calendly?: CalendlyGlobal }).Calendly;
      if (c && el.childElementCount === 0) {
        c.initInlineWidget({ url, parentElement: el });
        window.clearInterval(timer);
      } else if (++tries > 60) {
        window.clearInterval(timer); // give up after ~15s
      }
    }, 250);

    return () => window.clearInterval(timer);
  }, [url]);

  return (
    <div className="overflow-hidden rounded-2xl border border-stone/20 bg-white">
      <div
        ref={ref}
        className="calendly-inline-widget"
        style={{ minWidth: "320px", height: "700px" }}
      />
    </div>
  );
}
