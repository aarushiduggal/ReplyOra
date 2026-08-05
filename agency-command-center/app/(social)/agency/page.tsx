import type { Metadata } from "next";

import { getAgencyOverview } from "@/lib/social/agency";
import { listMembers } from "@/lib/social/team";
import { listRetainers } from "@/lib/social/retainers";
import { CommandCenter } from "@/components/social/agency/command-center";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Command Center · Replyora",
  description: "Every client, every risk, every retainer — one agency view.",
};

export default async function AgencyCommandCenterPage() {
  const [overview, members, retainers] = await Promise.all([
    getAgencyOverview(),
    listMembers(),
    listRetainers(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex items-baseline gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose">( 00 )</span>
        <h1 className="font-display text-2xl text-oxblood">Command Center</h1>
      </div>
      <p className="mt-1 max-w-xl text-sm text-ink/70">
        The place your agency runs from — who needs content, what&apos;s at risk, how the team&apos;s
        loaded, and the money coming in. Worst-first, so you always know where to look.
      </p>

      <div className="mt-6">
        <CommandCenter overview={overview} members={members} retainers={retainers} />
      </div>
    </div>
  );
}
