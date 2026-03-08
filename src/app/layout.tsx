import type { Metadata } from "next";
import { Exo_2, Roboto_Mono, Montserrat, PT_Sans } from "next/font/google";
import "./globals.css";

const exo2 = Exo_2({
  variable: "--font-exo2",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

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
      <body className={`${exo2.variable} ${robotoMono.variable} ${montserrat.variable} ${ptSans.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
