"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { deleteClientAction } from "@/app/(social)/clients/actions";

/** Small trash button on a client roster row. Confirms, then removes the client. */
export function DeleteClientButton({
  clientId,
  clientName,
}: {
  clientId: string;
  clientName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

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
    <button
      type="button"
      onClick={remove}
      disabled={pending}
      aria-label={`Delete ${clientName}`}
      className="rounded-full p-2 text-ink/35 transition-colors hover:bg-rose/10 hover:text-rose disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
