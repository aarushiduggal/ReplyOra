"use client";

import { useMemo, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Plus, Send, X } from "lucide-react";

import type { ClientPost } from "@/lib/social/posts";
import type { ApprovalStatus } from "@/lib/social/approvals";
import { PILLARS, PLATFORMS, PLATFORM_LABEL, type Platform } from "@/lib/social/types";
import {
  createCalendarPostAction,
  updateCalendarPostAction,
  deleteCalendarPostAction,
  sendForApprovalAction,
} from "@/app/(social)/clients/[id]/calendar/actions";
import { GuideTrigger } from "@/components/social/guide";
import { PublishAssist } from "@/components/social/publish-assist";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TABS = ["Planner", "Month", "Spreadsheet", "Approval Queue"] as const;
type Tab = (typeof TABS)[number];

const STATUS_STYLE: Record<ApprovalStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  changes: "bg-rose-100 text-rose-800",
};

function dateKey(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function CalendarWorkspace({
  clientId,
  clientName,
  posts,
  approvals,
  todayISO,
}: {
  clientId: string;
  clientName: string;
  posts: ClientPost[];
  approvals: Record<string, ApprovalStatus>;
  todayISO: string;
}) {
  const parts = todayISO.split("-");
  const todayY = Number(parts[0]);
  const todayM = Number(parts[1]) - 1;
  const todayD = Number(parts[2]);

  const [tab, setTab] = useState<Tab>("Month");
  const [year, setYear] = useState(todayY);
  const [month, setMonth] = useState(todayM);
  const [shareMonth, setShareMonth] = useState(false);
  const [createDate, setCreateDate] = useState<string | null>(null);
  const [publishPost, setPublishPost] = useState<ClientPost | null>(null);
  const [, startTransition] = useTransition();

  function markPosted(p: ClientPost) {
    startTransition(async () => {
      await updateCalendarPostAction(clientId, p.id, { status: "published" });
      setPublishPost(null);
    });
  }

  const postsByDate = useMemo(() => {
    const map = new Map<string, ClientPost[]>();
    for (const p of posts) {
      if (!p.scheduledFor) continue;
      const key = p.scheduledFor.slice(0, 10);
      const arr = map.get(key) ?? [];
      arr.push(p);
      map.set(key, arr);
    }
    return map;
  }, [posts]);

  const monthPosts = useMemo(
    () =>
      posts
        .filter((p) => {
          if (!p.scheduledFor) return false;
          const d = p.scheduledFor.slice(0, 7);
          return d === `${year}-${String(month + 1).padStart(2, "0")}`;
        })
        .sort((a, b) => (a.scheduledFor ?? "").localeCompare(b.scheduledFor ?? "")),
    [posts, year, month],
  );

  const queue = useMemo(
    () => posts.filter((p) => approvals[p.id] === "pending"),
    [posts, approvals],
  );

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  }
  function goToday() {
    setYear(todayY);
    setMonth(todayM);
  }

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      {/* header row */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/85">
          <span className="text-oxblood">( 03 )</span> Calendar
          <GuideTrigger pageKey="calendar" clientId={clientId} />
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/85">
          Tools
        </span>
      </div>

      {/* tabs */}
      <div className="flex flex-wrap gap-5 border-b border-ink/10 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em]">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={
              t === tab
                ? "pb-1 text-oxblood underline decoration-oxblood underline-offset-[7px]"
                : "pb-1 text-ink/80 hover:text-oxblood"
            }
          >
            {t}
          </button>
        ))}
      </div>

      {/* month nav + share */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button type="button" onClick={prevMonth} className="text-ink/85 hover:text-oxblood" aria-label="Previous month">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="font-display text-2xl text-oxblood">
            {MONTHS[month]} {year}
          </span>
          <button type="button" onClick={nextMonth} className="text-ink/85 hover:text-oxblood" aria-label="Next month">
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={goToday}
            className="ml-1 rounded-full border border-ink/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/80 hover:border-oxblood hover:text-oxblood"
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/85">
            Planner items · {monthPosts.length}
          </span>
          <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/80">
            Share month
            <button
              type="button"
              onClick={() => setShareMonth((s) => !s)}
              className={`relative h-5 w-9 rounded-full transition-colors ${shareMonth ? "bg-oxblood" : "bg-ink/20"}`}
            >
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${shareMonth ? "left-[18px]" : "left-0.5"}`} />
            </button>
          </label>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-ink/80">
        {shareMonth
          ? `Shared with ${clientName} — concepts and planned posts appear in their portal automatically.`
          : `Hidden from ${clientName} — add concepts, planned posts, or marketing plans; toggle Share month to reveal them.`}
      </p>

      {/* MONTH */}
      {tab === "Month" && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-ink/10">
          <div className="grid grid-cols-7 border-b border-ink/10 bg-ink/[0.02] text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/85">
            {WEEKDAYS.map((w) => (
              <div key={w} className="px-2 py-2 text-center">{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((d, i) => {
              const key = d ? dateKey(year, month, d) : `blank-${i}`;
              const dayPosts = d ? postsByDate.get(dateKey(year, month, d)) ?? [] : [];
              const isToday =
                d === todayD && month === todayM && year === todayY;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={!d}
                  onClick={() => d && setCreateDate(dateKey(year, month, d))}
                  className={`min-h-[92px] border-b border-r border-ink/10 p-1.5 text-left align-top last:border-r-0 ${d ? "hover:bg-oxblood/[0.04]" : "bg-ink/[0.01]"}`}
                >
                  {d && (
                    <>
                      <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${isToday ? "bg-oxblood text-cream" : "text-ink/85"}`}>
                        {d}
                      </span>
                      <span className="mt-1 flex flex-col gap-1">
                        {dayPosts.slice(0, 3).map((p) => (
                          <span
                            key={p.id}
                            className="truncate rounded bg-oxblood/10 px-1 py-0.5 text-[9px] font-medium text-oxblood"
                          >
                            {p.caption ? p.caption.slice(0, 22) : PLATFORM_LABEL[p.platform]}
                          </span>
                        ))}
                        {dayPosts.length > 3 && (
                          <span className="text-[9px] text-ink/80">
                            +{dayPosts.length - 3} more
                          </span>
                        )}
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* PLANNER */}
      {tab === "Planner" && (
        <div className="mt-6 space-y-2">
          {monthPosts.length === 0 ? (
            <Empty label="No planner items this month. Click a day in Month view to add one." />
          ) : (
            monthPosts.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-ink/10 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {p.caption ? p.caption.slice(0, 60) : "(untitled)"}
                  </p>
                  <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-ink/85">
                    {p.scheduledFor?.slice(0, 10)} · {PLATFORM_LABEL[p.platform]}
                    {p.pillar ? ` · ${p.pillar}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <ApprovalBadge status={approvals[p.id]} />
                  {p.status !== "published" && (
                    <button
                      type="button"
                      onClick={() => setPublishPost(p)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-oxblood px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-cream transition-opacity hover:opacity-90"
                    >
                      <Send className="h-3 w-3" /> Publish
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* SPREADSHEET */}
      {tab === "Spreadsheet" && (
        <div className="mt-6 overflow-x-auto">
          {monthPosts.length === 0 ? (
            <Empty label="Nothing scheduled this month yet." />
          ) : (
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-ink/15 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/85">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Platform</th>
                  <th className="py-2 pr-3">Pillar</th>
                  <th className="py-2 pr-3">Caption</th>
                  <th className="py-2 pr-3">Review</th>
                </tr>
              </thead>
              <tbody>
                {monthPosts.map((p) => (
                  <SpreadsheetRow
                    key={p.id}
                    clientId={clientId}
                    post={p}
                    status={approvals[p.id]}
                    startTransition={startTransition}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* APPROVAL QUEUE */}
      {tab === "Approval Queue" && (
        <div className="mt-6 space-y-2">
          {queue.length === 0 ? (
            <Empty label="No posts awaiting client review." />
          ) : (
            queue.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-ink/10 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {p.caption ? p.caption.slice(0, 60) : "(untitled)"}
                  </p>
                  <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-ink/85">
                    {p.scheduledFor?.slice(0, 10)} · {PLATFORM_LABEL[p.platform]}
                  </p>
                </div>
                <ApprovalBadge status="pending" />
              </div>
            ))
          )}
        </div>
      )}

      {createDate && (
        <CreatePostModal
          clientId={clientId}
          date={createDate}
          onClose={() => setCreateDate(null)}
          startTransition={startTransition}
        />
      )}

      {publishPost && (
        <PublishAssist
          platform={publishPost.platform}
          caption={publishPost.caption}
          hashtags={publishPost.hashtags}
          onClose={() => setPublishPost(null)}
          onPosted={() => markPosted(publishPost)}
        />
      )}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <p className="rounded-xl border border-dashed border-ink/20 px-4 py-10 text-center text-[12px] font-medium text-ink/80">
      {label}
    </p>
  );
}

function ApprovalBadge({ status }: { status?: ApprovalStatus }) {
  if (!status) {
    return (
      <span className="rounded-full bg-ink/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/80">
        Draft
      </span>
    );
  }
  const label =
    status === "pending" ? "In review" : status === "approved" ? "Approved" : "Changes";
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${STATUS_STYLE[status]}`}>
      {label}
    </span>
  );
}

function SpreadsheetRow({
  clientId,
  post,
  status,
  startTransition,
}: {
  clientId: string;
  post: ClientPost;
  status?: ApprovalStatus;
  startTransition: (cb: () => void) => void;
}) {
  const [caption, setCaption] = useState(post.caption);
  return (
    <tr className="border-b border-ink/10 align-top">
      <td className="py-2 pr-3 text-[12px] text-ink/90">{post.scheduledFor?.slice(0, 10)}</td>
      <td className="py-2 pr-3 text-[12px] text-ink/90">{PLATFORM_LABEL[post.platform]}</td>
      <td className="py-2 pr-3 text-[12px] text-ink/90">{post.pillar || "—"}</td>
      <td className="py-2 pr-3">
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          onBlur={() => {
            if (caption !== post.caption)
              startTransition(() =>
                updateCalendarPostAction(clientId, post.id, { caption }),
              );
          }}
          className="w-full min-w-[220px] rounded border border-transparent px-1 py-0.5 text-[12px] text-ink hover:border-ink/15 focus:border-oxblood focus:outline-none"
        />
      </td>
      <td className="py-2 pr-3">
        {status === "pending" ? (
          <ApprovalBadge status="pending" />
        ) : (
          <button
            type="button"
            onClick={() =>
              startTransition(() => sendForApprovalAction(clientId, post.id))
            }
            className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-oxblood hover:underline"
          >
            <Send className="h-3 w-3" /> Send
          </button>
        )}
      </td>
    </tr>
  );
}

function CreatePostModal({
  clientId,
  date,
  onClose,
  startTransition,
}: {
  clientId: string;
  date: string;
  onClose: () => void;
  startTransition: (cb: () => void) => void;
}) {
  const [caption, setCaption] = useState("");
  const [pillar, setPillar] = useState<string>(PILLARS[0]);
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [time, setTime] = useState("09:00");

  function save() {
    const scheduledFor = new Date(`${date}T${time}:00`).toISOString();
    startTransition(() =>
      createCalendarPostAction(clientId, { caption, pillar, platform, scheduledFor }),
    );
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-oxblood/15 bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-xl text-oxblood">New post · {date}</h3>
          <button onClick={onClose} className="text-ink/80 hover:text-oxblood" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-widest text-ink/90">Caption</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              placeholder="What's this post about?"
              className="mt-1 w-full rounded-lg border border-oxblood/20 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-oxblood"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-widest text-ink/90">Pillar</label>
              <select value={pillar} onChange={(e) => setPillar(e.target.value)} className="mt-1 w-full rounded-lg border border-oxblood/20 bg-white px-2 py-2 text-sm text-ink focus:border-oxblood">
                {PILLARS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-widest text-ink/90">Platform</label>
              <select value={platform} onChange={(e) => setPlatform(e.target.value as Platform)} className="mt-1 w-full rounded-lg border border-oxblood/20 bg-white px-2 py-2 text-sm text-ink focus:border-oxblood">
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>{PLATFORM_LABEL[p]}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-widest text-ink/90">Time</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1 w-full rounded-lg border border-oxblood/20 bg-white px-3 py-2 text-sm text-ink focus:border-oxblood" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/85 hover:text-oxblood">
              Cancel
            </button>
            <button type="button" onClick={save} className="inline-flex items-center gap-1.5 rounded-full bg-oxblood px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-cream transition-opacity hover:opacity-90">
              <Plus className="h-3.5 w-3.5" /> Add post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
