import { notFound } from "next/navigation";

import { Wordmark } from "@/components/brand/wordmark";
import { PortalReview } from "@/components/social/portal/portal-review";
import { getPortalData, verifyShareToken } from "@/lib/social/portal";

export const dynamic = "force-dynamic";

export default async function ClientPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const clientId = verifyShareToken(token);
  if (!clientId) notFound();

  const data = await getPortalData(clientId);
  if (!data) notFound();

  return (
    <div className="min-h-screen bg-porcelain text-ink">
      <header className="border-b border-stone/20 bg-blush">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Wordmark href="#" className="text-lg" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/85">
            Review · {data.clientName}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="font-heavy text-[11px] uppercase tracking-[0.2em] text-stone">
          Content review
        </p>
        <h1 className="mt-2 font-display text-3xl text-ink">
          Hi {data.clientName} 👋
        </h1>
        <p className="mt-2 max-w-lg text-sm font-medium text-ink/90">
          Here&apos;s the content we&apos;ve planned for you. Approve what you love, or
          request changes with a note — it updates our studio instantly.
        </p>

        <div className="mt-8">
          <PortalReview token={token} posts={data.posts} approvals={data.approvals} agencyReplies={data.agencyReplies} />
        </div>
      </main>

      {!data.whiteLabel && (
        <footer className="border-t border-stone/20">
          <div className="mx-auto flex max-w-3xl items-center gap-2 px-6 py-6 text-[11px] uppercase tracking-[0.16em] text-stone">
            Powered by <Wordmark asLink={false} className="text-[15px] text-ink" />
          </div>
        </footer>
      )}
    </div>
  );
}
