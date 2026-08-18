"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";

import {
  deleteClientAction,
  renameClientAction,
} from "@/app/(social)/clients/actions";

/** Rename + delete controls on a client roster row. */
export function DeleteClientButton({
  clientId,
  clientName,
}: {
  clientId: string;
  clientName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function rename() {
    const next = window.prompt("Rename client", clientName);
    if (next === null) return; // cancelled
    const clean = next.trim();
    if (!clean || clean === clientName) return;
    startTransition(async () => {
      await renameClientAction(clientId, clean);
      router.refresh();
    });
  }

  function remove() {
    if (
      !window.confirm(
        `Delete "${clientName}" and all its posts, assets and invoices? This can't be undone.`,
      )
    )
      return;
    startTransition(async () => {
      await deleteClientAction(clientId);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={rename}
        disabled={pending}
        aria-label={`Rename ${clientName}`}
        className="rounded-full p-2 text-ink/35 transition-colors hover:bg-oxblood/10 hover:text-oxblood disabled:opacity-50"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        aria-label={`Delete ${clientName}`}
        className="rounded-full p-2 text-ink/35 transition-colors hover:bg-rose/10 hover:text-roseink disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
