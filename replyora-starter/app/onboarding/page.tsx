import { OnboardingWizard } from "@/components/dashboard/onboarding-wizard";

/**
 * First-run onboarding wizard (shown after signup). Full-screen — no dashboard
 * chrome. Guides business profile → knowledge → assistant → install, with
 * niche quick-start templates.
 */
export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-cream">
      <OnboardingWizard />
    </div>
  );
}
