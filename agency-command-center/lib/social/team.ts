import { neon } from "@neondatabase/serverless";

/**
 * ReplyOra — Agency team & role model.
 *
 * One agency (per install) has members. Each member has an agency-wide role
 * and can additionally be assigned to specific clients with a per-client role.
 * Permissions are resolved from BOTH: the agency role sets the ceiling, the
 * per-client role can narrow it for a given workspace.
 *
 * Runs against Neon when DATABASE_URL is set; otherwise serves a small in-memory
 * demo team so the Command Center is fully explorable with zero setup.
 */

export type AgencyRole = "owner" | "manager" | "editor" | "viewer";
export type ClientRole = "lead" | "editor" | "viewer";
export type MemberStatus = "active" | "invited" | "disabled";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: AgencyRole;
  avatarUrl: string | null;
  status: MemberStatus;
  weeklyCapacity: number;
  createdAt: string;
}

export interface Assignment {
  clientId: string;
  memberId: string;
  roleOnClient: ClientRole;
}

/* ───────────────────────────  permissions  ─────────────────────────── */

export type Capability =
  | "view"
  | "create_content"
  | "send_for_approval"
  | "publish"
  | "manage_billing"
  | "manage_clients"
  | "manage_team";

const AGENCY_MATRIX: Record<AgencyRole, Capability[]> = {
  owner: [
    "view", "create_content", "send_for_approval", "publish",
    "manage_billing", "manage_clients", "manage_team",
  ],
  manager: [
    "view", "create_content", "send_for_approval", "publish",
    "manage_billing", "manage_clients",
  ],
  editor: ["view", "create_content", "send_for_approval"],
  viewer: ["view"],
};

/** Agency-wide capability check. */
export function can(role: AgencyRole, cap: Capability): boolean {
  return AGENCY_MATRIX[role]?.includes(cap) ?? false;
}

/** Effective capability for a member ON a specific client (role intersection). */
export function canOnClient(
  agencyRole: AgencyRole,
  clientRole: ClientRole | null,
  cap: Capability,
): boolean {
  if (!can(agencyRole, cap)) return false;
  if (!clientRole) return agencyRole === "owner" || agencyRole === "manager";
  const CLIENT_MATRIX: Record<ClientRole, Capability[]> = {
    lead: ["view", "create_content", "send_for_approval", "publish"],
    editor: ["view", "create_content", "send_for_approval"],
    viewer: ["view"],
  };
  return CLIENT_MATRIX[clientRole].includes(cap);
}

export const ROLE_LABEL: Record<AgencyRole, string> = {
  owner: "Owner",
  manager: "Manager",
  editor: "Editor",
  viewer: "Viewer",
};

/* ─────────────────────────────  storage  ──────────────────────────── */

const AGENCY_ID = "default";
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

/* demo team — shown when there is no DB */
const DEMO_TEAM: TeamMember[] = [
  { id: "tm_amara", name: "Amara Nguyen", email: "amara@coastalglow.com.au", role: "owner", avatarUrl: null, status: "active", weeklyCapacity: 20, createdAt: iso(-120) },
  { id: "tm_jde", name: "Jordan De Luca", email: "jordan@replyora.studio", role: "manager", avatarUrl: null, status: "active", weeklyCapacity: 30, createdAt: iso(-90) },
  { id: "tm_mia", name: "Mia Rossi", email: "mia@replyora.studio", role: "editor", avatarUrl: null, status: "active", weeklyCapacity: 35, createdAt: iso(-60) },
  { id: "tm_sam", name: "Sam Whitfield", email: "sam@replyora.studio", role: "editor", avatarUrl: null, status: "invited", weeklyCapacity: 25, createdAt: iso(-14) },
];

const DEMO_ASSIGNMENTS: Assignment[] = [
  { clientId: "cl_demo_bloom", memberId: "tm_mia", roleOnClient: "lead" },
  { clientId: "cl_demo_bloom", memberId: "tm_jde", roleOnClient: "editor" },
];

function iso(daysFromNow: number): string {
  return new Date(Date.now() + daysFromNow * 864e5).toISOString();
}

/* ─────────────────────────────  queries  ──────────────────────────── */

export async function listMembers(): Promise<TeamMember[]> {
  if (!hasDb()) return DEMO_TEAM;
  const rows = (await sql()`
    SELECT id, name, email, role, avatar_url, status, weekly_capacity, created_at
    FROM team_members WHERE agency_id = ${AGENCY_ID}
    ORDER BY (role = 'owner') DESC, name ASC
  `) as Record<string, unknown>[];
  return rows.map(mapMember);
}

export async function listAssignments(): Promise<Assignment[]> {
  if (!hasDb()) return DEMO_ASSIGNMENTS;
  const rows = (await sql()`
    SELECT client_id, member_id, role_on_client FROM client_assignments
  `) as Record<string, unknown>[];
  return rows.map((r) => ({
    clientId: String(r.client_id),
    memberId: String(r.member_id),
    roleOnClient: (r.role_on_client as ClientRole) ?? "editor",
  }));
}

export async function addMember(input: {
  name: string;
  email: string;
  role: AgencyRole;
  weeklyCapacity?: number;
}): Promise<TeamMember> {
  const id = "tm_" + Math.random().toString(36).slice(2, 10);
  const member: TeamMember = {
    id,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    role: input.role,
    avatarUrl: null,
    status: "invited",
    weeklyCapacity: input.weeklyCapacity ?? 25,
    createdAt: new Date().toISOString(),
  };
  if (!hasDb()) return member;
  await sql()`
    INSERT INTO team_members (id, agency_id, name, email, role, status, weekly_capacity)
    VALUES (${id}, ${AGENCY_ID}, ${member.name}, ${member.email}, ${member.role},
            'invited', ${member.weeklyCapacity})
    ON CONFLICT (agency_id, email) DO UPDATE
      SET name = EXCLUDED.name, role = EXCLUDED.role
  `;
  return member;
}

export async function setMemberRole(memberId: string, role: AgencyRole): Promise<void> {
  if (!hasDb()) return;
  await sql()`UPDATE team_members SET role = ${role} WHERE id = ${memberId}`;
}

export async function assignToClient(
  clientId: string,
  memberId: string,
  roleOnClient: ClientRole,
): Promise<void> {
  if (!hasDb()) return;
  await sql()`
    INSERT INTO client_assignments (client_id, member_id, role_on_client)
    VALUES (${clientId}, ${memberId}, ${roleOnClient})
    ON CONFLICT (client_id, member_id) DO UPDATE SET role_on_client = ${roleOnClient}
  `;
}

export async function unassignFromClient(clientId: string, memberId: string): Promise<void> {
  if (!hasDb()) return;
  await sql()`DELETE FROM client_assignments WHERE client_id = ${clientId} AND member_id = ${memberId}`;
}

function mapMember(r: Record<string, unknown>): TeamMember {
  return {
    id: String(r.id),
    name: String(r.name),
    email: String(r.email),
    role: (r.role as AgencyRole) ?? "editor",
    avatarUrl: (r.avatar_url as string) ?? null,
    status: (r.status as MemberStatus) ?? "active",
    weeklyCapacity: Number(r.weekly_capacity ?? 25),
    createdAt: new Date(String(r.created_at)).toISOString(),
  };
}
