import type { Metadata } from "next";

import "./globals.css";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import NextTopLoader from "nextjs-toploader";

// 1. Font Configuration
// Using system fonts to avoid network dependency during Docker build
// const inter = Inter({
//   subsets: ["latin"],
//   variable: "--font-inter",
//   display: "swap",
// });

// 2. Metadata (SEO & Tab Title)
export const metadata: Metadata = {
  title: {
    template: "%s | UOLJudge",
    default: "UOLJudge - Competitive Programming Platform",
  },
  description: "Official offline competitive programming system for UOL.",
};

// 3. Force Dynamic Rendering
// This prevents Next.js from trying to prerender this layout at build time,
// which would fail because the database isn't available during Docker build
export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="min-h-screen bg-white font-sans antialiased"
        suppressHydrationWarning
      >
        <NextTopLoader
          color="#4F39F6"
          height={3}
          showSpinner={false}
          crawlSpeed={200}
          speed={200}
          easing="ease"
          shadow="0 0 10px #4F39F6,0 0 5px #4F39F6"
        />

        <Toaster position="top-right" />
        {children}
        <Toaster
          position="top-right"
          theme="light"
          richColors
          closeButton
        />
      </body>
    </html>
  );
}
