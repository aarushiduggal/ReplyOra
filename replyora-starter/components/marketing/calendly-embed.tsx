"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarClock, Mail } from "lucide-react";

import { CONTACT_EMAIL } from "@/lib/site";

type CalendlyGlobal = {
  initInlineWidget: (opts: { url: string; parentElement: HTMLElement }) => void;
};

const SCRIPT_SRC = "https://assets.calendly.com/assets/external/widget.js";

/**
 * Calendly inline embed. We load the script ourselves and POLL until Calendly
 * is ready, then initialise the widget explicitly. This is bulletproof across
 * fresh loads AND client-side navigation (where next/script's onLoad won't
 * re-fire and the auto-scan never runs).
 *
 * Crucially, if Calendly never actually renders an iframe (script blocked, a
 * dead/unpublished scheduling link that redirects to calendly.com, an offline
 * network) we flip to a graceful fallback instead of leaving a blank white
 * card — the visitor always gets a way to reach us.
 */
export function CalendlyEmbed({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">(
    "loading",
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    setStatus("loading");

    // Ensure the script is present (append once).
    if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      const s = document.createElement("script");
      s.src = SCRIPT_SRC;
      s.async = true;
      document.body.appendChild(s);
    }

    let tries = 0;
    let initialised = false;

    const timer = window.setInterval(() => {
      const c = (window as unknown as { Calendly?: CalendlyGlobal }).Calendly;

      // Once Calendly injects its iframe, the widget is live.
      if (initialised && el.querySelector("iframe")) {
        setStatus("ready");
        window.clearInterval(timer);
        return;
      }

      if (c && !initialised) {
        c.initInlineWidget({ url, parentElement: el });
        initialised = true;
      }

      // ~10s ceiling: if the iframe never appeared, show the fallback.
      if (++tries > 40) {
        window.clearInterval(timer);
        if (!el.querySelector("iframe")) setStatus("failed");
      }
    }, 250);

    return () => window.clearInterval(timer);
  }, [url]);

  if (status === "failed") {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 rounded-2xl border border-stone/20 bg-white p-8 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink text-porcelain">
          <CalendarClock className="h-6 w-6" />
        </span>
        <h3 className="font-display text-xl text-ink">Let&apos;s find a time</h3>
        <p className="max-w-xs text-sm text-stone">
          Our live calendar is having a moment. Open it directly, or send us a
          note and we&apos;ll book you in.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-porcelain hover:bg-ink/90"
          >
            <CalendarClock className="h-4 w-4" /> Open scheduler
          </a>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-ink hover:underline"
          >
            <Mail className="h-4 w-4" /> {CONTACT_EMAIL}
          </a>
        </div>
      </div>
    );
  }

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
