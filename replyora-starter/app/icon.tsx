import { ImageResponse } from "next/og";

// Favicon — the full "replyora." wordmark (italic-serif reply + heavy ora.).
export const size = { width: 128, height: 40 };
export const contentType = "image/png";

const fetchFont = (url: string) => fetch(url).then((r) => r.arrayBuffer());

export default async function Icon() {
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
          background: "#F3F0EB",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span style={{ fontFamily: "S", fontStyle: "italic", color: "#1A1A1A", fontSize: 30 }}>
            reply
          </span>
          <span style={{ fontFamily: "H", color: "#1A1A1A", fontSize: 30, marginLeft: -1 }}>
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
