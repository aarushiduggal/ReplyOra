"use client";

import { useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, Check, AlertCircle } from "lucide-react";

type Status = "idle" | "uploading" | "done" | "error";

/** Mobile-first uploader shown at /upload/<token> after a QR scan. */
export function PhoneUploader({ token }: { token: string }) {
  const camRef = useRef<HTMLInputElement>(null);
  const libRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setStatus("uploading");
    setError(null);
    setTotal(files.length);
    setDone(0);
    let ok = 0;
    for (const file of Array.from(files)) {
      const form = new FormData();
      form.set("token", token);
      form.set("file", file);
      try {
        const res = await fetch("/api/social/assets/phone-upload", {
          method: "POST",
          body: form,
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          if (data.error === "invalid_or_expired") {
            setError("This link has expired. Ask for a fresh QR code.");
            setStatus("error");
            return;
          }
          if (data.error === "too_large") {
            setError("A file was over 25 MB and was skipped.");
          }
        } else {
          ok += 1;
        }
      } catch {
        setError("Network hiccup — some files may not have sent.");
      }
      setDone((d) => d + 1);
    }
    setStatus(ok > 0 ? "done" : "error");
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center gap-6 px-6 py-10">
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-oxblood">
          replyora°
        </p>
        <h1 className="mt-2 font-display text-3xl text-oxblood">Send in your photos</h1>
        <p className="mt-2 text-sm text-ink/70">
          Pick photos or videos and they&apos;ll drop straight into this brand&apos;s
          asset library — no app, no login.
        </p>
      </div>

      {status === "done" ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <Check className="mx-auto h-8 w-8 text-emerald-600" />
          <p className="mt-2 font-semibold text-emerald-800">
            {done} of {total} sent 🎉
          </p>
          <p className="mt-1 text-sm text-emerald-700/80">
            They&apos;re in the library now. Add more any time from this page.
          </p>
          <button
            type="button"
            onClick={() => setStatus("idle")}
            className="mt-4 rounded-full bg-oxblood px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-cream"
          >
            Send more
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <button
            type="button"
            disabled={status === "uploading"}
            onClick={() => camRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-oxblood px-5 py-4 text-[13px] font-semibold uppercase tracking-[0.14em] text-cream disabled:opacity-70"
          >
            {status === "uploading" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Camera className="h-5 w-5" />
            )}
            Take a photo
          </button>
          <button
            type="button"
            disabled={status === "uploading"}
            onClick={() => libRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-oxblood/25 px-5 py-4 text-[13px] font-semibold uppercase tracking-[0.14em] text-oxblood disabled:opacity-70"
          >
            <ImagePlus className="h-5 w-5" />
            Choose from library
          </button>

          {status === "uploading" && (
            <p className="text-center text-sm text-ink/70">
              Uploading {done} of {total}…
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="flex items-center justify-center gap-1.5 text-center text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </p>
      )}

      {/* Camera capture (rear camera on phones) */}
      <input
        ref={camRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        className="hidden"
        onChange={(e) => upload(e.target.files)}
      />
      {/* Multi-select from the photo library */}
      <input
        ref={libRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => upload(e.target.files)}
      />
    </div>
  );
}
