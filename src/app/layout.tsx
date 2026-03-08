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

export const metadata: Metadata = {
  title: {
    default: "АНИЦ — Арктический научно-исследовательский центр",
    template: "%s | АНИЦ",
  },
  description:
    "Арктический научно-исследовательский центр Республики Саха (Якутия). Где наука встречается с будущим Арктики.",
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
