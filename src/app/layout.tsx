import type { Metadata } from "next";
import { Montserrat, PT_Sans } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const ptSans = PT_Sans({
  variable: "--font-pt-sans",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
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
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className={`${montserrat.variable} ${ptSans.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
