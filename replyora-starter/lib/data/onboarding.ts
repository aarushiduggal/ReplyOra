"use server";

import { cookies } from "next/headers";

import { updateWorkspaceName } from "@/lib/data/workspace";
import { updateBusinessProfile } from "@/lib/data/business-profile";
import { updateAssistant } from "@/lib/data/assistant";
import { createKnowledgeSource } from "@/lib/data/knowledge";
import { ONBOARDED_COOKIE } from "@/lib/data/onboarding-cookie";

async function setOnboardedCookie() {
  const jar = await cookies();
  jar.set(ONBOARDED_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export interface OnboardingInput {
  businessName: string;
  industry: string;
  description: string;
  assistantName: string;
  welcomeMessage: string;
  knowledge: string[];
}

/** Persist the onboarding wizard into the user's real workspace. */
export async function saveOnboarding(input: OnboardingInput): Promise<void> {
  if (input.businessName.trim()) {
    await updateWorkspaceName(input.businessName.trim());
  }
  await updateBusinessProfile({
    industry: input.industry.trim(),
    description: input.description.trim(),
  });
  await updateAssistant({
    name: input.assistantName.trim() || "Assistant",
    welcomeMessage:
      input.welcomeMessage.trim() || "Hi! 👋 How can I help you today?",
  });
  for (const title of input.knowledge.filter((k) => k.trim())) {
    try {
      await createKnowledgeSource({
        type: "text",
        title: title.trim(),
        preview: `${title.trim()} — added during setup. Edit in Knowledge base.`,
      });
    } catch {
      // KB cap or transient error — don't block onboarding completion.
    }
  }
  await setOnboardedCookie();
}

/** "Skip for now" — mark onboarding seen so we don't force it again. */
export async function markOnboarded(): Promise<void> {
  await setOnboardedCookie();
}
