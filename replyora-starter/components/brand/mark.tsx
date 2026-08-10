import { cn } from "@/lib/utils";

/**
 * Companion mark — the heavy "o" (Archivo Black) on an ink or porcelain tile.
 * For favicons, avatars, collapsed nav and any square/tiny spot where the full
 * wordmark would fall below ~32px. `invert` puts porcelain "o" on ink.
 */
export function Mark({
  className,
  invert = false,
  size,
}: {
  className?: string;
  invert?: boolean;
  /** Tile size in px. Omit to size via CSS (e.g. h-8 w-8 in className). */
  size?: number;
}) {
  return (
    <span
      className={cn(
        "inline-grid aspect-square place-items-center rounded-[22%] leading-none",
        invert
          ? "bg-ink text-porcelain"
          : "bg-porcelain text-ink ring-1 ring-stone/25",
        className,
      )}
      style={size ? { width: size, height: size, fontSize: size } : undefined}
      aria-hidden="true"
    >
      <span className="font-heavy translate-y-[-2%] text-[0.62em]">o</span>
    </span>
  );
}
