import Link from "next/link";
import { CalendarDays, CheckCircle2, FileText } from "lucide-react";

import { listPosts } from "@/lib/social/store";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import {
  SocialCalendar,
  type SocialRow,
} from "@/components/social/social-calendar";

export default async function PlannerPage() {
  const posts = await listPosts();

  const rows: SocialRow[] = posts.map((p) => ({
    id: p.id,
    platform: p.platform,
    pillar: p.pillar,
    caption: p.caption,
    hashtags: p.hashtags,
    status: p.status,
    scheduledFor: p.scheduledFor,
  }));

  const drafts = rows.filter((r) => r.status === "draft").length;
  const scheduled = rows.filter((r) => r.status === "scheduled").length;
  const published = rows.filter((r) => r.status === "published").length;

  return (
    <div>
      <PageHeader
        title="Content Calendar"
        description="Everything you've drafted, scheduled, and published for Instagram & TikTok."
      >
        <Button asChild size="sm">
          <Link href="/dashboard/studio">New post</Link>
        </Button>
      </PageHeader>

      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Drafts" value={drafts} icon={FileText} />
          <StatCard label="Scheduled" value={scheduled} icon={CalendarDays} />
          <StatCard label="Published" value={published} icon={CheckCircle2} />
        </div>

        <SocialCalendar rows={rows} />
      </div>
    </div>
  );
}
