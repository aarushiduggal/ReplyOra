"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Instagram, Music2 } from "lucide-react";

import { toggleIntegrationAction } from "@/app/(social)/clients/[id]/integrations/actions";
import { GuideTrigger } from "@/components/social/guide";

export function IntegrationsWorkspace({
  clientId,
  clientName,
  platforms,
}: {
  clientId: string;
  clientName: string;
  platforms: string[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function toggle(platform: "instagram" | "tiktok", connected: boolean) {
    startTransition(async () => {
      await toggleIntegrationAction(clientId, platform, connected);
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Card
          icon={<Instagram className="h-5 w-5" />}
          name="Instagram"
          note="Paid feature"
          connected={platforms.includes("instagram")}
          onConnect={() => toggle("instagram", true)}
          onDisconnect={() => toggle("instagram", false)}
        />
        <Card
          icon={<Music2 className="h-5 w-5" />}
          name="TikTok"
          connected={platforms.includes("tiktok")}
          onConnect={() => toggle("tiktok", true)}
          onDisconnect={() => toggle("tiktok", false)}
        />
      </div>

      <p className="mt-6 text-[11px] text-ink/75">
        More networks coming soon. OAuth token exchange activates once the Meta &amp;
        TikTok app credentials are configured.
      </p>
    </div>
  );
}

function Card({
  icon,
  name,
  note,
  connected,
  onConnect,
  onDisconnect,
}: {
  icon: React.ReactNode;
  name: string;
  note?: string;
  connected: boolean;
  onConnect: () => void;
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
        ) : (
          <button
            type="button"
            onClick={onConnect}
            className="rounded-full bg-oxblood px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-cream transition-opacity hover:opacity-90"
          >
            Connect {name}
          </button>
        )}
      </div>
    </div>
  );
}
