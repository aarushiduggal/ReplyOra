"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Grid3x3,
  ImageIcon,
  Instagram,
  Play,
  Plus,
  QrCode,
  SlidersHorizontal,
  Square,
  Upload,
  UserSquare,
  X,
} from "lucide-react";

import type { PostStatus } from "@/lib/social/types";
import { Button } from "@/components/ui/button";

export interface GridTile {
  id: string;
  caption: string;
  status: PostStatus;
  pillar: string;
}

interface Profile {
  username: string;
  displayName: string;
  followers: string;
  following: string;
  bio: string;
}

const TINTS = ["#5C1A1A", "#7A2E2A", "#B26B62", "#3F1011", "#8A4A42", "#D9AFA6"];
function tintFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return TINTS[h % TINTS.length] ?? "#5C1A1A";
}
function firstWords(s: string, n = 6): string {
  return s.replace(/\s+/g, " ").trim().split(" ").slice(0, n).join(" ");
}
const STATUS_DOT: Record<PostStatus, string> = {
  draft: "bg-ink/30",
  scheduled: "bg-rose",
  published: "bg-oxblood",
};

export function GridPlanner({
  brand,
  tiles: initial,
  published,
}: {
  brand: string;
  tiles: GridTile[];
  published: number;
}) {
  const [tiles, setTiles] = useState(initial);
  const [dragId, setDragId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    username: brand.toLowerCase().replace(/\s+/g, ""),
    displayName: brand,
    followers: "0",
    following: "0",
    bio: "",
  });

  const drafts = useMemo(() => tiles.filter((t) => t.status === "draft"), [tiles]);
  const scheduled = useMemo(() => tiles.filter((t) => t.status === "scheduled"), [tiles]);

  function onDrop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    setTiles((prev) => {
      const from = prev.findIndex((t) => t.id === dragId);
      const to = prev.findIndex((t) => t.id === targetId);
      if (from < 0 || to < 0) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved!);
      return next;
    });
    setDragId(null);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,320px)_1fr]">
      {/* Left — platform + profile controls */}
      <aside className="space-y-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/75">Platform</p>
          <p className="mt-1 flex items-center gap-2 font-medium text-ink">
            <Instagram className="h-4 w-4 text-oxblood" /> Instagram
          </p>
          <p className="mt-1 text-xs text-ink/85">{published} posts · 0 highlights</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/75">Profile preview</p>
          <p className="mt-1 text-xs text-ink/85">Username, bio, followers &amp; photo shown on the Instagram mock.</p>
          <Button variant="outline" size="sm" className="mt-3 w-full rounded-full" onClick={() => setEditOpen(true)}>
            <SlidersHorizontal className="h-3.5 w-3.5" /> Edit profile preview
          </Button>
        </div>
        <div className="rounded-xl border border-oxblood/10 bg-oat/20 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-roseink">The plan</p>
          <p className="mt-1 text-xs text-ink/80">
            Arrange how the feed will look, then turn each tile into a scheduled
            post. Drag tiles to reorder.
          </p>
        </div>
      </aside>

      {/* Centre — iPhone mock with the grid */}
      <div>
        <div className="mx-auto max-w-[320px] overflow-hidden rounded-[2rem] border border-oxblood/15 bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 pt-3 text-[10px] text-ink/85">
            <span>9:41</span>
            <span>{profile.username || "instagram"}</span>
          </div>
          <div className="flex items-center gap-4 px-4 py-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-oxblood font-wordmark text-lg text-cream">
              {brand.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-1 justify-around text-center">
              <Stat n={String(published)} label="Posts" />
              <Stat n={profile.followers || "0"} label="Followers" />
              <Stat n={profile.following || "0"} label="Following" />
            </div>
          </div>
          <div className="px-4 pb-2">
            <p className="text-[12px] font-semibold text-ink">{profile.displayName}</p>
            {profile.bio && <p className="whitespace-pre-line text-[11px] text-ink/80">{profile.bio}</p>}
          </div>
          {/* tab row */}
          <div className="flex justify-around border-t border-oxblood/10 py-2 text-ink/85">
            <Grid3x3 className="h-4 w-4 text-oxblood" />
            <Play className="h-4 w-4" />
            <Square className="h-4 w-4" />
            <UserSquare className="h-4 w-4" />
          </div>

          {tiles.length === 0 ? (
            <div className="flex flex-col items-center gap-2 border-t border-oxblood/10 px-4 py-12 text-center">
              <ImageIcon className="h-6 w-6 text-ink/65" />
              <p className="text-xs text-ink/85">Add a post to start planning your feed.</p>
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
                  <span className={`absolute right-1 top-1 h-2 w-2 rounded-full ${STATUS_DOT[t.status]} ring-1 ring-white/70`} />
                  <span className="absolute inset-x-1 bottom-1 line-clamp-2 text-[8.5px] leading-tight text-cream/90">
                    {firstWords(t.caption, 6)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-center">
          <Button asChild size="sm" className="rounded-full">
            <Link href="/studio">
              <Plus className="h-4 w-4" /> New post
            </Link>
          </Button>
        </div>
      </div>

      {/* Right — assets + drafts/scheduled */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/75">Assets</p>
          {/* Approvals are per-client (/clients/[id]/approvals) — there is no
              workspace-wide queue, so send them to the roster to pick a client. */}
          <Link href="/clients" className="text-[11px] font-medium uppercase tracking-widest text-oxblood">
            Approval queue →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button asChild variant="outline" size="sm" className="rounded-lg">
            <Link href="/assets"><Upload className="h-3.5 w-3.5" /> Upload assets</Link>
          </Button>
          <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setQrOpen(true)}>
            <QrCode className="h-3.5 w-3.5" /> From phone
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Column title="Drafts" count={drafts.length} tiles={drafts} empty="No drafts yet" />
          <Column title="Scheduled" count={scheduled.length} tiles={scheduled} empty="Nothing scheduled" />
        </div>
      </div>

      {editOpen && (
        <Modal title="Edit profile" onClose={() => setEditOpen(false)}>
          <div className="space-y-4">
            <Field label="Username" value={profile.username} onChange={(v) => setProfile((p) => ({ ...p, username: v }))} placeholder="e.g. yourbrand" />
            <Field label="Display name" value={profile.displayName} onChange={(v) => setProfile((p) => ({ ...p, displayName: v }))} placeholder="e.g. Your Brand" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Followers" value={profile.followers} onChange={(v) => setProfile((p) => ({ ...p, followers: v }))} placeholder="e.g. 10.5K" />
              <Field label="Following" value={profile.following} onChange={(v) => setProfile((p) => ({ ...p, following: v }))} placeholder="e.g. 850" />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-widest text-ink/85">Bio</label>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                rows={3}
                placeholder="A few lines about the brand."
                className="mt-1 w-full rounded-lg border border-oxblood/20 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-oxblood"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={() => setEditOpen(false)}>Save profile</Button>
            </div>
          </div>
        </Modal>
      )}

      {qrOpen && (
        <Modal title="Upload from phone" onClose={() => setQrOpen(false)}>
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <div className="flex h-40 w-40 items-center justify-center rounded-xl border border-oxblood/15 bg-oat/20">
              <QrCode className="h-24 w-24 text-oxblood/70" />
            </div>
            <p className="text-xs text-ink/80">Scan with your phone camera to send photos or videos straight to this brand&apos;s library.</p>
            <p className="text-[11px] uppercase tracking-widest text-ink/75">Connect storage to enable · coming soon</p>
          </div>
        </Modal>
      )}
    </div>
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
      <label className="text-[11px] font-semibold uppercase tracking-widest text-ink/85">{label}</label>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-oxblood/15 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-xl text-oxblood">{title}</h3>
          <button onClick={onClose} className="text-ink/75 hover:text-oxblood">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Column({
  title,
  count,
  tiles,
  empty,
}: {
  title: string;
  count: number;
  tiles: GridTile[];
  empty: string;
}) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/75">
        {title} ({count})
      </p>
      {tiles.length === 0 ? (
        <p className="rounded-xl border border-dashed border-oxblood/15 px-3 py-6 text-center text-[11px] text-ink/75">
          {empty}
        </p>
      ) : (
        <div className="space-y-2">
          {tiles.map((t) => (
            <Link
              key={t.id}
              href="/dashboard/planner"
              className="flex items-center gap-2 rounded-xl border border-oxblood/10 bg-white p-2 hover:border-oxblood/30"
            >
              <span className="h-9 w-9 shrink-0 rounded-lg" style={{ backgroundColor: tintFor(t.id) }} />
              <span className="line-clamp-2 text-[11px] text-ink/85">{firstWords(t.caption, 8)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
