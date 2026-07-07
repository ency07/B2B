import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  // Optimización agresiva de imágenes
  images: {
    qualities: [60, 75, 85],
    formats: ["image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 días
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.vercel-storage.com" },
    ],
  },

  // Compresión de respuestas
  compress: true,

  // Optimización de producción
  poweredByHeader: false,
  productionBrowserSourceMaps: false,

  // Tree-shaking más agresivo
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false,
  },

  // Reducir bundle de framer-motion y otras libs pesadas
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@/utils/engineering",
    ],
  },

  // Cabeceras de seguridad HTTP
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.supabase.co https://challenges.cloudflare.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.supabase.co https://*.vercel-storage.com",
              "connect-src 'self' https://*.supabase.co https://api.whatsapp.com wss://*.supabase.co",
              "frame-src 'self' https://challenges.cloudflare.com",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
