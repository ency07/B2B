import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

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
              // *.sentry.io cubre tanto el legacy o<org>.ingest.sentry.io como los
              // hosts de ingesta regionales (o<org>.ingest.us.sentry.io, .de.sentry.io).
              // Sin DSN configurado, Sentry.init() nunca dispara estas requests —
              // permitir el dominio es inofensivo aunque el proyecto no use Sentry.
              "connect-src 'self' https://*.supabase.co https://api.whatsapp.com wss://*.supabase.co https://*.sentry.io",
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
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
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

// El wrapper de Sentry instrumenta el build (Turbopack/webpack) para inyectar
// el SDK y, si SENTRY_AUTH_TOKEN está presente, sube source maps a Sentry.
// Sin auth token simplemente omite la subida (build normal, sin fallar CI).
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // No imprimir logs del plugin de Sentry en desarrollo — solo en CI.
  silent: !process.env.CI,

  // Equivalente moderno de la antigua opción `hideSourceMaps`: sube los source
  // maps a Sentry y los borra del build de Next para que no queden expuestos
  // públicamente (es el default, se deja explícito para que quede documentado).
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

});
