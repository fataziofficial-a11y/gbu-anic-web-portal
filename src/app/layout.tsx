import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://аниц.рф";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "АНИЦ — Арктический научно-исследовательский центр",
    template: "%s | АНИЦ",
  },
  description:
    "Арктический научно-исследовательский центр Республики Саха (Якутия). Где наука встречается с будущим Арктики.",
  keywords: ["АНИЦ", "Арктика", "Якутия", "наука", "исследования", "мерзлота", "климат"],
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "АНИЦ — Арктический научно-исследовательский центр",
    title: "АНИЦ — Арктический научно-исследовательский центр",
    description: "Арктический научно-исследовательский центр Республики Саха (Якутия). Где наука встречается с будущим Арктики.",
    url: BASE_URL,
    images: [{ url: "/anic-hero.png", width: 1200, height: 630, alt: "АНИЦ" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "АНИЦ — Арктический научно-исследовательский центр",
    description: "Арктический научно-исследовательский центр Республики Саха (Якутия).",
    images: ["/anic-hero.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  },
  alternates: {
    canonical: BASE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className={`${manrope.variable} ${inter.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
