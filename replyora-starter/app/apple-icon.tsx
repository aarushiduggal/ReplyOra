import { ImageResponse } from "next/og";

// Apple touch icon — the full "replyora." wordmark centred on porcelain.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const fetchFont = (url: string) => fetch(url).then((r) => r.arrayBuffer());

export default async function AppleIcon() {
  const [serif, heavy] = await Promise.all([
    fetchFont(
      "https://cdn.jsdelivr.net/npm/@fontsource/playfair-display@5.0.20/files/playfair-display-latin-600-italic.woff",
    ),
    fetchFont(
      "https://cdn.jsdelivr.net/npm/@fontsource/archivo-black@5.0.20/files/archivo-black-latin-400-normal.woff",
    ),
  ]);

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
          borderRadius: "50%",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span style={{ fontFamily: "S", fontStyle: "italic", color: "#F3F0EB", fontSize: 44 }}>
            reply
          </span>
          <span style={{ fontFamily: "H", color: "#F3F0EB", fontSize: 44, marginLeft: -2 }}>
            ora.
          </span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "S", data: serif, style: "italic", weight: 600 },
        { name: "H", data: heavy, style: "normal", weight: 400 },
      ],
    },
  );
}
