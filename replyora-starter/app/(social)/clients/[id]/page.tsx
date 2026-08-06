import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { SectionHeader } from "@/components/social/section-header";
import { GuideTrigger } from "@/components/social/guide";
import { clientName as sampleName } from "@/components/social/portal-nav";
import { getClient } from "@/lib/social/clients";
import { getClientDetail } from "@/lib/social/client-detail";
import { listClientPosts } from "@/lib/social/posts";
import { listClientAssets } from "@/lib/social/assets";
import { getClientApprovals } from "@/lib/social/approvals";
import { listClientInvoices } from "@/lib/social/invoices";
import { ClientOverviewTools } from "@/components/social/client-overview-tools";

export const dynamic = "force-dynamic";

export default async function ClientOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [client, detail, posts, assets, approvals, invoices] = await Promise.all([
    getClient(id),
    getClientDetail(id),
    listClientPosts(id),
    listClientAssets(id).catch(() => []),
    getClientApprovals(id),
    listClientInvoices(id),
  ]);
  const name = client?.name ?? sampleName(id);

  const setup = detail
    ? {
        brandKit: Boolean(detail.logoUrl || detail.brandColors.length || detail.fontDisplay),
        pillars: detail.pillars.length >= 3,
        invite: detail.invites.length > 0,
        connected: detail.platforms.length > 0,
        assets: assets.length > 0,
        gridContent: posts.length > 0,
        calendar: posts.some((p) => p.scheduledFor),
      }
    : null;

  const scheduled = posts.filter((p) => p.status === "scheduled").length;
  const drafts = posts.filter((p) => p.status === "draft").length;
  const statuses = Array.from(approvals.values()).map((a) => a.status);
  const inReview = statuses.filter((s) => s === "pending").length;
  const changes = statuses.filter((s) => s === "changes").length;
  const outstanding = invoices.filter((i) => i.status === "sent" || i.status === "overdue").length;

  const base = `/clients/${id}`;
  const stats = [
    { label: "Scheduled", n: scheduled, href: `${base}/calendar` },
    { label: "Drafts", n: drafts, href: `${base}/grid` },
    { label: "In review", n: inReview, href: `${base}/approvals` },
    { label: "Changes requested", n: changes, href: `${base}/approvals` },
    { label: "Invoices", n: invoices.length, href: `${base}/invoices` },
    { label: "Outstanding", n: outstanding, href: `${base}/invoices` },
  ];

  const quick = [
    { label: "Plan the grid", href: `${base}/grid` },
    { label: "Open the calendar", href: `${base}/calendar` },
    { label: "Batch in studio", href: `${base}/studio` },
    { label: "Send for approval", href: `${base}/approvals` },
    { label: "Configure chatbox", href: `${base}/chatbox` },
    { label: "Connect platforms", href: `${base}/integrations` },
  ];

  return (
    <div>
      <span className="flex items-center gap-2">
        <SectionHeader num="01" label="Overview" />
        <GuideTrigger pageKey="overview" clientId={id} />
      </span>
      <h2 className="mt-6 font-display text-3xl text-oxblood">{name}</h2>
      <p className="mt-2 max-w-md text-sm font-medium text-ink/90">
        The account cockpit — status at a glance, and a jump to any part of the work.
      </p>

      {detail && setup && <ClientOverviewTools detail={detail} setup={setup} />}

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group rounded-xl border border-ink/10 px-4 py-3 transition-colors hover:border-oxblood/30"
          >
            <p className="font-display text-3xl text-oxblood">{s.n}</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/85">
              {s.label}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/85">
          Quick actions
        </p>
        <div className="mt-3 border-t border-ink/10">
          {quick.map((q) => (
            <Link
              key={q.href}
              href={q.href}
              className="group flex items-center justify-between border-b border-ink/10 py-3.5"
            >
              <span className="text-[13px] font-medium text-ink transition-colors group-hover:text-oxblood">
                {q.label}
              </span>
              <ArrowRight className="h-4 w-4 text-ink/35 transition-all group-hover:translate-x-1 group-hover:text-oxblood" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
