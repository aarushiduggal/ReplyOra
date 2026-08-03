import Link from "next/link";
import { ExternalLink, Globe, ShieldCheck } from "lucide-react";

import { getAssistant } from "@/lib/data/assistant";
import { getAvailableSlots } from "@/lib/data/bookings";
import { getBookingConfig } from "@/lib/data/booking-config";
import { getWorkspace } from "@/lib/data/workspace";
import { isEntitled } from "@/lib/data/entitlement";
import { hasFeature } from "@/lib/usage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { InstallSnippet } from "@/components/dashboard/install-snippet";
import { Paywall } from "@/components/dashboard/paywall";
import { ChatBubble } from "@/components/widget/chat-bubble";

const APP_URL = "https://app.replyora.com";

export default async function InstallPage() {
  const [assistant, workspace, allSlots, bookingConfig] = await Promise.all([
    getAssistant(),
    getWorkspace(),
    getAvailableSlots(),
    getBookingConfig(),
  ]);

  // Plan gating: booking is Growth+, branding removal is Growth+.
  const canBook = hasFeature(workspace.plan, "booking");
  const useCalendar = canBook && bookingConfig.source === "calendly";
  const bookingSlots = canBook && !useCalendar ? allSlots : undefined;
  const bookingUrl = useCalendar ? bookingConfig.externalUrl ?? undefined : undefined;
  const showBranding = !(
    hasFeature(workspace.plan, "removeBranding") && assistant.removeBranding
  );

  const snippet = `<script
  src="${APP_URL}/embed.js"
  data-key="${assistant.publicKey}"
  async
></script>`;

  if (!isEntitled(workspace)) {
    return (
      <div>
        <PageHeader
          title="Install"
          description="Add Replyora to your website with one line of code."
        />
        <div className="p-6">
          <Paywall feature="your widget" current={workspace.plan} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Install"
        description="Add Replyora to your website with one line of code."
      />

      <div className="grid gap-6 p-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Embed snippet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Paste this just before the closing{" "}
                <code className="rounded bg-oat px-1 py-0.5 text-xs">
                  &lt;/body&gt;
                </code>{" "}
                tag on every page of {workspace.name}&apos;s site.
              </p>
              <InstallSnippet snippet={snippet} />
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="text-muted-foreground">Public key:</span>
                <code className="rounded bg-oat px-2 py-1 text-xs text-wine">
                  {assistant.publicKey}
                </code>
                <Badge variant="muted">Safe to expose</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                <span className="inline-flex items-center gap-2">
                  <Globe className="h-4 w-4 text-oxblood" />
                  Allowed domains
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                The widget only runs on these domains. Requests from anywhere
                else are rejected.
              </p>
              <div className="flex flex-wrap gap-2">
                {assistant.allowedDomains.map((d) => (
                  <span
                    key={d}
                    className="rounded-full border border-border bg-card px-3 py-1 text-sm text-ink"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-oxblood" />
                  How it stays secure
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                · The widget loads in an isolated iframe + shadow DOM — no style
                or script collisions with your site.
              </p>
              <p>
                · The public key only grants scoped, rate-limited chat. It can
                never read your data.
              </p>
              <p>
                · Every request is checked against your allowed domains and your
                plan&apos;s message cap.
              </p>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href={`/widget/${assistant.publicKey}`} target="_blank">
                Open hosted widget
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/dashboard/assistant">Customise assistant</Link>
            </Button>
          </div>
        </div>

        {/* Live demo */}
        <div>
          <p className="mb-3 text-sm font-medium text-ink">Live demo</p>
          <div className="relative h-[560px] overflow-hidden rounded-2xl border border-dashed border-border bg-linear-to-br from-oat/60 to-cream">
            <div className="p-6">
              <div className="h-4 w-32 rounded bg-card" />
              <div className="mt-3 h-3 w-48 rounded bg-card/70" />
              <div className="mt-2 h-3 w-40 rounded bg-card/70" />
              <p className="mt-6 text-xs text-muted-foreground">
                This is your site. Click the bubble ↘
              </p>
            </div>
            <ChatBubble
              contained
              config={{
                publicKey: assistant.publicKey,
                name: assistant.name,
                welcomeMessage: assistant.welcomeMessage,
                suggestedQuestions: assistant.suggestedQuestions,
                brandColor: assistant.brandColor,
                leadFields: assistant.leadFields,
                businessName: workspace.name,
                showBranding,
                bookingSlots,
                bookingUrl,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
