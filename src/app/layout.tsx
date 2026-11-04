import type { Metadata, Viewport } from "next";

import { AppShell } from "@/components/layout/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "MEU TREINO",
  description: "Treinamento e evolução",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Meu Treino",
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
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full bg-[#09090B] text-[#F4F4F5]">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
