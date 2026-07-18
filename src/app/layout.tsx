import type { Metadata } from "next";
import { Inter, Fraunces, IBM_Plex_Mono } from "next/font/google";
import { PostHogProvider } from "@/platform/providers/posthog-provider";
import { Toaster } from "@/platform/ui/toaster";
import { SessionVersionListener } from "@/platform/ui/session-version-listener";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Sistemas B2B — Ingeniería de Ventilación",
  description:
    "Diseño, simulación y ejecución de sistemas de ventilación industrial. Más de dos décadas resolviendo los desafíos operativos de las plantas más exigentes de LATAM.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${inter.variable} ${fraunces.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-base text-fg-primary">
        {/* Inline script para evitar flash de tema antes de la hidratación */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var dsThemeId = localStorage.getItem('ds-theme-id');
                if (dsThemeId) {
                  var isDark = dsThemeId === 'carbon' || dsThemeId === 'graphite' || dsThemeId === 'midnightBlue' || dsThemeId === 'neoEmerald';
                  if (isDark) document.documentElement.classList.add('dark');
                  else document.documentElement.classList.remove('dark');
                }
                var params = new URLSearchParams(window.location.search);
                var tenant = params.get('tenant');
                if (tenant) {
                  var cached = localStorage.getItem('tenant_config_' + tenant);
                  if (cached) {
                    var config = JSON.parse(cached);
                    if (config.theme === 'dark') document.documentElement.classList.add('dark');
                    else if (config.theme === 'light') document.documentElement.classList.remove('dark');
                    if (config.primaryColor) {
                      document.documentElement.style.setProperty('--primary', config.primaryColor);
                      document.documentElement.style.setProperty('--ring', config.primaryColor);
                    }
                  }
                }
              } catch (e) {}
            `,
          }}
        />
        <PostHogProvider>
          {children}
          <Toaster />
          <SessionVersionListener />
        </PostHogProvider>
      </body>
    </html>
  );
}
