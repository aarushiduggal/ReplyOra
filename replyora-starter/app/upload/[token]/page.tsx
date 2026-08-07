import { AlertCircle } from "lucide-react";

import { PhoneUploader } from "@/components/social/phone-uploader";
import { verifyUploadToken } from "@/lib/social/upload-token";

export const dynamic = "force-dynamic";

/**
 * Public "upload from phone" page. Reached by scanning the QR the agency shows
 * in the grid. No login — the signed token in the URL scopes uploads to one
 * client's library and expires after 30 minutes.
 */
export default async function PhoneUploadPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const claim = verifyUploadToken(token);

  if (!claim) {
    return (
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <AlertCircle className="h-9 w-9 text-rose-600" />
        <h1 className="font-display text-2xl text-oxblood">Link expired</h1>
        <p className="text-sm text-ink/70">
          This upload link is no longer valid. Ask for a fresh QR code from the
          Replyora dashboard and scan it again.
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-cream text-ink">
      <PhoneUploader token={token} />
    </main>
  );
}
