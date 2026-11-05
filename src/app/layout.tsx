import type { Metadata, Viewport } from "next";

import { AppShell } from "@/components/layout/AppShell";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";
// Fontes dos temas, servidas pelo próprio app (sem depender do Google Fonts).
// O navegador só baixa os arquivos da fonte que o tema ativo usa.
import "@fontsource-variable/inter";
import "@fontsource/barlow/latin-400.css";
import "@fontsource/barlow/latin-500.css";
import "@fontsource/barlow/latin-600.css";
import "@fontsource/barlow/latin-700.css";
import "@fontsource/barlow/latin-800.css";
import "@fontsource/barlow-condensed/latin-600.css";
import "@fontsource/barlow-condensed/latin-700.css";
import "@fontsource/barlow-condensed/latin-800.css";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/manrope";
import "@fontsource-variable/sora";
import "./globals.css";

export const metadata: Metadata = {
  title: "MEU TREINO",
  description: "Treinamento e evolução",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Meu Treino",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090B",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased" suppressHydrationWarning>
      <head>
        {/* Aplica o tema salvo antes da primeira pintura. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-full bg-[var(--background)] text-[var(--foreground)]">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
