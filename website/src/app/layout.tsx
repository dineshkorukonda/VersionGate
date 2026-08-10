import type { Metadata } from "next";
import { Space_Grotesk, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VersionGate — Self-hosted zero-downtime Docker deploys",
  description:
    "Self-hosted blue-green deployment engine. Push to GitHub — VersionGate builds, health-checks, and switches traffic on your own server with zero downtime.",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "VersionGate",
    description:
      "Self-hosted zero-downtime Docker deploys on your own server. Blue-green slots, GitHub integration, environment promotion.",
    url: "https://versiongate.tech",
    siteName: "VersionGate",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" data-theme="dark">
      <body
        className={`${display.variable} ${sans.variable} ${mono.variable} font-sans antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
