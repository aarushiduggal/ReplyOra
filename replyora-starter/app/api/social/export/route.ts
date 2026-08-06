import { NextResponse } from "next/server";

import { getCurrentUser, getCurrentWorkspaceId } from "@/lib/auth/session";
import { listClients } from "@/lib/social/clients";
import { listClientPosts } from "@/lib/social/posts";
import { listAllInvoices } from "@/lib/social/invoices";
import { listTasks } from "@/lib/social/tasks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/social/export — download every record in the caller's workspace
 * (clients, posts, invoices, tasks) as a single JSON file. Scoped to the
 * authenticated workspace; never trusts a client-supplied id.
 */
export async function GET() {
  let user, workspaceId: string;
  try {
    [user, workspaceId] = await Promise.all([
      getCurrentUser(),
      getCurrentWorkspaceId(),
    ]);
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const clients = await listClients();
  const postsByClient = await Promise.all(
    clients.map(async (c) => ({
      clientId: c.id,
      clientName: c.name,
      posts: await listClientPosts(c.id),
    })),
  );
  const [invoices, tasks] = await Promise.all([listAllInvoices(), listTasks()]);

  const payload = {
    exportedFor: user.email,
    workspaceId,
    generatedNote: "Replyora workspace export",
    clients,
    posts: postsByClient,
    invoices,
    tasks,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="replyora-export.json"`,
    },
  });
}
