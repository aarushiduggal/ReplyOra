import { neon } from "@neondatabase/serverless";

import { getCurrentWorkspaceId } from "@/lib/auth/session";
import {
  totalWithTax,
  type BillTo,
  type Invoice,
  type InvoiceStatus,
  type LineItem,
} from "@/lib/social/invoice-types";

/**
 * ReplyOra Social — client invoices (the `invoices` table). Workspace- and
 * client-scoped. Defaults (tax/terms/currency) are inherited from
 * workspace_billing when an invoice is created.
 *
 * Client-safe types & money math live in ./invoice-types (re-exported here).
 */

export * from "@/lib/social/invoice-types";

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

function genId(): string {
  return "inv_" + Math.random().toString(36).slice(2, 10);
}

interface MemInvoice extends Invoice {
  workspaceId: string;
}
const MEM: MemInvoice[] = [];

interface Row {
  id: string;
  client_id: string | null;
  number: string | null;
  issued_at: string | Date | null;
  due_at: string | Date | null;
  status: string;
  currency: string | null;
  line_items: LineItem[] | null;
  bill_to: (BillTo & { taxRate?: number }) | null;
  total_cents: number | null;
}

function toInvoice(r: Row): Invoice {
  const billTo = r.bill_to;
  return {
    id: r.id,
    clientId: r.client_id ?? "",
    number: r.number ?? "",
    issuedAt: r.issued_at ? new Date(r.issued_at).toISOString() : null,
    dueAt: r.due_at ? new Date(r.due_at).toISOString() : null,
    status: (r.status as InvoiceStatus) ?? "draft",
    currency: r.currency ?? "AUD",
    lineItems: r.line_items ?? [],
    billTo: billTo ? { name: billTo.name, email: billTo.email, address: billTo.address } : null,
    totalCents: r.total_cents ?? 0,
    taxRate: billTo?.taxRate ?? 0,
  };
}

export async function listClientInvoices(clientId: string): Promise<Invoice[]> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!hasDb()) {
    return MEM.filter(
      (i) => i.workspaceId === workspaceId && i.clientId === clientId,
    ).sort((a, b) => (b.issuedAt ?? "").localeCompare(a.issuedAt ?? ""));
  }
  const rows = (await sql()`
    SELECT id, client_id, number, issued_at, due_at, status, currency,
           line_items, bill_to, total_cents
    FROM invoices
    WHERE workspace_id = ${workspaceId} AND client_id = ${clientId}
    ORDER BY issued_at DESC NULLS LAST
  `) as Row[];
  return rows.map(toInvoice);
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!hasDb()) {
    const i = MEM.find((x) => x.id === id && x.workspaceId === workspaceId);
    return i ?? null;
  }
  const rows = (await sql()`
    SELECT id, client_id, number, issued_at, due_at, status, currency,
           line_items, bill_to, total_cents
    FROM invoices WHERE workspace_id = ${workspaceId} AND id = ${id} LIMIT 1
  `) as Row[];
  const row = rows[0];
  return row ? toInvoice(row) : null;
}

export async function createInvoice(
  clientId: string,
  input: {
    lineItems: LineItem[];
    dueAt: string | null;
    billTo: BillTo | null;
    currency: string;
    taxRate: number;
  },
): Promise<Invoice> {
  const workspaceId = await getCurrentWorkspaceId();
  const existing = await listClientInvoices(clientId);
  const number = `INV-${String(existing.length + 1).padStart(4, "0")}`;
  const issuedAt = new Date().toISOString();
  const total = totalWithTax(input.lineItems, input.taxRate);
  const billToJson = input.billTo
    ? { ...input.billTo, taxRate: input.taxRate }
    : { name: "", email: "", address: "", taxRate: input.taxRate };

  const invoice: Invoice = {
    id: genId(),
    clientId,
    number,
    issuedAt,
    dueAt: input.dueAt,
    status: "draft",
    currency: input.currency,
    lineItems: input.lineItems,
    billTo: input.billTo,
    totalCents: total,
    taxRate: input.taxRate,
  };

  if (!hasDb()) {
    MEM.push({ ...invoice, workspaceId });
    return invoice;
  }
  await sql()`
    INSERT INTO invoices
      (id, workspace_id, client_id, number, issued_at, due_at, status,
       currency, line_items, bill_to, total_cents)
    VALUES
      (${invoice.id}, ${workspaceId}, ${clientId}, ${number}, ${issuedAt},
       ${input.dueAt}, 'draft', ${input.currency},
       ${JSON.stringify(input.lineItems)}, ${JSON.stringify(billToJson)}, ${total})
  `;
  return invoice;
}

export async function updateInvoiceStatus(
  id: string,
  status: InvoiceStatus,
): Promise<void> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!hasDb()) {
    const i = MEM.find((x) => x.id === id && x.workspaceId === workspaceId);
    if (i) i.status = status;
    return;
  }
  await sql()`
    UPDATE invoices SET status = ${status}
    WHERE workspace_id = ${workspaceId} AND id = ${id}
  `;
}
