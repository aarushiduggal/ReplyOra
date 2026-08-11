import { ImageResponse } from "next/og";

// Favicon — the companion Mark: heavy "o" in porcelain on an ink tile.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          fontSize: 23,
          fontWeight: 900,
          fontFamily: "sans-serif",
          borderRadius: 7,
          paddingBottom: 2,
        }}
      >
        o
      </div>
    ),
    size,
  );
}
