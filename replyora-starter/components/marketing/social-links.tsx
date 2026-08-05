import { Instagram } from "lucide-react";

import { cn } from "@/lib/utils";

export const INSTAGRAM_URL =
  "https://www.instagram.com/replyora?igsh=OGVvb3BoMWtyMDI1&utm_source=qr";
export const TIKTOK_URL = "https://www.tiktok.com/@replyora?_r=1&_t=ZS-98bghZk940C";

export function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M16.5 3c.29 2.19 1.86 3.94 4 4.2v2.73c-1.32.06-2.6-.3-3.8-1.03v6.42c0 3.02-2.44 5.46-5.45 5.46A5.46 5.46 0 0 1 6 15.34c0-3.2 2.86-5.7 6.03-5.2v2.83c-.42-.13-.86-.2-1.32-.2a2.63 2.63 0 1 0 2.63 2.63V3h3.16z" />
    </svg>
  );
}

/** Instagram + TikTok icon links to Replyora's socials. */
export function SocialLinks({ className }: { className?: string }) {
  const base =
    "flex h-9 w-9 items-center justify-center rounded-full border border-oxblood/15 text-oxblood transition-colors hover:bg-oxblood hover:text-cream";
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Replyora on Instagram"
        className={base}
      >
        <Instagram className="h-4 w-4" />
      </a>
      <a
        href={TIKTOK_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Replyora on TikTok"
        className={base}
      >
        <TikTokIcon className="h-4 w-4" />
      </a>
    </div>
  );
}
