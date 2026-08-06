"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  Check,
  Facebook,
  Grid3x3,
  Heart,
  ImageIcon,
  Instagram,
  Menu,
  Music2,
  PencilLine,
  Play,
  Plus,
  QrCode,
  Redo2,
  Repeat2,
  Square,
  Trash2,
  Undo2,
  UserSquare,
  Upload,
  X,
} from "lucide-react";

import type { GridTile, ProfilePreview, TileStatus } from "@/lib/social/grid";
import { PLATFORM_LABEL, type Platform } from "@/lib/social/types";
import { GuideTrigger } from "@/components/social/guide";
import { toast } from "@/lib/toast";
import {
  bulkDeleteAction,
  bulkStatusAction,
  placeAssetAction,
  reorderTilesAction,
  saveProfilePreviewAction,
  unscheduleTileAction,
} from "@/app/(social)/clients/[id]/grid/actions";

export interface GridAsset {
  id: string;
  url: string;
}

const TINTS = ["#5C1A1A", "#7A2E2A", "#B26B62", "#3F1011", "#8A4A42", "#D9AFA6"];
/**
 * A tile's representative swatch is derived from its content pillar (falling
 * back to its id) — so tiles that share a theme share a colour. That makes the
 * palette + harmony read the feed's real content consistency, not random noise.
 */
function colorFor(key: string): string {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) & 0xffff;
  return TINTS[h % TINTS.length] ?? "#5C1A1A";
}
function tileColor(t: GridTile): string {
  return colorFor(t.pillar || t.id);
}
function firstWords(s: string, n = 6): string {
  return s.replace(/\s+/g, " ").trim().split(" ").slice(0, n).join(" ");
}
const STATUS_DOT: Record<GridTile["status"], string> = {
  draft: "bg-ink/30",
  scheduled: "bg-rose",
  published: "bg-oxblood",
};

/** Fake view counts for the TikTok mock thumbnails. */
const TIKTOK_VIEWS = [
  "12.4K", "8.1K", "23.7K", "5.6K", "41.2K", "9.9K",
  "3.3K", "18.0K", "6.7K", "2.1K", "15.5K", "7.2K",
];

/** Live feed analysis — harmony %, palette, pillar mix. Computed from tiles. */
function analyzeFeed(tiles: GridTile[]) {
  const total = tiles.length;
  const colors = tiles.map(tileColor);
  const distinct = [...new Set(colors)];
  // Consistency: 1 shared colour → 100%, all-different → 0%. Floors at 40 so a
  // varied-but-intentional feed never reads as "broken".
  const raw =
    total <= 1 ? 100 : 100 * (1 - (distinct.length - 1) / (total - 1));
  const harmony = total === 0 ? 0 : Math.max(40, Math.round(raw));
  // Palette ordered by frequency.
  const freq = new Map<string, number>();
  for (const c of colors) freq.set(c, (freq.get(c) ?? 0) + 1);
  const palette = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([c]) => c)
    .slice(0, 5);
  return { harmony, palette, total };
}

