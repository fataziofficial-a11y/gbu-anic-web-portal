import { ImageResponse } from "next/og";
import { loadOgFont } from "@/lib/utils/og-font";

export const dynamic = "force-dynamic";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BRAND = "АНИЦ";
const TAGLINE = "Арктический научно-исследовательский центр";
const SITE = "anic.ru";

export default async function Image() {
  const text = `${BRAND} ${TAGLINE} ${SITE}`;
  const fontBold = await loadOgFont(text, 700);
  const fontNormal = await loadOgFont(text, 400);

  const fonts = [
    ...(fontBold ? [{ name: "Inter", data: fontBold, weight: 700 as const }] : []),
    ...(fontNormal ? [{ name: "Inter", data: fontNormal, weight: 400 as const }] : []),
  ];

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0f172a 0%, #1a3a5c 60%, #1e3a5f 100%)",
          padding: "60px",
          fontFamily: fonts.length ? "Inter" : "sans-serif",
        }}
      >
        {/* Accent bar */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: "6px",
            background: "linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)",
          }}
        />

        {/* Top: brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            {BRAND}
          </span>
          <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.25)" }} />
          <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", letterSpacing: "0.05em" }}>
            Официальный сайт
          </span>
        </div>

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
          }}
        >
          <p
            style={{
              fontSize: "18px",
              color: "rgba(147,197,253,0.7)",
              margin: "0 0 20px",
              fontWeight: 400,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            {TAGLINE}
          </p>
          <h1
            style={{
              fontSize: "64px",
              fontWeight: 700,
              color: "#ffffff",
              margin: 0,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            {BRAND}
          </h1>
        </div>

        {/* Bottom: site */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "32px", height: "2px", background: "#3b82f6" }} />
          <span style={{ fontSize: "16px", color: "rgba(255,255,255,0.4)", letterSpacing: "0.05em" }}>
            {SITE}
          </span>
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
