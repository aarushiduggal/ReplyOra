"use server";

import { revalidatePath } from "next/cache";

import {
  createInvoice,
  updateInvoiceStatus,
  type BillTo,
  type InvoiceStatus,
  type LineItem,
} from "@/lib/social/invoices";

export async function createInvoiceAction(
  clientId: string,
  input: {
    lineItems: LineItem[];
    dueAt: string | null;
    billTo: BillTo | null;
    currency: string;
    taxRate: number;
  },
): Promise<void> {
  await createInvoice(clientId, input);
  revalidatePath(`/clients/${clientId}/invoices`);
}

export async function updateInvoiceStatusAction(
  clientId: string,
  id: string,
  status: InvoiceStatus,
): Promise<void> {
  await updateInvoiceStatus(id, status);
  revalidatePath(`/clients/${clientId}/invoices`);
}
