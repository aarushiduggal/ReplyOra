/**
 * ReplyOra Social — client-safe invoice types & money math.
 * No server-only imports, so client components can use these directly.
 * lib/social/invoices.ts re-exports all of this and adds the Neon functions.
 */

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

export interface LineItem {
  description: string;
  quantity: number;
  unitCents: number;
}

export interface BillTo {
  name: string;
  email: string;
  address: string;
}

export interface Invoice {
  id: string;
  clientId: string;
  number: string;
  issuedAt: string | null;
  dueAt: string | null;
  status: InvoiceStatus;
  currency: string;
  lineItems: LineItem[];
  billTo: BillTo | null;
  totalCents: number;
  taxRate: number;
}

export function subtotalCents(items: LineItem[]): number {
  return items.reduce((sum, i) => sum + Math.round(i.quantity * i.unitCents), 0);
}

export function totalWithTax(items: LineItem[], taxRate: number): number {
  const sub = subtotalCents(items);
  return Math.round(sub * (1 + taxRate / 100));
}
