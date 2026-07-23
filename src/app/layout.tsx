import type { Metadata } from "next";
import { Inter, Fraunces, IBM_Plex_Mono } from "next/font/google";
import { PostHogProvider } from "@/platform/providers/posthog-provider";
import { Toaster } from "@/platform/ui/toaster";
import { SessionVersionListener } from "@/platform/ui/session-version-listener";
import { themes } from "@/design-system/themes";
import "./globals.css";

// Fuente única de verdad para saber qué theme-ids son oscuros.
// Se deriva de la definición real de temas (kebab-case: carbon, graphite,
// midnight-blue, neo-emerald) y se inyecta en el script anti-FOUC de abajo.
// ANTES estaba hardcodeado con "midnightBlue"/"neoEmerald" (camelCase), que
// NO coinciden con los ids que el provider guarda en localStorage → el script
// no aplicaba .dark para esos temas y causaba flash/tema desvaído.
const DARK_THEME_IDS = themes.filter((t) => t.mode === "dark").map((t) => t.id);

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
                  var darkThemeIds = ${JSON.stringify(DARK_THEME_IDS)};
                  var isDark = darkThemeIds.indexOf(dsThemeId) !== -1;
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
                    var rawColor = config.color_primario || config.primaryColor;
                    if (rawColor) {
                      var hsl = rawColor;
                      var hexMatch = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/.exec(rawColor);
                      if (hexMatch) {
                        var hex = hexMatch[1];
                        if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
                        var r = parseInt(hex.substring(0,2),16)/255, g = parseInt(hex.substring(2,4),16)/255, b = parseInt(hex.substring(4,6),16)/255;
                        var max = Math.max(r,g,b), min = Math.min(r,g,b), h = 0, s = 0, l = (max+min)/2;
                        if (max !== min) {
                          var d = max-min;
                          s = l > 0.5 ? d/(2-max-min) : d/(max+min);
                          if (max === r) h = (g-b)/d + (g<b?6:0);
                          else if (max === g) h = (b-r)/d + 2;
                          else h = (r-g)/d + 4;
                          h /= 6;
                        }
                        hsl = Math.round(h*360) + ' ' + Math.round(s*100) + '% ' + Math.round(l*100) + '%';
                      }
                      document.documentElement.style.setProperty('--primary', hsl);
                      document.documentElement.style.setProperty('--ring', hsl);
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
