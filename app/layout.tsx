import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import { RegisterSW } from "@/components/RegisterSW";
import "./globals.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Thulir — Charge time, spent well",
  description:
    "Thulir turns EV charge time into nearby offers, honest bay status, and rewards you can spend before you unplug.",
  manifest: "/manifest.json",
  icons: { icon: "/icon.svg" },
  appleWebApp: { capable: true, title: "Thulir", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#050a14",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable} antialiased`}>
        <RegisterSW />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
