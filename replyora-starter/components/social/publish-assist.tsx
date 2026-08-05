"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Instagram, Music2, X } from "lucide-react";

import type { Platform } from "@/lib/social/types";

/** Where to send the user to actually post (web works everywhere; apps deep-link on mobile). */
const OPEN_URL: Record<Platform, string> = {
  instagram: "https://www.instagram.com/",
  tiktok: "https://www.tiktok.com/upload",
};
const LABEL: Record<Platform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
};

/**
 * Assisted publishing — no paid API, no Meta/TikTok app review. At post time we
 * hand the user a ready-to-post package (caption + hashtags copied, the app
 * opened) and let them mark it posted. This is how the cheaper tiers of Later /
 * Planoly work; swap in a real API later without changing this UI.
 */
export function PublishAssist({
  platform,
  caption,
  hashtags,
  mediaUrl,
  onClose,
  onPosted,
  posting,
}: {
  platform: Platform;
  caption: string;
  hashtags: string[];
  mediaUrl?: string | null;
  onClose: () => void;
  onPosted: () => void;
  posting?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const fullCaption = [caption, hashtags.join(" ")].filter(Boolean).join("\n\n");
  const Icon = platform === "tiktok" ? Music2 : Instagram;

  async function copy() {
    try {
      await navigator.clipboard.writeText(fullCaption);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — the caption is still selectable below */
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-oxblood/15 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-display text-xl text-oxblood">
            <Icon className="h-5 w-5" /> Post to {LABEL[platform]}
          </h3>
          <button onClick={onClose} className="text-ink/60 hover:text-oxblood" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {mediaUrl && (
          <div
            className="mb-3 h-40 w-full rounded-xl bg-oat bg-cover bg-center"
            style={{ backgroundImage: `url(${mediaUrl})` }}
          />
        )}

        {/* Step 1 — caption */}
        <div className="rounded-xl border border-oxblood/10 bg-cream/40 p-3">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-ink/55">
              1 · Your caption
            </span>
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1 rounded-full bg-oxblood px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-cream"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="max-h-32 overflow-y-auto whitespace-pre-line text-sm text-ink/80">
            {fullCaption || "(no caption)"}
          </p>
        </div>

        {/* Step 2 — open the app */}
        <a
          href={OPEN_URL[platform]}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-oxblood/25 px-4 py-2.5 text-sm font-semibold text-oxblood transition-colors hover:bg-oxblood/5"
        >
          <ExternalLink className="h-4 w-4" /> 2 · Open {LABEL[platform]} & paste
        </a>

        {/* Step 3 — mark posted */}
        <button
          type="button"
          disabled={posting}
          onClick={onPosted}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-oxblood px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-cream transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Check className="h-4 w-4" /> 3 · Mark as posted
        </button>

        <p className="mt-3 text-center text-[11px] text-ink/45">
          No account connection needed. One-tap auto-publishing arrives when you
          connect a platform.
        </p>
      </div>
    </div>
  );
}
