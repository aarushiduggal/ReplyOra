import { getAssistant } from "@/lib/data/assistant";
import { getWorkspace } from "@/lib/data/workspace";
import { isEntitled } from "@/lib/data/entitlement";
import { hasFeature } from "@/lib/usage";
import { PageHeader } from "@/components/dashboard/page-header";
import { AssistantConfig } from "@/components/dashboard/assistant-config";
import { Paywall } from "@/components/dashboard/paywall";

export default async function AssistantPage() {
  const [assistant, workspace] = await Promise.all([
    getAssistant(),
    getWorkspace(),
  ]);

  return (
    <div>
      <PageHeader
        title="Assistant"
        description="Shape your assistant's persona and branding, then test it live."
      />
      <div className="p-6">
        {isEntitled(workspace) ? (
          <AssistantConfig
            assistant={assistant}
            businessName={workspace.name}
            canRemoveBranding={hasFeature(workspace.plan, "removeBranding")}
          />
        ) : (
          <Paywall feature="your assistant" current={workspace.plan} />
        )}
      </div>
    </div>
  );
}
