import { ImageResponse } from "next/og";

// Apple touch icon — the Mark on ink, larger.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          color: "#F3F0EB",
          fontSize: 132,
          fontWeight: 900,
          fontFamily: "sans-serif",
          paddingBottom: 12,
        }}
      >
        o
      </div>
    ),
    size,
  );
}
