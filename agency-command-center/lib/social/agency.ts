import { neon } from "@neondatabase/serverless";

import { listMembers, listAssignments, type TeamMember } from "@/lib/social/team";
import { listRetainers, monthlyValueCents, type Retainer } from "@/lib/social/retainers";

/**
 * ReplyOra — Agency Command Center engine.
 *
 * Aggregates across EVERY client so the agency has one place that answers:
 *   • Who needs content this week? (runway = days of scheduled posts left)
 *   • What's at risk? (empty queue, approvals overdue, invoice past due, gone quiet)
 *   • What's the team's load? (capacity vs assigned work)
 *   • What's the money doing? (MRR from retainers, outstanding)
 *
 * DB-backed via Neon when DATABASE_URL is set; otherwise a rich demo agency is
 * synthesised so the whole surface is explorable with zero setup.
 */

const RUNWAY_WARN_DAYS = 5;      // < this many days of scheduled content = "needs content"
const QUIET_DAYS = 14;           // no published post in this many days = "gone quiet"
const APPROVAL_DUE_DAYS = 3;     // post due within N days but still awaiting client = overdue

export type RiskKind =
  | "empty_queue"
  | "low_runway"
  | "approval_overdue"
  | "invoice_overdue"
  | "gone_quiet"
  | "unassigned";

export interface RiskFlag {
  kind: RiskKind;
  label: string;
  severity: "high" | "medium" | "low";
  detail: string;
}

export type Health = "healthy" | "watch" | "at_risk";

export interface AgencyClientRow {
  clientId: string;
  clientName: string;
  scheduledCount: number;      // future scheduled posts
  draftCount: number;
  inReviewCount: number;
  runwayDays: number;          // days until the queue runs dry
  nextPostAt: string | null;
  lastPublishedAt: string | null;
  outstandingCents: number;
  pastDueCents: number;
  assignees: { id: string; name: string; roleOnClient: string }[];
  retainerMonthlyCents: number;
  health: Health;
  healthScore: number;         // 0–100
  risks: RiskFlag[];
}

export interface CapacityRow {
  member: TeamMember;
  clientCount: number;
  postsThisWeek: number;       // drafts + scheduled in next 7 days on their clients
  openTasks: number;
  loadPct: number;             // postsThisWeek / weeklyCapacity
}

export interface AgencyKpis {
  clients: number;
  needsContent: number;
  atRisk: number;
  scheduledNext7: number;
  mrrCents: number;
  outstandingCents: number;
  pastDueCents: number;
}

export interface AgencyOverview {
  kpis: AgencyKpis;
  clients: AgencyClientRow[];
  capacity: CapacityRow[];
  generatedAt: string;
}

/* ─────────────────────────────  storage  ──────────────────────────── */

const hasDb = (): boolean => Boolean(process.env.DATABASE_URL);
let _sql: ReturnType<typeof neon> | null = null;
function sql() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    _sql = neon(url);
  }
  return _sql;
}

const now = () => Date.now();
const daysBetween = (a: number, b: number) => Math.round((a - b) / 864e5);

/* ───────────────────────────  public API  ─────────────────────────── */

export async function getAgencyOverview(): Promise<AgencyOverview> {
  const [members, assignments, retainers] = await Promise.all([
    listMembers(),
    listAssignments(),
    listRetainers(),
  ]);

  const rows = hasDb()
    ? await buildFromDb(members, assignments, retainers)
    : buildDemo(members, assignments, retainers);

  const clients = rows.map(scoreClient);

  const kpis: AgencyKpis = {
    clients: clients.length,
    needsContent: clients.filter((c) => c.runwayDays < RUNWAY_WARN_DAYS).length,
    atRisk: clients.filter((c) => c.health === "at_risk").length,
    scheduledNext7: clients.reduce((s, c) => s + upcoming7(c), 0),
    mrrCents: retainers
      .filter((r) => r.status === "active")
      .reduce((s, r) => s + monthlyValueCents(r), 0),
    outstandingCents: clients.reduce((s, c) => s + c.outstandingCents, 0),
    pastDueCents: clients.reduce((s, c) => s + c.pastDueCents, 0),
  };

  const capacity = buildCapacity(members, assignments, clients);

  // Sort the worst first — that's what a command center is for.
  clients.sort((a, b) => a.healthScore - b.healthScore);

  return { kpis, clients, capacity, generatedAt: new Date().toISOString() };
}

/* ───────────────────────────  scoring  ────────────────────────────── */

type RawRow = Omit<AgencyClientRow, "health" | "healthScore" | "risks">;

