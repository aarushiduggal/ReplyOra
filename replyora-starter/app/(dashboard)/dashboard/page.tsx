import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CalendarCheck,
  MessagesSquare,
  TrendingUp,
  UsersRound,
} from "lucide-react";

import { ONBOARDED_COOKIE } from "@/lib/data/onboarding-cookie";
import { USE_SUPABASE, USE_AUTHJS } from "@/lib/data/mode";
import { getCurrentUser } from "@/lib/auth/session";
import { getAssistant } from "@/lib/data/assistant";
import { getBusinessProfile } from "@/lib/data/business-profile";
import { listConversations } from "@/lib/data/conversations";
import { listLeads } from "@/lib/data/leads";
import { listKnowledgeSources } from "@/lib/data/knowledge";
import { getPlanLimits, getUsage, getWorkspace } from "@/lib/data/workspace";
import { kbUsage } from "@/lib/usage";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { UsageCard } from "@/components/dashboard/usage-card";
import { ServiceCard } from "@/components/dashboard/service-card";
import {
  GetStartedChecklist,
  type ChecklistStep,
} from "@/components/dashboard/get-started-checklist";
import {
  ConversationStatusBadge,
  LeadStatusBadge,
} from "@/components/dashboard/status-badges";
import { relativeTime } from "@/lib/format";

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ empty?: string }>;
}) {
  // ReplyOra Social (Netlify/Neon): the legacy product overview isn't part of
  // this deploy — send users to their content calendar instead.
  if (USE_AUTHJS) redirect("/dashboard/planner");

  const empty = (await searchParams).empty === "1";

  const [
    user,
    workspace,
    usage,
    plan,
    allLeads,
    allConversations,
    allSources,
    assistant,
    profile,
  ] = await Promise.all([
    getCurrentUser(),
    getWorkspace(),
    getUsage(),
    getPlanLimits(),
    listLeads(),
    listConversations(),
    listKnowledgeSources(),
    getAssistant(),
    getBusinessProfile(),
  ]);

  // First run: send real users to the onboarding wizard to enter their own
  // business details, until they've completed it or chosen "Skip for now".
  if (USE_SUPABASE && !empty) {
    const onboarded =
      (await cookies()).get(ONBOARDED_COOKIE)?.value === "1";
    const profileEmpty =
      !profile.description.trim() && !profile.industry.trim();
    if (!onboarded && profileEmpty) redirect("/onboarding");
  }

  // `?empty=1` simulates a brand-new workspace to preview the first-run UX.
  const leads = empty ? [] : allLeads;
  const conversations = empty ? [] : allConversations;
  const sources = empty ? [] : allSources;
  const messagesUsed = empty ? 0 : usage.messagesUsed;

  // KB is enforced in characters (~1 byte ≈ 1 char) but shown to owners in pages.
  const kbChars = sources.reduce((sum, s) => sum + s.sizeBytes, 0);
  const kb = kbUsage(plan.key, kbChars);
  const booked = leads.filter((l) => l.status === "booked").length;
  const firstName = user.fullName.split(" ")[0];

  const steps: ChecklistStep[] = [
    {
      label: "Complete your business profile",
      description: "Hours, contact details and what you do.",
      href: "/dashboard/business",
      done: !empty && profile.description.trim().length > 0,
    },
    {
      label: "Add knowledge",
      description: "Paste FAQs or upload a file to train the assistant.",
      href: "/dashboard/knowledge",
      done: sources.some((s) => s.status === "ready"),
    },
    {
      label: "Customise your assistant",
      description: "Name, tone, brand colour and welcome message.",
      href: "/dashboard/assistant",
      done: !empty && assistant.name !== "Assistant",
    },
    {
      label: "Install on your site",
      description: "Copy the one-line embed snippet.",
      href: "/dashboard/install",
      done: !empty && assistant.allowedDomains.length > 0,
    },
  ];
  const setupComplete = steps.every((s) => s.done);

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description={
          empty
            ? "Let's get your assistant set up."
            : `Here's what ${assistant.name} has been up to.`
        }
      >
        <Button asChild>
          <Link href="/dashboard/assistant">
            Open assistant
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </PageHeader>

      <div className="space-y-6 p-6">
        {!setupComplete && <GetStartedChecklist steps={steps} />}

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Conversations"
            value={conversations.length}
            hint="all time"
            icon={MessagesSquare}
            href="/dashboard/conversations"
          />
          <StatCard
            label="Leads captured"
            value={leads.length}
            hint={`${leads.filter((l) => l.status === "new").length} new`}
            icon={UsersRound}
            href="/dashboard/leads"
          />
          <StatCard
            label="Booked"
            value={booked}
            hint="converted to bookings"
            icon={CalendarCheck}
            href="/dashboard/leads?status=booked"
          />
          <StatCard
            label="Messages this month"
            value={messagesUsed.toLocaleString()}
            hint={`of ${plan.messagesPerMonth.toLocaleString()}`}
            icon={TrendingUp}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent conversations */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Recent conversations</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/conversations">View all</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-1">
              {conversations.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No conversations yet. Install the widget to start chatting with
                  visitors.
                </p>
              ) : (
                conversations.slice(0, 5).map((c) => (
                  <Link
                    key={c.id}
                    href={`/dashboard/conversations/${c.id}`}
                    className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-oat"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {c.preview}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {c.messageCount} messages ·{" "}
                        {relativeTime(c.lastMessageAt)}
                      </p>
                    </div>
                    {c.capturedLead && (
                      <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                        Lead
                      </span>
                    )}
                    <ConversationStatusBadge status={c.status} />
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          {/* Usage + latest leads */}
          <div className="space-y-6">
            <UsageCard
              planName={plan.name}
              messagesUsed={messagesUsed}
              messagesLimit={plan.messagesPerMonth}
              kbUsedPages={kb.usedPages}
              kbLimitPages={kb.limitPages}
            />
            <ServiceCard plan={plan} createdAt={workspace.createdAt} />
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Latest leads</CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard/leads">View all</Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {leads.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No leads yet.
                  </p>
                ) : (
                  leads.slice(0, 4).map((l) => (
                    <div key={l.id} className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">
                          {l.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {l.intent}
                        </p>
                      </div>
                      <LeadStatusBadge status={l.status} />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
