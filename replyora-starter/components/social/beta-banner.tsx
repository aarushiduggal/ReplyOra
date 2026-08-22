import Link from "next/link";

/**
 * Quiet reminder that an account is on the free beta, and when it ends.
 *
 * Deliberately states the end date as well as the days remaining: "7 days left"
 * is easy to misread as a nag, while a date is a fact people can plan around.
 */
export function BetaBanner({
  daysLeft,
  expiresAt,
}: {
  daysLeft: number;
  expiresAt: string | null;
}) {
  const date = expiresAt
    ? new Date(expiresAt).toLocaleDateString("en-AU", {
        day: "numeric",
        month: "long",
      })
    : null;
  // Under a week, warm the tone up so it reads as a heads-up, not decoration.
  const soon = daysLeft <= 7;

  return (
    <div
      className={
        soon
          ? "bg-oxblood text-porcelain"
          : "border-b border-ink/10 bg-oat/60 text-ink"
      }
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-1 px-6 py-2 text-[12px]">
        <span className="font-semibold uppercase tracking-[0.16em]">Beta</span>
        <span className={soon ? "text-porcelain/90" : "text-ink/75"}>
          Full access, free
          {date ? ` until ${date}` : ""} —{" "}
          {daysLeft === 0
            ? "ends today"
            : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}
          .
        </span>
        <Link
          href="/settings?tab=billing"
          className="ml-auto font-semibold underline underline-offset-4"
        >
          Add a card to keep going
        </Link>
      </div>
    </div>
  );
}
