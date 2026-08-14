import { ImageResponse } from "next/og";

// Favicon — a circular badge with the "replyora." wordmark in porcelain on ink.
export const size = { width: 128, height: 128 };
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
          background: "#1A1A1A",
          borderRadius: "50%",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span style={{ fontFamily: "S", fontStyle: "italic", color: "#F3F0EB", fontSize: 34 }}>
            reply
          </span>
          <span style={{ fontFamily: "H", color: "#F3F0EB", fontSize: 34, marginLeft: -2 }}>
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
