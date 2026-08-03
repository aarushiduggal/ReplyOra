"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

export interface WaitlistRow {
  id: string;
  email: string;
  feature: string;
  source: string;
  createdAt: string;
}

function dateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function WaitlistTable({ rows }: { rows: WaitlistRow[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (r) =>
        r.email.toLowerCase().includes(needle) ||
        r.feature.toLowerCase().includes(needle) ||
        r.source.toLowerCase().includes(needle),
    );
  }, [rows, q]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search email, feature, source…"
          className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink/40 focus:border-oxblood focus:outline-none"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-border bg-white text-xs uppercase tracking-wide">
            <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-ink/60">
              <th>Email</th>
              <th>Feature</th>
              <th>Source</th>
              <th>Signed up</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((r) => (
              <tr key={r.id} className="transition-colors hover:bg-oat">
                <td className="px-4 py-3 font-medium text-ink">
                  <a
                    href={`mailto:${r.email}`}
                    className="hover:text-oxblood hover:underline"
                  >
                    {r.email}
                  </a>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-oxblood/10 px-2 py-0.5 text-xs capitalize text-oxblood">
                    {r.feature}
                  </span>
                </td>
                <td className="px-4 py-3 capitalize text-ink/60">{r.source}</td>
                <td className="whitespace-nowrap px-4 py-3 text-ink/60">
                  {dateTime(r.createdAt)}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-ink/50">
                  {rows.length === 0
                    ? "No signups yet. When someone clicks “Notify me” on the roadmap, they'll appear here."
                    : `No signups match “${q}”.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
