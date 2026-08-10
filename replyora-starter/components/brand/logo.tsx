import { cn } from "@/lib/utils";
import { Wordmark } from "@/components/brand/wordmark";
import { Mark } from "@/components/brand/mark";

type LogoVariant = "wordmark" | "lockup" | "badge" | "mark";
/** default = ink logo for light backgrounds · inverted = porcelain for dark. */
type LogoTone = "default" | "inverted";

/**
 * Replyora logo — now renders the live CSS wordmark/mark (no more PNG badge).
 *  - `variant="wordmark"|"lockup"` → the <Wordmark/> ("replyora.")
 *  - `variant="badge"|"mark"` → the square companion <Mark/> (heavy "o")
 *  - `tone="inverted"` on ink / dark backgrounds
 * `height` is the rendered height in px.
 */
export function Logo({
  variant = "wordmark",
  tone = "default",
  height = 30,
  href = "/",
  asLink = true,
  className,
}: {
  variant?: LogoVariant;
  tone?: LogoTone;
  height?: number;
  href?: string;
  asLink?: boolean;
  alt?: string;
  className?: string;
  priority?: boolean;
}) {
  const inverted = tone === "inverted";

  if (variant === "mark" || variant === "badge") {
    return <Mark invert={inverted} size={height} className={className} />;
  }

  // Cap height of the wordmark ≈ 0.72 × font-size, so scale font-size up to hit
  // the requested pixel height.
  return (
    <span style={{ fontSize: `${Math.round(height * 1.35)}px` }} className="inline-flex">
      <Wordmark
        variant={inverted ? "inverted" : "default"}
        href={href}
        asLink={asLink}
        className={className}
      />
    </span>
  );
}