export function GridWorkspace({
  clientId,
  clientName,
  tiles: initialTiles,
  profile: initialProfile,
  assets = [],
  connectedPlatforms = [],
}: {
  clientId: string;
  clientName: string;
  tiles: GridTile[];
  profile: ProfilePreview;
  assets?: GridAsset[];
  connectedPlatforms?: string[];
}) {
  const base = `/clients/${clientId}`;
  const [tiles, setTiles] = useState<GridTile[]>(initialTiles);
  const [past, setPast] = useState<GridTile[][]>([]);
  const [future, setFuture] = useState<GridTile[][]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragAssetUrl, setDragAssetUrl] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const [profile, setProfile] = useState<ProfilePreview>({
    ...initialProfile,
    username:
      initialProfile.username || clientName.toLowerCase().replace(/\s+/g, ""),
    displayName: initialProfile.displayName || clientName,
  });
  const [editOpen, setEditOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [reels, setReels] = useState(false);
  const [showDates, setShowDates] = useState(false);

  // Persist the display toggles per client so they survive a reload.
  useEffect(() => {
    try {
      setReels(localStorage.getItem(`ro_grid_reels_${clientId}`) === "1");
      setShowDates(localStorage.getItem(`ro_grid_dates_${clientId}`) === "1");
    } catch {
      /* localStorage unavailable — keep defaults */
    }
  }, [clientId]);
  useEffect(() => {
    try {
      localStorage.setItem(`ro_grid_reels_${clientId}`, reels ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [reels, clientId]);
  useEffect(() => {
    try {
      localStorage.setItem(`ro_grid_dates_${clientId}`, showDates ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [showDates, clientId]);
  const [platform, setPlatform] = useState<Platform>("instagram");
  const isTikTok = platform === "tiktok";
  const [, startTransition] = useTransition();

  const drafts = useMemo(() => tiles.filter((t) => t.status === "draft"), [tiles]);
  const scheduled = useMemo(
    () => tiles.filter((t) => t.status === "scheduled"),
    [tiles],
  );
  const feed = useMemo(() => analyzeFeed(tiles), [tiles]);

  function commitOrder(next: GridTile[]) {
    setPast((p) => [...p, tiles]);
    setFuture([]);
    setTiles(next);
    startTransition(() =>
      reorderTilesAction(clientId, next.map((t) => t.id)),
    );
  }

  function onDrop(targetId: string) {
    setDropTarget(null);
    // Dropping an ASSET onto a tile → place its image (real, persisted).
    if (dragAssetUrl) {
      placeAsset(targetId, dragAssetUrl);
      setDragAssetUrl(null);
      return;
    }
    // Otherwise it's a tile being dragged → reorder.
    if (!dragId || dragId === targetId) return;
    const from = tiles.findIndex((t) => t.id === dragId);
    const to = tiles.findIndex((t) => t.id === targetId);
    setDragId(null);
    if (from < 0 || to < 0) return;
    const next = [...tiles];
    const [moved] = next.splice(from, 1);
    if (!moved) return;
    next.splice(to, 0, moved);
    commitOrder(next);
  }

  /** Place (persist) an asset image onto a tile — optimistic. */
  function placeAsset(tileId: string, url: string) {
    setTiles((ts) =>
      ts.map((t) => (t.id === tileId ? { ...t, mediaUrl: url } : t)),
    );
    startTransition(() => placeAssetAction(clientId, tileId, url));
    toast({ title: "Image placed", type: "success" });
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function clearSelection() {
    setSelected(new Set());
  }

  function applyBulkStatus(status: TileStatus) {
    const ids = [...selected];
    if (ids.length === 0) return;
    setTiles((ts) =>
      ts.map((t) => (selected.has(t.id) ? { ...t, status } : t)),
    );
    startTransition(() => bulkStatusAction(clientId, ids, status));
    toast({ title: `${ids.length} moved to ${status}`, type: "success" });
    clearSelection();
  }
  function applyBulkDelete() {
    const ids = [...selected];
    if (ids.length === 0) return;
    setPast((p) => [...p, tiles]);
    setTiles((ts) => ts.filter((t) => !selected.has(t.id)));
    startTransition(() => bulkDeleteAction(clientId, ids));
    toast({ title: `${ids.length} deleted`, type: "info" });
    clearSelection();
  }

  function undo() {
    const prev = past[past.length - 1];
    if (!prev) return;
    setPast((p) => p.slice(0, -1));
    setFuture((f) => [tiles, ...f]);
    setTiles(prev);
    startTransition(() => reorderTilesAction(clientId, prev.map((t) => t.id)));
  }
  function redo() {
    const nxt = future[0];
    if (!nxt) return;
    setFuture((f) => f.slice(1));
    setPast((p) => [...p, tiles]);
    setTiles(nxt);
    startTransition(() => reorderTilesAction(clientId, nxt.map((t) => t.id)));
  }

  function saveProfile() {
    startTransition(() => saveProfilePreviewAction(clientId, profile));
    setEditOpen(false);
  }

  const upper = clientName.toUpperCase();

  return (
    <div>
      {/* sub-title row */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/85">
          <span className="text-oxblood">( 02 )</span> Grid
          <span className="text-ink/60">·</span>
          <span className="text-ink/80">
            Studio · {PLATFORM_LABEL[platform]}
          </span>
          <GuideTrigger pageKey="grid" clientId={clientId} />
        </div>
        <div className="flex items-center gap-4">
          <Link
            href={`${base}/studio`}
            className="inline-flex items-center gap-1.5 rounded-full bg-oxblood px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-cream transition-opacity hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" /> Add post
          </Link>
          <Link
            href={`${base}/approvals`}
            className="text-[11px] font-semibold uppercase tracking-[0.16em] text-oxblood hover:underline"
          >
            Approval queue →
          </Link>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,320px)_1fr]">
        {/* Left — platform + profile controls */}
        <aside className="space-y-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/85">
              Platform
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold">
              {(["instagram", "tiktok", "facebook"] as Platform[]).map((p) => {
                const active = platform === p;
                const Icon =
                  p === "instagram" ? Instagram : p === "tiktok" ? Music2 : Facebook;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlatform(p)}
                    className={`flex items-center gap-1.5 pb-1 transition-colors ${
                      active
                        ? "text-oxblood underline decoration-oxblood underline-offset-[6px]"
                        : "text-ink/50 hover:text-ink/80"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {PLATFORM_LABEL[p]}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs font-medium text-ink/85">
              {tiles.length} posts{isTikTok ? "" : " · 0 highlights"}
            </p>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/85">
              Profile preview
            </p>
            <p className="mt-1 text-xs font-medium text-ink/85">
              Username, bio, followers &amp; photo shown on the mock.
            </p>
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="mt-3 w-full rounded-full border border-oxblood/30 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-oxblood transition-colors hover:bg-oxblood hover:text-cream"
            >
              Edit profile preview
            </button>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/85">
              Account
            </p>
            {connectedPlatforms.includes(platform) ? (
              <Link
                href={`${base}/integrations`}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-800 transition-colors hover:border-emerald-400"
              >
                <Check className="h-3.5 w-3.5" /> {PLATFORM_LABEL[platform]} connected
              </Link>
            ) : (
              <>
                <Link
                  href={`${base}/integrations`}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border border-ink/20 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/80 transition-colors hover:border-oxblood hover:text-oxblood"
                >
                  {platform === "instagram" ? (
                    <Instagram className="h-3.5 w-3.5" />
                  ) : platform === "facebook" ? (
                    <Facebook className="h-3.5 w-3.5" />
                  ) : (
                    <Music2 className="h-3.5 w-3.5" />
                  )}{" "}
                  Connect {PLATFORM_LABEL[platform]}
                </Link>
                <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-ink/75">
                  Paid feature
                </p>
              </>
            )}
          </div>

          {!isTikTok && (
            <div className="space-y-3">
              <Toggle
                label="Reels"
                on={reels}
                onChange={setReels}
                help="Show a Reels play icon on video tiles in the preview."
              />
              <Toggle
                label="Scheduled dates"
                on={showDates}
                onChange={setShowDates}
                help="Show the scheduled date on each planned tile."
              />
            </div>
          )}
        </aside>

        {/* Centre — iPhone mock */}
        <div>
          <div className="mx-auto max-w-[320px] overflow-hidden rounded-[2rem] border border-oxblood/15 bg-white shadow-sm">
            <div className="flex items-center justify-between px-4 pt-3 text-[10px] font-medium text-ink/85">
              <span>9:41</span>
              <span>5G</span>
            </div>
            {isTikTok ? (
              <>
                <div className="flex items-center justify-between px-4 pt-1 text-ink/85">
                  <span className="w-4" />
                  <span className="text-[13px] font-semibold text-ink">
                    {profile.username ? `@${profile.username}` : "@tiktok"}
                  </span>
                  <Menu className="h-4 w-4" />
                </div>
                <div className="flex flex-col items-center px-4 pt-2">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-oxblood font-wordmark text-lg text-cream">
                    {clientName.charAt(0).toUpperCase()}
                  </div>
                  <p className="mt-2 text-[13px] font-semibold text-ink">
                    @{profile.username || "tiktok"}
                  </p>
                  <div className="mt-2 flex justify-center gap-6 text-center">
                    <Stat n={profile.following || "0"} label="Following" />
                    <Stat n={profile.followers || "0"} label="Followers" />
                    <Stat n="18.2K" label="Likes" />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between px-4 pt-1">
                  <span className="text-[13px] font-semibold text-ink">
                    {profile.username || "instagram"}
                  </span>
                  <span className="flex items-center gap-3 text-ink/85">
                    <Plus className="h-4 w-4" />
                    <Menu className="h-4 w-4" />
                  </span>
                </div>
                <div className="flex items-center gap-4 px-4 py-3">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-oxblood font-wordmark text-lg text-cream">
                    {clientName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-1 justify-around text-center">
                    <Stat n={String(tiles.length)} label="Posts" />
                    <Stat n={profile.followers || "0"} label="Followers" />
                    <Stat n={profile.following || "0"} label="Following" />
                  </div>
                </div>
              </>
            )}
            <div className="px-4 pb-2">
              <p className="text-[12px] font-semibold text-ink">
                {profile.displayName}
              </p>
              {profile.bio && (
                <p className="whitespace-pre-line text-[11px] text-ink/85">
                  {profile.bio}
                </p>
              )}
              {profile.website && (
                <p className="text-[11px] font-medium text-oxblood">
                  {profile.website}
                </p>
              )}
            </div>
            <div className="flex justify-around border-t border-oxblood/10 py-2 text-ink/85">
              {isTikTok ? (
                <>
                  <Grid3x3 className="h-4 w-4 text-oxblood" />
                  <Repeat2 className="h-4 w-4" />
                  <Heart className="h-4 w-4" />
                </>
              ) : (
                <>
                  <Grid3x3 className="h-4 w-4 text-oxblood" />
                  <Play className="h-4 w-4" />
                  <UserSquare className="h-4 w-4" />
                  <Square className="h-4 w-4" />
                </>
              )}
            </div>

            {tiles.length === 0 ? (
              <div className="border-t border-oxblood/10">
                <div className="grid grid-cols-3 gap-0.5 bg-oxblood/5">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-center border border-dashed border-oxblood/15 bg-oat/40 ${
                        isTikTok ? "aspect-[9/16]" : "aspect-square"
                      }`}
                    >
                      <ImageIcon className="h-4 w-4 text-oxblood/20" />
                    </div>
                  ))}
                </div>
                <p className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/70">
                  Use Add Post above to start planning your feed
                </p>
              </div>
            ) : (
              <div className="relative grid grid-cols-3 gap-0.5 border-t border-oxblood/10 bg-oxblood/10">
                {tiles.map((t, i) => {
                  const isSel = selected.has(t.id);
                  const isTarget = dropTarget === t.id;
                  return (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={() => setDragId(t.id)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (dragAssetUrl) setDropTarget(t.id);
                      }}
                      onDragLeave={() =>
                        setDropTarget((d) => (d === t.id ? null : d))
                      }
                      onDrop={() => onDrop(t.id)}
                      className={`group relative cursor-grab bg-cover bg-center active:cursor-grabbing ${
                        isTikTok ? "aspect-[9/16]" : "aspect-square"
                      }`}
                      style={
                        t.mediaUrl
                          ? { backgroundImage: `url(${t.mediaUrl})` }
                          : { backgroundColor: tileColor(t) }
                      }
                      title={firstWords(t.caption, 12)}
                    >
                      {/* select toggle (click doesn't trigger drag) */}
                      <button
                        type="button"
                        draggable={false}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelect(t.id);
                        }}
                        aria-label={isSel ? "Deselect" : "Select"}
                        className={`absolute left-1 top-1 flex h-4 w-4 items-center justify-center rounded-full border transition ${
                          isSel
                            ? "border-oxblood bg-oxblood text-cream"
                            : "border-white/70 bg-black/25 text-transparent opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        <Check className="h-2.5 w-2.5" />
                      </button>
                      <span
                        className={`absolute right-1 top-1 h-2 w-2 rounded-full ${STATUS_DOT[t.status]} ring-1 ring-white/70`}
                      />
                      {!t.mediaUrl && !isTikTok && (
                        <span className="absolute inset-x-1 bottom-1 line-clamp-2 text-[8.5px] leading-tight text-cream/90">
                          {firstWords(t.caption, 6)}
                        </span>
                      )}
                      {isTikTok && (
                        <span className="absolute bottom-1 left-1 flex items-center gap-0.5 text-[8px] font-semibold text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.55)]">
                          <Play className="h-2.5 w-2.5 fill-white text-white" />
                          {TIKTOK_VIEWS[i % TIKTOK_VIEWS.length]}
                        </span>
                      )}
                      {isTarget && (
                        <span className="absolute inset-0 flex items-center justify-center bg-oxblood/40 text-[8px] font-bold uppercase tracking-wide text-cream">
                          Drop
                        </span>
                      )}
                      {isSel && (
                        <span className="pointer-events-none absolute inset-0 ring-2 ring-inset ring-oxblood" />
                      )}
                      {/* "first impression" line after the top 6 (above the fold) */}
                      {i === 5 && tiles.length > 6 && (
                        <span className="pointer-events-none absolute inset-x-0 -bottom-0.5 z-10 flex translate-y-1/2 items-center gap-1">
                          <span className="h-px flex-1 bg-oxblood/70" />
                          <span className="whitespace-nowrap rounded-full bg-oxblood px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wide text-cream">
                            First impression
                          </span>
                          <span className="h-px flex-1 bg-oxblood/70" />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right — assets + drafts/scheduled */}
        <div className="space-y-5">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition-opacity hover:opacity-90"
          >
            <Upload className="h-3.5 w-3.5" /> Upload assets
          </button>
          <button
            type="button"
            onClick={() => setQrOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-ink/20 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/85 transition-colors hover:border-oxblood hover:text-oxblood"
          >
            <QrCode className="h-3.5 w-3.5" /> Upload from phone
          </button>

          {/* Bulk actions bar — appears when tiles are multi-selected */}
          {selected.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-oxblood/20 bg-white p-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/85">
                {selected.size} selected
              </span>
              <Link
                href={`${base}/calendar`}
                className="inline-flex items-center gap-1 rounded-full bg-oxblood px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-cream"
              >
                <CalendarClock className="h-3 w-3" /> Schedule in calendar
              </Link>
              <button
                type="button"
                onClick={() => applyBulkStatus("draft")}
                className="inline-flex items-center gap-1 rounded-full border border-oxblood/25 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-oxblood"
              >
                <PencilLine className="h-3 w-3" /> Draft
              </button>
              <button
                type="button"
                onClick={applyBulkDelete}
                className="inline-flex items-center gap-1 rounded-full border border-ink/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink/70 hover:border-red-400 hover:text-red-600"
              >
                <Trash2 className="h-3 w-3" /> Delete
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="ml-auto text-[10px] font-semibold uppercase tracking-[0.1em] text-ink/60 hover:text-oxblood"
              >
                Clear
              </button>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/85">
              <span>{assets.length} assets</span>
              <Link
                href={`${base}/assets`}
                className="text-oxblood hover:underline"
              >
                Manage
              </Link>
            </div>
            {assets.length === 0 ? (
              <div className="mt-2 flex flex-col items-center gap-1 rounded-xl border border-dashed border-oxblood/20 px-4 py-8 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/85">
                  No assets yet
                </p>
                <Link
                  href={`${base}/assets`}
                  className="text-[11px] text-oxblood hover:underline"
                >
                  Upload some to drag onto the grid →
                </Link>
              </div>
            ) : (
              <>
                <div className="mt-2 grid grid-cols-4 gap-1.5">
                  {assets.map((a) => (
                    <div
                      key={a.id}
                      draggable
                      onDragStart={() => setDragAssetUrl(a.url)}
                      onDragEnd={() => setDragAssetUrl(null)}
                      className="aspect-square cursor-grab rounded-md bg-oat bg-cover bg-center ring-1 ring-oxblood/10 transition hover:ring-oxblood/40 active:cursor-grabbing"
                      style={{ backgroundImage: `url(${a.url})` }}
                      title="Drag onto a grid tile to place"
                    />
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-ink/55">
                  Drag an asset onto a grid tile to place it.
                </p>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={undo}
              disabled={past.length === 0}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink/20 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/80 transition-colors hover:border-oxblood hover:text-oxblood disabled:opacity-40"
            >
              <Undo2 className="h-3.5 w-3.5" /> Undo
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={future.length === 0}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink/20 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/80 transition-colors hover:border-oxblood hover:text-oxblood disabled:opacity-40"
            >
              <Redo2 className="h-3.5 w-3.5" /> Redo
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/85">
                  Drafts ({drafts.length})
                </p>
                <Link
                  href={`${base}/studio`}
                  className="text-[11px] font-semibold uppercase tracking-[0.12em] text-oxblood hover:underline"
                >
                  + Carousel
                </Link>
              </div>
              <Column tiles={drafts} empty="No drafts yet" base={base} clientId={clientId} variant="draft" />
            </div>
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/85">
                Scheduled ({scheduled.length})
              </p>
              <Column tiles={scheduled} empty="Nothing scheduled" base={base} clientId={clientId} variant="scheduled" />
            </div>
          </div>
        </div>
      </div>

      <GridIntelligence feed={feed} />

      {editOpen && (
        <Modal title="Edit profile" onClose={() => setEditOpen(false)}>
          <div className="space-y-4">
            <Field label="Username" value={profile.username} onChange={(v) => setProfile((p) => ({ ...p, username: v }))} placeholder="e.g. yourbrand" />
            <Field label="Display name" value={profile.displayName} onChange={(v) => setProfile((p) => ({ ...p, displayName: v }))} placeholder="e.g. Your Brand" />
            <div className="grid grid-cols-3 gap-3">
              <Field label="Posts" value={String(tiles.length)} onChange={() => {}} placeholder="0" />
              <Field label="Followers" value={profile.followers} onChange={(v) => setProfile((p) => ({ ...p, followers: v }))} placeholder="10.5K" />
              <Field label="Following" value={profile.following} onChange={(v) => setProfile((p) => ({ ...p, following: v }))} placeholder="850" />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-widest text-ink/90">Bio</label>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                rows={3}
                placeholder="A few lines about the brand."
                className="mt-1 w-full rounded-lg border border-oxblood/20 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-oxblood"
              />
            </div>
            <Field label="Website link" value={profile.website} onChange={(v) => setProfile((p) => ({ ...p, website: v }))} placeholder="yourbrand.com" />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditOpen(false)} className="rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/85 hover:text-oxblood">
                Cancel
              </button>
              <button type="button" onClick={saveProfile} className="rounded-full bg-oxblood px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-cream transition-opacity hover:opacity-90">
                Save profile
              </button>
            </div>
          </div>
        </Modal>
      )}

      {qrOpen && <PhoneUploadModal clientName={clientName} onClose={() => setQrOpen(false)} />}
    </div>
  );
}

function Toggle({
  label,
  on,
  onChange,
  help,
}: {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
  help: string;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={() => onChange(!on)}
        className="flex w-full items-center justify-between"
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/80">
          {label}
        </span>
        <span
          className={`relative h-5 w-9 rounded-full transition-colors ${on ? "bg-oxblood" : "bg-ink/20"}`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${on ? "left-[18px]" : "left-0.5"}`}
          />
        </span>
      </button>
      <p className="mt-1 text-[10px] text-ink/80">{help}</p>
    </div>
  );
}

function PhoneUploadModal({
  clientName,
  onClose,
}: {
  clientName: string;
  onClose: () => void;
}) {
  const [secs, setSecs] = useState(300);
  useEffect(() => {
    const id = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  return (
    <Modal title="Upload from phone" onClose={onClose}>
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <div className="flex h-40 w-40 items-center justify-center rounded-xl border border-oxblood/15 bg-oat/20">
          <QrCode className="h-24 w-24 text-oxblood/70" />
        </div>
        <p className="text-xs font-medium text-ink/90">
          Files go to <span className="font-semibold text-ink">{clientName}</span> only.
        </p>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-oxblood">
          Expires {mm}:{ss}
        </p>
        <p className="text-[10px] uppercase tracking-[0.14em] text-ink/75">
          Connect storage to enable · coming soon
        </p>
      </div>
    </Modal>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <p className="font-semibold text-ink">{n}</p>
      <p className="text-[10px] text-ink/85">{label}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-widest text-ink/90">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-oxblood/20 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-oxblood"
      />
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-oxblood/15 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-xl text-oxblood">{title}</h3>
          <button onClick={onClose} className="text-ink/80 hover:text-oxblood" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function scheduleLabel(iso: string | null): string {
  if (!iso) return "No date — set in Calendar";
  return new Date(iso).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Column({
  tiles,
  empty,
  base,
  clientId,
  variant,
}: {
  tiles: GridTile[];
  empty: string;
  base: string;
  clientId: string;
  variant: "draft" | "scheduled";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // Scheduled cards jump to the Calendar (where a real date is set); drafts to Studio.
  const href = variant === "scheduled" ? `${base}/calendar` : `${base}/studio`;

  function unschedule(id: string) {
    startTransition(async () => {
      await unscheduleTileAction(clientId, id);
      router.refresh();
    });
  }

  if (tiles.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-oxblood/15 px-3 py-6 text-center text-[11px] font-medium text-ink/80">
        {empty}
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {tiles.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-2 rounded-xl border border-oxblood/10 bg-white p-2 hover:border-oxblood/30"
        >
          <Link href={href} className="flex min-w-0 flex-1 items-center gap-2">
            <span
              className="h-9 w-9 shrink-0 rounded-lg bg-cover bg-center"
              style={
                t.mediaUrl
                  ? { backgroundImage: `url(${t.mediaUrl})` }
                  : { backgroundColor: tileColor(t) }
              }
            />
            <span className="min-w-0">
              <span className="line-clamp-1 text-[11px] font-medium text-ink/90">
                {firstWords(t.caption, 8)}
              </span>
              {variant === "scheduled" && (
                <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-oxblood/80">
                  {scheduleLabel(t.scheduledFor)}
                </span>
              )}
            </span>
          </Link>
          {variant === "scheduled" && (
            <button
              type="button"
              onClick={() => unschedule(t.id)}
              disabled={pending}
              aria-label="Remove from schedule"
              className="shrink-0 rounded-full p-1.5 text-ink/40 transition-colors hover:bg-rose/10 hover:text-rose disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

/** Recommended posting windows (general best-practice, not per-account analytics). */
const RECOMMENDED_TIMES = ["Tue 7pm", "Thu 6pm", "Sun 11am"];

function GridIntelligence({
  feed,
}: {
  feed: { harmony: number; palette: string[]; total: number };
}) {
  const empty = feed.total === 0;
  const verdict = empty
    ? "Add posts and this reads your feed's colour consistency."
    : feed.harmony >= 80
      ? "Your tiles are consistent — this feed reads as one brand."
      : feed.harmony >= 60
        ? "Fairly consistent — a couple of outliers break the rhythm."
        : "Mixed themes — group similar posts to tighten the look.";

  return (
    <section className="mt-8 border-t border-oxblood/10 pt-6">
      <div className="mb-4 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/85">
        <span className="text-oxblood">( 02b )</span> Grid intelligence
        {empty && (
          <span className="rounded-full bg-oat px-2 py-0.5 text-[9px] font-semibold tracking-[0.12em] text-ink/60">
            Preview — add posts to activate
          </span>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {/* Feed harmony */}
        <div className="rounded-2xl border border-oxblood/10 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/55">
              Feed harmony
            </p>
            <p className="font-display text-lg text-oxblood">
              {empty ? "—" : `${feed.harmony}%`}
            </p>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-oat">
            <div
              className="h-full rounded-full bg-gradient-to-r from-oxblood to-rose transition-all duration-700"
              style={{ width: empty ? "0%" : `${feed.harmony}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-ink/55">{verdict}</p>
        </div>

        {/* Palette */}
        <div className="rounded-2xl border border-oxblood/10 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/55">
            Your palette
          </p>
          <div className="mt-2 flex gap-1.5">
            {(empty ? [null, null, null, null, null] : feed.palette).map(
              (c, i) => (
                <span
                  key={`${c ?? "ghost"}-${i}`}
                  className={`h-7 flex-1 rounded-md ring-1 ring-black/5 ${c ? "" : "border border-dashed border-oxblood/20 bg-oat/50 ring-0"}`}
                  style={c ? { backgroundColor: c } : undefined}
                />
              ),
            )}
          </div>
          <p className="mt-2 text-[11px] text-ink/55">
            {empty
              ? "Your palette appears as you plan tiles."
              : `Pulled from your ${feed.total} planned tiles.`}
          </p>
        </div>

        {/* Recommended times */}
        <div className="rounded-2xl border border-oxblood/10 bg-white p-4">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink/55">
            <CalendarClock className="h-3.5 w-3.5" /> Recommended times
          </p>
          <div className="flex flex-wrap gap-2">
            {RECOMMENDED_TIMES.map((t) => (
              <span
                key={t}
                className="rounded-full bg-oxblood/10 px-3 py-1 text-xs font-medium text-oxblood"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
