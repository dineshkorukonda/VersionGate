import type { Metadata } from "next";
import { IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VersionGate — Self-Hosted Zero-Downtime Docker & Multi-Runtime PaaS",
  description:
    "Self-hosted zero-downtime deployment engine: Git webhook builds, Blue/Green warm-swap slotting, in-dashboard DB studio, and PM2 supervision on your own VPS.",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "VersionGate — Self-Hosted Zero-Downtime Docker & Multi-Runtime PaaS",
    description:
      "Deploy Docker containers and host PM2 apps on your VPS with zero downtime, instant rollbacks, and built-in database management.",
    url: "https://versiongate.tech",
    siteName: "VersionGate",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" data-theme="dark">
      <body
        className={`${sans.variable} ${mono.variable} font-sans antialiased bg-background text-foreground`}
        style={{ "--font-display": "var(--font-mono)" } as React.CSSProperties}
      >
        {children}
      </body>
    </html>
  );
}
