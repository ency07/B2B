import type { Metadata } from "next";
import { Inter, Fraunces, IBM_Plex_Mono } from "next/font/google";
import { ThemeProvider } from "@/platform/providers/theme-provider";
import { Toaster } from "@/platform/ui/toaster";
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
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {/* Synchronous inline script placed inside ThemeProvider to execute immediately after next-themes' script and override theme/colors for tenants */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                try {
                  const params = new URLSearchParams(window.location.search);
                  const tenant = params.get('tenant');
                  if (tenant) {
                    const cached = localStorage.getItem('tenant_config_' + tenant);
                    if (cached) {
                      const config = JSON.parse(cached);
                      if (config.theme === 'dark') {
                        document.documentElement.classList.add('dark');
                      } else {
                        document.documentElement.classList.remove('dark');
                      }
                      if (config.primaryColor) {
                        document.documentElement.style.setProperty('--primary', config.primaryColor);
                        document.documentElement.style.setProperty('--ring', config.primaryColor);
                      }
                    } else {
                      // Fallback: sin tenant_config en localStorage, no aplicamos
                      // tema ni color. El tenant debe configurar el branding desde
                      // el CMS. Para evitar un flash feo, no forzamos nada.
                    }
                  }
                } catch (e) {}
              `,
            }}
          />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
