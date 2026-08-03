import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "Replyora — AI that replies, captures leads, and books customers 24/7";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Branded default OG image (burgundy & oat). */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#FBF7EF",
        }}
      >
        {/* Wordmark: "replyora" + the brand open dot (hollow circle). */}
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: "#5C1A1A",
              letterSpacing: "-2px",
              lineHeight: 1,
            }}
          >
            replyora
          </div>
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              border: "5px solid #5C1A1A",
              marginLeft: 5,
              marginBottom: 8,
            }}
          />
        </div>
        <div
          style={{
            marginTop: 32,
            fontSize: 56,
            lineHeight: 1.1,
            color: "#2B1413",
            maxWidth: 900,
          }}
        >
          Turn website visitors into booked customers — while you sleep.
        </div>
        <div style={{ marginTop: 28, fontSize: 30, color: "#6b5a52" }}>
          Replies instantly · captures leads · books 24/7
        </div>
      </div>
    ),
    { ...size },
  );
}
