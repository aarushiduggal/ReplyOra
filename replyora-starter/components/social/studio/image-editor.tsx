"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Move, X, ZoomIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

/**
 * Crop & compose an image for a specific platform slot.
 *
 * Deliberately NOT a general design tool — it does the part that a scheduler
 * genuinely owns: get the picture into the right aspect ratio for the placement,
 * framed where you want it, with an optional on-brand headline. Anything more
 * elaborate belongs in a real design app.
 *
 * Everything renders in the browser via <canvas>; the export is uploaded through
 * the existing same-origin upload route.
 */

export interface Ratio {
  key: string;
  label: string;
  hint: string;
  w: number;
  h: number;
  /** Export pixel width; height derives from the ratio. */
  out: number;
}

export const RATIOS: Ratio[] = [
  { key: "1:1", label: "Square", hint: "Feed · 1080×1080", w: 1, h: 1, out: 1080 },
  { key: "4:5", label: "Portrait", hint: "Feed · 1080×1350", w: 4, h: 5, out: 1080 },
  { key: "9:16", label: "Story / Reel", hint: "Full screen · 1080×1920", w: 9, h: 16, out: 1080 },
  { key: "16:9", label: "Landscape", hint: "Wide · 1080×608", w: 16, h: 9, out: 1080 },
];

type TextPos = "none" | "top" | "middle" | "bottom";

const INK = "#1A1A1A";
const PORCELAIN = "#F3F0EB";

