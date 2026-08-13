import { ImageResponse } from "next/og";

// Favicon — a compact mark that stays legible at ~16px: heavy "r." (the
// replyora initial + the wordmark's signature dot) in porcelain on an ink tile.
// The full wordmark can't be read at tab size, so it lives on the apple icon.
export const size = { width: 48, height: 48 };
export const contentType = "image/png";

const fetchFont = (url: string) => fetch(url).then((r) => r.arrayBuffer());

export default async function Icon() {
  const heavy = await fetchFont(
    "https://cdn.jsdelivr.net/npm/@fontsource/archivo-black@5.0.20/files/archivo-black-latin-400-normal.woff",
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1A1A1A",
          borderRadius: 10,
        }}
      >
        <span
          style={{
            fontFamily: "H",
            color: "#F3F0EB",
            fontSize: 30,
            lineHeight: 1,
            marginTop: -2,
          }}
        >
          r.
        </span>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "H", data: heavy, style: "normal", weight: 400 }],
    },
  );
}
