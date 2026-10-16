import type { Metadata, Viewport } from "next";
import { fraunces, ibmPlexSans, ibmPlexMono } from "@/lib/fonts";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#1a3a6e",
};

export const metadata: Metadata = {
  title: "Pentecost Convention Center - Visitor Management System",
  description: "Visitor management system for Pentecost Convention Center",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", fraunces.variable, ibmPlexSans.variable, ibmPlexMono.variable, "font-sans", geist.variable)}
      style={{ backgroundColor: '#FFFFFF', color: '#152420' }}
    >
      <body 
        className="min-h-full flex flex-col"
        style={{ backgroundColor: '#FFFFFF', color: '#152420' }}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
