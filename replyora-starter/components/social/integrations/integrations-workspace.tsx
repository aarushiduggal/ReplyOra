"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Instagram, Music2, Zap } from "lucide-react";

import {
  disconnectAction,
  toggleIntegrationAction,
} from "@/app/(social)/clients/[id]/integrations/actions";
import { GuideTrigger } from "@/components/social/guide";

export function IntegrationsWorkspace({
  clientId,
  clientName,
  platforms,
  metaReady,
  tiktokReady,
  ayrshareReady,
}: {
  clientId: string;
  clientName: string;
  platforms: string[];
  metaReady: boolean;
  tiktokReady: boolean;
  ayrshareReady: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function stubConnect(platform: "instagram" | "tiktok") {
    startTransition(async () => {
      await toggleIntegrationAction(clientId, platform, true);
      router.refresh();
    });
  }
  function disconnect(platform: "instagram" | "tiktok") {
    startTransition(async () => {
      await disconnectAction(clientId, platform);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-3">
        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/85">
          <span className="text-oxblood">( 10 )</span> Integrations
          <GuideTrigger pageKey="integrations" clientId={clientId} />
        </div>
      </div>
      <p className="mb-6 text-[12px] font-medium text-ink/85">
        Connect social accounts for <strong>{clientName}</strong> only. Published posts
        flow back onto the Grid and power Reports.
      </p>

      {ayrshareReady && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <Zap className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
          <div>
            <p className="text-sm font-semibold text-emerald-900">Auto-publishing is live</p>
            <p className="mt-0.5 text-[12px] text-emerald-800/90">
              Instagram &amp; TikTok posting runs through your connected publishing
              account — just hit <strong>Publish</strong> on any post in the Calendar and
              it goes out for real. Link the social accounts inside your Ayrshare
              dashboard.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card
          icon={<Instagram className="h-5 w-5" />}
          name="Instagram"
          note="Paid feature"
          connected={platforms.includes("instagram")}
          oauthReady={metaReady}
          connectHref={`/api/social/connect/instagram?client=${clientId}`}
          onStubConnect={() => stubConnect("instagram")}
          onDisconnect={() => disconnect("instagram")}
        />
        <Card
          icon={<Music2 className="h-5 w-5" />}
          name="TikTok"
          connected={platforms.includes("tiktok")}
          oauthReady={tiktokReady}
          connectHref={`/api/social/connect/tiktok?client=${clientId}`}
          onStubConnect={() => stubConnect("tiktok")}
          onDisconnect={() => disconnect("tiktok")}
        />
      </div>

      <p className="mt-6 text-[11px] text-ink/75">
        {metaReady || tiktokReady
          ? "Connect authorises this client's account so scheduled posts publish automatically."
          : "You can publish today with no connection — the Calendar's Publish button hands you the ready-to-post caption and opens the app. Connect an account to upgrade to hands-off auto-publishing."}
      </p>
    </div>
  );
}

function Card({
  icon,
  name,
  note,
  connected,
  oauthReady,
  connectHref,
  onStubConnect,
  onDisconnect,
}: {
  icon: React.ReactNode;
  name: string;
  note?: string;
  connected: boolean;
  oauthReady: boolean;
  connectHref: string;
  onStubConnect: () => void;
  onDisconnect: () => void;
}) {
  return (
    <div className="rounded-2xl border border-ink/10 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-oxblood">
          {icon}
          <span className="font-display text-xl text-ink">{name}</span>
        </div>
        {connected && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-800">
            <Check className="h-3 w-3" /> Connected
          </span>
        )}
      </div>
      {note && (
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/75">{note}</p>
      )}
      <div className="mt-4">
        {connected ? (
          <button
            type="button"
            onClick={onDisconnect}
            className="rounded-full border border-ink/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/85 hover:border-rose hover:text-rose"
          >
            Disconnect
          </button>
        ) : oauthReady ? (
          <a
            href={connectHref}
            className="inline-block rounded-full bg-oxblood px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-cream transition-opacity hover:opacity-90"
          >
            Connect {name}
          </a>
        ) : (
          <button
            type="button"
            onClick={onStubConnect}
            className="rounded-full bg-oxblood px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-cream transition-opacity hover:opacity-90"
          >
            Connect {name}
          </button>
        )}
      </div>
    </div>
  );
}
