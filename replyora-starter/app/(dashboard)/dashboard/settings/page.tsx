import { getCurrentUser } from "@/lib/auth/session";
import { getUsage, getWorkspace, listMembers } from "@/lib/data/workspace";
import { getBusinessProfile } from "@/lib/data/business-profile";
import { listConversations } from "@/lib/data/conversations";
import { listLeads } from "@/lib/data/leads";
import { listBookings } from "@/lib/data/bookings";
import { getNotificationSettings } from "@/lib/data/notifications";
import { getFollowupRule } from "@/lib/data/followups";
import { PLANS } from "@/lib/stripe/plans";
import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsTabs } from "@/components/dashboard/settings-tabs";

export default async function SettingsPage() {
  const [
    user,
    workspace,
    members,
    usage,
    notificationSettings,
    followupRule,
    businessProfile,
    leads,
    conversations,
    bookings,
  ] = await Promise.all([
    getCurrentUser(),
    getWorkspace(),
    listMembers(),
    getUsage(),
    getNotificationSettings(),
    getFollowupRule(),
    getBusinessProfile(),
    listLeads(),
    listConversations(),
    listBookings(),
  ]);

  // Full workspace export payload (mock) — makes the Privacy Policy's data-export
  // right actionable. // TODO: replace with a server-side export job.
  const exportData = {
    workspace: { name: workspace.name, slug: workspace.slug, plan: workspace.plan },
    account: { name: user.fullName, email: user.email },
    members: members.map((m) => ({ name: m.fullName, email: m.email, role: m.role })),
    businessProfile,
    leads,
    conversations,
    bookings,
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your profile, team, notifications and subscription."
      />
      <div className="p-6">
        <SettingsTabs
          user={user}
          members={members}
          currentPlan={workspace.plan}
          plans={PLANS}
          messagesUsed={usage.messagesUsed}
          workspaceName={workspace.name}
          notificationSettings={notificationSettings}
          followupRule={followupRule}
          exportData={exportData}
        />
      </div>
    </div>
  );
}
