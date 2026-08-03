"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, FolderPlus, Loader2, Trash2, UploadCloud } from "lucide-react";

import type { Asset } from "@/lib/social/assets";
import { deleteAssetAction, recordAssetAction } from "@/app/(social)/clients/[id]/assets/actions";

export function AssetsWorkspace({
  clientId,
  clientName,
  assets,
  storageReady,
}: {
  clientId: string;
  clientName: string;
  assets: Asset[];
  storageReady: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [yourOpen, setYourOpen] = useState(true);
  const [clientOpen, setClientOpen] = useState(true);

  const yours = assets.filter((a) => a.uploadedBy === "agency");
  const clientUploads = assets.filter((a) => a.uploadedBy === "client");

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (!storageReady) {
      setError("Storage isn't connected yet — add R2 keys in Netlify.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const kind = file.type.startsWith("video") ? "video" : "image";
        const res = await fetch("/api/social/assets/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId,
            filename: file.name,
            contentType: file.type || "application/octet-stream",
          }),
        });
        if (!res.ok) {
          setError("Storage isn't connected yet — add R2 keys in Netlify.");
          break;
        }
        const { uploadUrl, publicUrl } = (await res.json()) as {
          uploadUrl: string;
          publicUrl: string;
        };
        const put = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });
        if (!put.ok) {
          setError("Upload failed — check your R2 bucket settings.");
          break;
        }
        await recordAssetAction(clientId, { url: publicUrl, kind });
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/85">
          <span className="text-oxblood">( 04 )</span> Assets
        </p>
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/70">
          {assets.length} {assets.length === 1 ? "file" : "files"}
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-[180px_1fr]">
        {/* Folders */}
        <aside>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/70">
            Folders
          </p>
          <div className="mt-3 space-y-2">
            <div className="rounded-lg bg-oxblood/10 px-3 py-2 text-[12px] font-semibold text-oxblood">
              Library
            </div>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg border border-dashed border-ink/20 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/70 hover:border-oxblood hover:text-oxblood"
            >
              <FolderPlus className="h-3.5 w-3.5" /> New folder
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="space-y-6">
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => uploadFiles(e.target.files)}
          />
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              uploadFiles(e.dataTransfer.files);
            }}
            className={`flex flex-col items-center gap-2 rounded-2xl border border-dashed px-6 py-12 text-center transition-colors ${dragOver ? "border-oxblood bg-oxblood/[0.04]" : "border-ink/25"}`}
          >
            {busy ? (
              <Loader2 className="h-6 w-6 animate-spin text-oxblood" />
            ) : (
              <UploadCloud className="h-6 w-6 text-ink/50" />
            )}
            <p className="text-[12px] font-semibold text-ink/80">
              Drop JPG, PNG, or MP4 · up to 200MB
            </p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-1 rounded-full bg-oxblood px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-cream transition-opacity hover:opacity-90 disabled:opacity-50"
              disabled={busy}
            >
              Select
            </button>
            {!storageReady && (
              <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-ink/55">
                Connect storage · add R2 keys in Netlify to enable uploads
              </p>
            )}
            {error && <p className="mt-1 text-[11px] font-medium text-rose">{error}</p>}
          </div>

          {assets.length === 0 ? (
            <p className="rounded-xl border border-dashed border-ink/20 px-4 py-10 text-center text-[12px] font-semibold uppercase tracking-[0.14em] text-ink/60">
              No assets yet
            </p>
          ) : (
            <div className="space-y-5">
              <Section
                title={`Your uploads · ${yours.length}`}
                open={yourOpen}
                onToggle={() => setYourOpen((o) => !o)}
                assets={yours}
                clientId={clientId}
                onChange={() => router.refresh()}
              />
              <Section
                title={`${clientName} uploads · ${clientUploads.length}`}
                open={clientOpen}
                onToggle={() => setClientOpen((o) => !o)}
                assets={clientUploads}
                clientId={clientId}
                onChange={() => router.refresh()}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  open,
  onToggle,
  assets,
  clientId,
  onChange,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  assets: Asset[];
  clientId: string;
  onChange: () => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/75"
      >
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        {title}
      </button>
      {open && (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {assets.length === 0 ? (
            <p className="col-span-full text-[11px] text-ink/55">Nothing here yet.</p>
          ) : (
            assets.map((a) => (
              <div key={a.id} className="group relative aspect-square overflow-hidden rounded-lg border border-ink/10 bg-ink/[0.03]">
                {a.kind === "video" ? (
                  <video src={a.url} className="h-full w-full object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.url} alt="" className="h-full w-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={async () => {
                    await deleteAssetAction(clientId, a.id);
                    onChange();
                  }}
                  className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-ink/70 opacity-0 transition-opacity hover:text-rose group-hover:opacity-100"
                  aria-label="Delete asset"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
