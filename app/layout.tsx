import type { Metadata, Viewport } from "next";
import PwaRegister from "@/components/PwaRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: "Truco no Valville",
  description: "App oficial do truco semanal do Valville.",
  applicationName: "Truco Valville",
  appleWebApp: {
    capable: true,
    title: "Truco Valville",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/logo_truco.png",
    apple: "/logo_truco.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B6B3A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}