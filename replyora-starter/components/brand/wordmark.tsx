import Link from "next/link";

import { cn } from "@/lib/utils";

type WordmarkVariant = "default" | "inverted";

/**
 * Replyora wordmark — "replyora." as ONE word: italic-serif "reply" (Playfair
 * Display) running tight into heavy "ora." (Archivo Black), finished with a bold
 * full stop. Never split reply / ora. or space them.
 * Use variant="inverted" (porcelain) on ink / dark backgrounds.
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
  const color = variant === "inverted" ? "text-porcelain" : "text-ink";
  const content = (
    <span
      className={cn(
        "inline-flex items-baseline whitespace-nowrap leading-none",
        color,
        className,
      )}
    >
      <span className="font-serif font-semibold italic tracking-[-0.005em]">
        reply
      </span>
      <span className="font-heavy -ml-[0.03em] tracking-[-0.01em]">ora.</span>
    </span>
  );

  if (!asLink) return content;
  return (
    <Link
      href={href}
      className="inline-flex items-center"
      aria-label="Replyora home"
    >
      {content}
    </Link>
  );
}
