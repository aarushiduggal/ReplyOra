"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Founder photo with a graceful fallback. Shows the image from `src`; if the
 * file isn't present yet (e.g. before public/founder-aarushi.jpg is added), it
 * renders an on-brand initial avatar instead of a broken-image icon.
 *
 * Also checks on mount in case the load error fired before hydration (so the
 * onError handler wasn't attached yet).
 *
 * `size` sets a square; pass `width`/`height` for a portrait/landscape crop.
 */
export function FounderPhoto({
  src,
  alt,
  initial,
  size = 176,
  width,
  height,
  rounded = "rounded-2xl",
  objectPosition = "center",
}: {
  src: string;
  alt: string;
  initial: string;
  size?: number;
  width?: number;
  height?: number;
  rounded?: string;
  objectPosition?: string;
}) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) {
      setFailed(true);
    }
  }, []);

  const w = width ?? size;
  const h = height ?? size;
  const dims = { width: w, height: h };
  const fontSize = Math.round(Math.min(w, h) * 0.42);

  if (failed) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center bg-oxblood font-display text-cream ${rounded}`}
        style={{ ...dims, fontSize }}
      >
        {initial}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      width={w}
      height={h}
      onError={() => setFailed(true)}
      className={`shrink-0 object-cover ${rounded}`}
      style={{ ...dims, objectPosition }}
    />
  );
}
