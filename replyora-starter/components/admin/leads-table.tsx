"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

export interface AdminLeadRow {
  id: string;
  workspaceId: string;
  clientName: string;
  name: string;
  email: string;
  phone: string;
  intent: string;
  status: string;
  createdAt: string;
}

const STATUS_STYLE: Record<string, string> = {
  new: "bg-sky-100 text-sky-700",
  qualified: "bg-amber-100 text-amber-800",
  booked: "bg-emerald-100 text-emerald-700",
  lost: "bg-oat text-ink/50",
};

const FILTERS = ["all", "new", "qualified", "booked", "lost"] as const;
type Filter = (typeof FILTERS)[number];

function dateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LeadsTable({ rows }: { rows: AdminLeadRow[] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length };
    for (const r of rows) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (!needle) return true;
      return (
        r.name.toLowerCase().includes(needle) ||
        r.email.toLowerCase().includes(needle) ||
        r.phone.toLowerCase().includes(needle) ||
        r.clientName.toLowerCase().includes(needle) ||
        r.intent.toLowerCase().includes(needle)
      );
    });
  }, [rows, q, filter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, phone, client…"
            className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink/40 focus:border-oxblood focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs capitalize transition-colors ${
                filter === f
                  ? "bg-oxblood text-cream"
                  : "bg-oat text-ink/60 hover:text-oxblood"
              }`}
            >
              {f} {counts[f] ? `(${counts[f]})` : ""}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-border bg-white text-xs uppercase tracking-wide">
            <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-ink/60">
              <th>Lead</th>
              <th>Contact</th>
              <th>Client</th>
              <th>Enquiry</th>
              <th>Status</th>
              <th>Captured</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((r) => (
              <tr key={r.id} className="align-top transition-colors hover:bg-oat">
                <td className="px-4 py-3 font-medium text-ink">
                  {r.name || "—"}
                </td>
                <td className="px-4 py-3 text-ink/60">
                  {r.email && <div>{r.email}</div>}
                  {r.phone && <div className="text-xs text-ink/40">{r.phone}</div>}
                  {!r.email && !r.phone && "—"}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/clients/${r.workspaceId}`}
                    className="text-ink/70 hover:text-oxblood hover:underline"
                  >
                    {r.clientName}
                  </Link>
                </td>
                <td className="max-w-xs px-4 py-3 text-ink/60">
                  {r.intent || "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs capitalize ${
                      STATUS_STYLE[r.status] ?? "bg-oat text-ink/60"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-ink/60">
                  {dateTime(r.createdAt)}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ink/50">
                  {rows.length === 0
                    ? "No leads captured yet. When a visitor shares their details in any client's chat widget, they'll appear here."
                    : `No leads match your filter.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
