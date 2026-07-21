import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VersionGate — Self-hosted zero-downtime Docker deploys",
  description:
    "Self-hosted blue-green deployment engine. Push to GitHub — VersionGate builds, health-checks, and switches traffic on your own server with zero downtime.",
  icons: { icon: "/favicon.svg" },
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
    <html lang="en">
      <body className={`${inter.variable} ${jetbrains.variable} antialiased`}>{children}</body>
    </html>
  );
}
