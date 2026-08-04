"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Lightbulb, X } from "lucide-react";

import { GUIDES, type GuideConfig, type GuideKey } from "@/components/social/guides";

/**
 * Entire Socials-style GUIDE system. Build once, reuse everywhere.
 *
 * - <GuideProvider> lives in the (social) layout and renders the single modal.
 * - <GuideTrigger pageKey clientId /> sits next to a page's numbered header:
 *   it registers the page's guide, auto-opens it the FIRST visit (localStorage
 *   "guide-seen:<pageKey>"), and renders the lightbulb that always reopens it.
 * - <GuideFooterLink /> is the footer "Guide" link (opens the active guide).
 */

type Ctx = {
  registerActive: (config: GuideConfig | null) => void;
  openConfig: (config: GuideConfig) => void;
  openActive: () => void;
  hasActive: boolean;
};

const GuideContext = createContext<Ctx | null>(null);

function resolve(pageKey: GuideKey, clientId?: string): GuideConfig {
  const base = GUIDES[pageKey];
  return {
    ...base,
    primaryHref: clientId
      ? base.primaryHref.replace("{id}", clientId)
      : base.primaryHref,
  };
}

export function GuideProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState<GuideConfig | null>(null);
  const [shown, setShown] = useState<GuideConfig | null>(null);

  const registerActive = useCallback((config: GuideConfig | null) => {
    setActive(config);
  }, []);
  const openConfig = useCallback((config: GuideConfig) => setShown(config), []);
  const openActive = useCallback(() => {
    setActive((cur) => {
      if (cur) setShown(cur);
      return cur;
    });
  }, []);

  return (
    <GuideContext.Provider
      value={{ registerActive, openConfig, openActive, hasActive: Boolean(active) }}
    >
      {children}
      {shown && <GuideModal config={shown} onClose={() => setShown(null)} />}
    </GuideContext.Provider>
  );
}

function useGuideCtx(): Ctx {
  const ctx = useContext(GuideContext);
  if (!ctx) throw new Error("Guide components must be inside <GuideProvider>");
  return ctx;
}

/** Registers a page's guide, auto-opens once, returns an opener for the bulb. */
export function useGuide(config: GuideConfig): { open: () => void } {
  const { registerActive, openConfig } = useGuideCtx();

  useEffect(() => {
    registerActive(config);
    try {
      const key = `guide-seen:${config.pageKey}`;
      if (!localStorage.getItem(key)) {
        openConfig(config);
        localStorage.setItem(key, "1");
      }
    } catch {
      /* localStorage unavailable — skip auto-open */
    }
    return () => registerActive(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.pageKey, config.primaryHref]);

  return { open: () => openConfig(config) };
}

/** Lightbulb next to a numbered section header — opens (and auto-opens) the guide. */
export function GuideTrigger({
  pageKey,
  clientId,
}: {
  pageKey: GuideKey;
  clientId?: string;
}) {
  const config = resolve(pageKey, clientId);
  const { open } = useGuide(config);
  return (
    <button
      type="button"
      onClick={open}
      aria-label="Open guide"
      title="Guide"
      className="inline-flex items-center text-oxblood/70 transition-colors hover:text-oxblood"
    >
      <Lightbulb className="h-4 w-4" />
    </button>
  );
}

/** Footer "Guide" link — opens the current page's registered guide. */
export function GuideFooterLink({ className }: { className?: string }) {
  const { openActive, hasActive } = useGuideCtx();
  if (!hasActive) return null;
  return (
    <button type="button" onClick={openActive} className={className}>
      Guide
    </button>
  );
}

function GuideModal({
  config,
  onClose,
}: {
  config: GuideConfig;
  onClose: () => void;
}) {
  const router = useRouter();

  function primary() {
    onClose();
    router.push(config.primaryHref);
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-oxblood/15 bg-white p-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-oxblood">
            Guide
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-ink/80 transition-colors hover:text-oxblood"
            aria-label="Close guide"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h2 className="mt-3 font-display text-3xl text-oxblood">{config.title}</h2>
        <p className="mt-2 text-sm font-medium leading-relaxed text-ink/90">
          {config.intro}
        </p>

        <ol className="mt-6 space-y-4">
          {config.steps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-0.5 text-[11px] font-semibold tracking-[0.12em] text-oxblood">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-sm leading-relaxed">
                <span className="font-semibold text-ink">{s.label}</span>
                <span className="text-ink/85"> — {s.description}</span>
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-8 h-px w-full bg-ink/10" />

        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/85 transition-colors hover:text-oxblood"
          >
            {config.secondaryLabel}
          </button>
          <button
            type="button"
            onClick={primary}
            className="rounded-full bg-oxblood px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-cream transition-opacity hover:opacity-90"
          >
            {config.primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
