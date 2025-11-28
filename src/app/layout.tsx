import type { Metadata } from "next";
// import { Inter } from "next/font/google"; // Disabled for offline/docker build stability
import "./globals.css";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          // 3. Force Light Mode & Base Styles
          "min-h-screen bg-white font-sans antialiased",
          // inter.variable
        )}
      >
        {children}

        {/* 4. Notification System (Forced Light Mode) */}
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