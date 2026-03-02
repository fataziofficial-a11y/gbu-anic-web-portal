import type { Metadata } from "next";
import { Cormorant, Manrope } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant({
  variable: "--font-cormorant",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ГБУ АНИЦ — Арктический научно-исследовательский центр",
    template: "%s | ГБУ АНИЦ",
  },
  description:
    "Государственное бюджетное учреждение Арктический научно-исследовательский центр Республики Саха (Якутия)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${cormorant.variable} ${manrope.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
