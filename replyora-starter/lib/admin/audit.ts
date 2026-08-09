import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { USE_SUPABASE } from "@/lib/data/mode";
import { mockState } from "@/lib/admin/mock-state";

/**
 * Staff audit trail. EVERY staff view/edit in /admin is recorded here
 * (who, which workspace, what action) — see ADMIN_PORTAL.md security rules.
 *
 * LIVE: rows are written to public.audit_logs (from 0001) via the service role.
 * MOCK: an in-memory ring buffer so the audit viewer works locally.
 */

export interface AuditEntry {
  id: string;
  actorId: string;
  actorName: string;
  workspaceId: string | null;
  workspaceName: string | null;
  action: string;
  target: string | null;
  createdAt: string;
}

interface LogInput {
  actorId: string;
  actorName: string;
  workspaceId?: string | null;
  workspaceName?: string | null;
  action: string;
  target?: string | null;
  metadata?: Record<string, unknown>;
}

// Mock ring buffer lives on the process-global store (shared across dev bundles).
const MOCK_AUDIT = mockState.audit;

let seq = 0;

export async function logAdminAction(input: LogInput): Promise<void> {
  const entry: AuditEntry = {
    id: `aud_${Date.now()}_${seq++}`,
    actorId: input.actorId,
    actorName: input.actorName,
    workspaceId: input.workspaceId ?? null,
    workspaceName: input.workspaceName ?? null,
    action: input.action,
    target: input.target ?? null,
    // createdAt is stamped by the DB in live mode; here we use ISO now.
    createdAt: new Date().toISOString(),
  };

  if (!USE_SUPABASE) {
    MOCK_AUDIT.unshift(entry);
    if (MOCK_AUDIT.length > 500) MOCK_AUDIT.pop();
    return;
  }

  try {
    const admin = createAdminClient();
    await admin.from("audit_logs").insert({
      workspace_id: input.workspaceId ?? null,
      actor_id: input.actorId,
      action: input.action,
      target: input.target ?? null,
      metadata: {
        ...(input.metadata ?? {}),
        actor_name: input.actorName,
        workspace_name: input.workspaceName ?? null,
        via: "admin_portal",
      },
    });
  } catch {
    // Never let an audit-write failure block a staff action; surface later.
  }
}

export interface AuditFilter {
  actorId?: string;
  workspaceId?: string;
  action?: string;
  limit?: number;
}

export async function listAuditLogs(
  filter: AuditFilter = {},
): Promise<AuditEntry[]> {
  const limit = filter.limit ?? 100;

  if (!USE_SUPABASE) {
    // No Neon-backed audit store yet — return empty in prod (never the seed
    // "Coastal Glow / Jordan Lee" entries); keep the mock for local dev.
    if (process.env.NODE_ENV === "production") return [];
    return MOCK_AUDIT.filter(
      (e) =>
        (!filter.actorId || e.actorId === filter.actorId) &&
        (!filter.workspaceId || e.workspaceId === filter.workspaceId) &&
        (!filter.action || e.action.includes(filter.action)),
    ).slice(0, limit);
  }

  try {
    const admin = createAdminClient();
    let query = admin
      .from("audit_logs")
      .select("id, workspace_id, actor_id, action, target, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (filter.workspaceId) query = query.eq("workspace_id", filter.workspaceId);
    if (filter.actorId) query = query.eq("actor_id", filter.actorId);
    const { data } = await query;
    return (data ?? []).map((r) => {
      const meta = (r.metadata ?? {}) as Record<string, unknown>;
      return {
        id: r.id as string,
        actorId: (r.actor_id as string) ?? "",
        actorName: (meta.actor_name as string) ?? "Staff",
        workspaceId: (r.workspace_id as string) ?? null,
        workspaceName: (meta.workspace_name as string) ?? null,
        action: (r.action as string) ?? "",
        target: (r.target as string) ?? null,
        createdAt: r.created_at as string,
      };
    });
  } catch {
    return [];
  }
}
