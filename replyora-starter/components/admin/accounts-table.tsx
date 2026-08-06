"use client";

import { useMemo, useState } from "react";

interface Account {
  email: string;
  name: string | null;
  workspaceName: string;
  createdAt: string;
  newsletterOptIn: boolean;
}

export function AccountsTable({ accounts }: { accounts: Account[] }) {
  const [copied, setCopied] = useState<"all" | "opted" | null>(null);

  const optedEmails = useMemo(
    () => accounts.filter((a) => a.newsletterOptIn).map((a) => a.email),
    [accounts],
  );
  const allEmails = useMemo(() => accounts.map((a) => a.email), [accounts]);

  async function copy(which: "all" | "opted") {
    const list = which === "opted" ? optedEmails : allEmails;
    try {
      await navigator.clipboard.writeText(list.join(", "));
      setCopied(which);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      /* clipboard unavailable */
    }
  }

  if (accounts.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-ink/20 px-4 py-10 text-center text-sm text-ink/60">
        No accounts yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => copy("opted")}
          className="rounded-full bg-oxblood px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-cream transition-opacity hover:opacity-90"
        >
          {copied === "opted" ? "Copied ✓" : `Copy ${optedEmails.length} opted-in emails`}
        </button>
        <button
          type="button"
          onClick={() => copy("all")}
          className="rounded-full border border-oxblood/30 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-oxblood transition-colors hover:bg-oxblood/5"
        >
          {copied === "all" ? "Copied ✓" : `Copy all ${allEmails.length} emails`}
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-ink/10">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/60">
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Workspace</th>
              <th className="px-3 py-2">Joined</th>
              <th className="px-3 py-2">Newsletter</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.email} className="border-b border-ink/[0.06] last:border-0">
                <td className="px-3 py-2 text-ink">{a.email}</td>
                <td className="px-3 py-2 text-ink/80">{a.name ?? "—"}</td>
                <td className="px-3 py-2 text-ink/80">{a.workspaceName}</td>
                <td className="px-3 py-2 text-ink/70">{a.createdAt.slice(0, 10)}</td>
                <td className="px-3 py-2">
                  {a.newsletterOptIn ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-700">
                      Subscribed
                    </span>
                  ) : (
                    <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink/60">
                      No
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
