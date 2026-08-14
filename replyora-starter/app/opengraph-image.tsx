import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "Replyora — Socials, simplified. Plan, create and schedule your socials in one calm workspace.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default OG image — porcelain + ink brand. No external fonts (kept robust). */
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
          padding: "88px",
          background: "#F3F0EB",
        }}
      >
        {/* Wordmark: "replyora" + the bold brand dot. */}
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <div
            style={{
              fontSize: 68,
              fontWeight: 800,
              color: "#1A1A1A",
              letterSpacing: "-3px",
              lineHeight: 1,
            }}
          >
            replyora
          </div>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "#1A1A1A",
              marginLeft: 6,
              marginBottom: 6,
            }}
          />
        </div>

        <div
          style={{
            marginTop: 40,
            fontSize: 76,
            fontWeight: 700,
            lineHeight: 1.05,
            color: "#1A1A1A",
            letterSpacing: "-2px",
            maxWidth: 940,
          }}
        >
          Socials, simplified.
        </div>

        <div
          style={{
            marginTop: 28,
            fontSize: 32,
            lineHeight: 1.35,
            color: "#8C877E",
            maxWidth: 900,
          }}
        >
          Plan, create and schedule Instagram, Facebook &amp; TikTok — all in
          one calm workspace.
        </div>
      </div>
    ),
    { ...size },
  );
}
