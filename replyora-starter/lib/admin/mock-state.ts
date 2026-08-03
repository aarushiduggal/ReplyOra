import "server-only";

import { DEMO_KNOWLEDGE_SOURCES } from "@/lib/data/seed";
import type { KnowledgeSource } from "@/lib/data/types";

/**
 * Process-global mock state for the staff portal (local/dev only).
 *
 * Next dev compiles page renders and server actions into separate bundles that
 * don't share plain module-level `let`s — so a staff edit wouldn't appear on
 * the client's dashboard. Pinning the store to `globalThis` shares it across
 * every bundle in the one Node process, so edit-on-behalf propagates and the
 * audit trail is consistent. In LIVE mode none of this is used — the service
 * role writes to the real Supabase tables.
 */

export interface MockAuditEntry {
  id: string;
  actorId: string;
  actorName: string;
  workspaceId: string | null;
  workspaceName: string | null;
  action: string;
  target: string | null;
  createdAt: string;
}

export interface WaitlistEntry {
  id: string;
  email: string;
  /** Which upcoming feature they raised their hand for, e.g. "voice". */
  feature: string;
  /** Where the signup came from, e.g. "roadmap" | "dashboard". */
  source: string;
  createdAt: string;
}

interface MockState {
  audit: MockAuditEntry[];
  kb: Record<string, KnowledgeSource[]>;
  waitlist: WaitlistEntry[];
}

const g = globalThis as unknown as { __replyoraMock?: MockState };

if (!g.__replyoraMock) {
  g.__replyoraMock = {
    audit: [
      {
        id: "aud_seed_1",
        actorId: "user_demo_owner",
        actorName: "Aarushi",
        workspaceId: "ws_demo",
        workspaceName: "Coastal Glow Skin Clinic",
        action: "client.view",
        target: "overview",
        createdAt: "2026-06-30T22:05:00.000Z",
      },
      {
        id: "aud_seed_2",
        actorId: "user_demo_owner",
        actorName: "Aarushi",
        workspaceId: "ws_northside",
        workspaceName: "Northside Physio",
        action: "service.update.logged",
        target: "90-day refresh",
        createdAt: "2026-06-29T04:12:00.000Z",
      },
    ],
    // ws_demo seeded from the demo client's sources so staff edits propagate to
    // the same list the client dashboard reads (see lib/data/knowledge.ts).
    kb: { ws_demo: [...DEMO_KNOWLEDGE_SOURCES] },
    // A couple of seeded voice-waitlist signups so the admin view isn't empty
    // in local/mock mode.
    waitlist: [
      {
        id: "wl_seed_1",
        email: "mitch@peakplumbing.com.au",
        feature: "voice",
        source: "roadmap",
        createdAt: "2026-06-28T09:14:00.000Z",
      },
      {
        id: "wl_seed_2",
        email: "hello@northsidephysio.com.au",
        feature: "voice",
        source: "roadmap",
        createdAt: "2026-06-30T21:02:00.000Z",
      },
    ],
  };
}

export const mockState = g.__replyoraMock;

export function mockKb(workspaceId: string): KnowledgeSource[] {
  if (!mockState.kb[workspaceId]) mockState.kb[workspaceId] = [];
  return mockState.kb[workspaceId]!;
}