function scoreClient(r: RawRow): AgencyClientRow {
  const risks: RiskFlag[] = [];
  const t = now();

  if (r.scheduledCount === 0) {
    risks.push({ kind: "empty_queue", label: "Empty queue", severity: "high", detail: "No scheduled posts — nothing will go out." });
  } else if (r.runwayDays < RUNWAY_WARN_DAYS) {
    risks.push({ kind: "low_runway", label: `${r.runwayDays}d of content left`, severity: "medium", detail: `Queue runs dry in ${r.runwayDays} day${r.runwayDays === 1 ? "" : "s"}.` });
  }
  if (r.inReviewCount > 0 && r.nextPostAt && daysBetween(new Date(r.nextPostAt).getTime(), t) <= APPROVAL_DUE_DAYS) {
    risks.push({ kind: "approval_overdue", label: "Approval overdue", severity: "high", detail: `${r.inReviewCount} post${r.inReviewCount === 1 ? "" : "s"} awaiting the client and due soon.` });
  }
  if (r.pastDueCents > 0) {
    risks.push({ kind: "invoice_overdue", label: "Invoice past due", severity: "medium", detail: `$${(r.pastDueCents / 100).toLocaleString("en-AU")} past due.` });
  }
  if (r.lastPublishedAt && daysBetween(t, new Date(r.lastPublishedAt).getTime()) > QUIET_DAYS) {
    const d = daysBetween(t, new Date(r.lastPublishedAt).getTime());
    risks.push({ kind: "gone_quiet", label: "Gone quiet", severity: "low", detail: `No post in ${d} days.` });
  }
  if (r.assignees.length === 0) {
    risks.push({ kind: "unassigned", label: "Unassigned", severity: "low", detail: "No team member owns this client." });
  }

  const weight: Record<RiskFlag["severity"], number> = { high: 34, medium: 18, low: 8 };
  const score = Math.max(0, 100 - risks.reduce((s, f) => s + weight[f.severity], 0));
  const health: Health = score >= 80 ? "healthy" : score >= 55 ? "watch" : "at_risk";

  return { ...r, risks, healthScore: score, health };
}

function upcoming7(c: AgencyClientRow): number {
  return c.nextPostAt ? Math.min(c.scheduledCount, Math.max(0, 7 - Math.max(0, daysBetween(new Date(c.nextPostAt).getTime(), now())))) : 0;
}

/* ───────────────────────────  capacity  ───────────────────────────── */

function buildCapacity(members: TeamMember[], assignments: { clientId: string; memberId: string }[], clients: AgencyClientRow[]): CapacityRow[] {
  const byClient = new Map(clients.map((c) => [c.clientId, c]));
  return members
    .filter((m) => m.status !== "disabled")
    .map((m) => {
      const mine = assignments.filter((a) => a.memberId === m.id);
      const postsThisWeek = mine.reduce((s, a) => {
        const c = byClient.get(a.clientId);
        return s + (c ? c.draftCount + upcoming7(c) : 0);
      }, 0);
      const loadPct = m.weeklyCapacity > 0 ? Math.round((postsThisWeek / m.weeklyCapacity) * 100) : 0;
      return { member: m, clientCount: mine.length, postsThisWeek, openTasks: 0, loadPct };
    })
    .sort((a, b) => b.loadPct - a.loadPct);
}

/* ─────────────────────────────  DB build  ─────────────────────────── */

