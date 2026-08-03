import Link from "next/link";

import { cn } from "@/lib/utils";

type WordmarkVariant = "default" | "inverted";

const VARIANT: Record<WordmarkVariant, { text: string; dot: string }> = {
  // On light (oat/cream/card) backgrounds.
  default: { text: "text-oxblood", dot: "text-rose" },
  // On dark (oxblood/wine/ink) backgrounds.
  inverted: { text: "text-cream", dot: "text-blush" },
};

/**
 * Replyora wordmark — lowercase "replyora" with an open dot "°", Fredoka.
 * Brand spec in CLAUDE.md §Brand. Use `variant="inverted"` on dark backgrounds.
 */
export function Wordmark({
  className,
  href = "/",
  asLink = true,
  variant = "default",
}: {
  className?: string;
  href?: string;
  asLink?: boolean;
  variant?: WordmarkVariant;
}) {
  const v = VARIANT[variant];
  const content = (
    <span
      className={cn("font-wordmark lowercase tracking-tight", v.text, className)}
    >
      replyora<span className={v.dot}>°</span>
    </span>
  );

  if (!asLink) return content;
  return (
    <Link href={href} className="inline-flex items-center">
      {content}
    </Link>
  );
}
