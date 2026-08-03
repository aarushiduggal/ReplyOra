import { getBusinessProfile } from "@/lib/data/business-profile";
import { PageHeader } from "@/components/dashboard/page-header";
import { BusinessProfileForm } from "@/components/dashboard/business-profile-form";

export default async function BusinessProfilePage() {
  const profile = await getBusinessProfile();

  return (
    <div>
      <PageHeader
        title="Business profile"
        description="The facts your assistant uses to answer — hours, contact details and what you do."
      />
      <div className="mx-auto max-w-4xl p-6">
        <BusinessProfileForm profile={profile} />
      </div>
    </div>
  );
}