async function buildFromDb(members: TeamMember[], assignments: { clientId: string; memberId: string; roleOnClient: string }[], _retainers: Retainer[]): Promise<RawRow[]> {
  const clientRows = (await sql()`SELECT id, name FROM clients ORDER BY name ASC`) as { id: string; name: string }[];

  // Post aggregates per client in one pass.
  const postRows = (await sql()`
    SELECT client_id, status, scheduled_for
    FROM social_posts
  `) as { client_id: string | null; status: string; scheduled_for: string | Date | null }[];

  // Approvals still pending (in review) per client.
  const reviewRows = (await sql()`
    SELECT p.client_id, COUNT(*)::int AS n
    FROM approvals a JOIN social_posts p ON p.id = a.post_id
    WHERE a.status = 'pending'
    GROUP BY p.client_id
  `) as { client_id: string; n: number }[];
  const inReview = new Map(reviewRows.map((r) => [r.client_id, r.n]));

  // Invoices are best-effort — the schema may vary between installs.
  const outstanding = new Map<string, { out: number; past: number }>();
  try {
    const inv = (await sql()`
      SELECT client_id,
             COALESCE(SUM(CASE WHEN status <> 'paid' THEN amount_cents ELSE 0 END),0)::int AS out,
             COALESCE(SUM(CASE WHEN status <> 'paid' AND due_date < NOW() THEN amount_cents ELSE 0 END),0)::int AS past
      FROM invoices GROUP BY client_id
    `) as { client_id: string; out: number; past: number }[];
    for (const r of inv) outstanding.set(r.client_id, { out: r.out, past: r.past });
  } catch {
    /* invoices table/columns differ — treat as $0 outstanding */
  }

  const retMonthly = new Map<string, number>();
  for (const r of _retainers) retMonthly.set(r.clientId, (retMonthly.get(r.clientId) ?? 0) + (r.status === "active" ? monthlyValueCents(r) : 0));

  const memberById = new Map(members.map((m) => [m.id, m]));
  const assignByClient = new Map<string, { id: string; name: string; roleOnClient: string }[]>();
  for (const a of assignments) {
    const m = memberById.get(a.memberId);
    if (!m) continue;
    const arr = assignByClient.get(a.clientId) ?? [];
    arr.push({ id: m.id, name: m.name, roleOnClient: a.roleOnClient });
    assignByClient.set(a.clientId, arr);
  }

  const t = now();
  return clientRows.map((c) => {
    const posts = postRows.filter((p) => p.client_id === c.id);
    const futureSched = posts
      .filter((p) => p.status === "scheduled" && p.scheduled_for && new Date(p.scheduled_for).getTime() >= t)
      .map((p) => new Date(p.scheduled_for as string).getTime())
      .sort((a, b) => a - b);
    const published = posts
      .filter((p) => p.status === "published" && p.scheduled_for)
      .map((p) => new Date(p.scheduled_for as string).getTime())
      .sort((a, b) => b - a);
    const inv = outstanding.get(c.id) ?? { out: 0, past: 0 };
    return {
      clientId: c.id,
      clientName: c.name,
      scheduledCount: futureSched.length,
      draftCount: posts.filter((p) => p.status === "draft").length,
      inReviewCount: inReview.get(c.id) ?? 0,
      runwayDays: futureSched.length ? Math.max(0, daysBetween(futureSched[futureSched.length - 1]!, t)) : 0,
      nextPostAt: futureSched.length ? new Date(futureSched[0]!).toISOString() : null,
      lastPublishedAt: published.length ? new Date(published[0]!).toISOString() : null,
      outstandingCents: inv.out,
      pastDueCents: inv.past,
      assignees: assignByClient.get(c.id) ?? [],
      retainerMonthlyCents: retMonthly.get(c.id) ?? 0,
    };
  });
}

/* ────────────────────────────  demo build  ────────────────────────── */

function buildDemo(members: TeamMember[], assignments: { clientId: string; memberId: string; roleOnClient: string }[], retainers: Retainer[]): RawRow[] {
  const byId = new Map(members.map((m) => [m.id, m]));
  const asg = (clientId: string) =>
    assignments.filter((a) => a.clientId === clientId).flatMap((a) => {
      const m = byId.get(a.memberId);
      return m ? [{ id: m.id, name: m.name, roleOnClient: a.roleOnClient }] : [];
    });
  const ret = (clientId: string) =>
    retainers.filter((r) => r.clientId === clientId && r.status === "active").reduce((s, r) => s + monthlyValueCents(r), 0);

  const d = (n: number) => new Date(now() + n * 864e5).toISOString();
  return [
    { clientId: "cl_demo_bloom", clientName: "Bloom Hair Studio", scheduledCount: 6, draftCount: 3, inReviewCount: 2, runwayDays: 9, nextPostAt: d(1), lastPublishedAt: d(-2), outstandingCents: 0, pastDueCents: 0, assignees: asg("cl_demo_bloom"), retainerMonthlyCents: ret("cl_demo_bloom") || 120000 },
    { clientId: "cl_demo_coastal", clientName: "Coastal Glow Skin", scheduledCount: 1, draftCount: 0, inReviewCount: 3, runwayDays: 2, nextPostAt: d(1), lastPublishedAt: d(-4), outstandingCents: 88000, pastDueCents: 88000, assignees: asg("cl_demo_coastal"), retainerMonthlyCents: ret("cl_demo_coastal") || 90000 },
    { clientId: "cl_demo_marlowe", clientName: "Marlowe & Co", scheduledCount: 0, draftCount: 1, inReviewCount: 0, runwayDays: 0, nextPostAt: null, lastPublishedAt: d(-19), outstandingCents: 0, pastDueCents: 0, assignees: [], retainerMonthlyCents: ret("cl_demo_marlowe") || 60000 },
    { clientId: "cl_demo_fern", clientName: "Fern & Fig Café", scheduledCount: 12, draftCount: 4, inReviewCount: 0, runwayDays: 21, nextPostAt: d(1), lastPublishedAt: d(-1), outstandingCents: 0, pastDueCents: 0, assignees: asg("cl_demo_fern"), retainerMonthlyCents: ret("cl_demo_fern") || 150000 },
  ];
}
