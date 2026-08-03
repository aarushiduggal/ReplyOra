import { CalendarDays, FileText } from "lucide-react";

import { getWorkspace } from "@/lib/data/workspace";
import { getBusinessProfile } from "@/lib/data/business-profile";
import { listPosts } from "@/lib/social/store";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { ContentStudio } from "@/components/social/content-studio";

export default async function StudioPage() {
  const [workspace, profile, posts] = await Promise.all([
    getWorkspace(),
    getBusinessProfile(),
    listPosts(),
  ]);

  const draftCount = posts.filter((p) => p.status === "draft").length;
  const scheduledCount = posts.filter((p) => p.status === "scheduled").length;

  return (
    <div>
      <PageHeader
        title="Content Studio"
        description="Describe a topic and ReplyOra writes on-brand posts for Instagram & TikTok. Edit, then save or schedule."
      />
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Drafts"
            value={draftCount}
            hint="saved, not scheduled"
            icon={FileText}
            href="/dashboard/planner"
          />
          <StatCard
            label="Scheduled"
            value={scheduledCount}
            hint="on the calendar"
            icon={CalendarDays}
            href="/dashboard/planner"
          />
        </div>

        <ContentStudio
          businessName={workspace.name}
          industry={profile.industry}
        />
      </div>
    </div>
  );
}
