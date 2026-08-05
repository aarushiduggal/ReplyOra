"use client";

import { useMemo, useState } from "react";

export interface AuditRow {
  id: string;
  actorName: string;
  workspaceName: string | null;
  action: string;
  target: string | null;
  createdAt: string;
}

function when(iso: string) {
  return new Date(iso).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AuditViewer({ entries }: { entries: AuditRow[] }) {
  const [actor, setActor] = useState("");
  const [ws, setWs] = useState("");
  const [q, setQ] = useState("");

  const actors = useMemo(
    () => [...new Set(entries.map((e) => e.actorName))],
    [entries],
  );
  const workspaces = useMemo(
    () => [...new Set(entries.map((e) => e.workspaceName).filter(Boolean) as string[])],
    [entries],
  );

  const filtered = entries.filter(
    (e) =>
      (!actor || e.actorName === actor) &&
      (!ws || e.workspaceName === ws) &&
      (!q || e.action.toLowerCase().includes(q.toLowerCase())),
  );

  const sel =
    "rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink focus:border-oxblood focus:outline-none";

  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <div className="mb-4 flex flex-wrap gap-2">
        <select value={actor} onChange={(e) => setActor(e.target.value)} className={sel}>
          <option value="">All staff</option>
          {actors.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <select value={ws} onChange={(e) => setWs(e.target.value)} className={sel}>
          <option value="">All agencies</option>
          {workspaces.map((w) => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter by action…"
          className={`${sel} flex-1`}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wide text-ink/50">
            <tr className="[&>th]:py-2 [&>th]:pr-4">
              <th>When</th>
              <th>Staff</th>
              <th>Agency</th>
              <th>Action</th>
              <th>Target</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((e) => (
              <tr key={e.id} className="[&>td]:py-2 [&>td]:pr-4">
                <td className="whitespace-nowrap text-ink/50">{when(e.createdAt)}</td>
                <td className="text-ink/70">{e.actorName}</td>
                <td className="text-ink/60">{e.workspaceName ?? "—"}</td>
                <td>
                  <code className="rounded bg-oat px-1.5 py-0.5 text-xs text-ink/70">
                    {e.action}
                  </code>
                </td>
                <td className="text-ink/50">{e.target ?? "—"}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-ink/40">
                  No matching audit entries.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
