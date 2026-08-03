"use server";

import { revalidatePath } from "next/cache";

import { getCurrentWorkspaceId } from "@/lib/auth/session";
import { markGrowthItem } from "@/lib/data/growth";
import { createKnowledgeSource } from "@/lib/data/knowledge";
import { getImpersonation } from "@/lib/admin/access";

async function guard() {
  const imp = await getImpersonation();
  if (imp?.mode === "view") throw new Error("Read-only view.");
  await getCurrentWorkspaceId();
}

/** Fire a growth action (recover / review / reminder / win-back) — stub send. */
export async function fireGrowthAction(
  kind: "abandoned" | "review" | "reminder" | "winback",
  id: string,
  path: string,
): Promise<void> {
  await guard();
  markGrowthItem(kind, id);
  // // TODO: real email/SMS fan-out via the messaging seam.
  revalidatePath(path);
}

/** Continuous retraining: resolve a knowledge gap by adding it to the KB. */
export async function addTrainingAnswer(
  id: string,
  question: string,
  answer: string,
): Promise<{ ok: boolean; error?: string }> {
  await guard();
  try {
    await createKnowledgeSource({
      type: "faq",
      title: question,
      preview: `Q: ${question}\nA: ${answer}`,
    });
    markGrowthItem("training", id);
    revalidatePath("/dashboard/training");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't add that — you may be over your KB limit." };
  }
}
