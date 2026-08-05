import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type LogoVariant = "wordmark" | "lockup" | "badge" | "mark";
/** default = dark logo for light backgrounds · inverted = cream logo for dark. */
type LogoTone = "default" | "inverted";

const SRC: Record<LogoVariant, Record<LogoTone, string>> = {
  wordmark: {
    default: "/brand/replyora-wordmark.png",
    inverted: "/brand/replyora-wordmark-cream.png",
  },
  lockup: {
    default: "/brand/replyora-lockup.png",
    inverted: "/brand/replyora-lockup-cream.png",
  },
  badge: {
    default: "/brand/replyora-badge.png",
    inverted: "/brand/replyora-badge.png",
  },
  // The current brand logo — white wordmark on an oxblood field, shown as a
  // round badge.
  mark: {
    default: "/brand/replyora-circle.png",
    inverted: "/brand/replyora-circle.png",
  },
};

// Intrinsic aspect ratios of the source PNGs (width / height).
const RATIO: Record<LogoVariant, number> = {
  wordmark: 1299 / 313,
  lockup: 1299 / 400,
  badge: 1,
  mark: 1,
};

/**
 * Replyora logo — the real brand image (replaces the old CSS wordmark).
 * Uses next/image, preserves aspect ratio, and adds alt text.
 *  - `variant="wordmark"` (default) for header/footer/sidebar
 *  - `variant="lockup"` for large hero/About spots (includes the tagline)
 *  - `variant="badge"` for the square app/avatar icon
 *  - `tone="inverted"` for the cream logo on dark/oxblood backgrounds
 */
export function Logo({
  variant = "wordmark",
  tone = "default",
  height = 30,
  href = "/",
  asLink = true,
  alt = "Replyora",
  className,
  priority = false,
}: {
  variant?: LogoVariant;
  tone?: LogoTone;
  /** Rendered height in px; width follows the intrinsic aspect ratio. */
  height?: number;
  href?: string;
  asLink?: boolean;
  alt?: string;
  className?: string;
  priority?: boolean;
}) {
  const width = Math.round(height * RATIO[variant]);
  const img = (
    <Image
      src={SRC[variant][tone]}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      sizes={`${width}px`}
      className={cn(
        "block object-contain",
        variant === "mark" && "rounded-full",
        className,
      )}
      style={{ height, width: "auto" }}
    />
  );

  if (!asLink) return img;
  return (
    <Link href={href} className="inline-flex items-center" aria-label={alt}>
      {img}
    </Link>
  );
}
