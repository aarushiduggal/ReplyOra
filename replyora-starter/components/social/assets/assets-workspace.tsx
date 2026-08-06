"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, FolderPlus, Loader2, Trash2, UploadCloud } from "lucide-react";

import type { Asset } from "@/lib/social/assets";
import { deleteAssetAction } from "@/app/(social)/clients/[id]/assets/actions";
import { GuideTrigger } from "@/components/social/guide";

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

  // Folders: null = Library (all). `extraFolders` holds just-created empty ones.
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [extraFolders, setExtraFolders] = useState<string[]>([]);
  const folders = Array.from(
    new Set([
      ...assets.map((a) => a.folder).filter((f): f is string => Boolean(f)),
      ...extraFolders,
    ]),
  ).sort();

  function newFolder() {
    const name = window.prompt("New folder name")?.trim();
    if (!name) return;
    setExtraFolders((f) => (f.includes(name) ? f : [...f, name]));
    setActiveFolder(name);
  }

  const inFolder = (a: Asset) =>
    activeFolder === null ? true : a.folder === activeFolder;
  const yours = assets.filter((a) => a.uploadedBy === "agency" && inFolder(a));
  const clientUploads = assets.filter((a) => a.uploadedBy === "client" && inFolder(a));

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
        // Upload through our own server (no CORS, works behind strict networks).
        const form = new FormData();
        form.append("file", file);
        form.append("clientId", clientId);
        if (activeFolder) form.append("folder", activeFolder);
        const res = await fetch("/api/social/assets/upload", {
          method: "POST",
          body: form,
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
            detail?: string;
          };
          if (res.status === 501) {
            setError("Storage isn't connected — add the R2 keys in Netlify, then redeploy.");
          } else if (res.status === 413) {
            setError("That file is too large — try an image under ~4 MB.");
          } else {
            setError(`Upload failed: ${data.error ?? res.status}. ${data.detail ?? ""}`);
          }
          break;
        }
      }
      router.refresh();
    } catch (e) {
      setError(`Upload error: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/85">
          <span className="text-oxblood">( 05 )</span> Assets
          <GuideTrigger pageKey="assets" clientId={clientId} />
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/85">
          {assets.length} {assets.length === 1 ? "file" : "files"}
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-[180px_1fr]">
        {/* Folders */}
        <aside>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/85">
            Folders
          </p>
          <div className="mt-3 space-y-2">
            <button
              type="button"
              onClick={() => setActiveFolder(null)}
              className={`block w-full rounded-lg px-3 py-2 text-left text-[12px] font-semibold ${
                activeFolder === null
                  ? "bg-oxblood/10 text-oxblood"
                  : "text-ink/70 hover:bg-oxblood/5"
              }`}
            >
              Library
            </button>
            {folders.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setActiveFolder(f)}
                className={`block w-full truncate rounded-lg px-3 py-2 text-left text-[12px] font-semibold ${
                  activeFolder === f
                    ? "bg-oxblood/10 text-oxblood"
                    : "text-ink/70 hover:bg-oxblood/5"
                }`}
              >
                {f}
              </button>
            ))}
            <button
              type="button"
              onClick={newFolder}
              className="flex w-full items-center gap-2 rounded-lg border border-dashed border-ink/20 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/85 hover:border-oxblood hover:text-oxblood"
            >
              <FolderPlus className="h-3.5 w-3.5" /> New folder
            </button>
            {activeFolder && (
              <p className="px-1 text-[10px] text-ink/60">
                Uploads go into <strong>{activeFolder}</strong>.
              </p>
            )}
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
              <UploadCloud className="h-6 w-6 text-ink/70" />
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
              <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-ink/75">
                Connect storage · add R2 keys in Netlify to enable uploads
              </p>
            )}
            {error && <p className="mt-1 text-[11px] font-medium text-rose">{error}</p>}
          </div>

          {assets.length === 0 ? (
            <p className="rounded-xl border border-dashed border-ink/20 px-4 py-10 text-center text-[12px] font-semibold uppercase tracking-[0.14em] text-ink/80">
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
        className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/90"
      >
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        {title}
      </button>
      {open && (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {assets.length === 0 ? (
            <p className="col-span-full text-[11px] text-ink/75">Nothing here yet.</p>
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
                  className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-ink/85 opacity-0 transition-opacity hover:text-rose group-hover:opacity-100"
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
