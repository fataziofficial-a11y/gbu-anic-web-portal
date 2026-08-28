import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // standalone нужен только для VPS/Docker деплоя, на Vercel не используется
  ...(process.env.BUILD_STANDALONE === "1" ? { output: "standalone" } : {}),
  serverExternalPackages: ["meilisearch"],
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    remotePatterns: [],
  },
  // Standalone-сервер индексирует public/ один раз при старте, поэтому файлы,
  // загруженные через CMS после старта процесса, статикой не отдаются (404) и
  // next/image возвращает 400 вместо обложки. Уводим /uploads/* на route
  // handler, читающий диск на каждый запрос. beforeFiles — чтобы перехват
  // случился до проверки файловой системы.
  async rewrites() {
    return {
      beforeFiles: [{ source: "/uploads/:path*", destination: "/api/uploads/:path*" }],
      afterFiles: [],
      fallback: [],
    };
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "geolocation=(), camera=(), microphone=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-src 'self' https://rutube.ru https://vk.com; frame-ancestors 'self'; base-uri 'self'; form-action 'self'",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
