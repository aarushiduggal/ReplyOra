"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  Grid3x3,
  ImageIcon,
  Instagram,
  Menu,
  Play,
  Plus,
  QrCode,
  Redo2,
  Square,
  Undo2,
  UserSquare,
  Upload,
  X,
} from "lucide-react";

import type { GridTile, ProfilePreview } from "@/lib/social/grid";
import {
  reorderTilesAction,
  saveProfilePreviewAction,
} from "@/app/(social)/clients/[id]/grid/actions";

const TINTS = ["#5C1A1A", "#7A2E2A", "#B26B62", "#3F1011", "#8A4A42", "#D9AFA6"];
function tintFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return TINTS[h % TINTS.length] ?? "#5C1A1A";
}
function firstWords(s: string, n = 6): string {
  return s.replace(/\s+/g, " ").trim().split(" ").slice(0, n).join(" ");
}
const STATUS_DOT: Record<GridTile["status"], string> = {
  draft: "bg-slate-400",
  scheduled: "bg-sky-500",
  published: "bg-emerald-500",
};

export function GridWorkspace({
  clientId,
  clientName,
  tiles: initialTiles,
  profile: initialProfile,
}: {
  clientId: string;
  clientName: string;
  tiles: GridTile[];
  profile: ProfilePreview;
}) {
  const base = `/clients/${clientId}`;
  const [tiles, setTiles] = useState<GridTile[]>(initialTiles);
  const [past, setPast] = useState<GridTile[][]>([]);
  const [future, setFuture] = useState<GridTile[][]>([]);
  const [dragId, setDragId] = useState<string | null>(null);

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
  const [, startTransition] = useTransition();

  const drafts = useMemo(() => tiles.filter((t) => t.status === "draft"), [tiles]);
  const scheduled = useMemo(
    () => tiles.filter((t) => t.status === "scheduled"),
    [tiles],
  );

  function commitOrder(next: GridTile[]) {
    setPast((p) => [...p, tiles]);
    setFuture([]);
    setTiles(next);
    startTransition(() =>
      reorderTilesAction(clientId, next.map((t) => t.id)),
    );
  }

  function onDrop(targetId: string) {
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
        <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/85">
          <span className="text-oxblood">( 02 )</span> Grid
          <span className="text-ink/40">·</span>
          <span className="text-ink/60">Studio · Instagram</span>
        </p>
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
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/70">
              Platform
            </p>
            <p className="mt-1 flex items-center gap-2 font-semibold text-ink">
              <Instagram className="h-4 w-4 text-oxblood" /> Instagram
            </p>
            <p className="mt-1 text-xs font-medium text-ink/70">
              {tiles.length} posts · 0 highlights
            </p>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/70">
              Profile preview
            </p>
            <p className="mt-1 text-xs font-medium text-ink/70">
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
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/70">
              Account
            </p>
            <button
              type="button"
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border border-ink/20 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/80 transition-colors hover:border-oxblood hover:text-oxblood"
            >
              <Instagram className="h-3.5 w-3.5" /> Connect Instagram
            </button>
            <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-ink/55">
              Paid feature
            </p>
          </div>

          <div className="space-y-3">
            <Toggle
              label="Reels"
              on={reels}
              onChange={setReels}
              help="Includes live posts fetched from Instagram."
            />
            <Toggle
              label="Scheduled dates"
              on={showDates}
              onChange={setShowDates}
              help="Show the scheduled date on each planned tile."
            />
          </div>
        </aside>

        {/* Centre — iPhone mock */}
        <div>
          <div className="mx-auto max-w-[320px] overflow-hidden rounded-[2rem] border border-oxblood/15 bg-white shadow-sm">
            <div className="flex items-center justify-between px-4 pt-3 text-[10px] font-medium text-ink/70">
              <span>9:41</span>
              <span>5G</span>
            </div>
            <div className="flex items-center justify-between px-4 pt-1">
              <span className="text-[13px] font-semibold text-ink">
                {profile.username || "instagram"}
              </span>
              <span className="flex items-center gap-3 text-ink/70">
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
            <div className="px-4 pb-2">
              <p className="text-[12px] font-semibold text-ink">
                {profile.displayName}
              </p>
              {profile.bio && (
                <p className="whitespace-pre-line text-[11px] text-ink/70">
                  {profile.bio}
                </p>
              )}
              {profile.website && (
                <p className="text-[11px] font-medium text-oxblood">
                  {profile.website}
                </p>
              )}
            </div>
            <div className="flex justify-around border-t border-oxblood/10 py-2 text-ink/70">
              <Grid3x3 className="h-4 w-4 text-oxblood" />
              <Play className="h-4 w-4" />
              <UserSquare className="h-4 w-4" />
              <Square className="h-4 w-4" />
            </div>

            {tiles.length === 0 ? (
              <div className="flex flex-col items-center gap-2 border-t border-oxblood/10 px-4 py-12 text-center">
                <ImageIcon className="h-6 w-6 text-ink/45" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/70">
                  Use Add Post above to get started
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-0.5 border-t border-oxblood/10 bg-oxblood/10">
                {tiles.map((t) => (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={() => setDragId(t.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onDrop(t.id)}
                    className="group relative aspect-square cursor-grab active:cursor-grabbing"
                    style={{ backgroundColor: tintFor(t.id) }}
                    title={firstWords(t.caption, 12)}
                  >
                    <span
                      className={`absolute right-1 top-1 h-2 w-2 rounded-full ${STATUS_DOT[t.status]} ring-1 ring-white/70`}
                    />
                    <span className="absolute inset-x-1 bottom-1 line-clamp-2 text-[8.5px] leading-tight text-cream/90">
                      {firstWords(t.caption, 6)}
                    </span>
                  </div>
                ))}
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

          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/70">
              <span>0 assets</span>
              <span className="flex gap-3">
                <span>Filter</span>
                <span>Arrange</span>
              </span>
            </div>
            <div className="mt-2 flex flex-col items-center gap-1 rounded-xl border border-dashed border-oxblood/20 px-4 py-8 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/70">
                No unplaced assets here
              </p>
              <p className="text-[11px] text-ink/60">Drop files here</p>
            </div>
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
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/70">
                  Drafts ({drafts.length})
                </p>
                <Link
                  href={`${base}/studio`}
                  className="text-[11px] font-semibold uppercase tracking-[0.12em] text-oxblood hover:underline"
                >
                  + Carousel
                </Link>
              </div>
              <Column tiles={drafts} empty="No drafts yet" base={base} />
            </div>
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/70">
                Scheduled ({scheduled.length})
              </p>
              <Column tiles={scheduled} empty="Nothing scheduled" base={base} />
            </div>
          </div>
        </div>
      </div>

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
              <label className="text-[11px] font-semibold uppercase tracking-widest text-ink/75">Bio</label>
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
              <button type="button" onClick={() => setEditOpen(false)} className="rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/70 hover:text-oxblood">
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
      <p className="mt-1 text-[10px] text-ink/60">{help}</p>
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
        <p className="text-xs font-medium text-ink/75">
          Files go to <span className="font-semibold text-ink">{clientName}</span> only.
        </p>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-oxblood">
          Expires {mm}:{ss}
        </p>
        <p className="text-[10px] uppercase tracking-[0.14em] text-ink/55">
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
      <p className="text-[10px] text-ink/70">{label}</p>
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
      <label className="text-[11px] font-semibold uppercase tracking-widest text-ink/75">
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
          <button onClick={onClose} className="text-ink/60 hover:text-oxblood" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Column({
  tiles,
  empty,
  base,
}: {
  tiles: GridTile[];
  empty: string;
  base: string;
}) {
  if (tiles.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-oxblood/15 px-3 py-6 text-center text-[11px] font-medium text-ink/60">
        {empty}
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {tiles.map((t) => (
        <Link
          key={t.id}
          href={`${base}/studio`}
          className="flex items-center gap-2 rounded-xl border border-oxblood/10 bg-white p-2 hover:border-oxblood/30"
        >
          <span className="h-9 w-9 shrink-0 rounded-lg" style={{ backgroundColor: tintFor(t.id) }} />
          <span className="line-clamp-2 text-[11px] font-medium text-ink/75">
            {firstWords(t.caption, 8)}
          </span>
        </Link>
      ))}
    </div>
  );
}
