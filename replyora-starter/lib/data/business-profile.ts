import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/auth/session";
import { USE_SUPABASE } from "@/lib/data/mode";

import { DEMO_BUSINESS_PROFILE } from "./seed";
import type { BusinessHours, BusinessProfile } from "./types";

const EMPTY_HOURS: BusinessHours = {
  mon: { open: "09:00", close: "17:00" },
  tue: { open: "09:00", close: "17:00" },
  wed: { open: "09:00", close: "17:00" },
  thu: { open: "09:00", close: "17:00" },
  fri: { open: "09:00", close: "17:00" },
  sat: { open: "", close: "", closed: true },
  sun: { open: "", close: "", closed: true },
};

export async function getBusinessProfile(): Promise<BusinessProfile> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!USE_SUPABASE) return DEMO_BUSINESS_PROFILE;

  const supabase = await createClient();
  const { data } = await supabase
    .from("business_profiles")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  return {
    workspaceId,
    industry: data?.industry ?? "",
    description: data?.description ?? "",
    website: data?.website ?? "",
    phone: data?.phone ?? "",
    email: data?.email ?? "",
    address: data?.address ?? "",
    hours: (data?.hours as BusinessHours) ?? EMPTY_HOURS,
    timezone: data?.timezone ?? "Australia/Sydney",
  };
}

export async function updateBusinessProfile(
  patch: Partial<BusinessProfile>,
): Promise<BusinessProfile> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!USE_SUPABASE) return { ...DEMO_BUSINESS_PROFILE, ...patch };

  const supabase = await createClient();
  await supabase
    .from("business_profiles")
    .update({
      industry: patch.industry,
      description: patch.description,
      website: patch.website,
      phone: patch.phone,
      email: patch.email,
      address: patch.address,
      hours: patch.hours,
      timezone: patch.timezone,
    })
    .eq("workspace_id", workspaceId);

  return { ...(await getBusinessProfile()), ...patch };
}
