"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Facebook, Instagram, Music2, Zap } from "lucide-react";

import {
  disconnectAction,
  toggleIntegrationAction,
  linkPublisherAccountAction,
} from "@/app/(social)/clients/[id]/integrations/actions";
import { GuideTrigger } from "@/components/social/guide";

export function IntegrationsWorkspace({
  clientId,
  clientName,
  platforms,
  metaReady,
  tiktokReady,
  ayrshareReady,
  postpeerReady,
  linkedAccounts,
}: {
  clientId: string;
  clientName: string;
  platforms: string[];
  metaReady: boolean;
  tiktokReady: boolean;
  ayrshareReady: boolean;
  postpeerReady: boolean;
  linkedAccounts: Record<string, string>;
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

      {postpeerReady ? (
        <>
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <Zap className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
            <div>
              <p className="text-sm font-semibold text-emerald-900">Auto-publishing is live</p>
              <p className="mt-0.5 text-[12px] text-emerald-800/90">
                Posting runs through PostPeer. Link {clientName}&rsquo;s accounts in your{" "}
                <a
                  href="https://www.postpeer.dev/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline"
                >
                  PostPeer dashboard
                </a>
                , copy each connected account&rsquo;s <strong>Account ID</strong>, and paste
                it below. Then hit <strong>Publish</strong> on any Calendar post and it goes
                out for real.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <PublisherLink
              clientId={clientId}
              platform="instagram"
              icon={<Instagram className="h-5 w-5" />}
              name="Instagram"
              current={linkedAccounts.instagram ?? ""}
            />
            <PublisherLink
              clientId={clientId}
              platform="tiktok"
              icon={<Music2 className="h-5 w-5" />}
              name="TikTok"
              current={linkedAccounts.tiktok ?? ""}
            />
            <PublisherLink
              clientId={clientId}
              platform="facebook"
              icon={<Facebook className="h-5 w-5" />}
              name="Facebook"
              current={linkedAccounts.facebook ?? ""}
            />
          </div>

          <p className="mt-6 text-[11px] text-ink/75">
            TikTok note: brand-new TikTok apps may post as a private draft until TikTok
            approves public posting. Instagram publishes fully automatically.
          </p>
        </>
      ) : (
        <>
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
            {metaReady || tiktokReady || ayrshareReady
              ? "Connect authorises this client's account so scheduled posts publish automatically."
              : "You can publish today with no connection — the Calendar's Publish button hands you the ready-to-post caption and opens the app. Connect an account to upgrade to hands-off auto-publishing."}
          </p>
        </>
      )}
    </div>
  );
}

/** Paste-the-Account-ID linker for the PostPeer publisher. */
function PublisherLink({
  clientId,
  platform,
  icon,
  name,
  current,
}: {
  clientId: string;
  platform: "instagram" | "tiktok" | "facebook";
  icon: React.ReactNode;
  name: string;
  current: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(current);
  const [pending, startTransition] = useTransition();
  const linked = current.trim().length > 0;
  const dirty = value.trim() !== current.trim();

  function save() {
    startTransition(async () => {
      await linkPublisherAccountAction(clientId, platform, value);
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-ink/10 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-oxblood">
          {icon}
          <span className="font-display text-xl text-ink">{name}</span>
        </div>
        {linked && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-800">
            <Check className="h-3 w-3" /> Linked
          </span>
        )}
      </div>
      <label className="mt-4 block text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/75">
        PostPeer account ID
      </label>
      <div className="mt-1.5 flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="acc_…"
          className="min-w-0 flex-1 rounded-lg border border-oxblood/20 bg-white px-3 py-2 text-sm text-ink focus:border-oxblood focus:outline-none"
        />
        <button
          type="button"
          onClick={save}
          disabled={pending || (!dirty && linked) || (!value.trim() && !linked)}
          className="shrink-0 rounded-full bg-oxblood px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-cream transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving…" : linked && !value.trim() ? "Unlink" : "Save"}
        </button>
      </div>
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