export function ImageEditor({
  src,
  clientId,
  onDone,
  onCancel,
}: {
  /** Original asset URL (R2) or a local object URL. */
  src: string;
  clientId: string;
  /** Called with the new asset URL once the crop is uploaded. */
  onDone: (url: string) => void;
  onCancel: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const [ratio, setRatio] = useState<Ratio>(RATIOS[1]!);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [headline, setHeadline] = useState("");
  const [textPos, setTextPos] = useState<TextPos>("none");
  const [dark, setDark] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  // Preview box is fixed-width; height follows the chosen ratio.
  const BOX_W = 320;
  const boxH = Math.round((BOX_W * ratio.h) / ratio.w);

  /** Load through our own origin so canvas.toBlob() isn't blocked by tainting. */
  useEffect(() => {
    const sameOrigin =
      src.startsWith("blob:") ||
      src.startsWith("data:") ||
      src.startsWith("/") ||
      (typeof window !== "undefined" && src.startsWith(window.location.origin));
    const loadFrom = sameOrigin
      ? src
      : `/api/social/assets/proxy?url=${encodeURIComponent(src)}`;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setLoaded(true);
      setFailed(false);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    img.onerror = () => setFailed(true);
    img.src = loadFrom;
  }, [src]);

  /** Draw the framed crop at an arbitrary size (preview and export share this). */
  const paint = useCallback(
    (canvas: HTMLCanvasElement, width: number) => {
      const img = imgRef.current;
      if (!img) return;
      const height = Math.round((width * ratio.h) / ratio.w);
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = PORCELAIN;
      ctx.fillRect(0, 0, width, height);

      // "Cover" fit, then apply the user's zoom and pan.
      const base = Math.max(width / img.width, height / img.height);
      const scale = base * zoom;
      const dw = img.width * scale;
      const dh = img.height * scale;
      // Offsets are stored in preview pixels; rescale for the export size.
      const k = width / BOX_W;
      const dx = (width - dw) / 2 + offset.x * k;
      const dy = (height - dh) / 2 + offset.y * k;
      ctx.drawImage(img, dx, dy, dw, dh);

      if (textPos !== "none" && headline.trim()) {
        drawHeadline(ctx, width, height, headline.trim(), textPos, dark);
      }
    },
    [ratio, zoom, offset, headline, textPos, dark],
  );

  // Repaint the preview whenever anything changes.
  useEffect(() => {
    const c = canvasRef.current;
    if (c && loaded) paint(c, BOX_W);
  }, [paint, loaded]);

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  }
  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const d = dragRef.current;
    if (!d) return;
    setOffset({ x: d.ox + (e.clientX - d.x), y: d.oy + (e.clientY - d.y) });
  }
  function onPointerUp() {
    dragRef.current = null;
  }

  async function save() {
    const img = imgRef.current;
    if (!img) return;
    setSaving(true);
    try {
      const out = document.createElement("canvas");
      paint(out, ratio.out);
      const blob = await new Promise<Blob | null>((resolve) =>
        out.toBlob((b) => resolve(b), "image/jpeg", 0.92),
      );
      if (!blob) throw new Error("export failed");

      const form = new FormData();
      form.append("file", new File([blob], `crop-${ratio.key.replace(":", "x")}.jpg`, {
        type: "image/jpeg",
      }));
      form.append("clientId", clientId);
      form.append("folder", "Edited");

      const res = await fetch("/api/social/assets/upload", {
        method: "POST",
        body: form,
      });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "upload failed");
      }
      toast({ title: `Saved a ${ratio.label.toLowerCase()} crop`, type: "success" });
      onDone(data.url);
    } catch {
      toast({
        title: "Couldn't save that crop.",
        body: "Check that storage is connected, then try again.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-ink/15 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/75">
          Crop &amp; compose
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="text-ink/50 transition-colors hover:text-ink"
          aria-label="Close the editor"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row">
        {/* Preview */}
        <div className="shrink-0">
          {failed ? (
            <div
              style={{ width: BOX_W, height: boxH }}
              className="flex items-center justify-center rounded-xl border border-dashed border-ink/25 px-4 text-center text-[12px] text-ink/70"
            >
              Couldn&apos;t load that image for editing.
            </div>
          ) : !loaded ? (
            <div
              style={{ width: BOX_W, height: boxH }}
              className="flex items-center justify-center rounded-xl bg-oat/50"
            >
              <Loader2 className="h-5 w-5 animate-spin text-ink/40" />
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              style={{ width: BOX_W, height: boxH, touchAction: "none" }}
              className="cursor-grab rounded-xl border border-ink/10 active:cursor-grabbing"
            />
          )}
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-ink/55">
            <Move className="h-3 w-3" /> Drag to reposition
          </p>
        </div>

        {/* Controls */}
        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/75">
              Shape
            </p>
            <div className="flex flex-wrap gap-2">
              {RATIOS.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setRatio(r)}
                  aria-pressed={r.key === ratio.key}
                  title={r.hint}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors",
                    r.key === ratio.key
                      ? "border-ink bg-ink text-porcelain"
                      : "border-ink/20 text-ink/75 hover:border-ink/50 hover:text-ink",
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-ink/60">{ratio.hint}</p>
          </div>

          <div>
            <label
              htmlFor="zoom"
              className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/75"
            >
              <ZoomIn className="h-3 w-3" /> Zoom
            </label>
            <input
              id="zoom"
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-[#1A1A1A]"
            />
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/75">
              Headline
            </p>
            <input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Optional text over the image"
              className="w-full rounded-lg border border-ink/15 bg-cream/40 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink/40 focus:border-ink/40"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {(["none", "top", "middle", "bottom"] as TextPos[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setTextPos(p)}
                  aria-pressed={p === textPos}
                  className={cn(
                    "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors",
                    p === textPos
                      ? "border-ink bg-ink text-porcelain"
                      : "border-ink/20 text-ink/75 hover:border-ink/50",
                  )}
                >
                  {p}
                </button>
              ))}
              {textPos !== "none" && (
                <button
                  type="button"
                  onClick={() => setDark((v) => !v)}
                  className="rounded-full border border-ink/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink/75 transition-colors hover:border-ink/50"
                >
                  {dark ? "Ink on porcelain" : "Porcelain on ink"}
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button onClick={save} disabled={!loaded || saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                <>Save {ratio.label.toLowerCase()} crop</>
              )}
            </Button>
            <Button variant="outline" onClick={onCancel} disabled={saving}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Brand headline band: Archivo-ish heavy type on a porcelain or ink panel. */
function drawHeadline(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  text: string,
  pos: Exclude<TextPos, "none">,
  dark: boolean,
) {
  const pad = Math.round(width * 0.06);
  const fontSize = Math.round(width * 0.075);
  ctx.font = `700 ${fontSize}px Archivo, system-ui, -apple-system, Helvetica, Arial, sans-serif`;
  ctx.textBaseline = "top";

  // Wrap to the padded width.
  const maxW = width - pad * 2;
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > maxW && line) {
      lines.push(line);
      line = w;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);

  const lineH = Math.round(fontSize * 1.22);
  const blockH = lines.length * lineH + pad;
  const y =
    pos === "top" ? 0 : pos === "bottom" ? height - blockH : (height - blockH) / 2;

  ctx.fillStyle = dark ? PORCELAIN : INK;
  ctx.globalAlpha = 0.92;
  ctx.fillRect(0, y, width, blockH);
  ctx.globalAlpha = 1;

  ctx.fillStyle = dark ? INK : PORCELAIN;
  lines.forEach((l, i) => {
    ctx.fillText(l, pad, y + pad / 2 + i * lineH);
  });
}
