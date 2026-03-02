import { ImageResponse } from "next/og";
import { db } from "@/lib/db";
import { pages } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { loadOgFont } from "@/lib/utils/og-font";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 300;

const BRAND = "АНИЦ";
const SITE = "anic.ru";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const page = await db.query.pages.findFirst({
    where: and(eq(pages.slug, slug), eq(pages.status, "published")),
    columns: { title: true },
  });

  const title = page?.title ?? "Страница";

  const allText = `${BRAND} ${SITE} ${title} Официальный сайт`;
  const fontBold = await loadOgFont(allText, 700);
  const fontNormal = await loadOgFont(allText, 400);

  const fonts = [
    ...(fontBold ? [{ name: "Inter", data: fontBold, weight: 700 as const }] : []),
    ...(fontNormal ? [{ name: "Inter", data: fontNormal, weight: 400 as const }] : []),
  ];

  const displayTitle = title.length > 80 ? title.slice(0, 77) + "…" : title;

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
        {/* Left accent bar */}
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

        {/* Top */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            {BRAND}
          </span>
          <div style={{ width: "1px", height: "18px", background: "rgba(255,255,255,0.25)" }} />
          <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", letterSpacing: "0.05em" }}>
            {SITE}
          </span>
        </div>

        {/* Main */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
            gap: "20px",
          }}
        >
          <h1
            style={{
              fontSize: displayTitle.length > 50 ? "44px" : "54px",
              fontWeight: 700,
              color: "#ffffff",
              margin: 0,
              lineHeight: 1.15,
              letterSpacing: "-0.01em",
            }}
          >
            {displayTitle}
          </h1>
        </div>

        {/* Bottom */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "32px", height: "2px", background: "#3b82f6" }} />
          <span style={{ fontSize: "15px", color: "rgba(255,255,255,0.35)", letterSpacing: "0.05em" }}>
            {SITE}
          </span>
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
