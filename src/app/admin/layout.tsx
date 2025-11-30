"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/features/admin/components/dashboard/Sidebar";
import Header from "@/features/admin/components/dashboard/Header";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  // Initialize time immediately to avoid hydration mismatch (handled by useEffect below)
  const [currentTime, setCurrentTime] = useState<string>("--:--:--");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Desktop Toggle
  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  // Mobile Handlers
  const toggleMobileSidebar = () => setIsMobileOpen(!isMobileOpen);
  const closeMobileSidebar = () => setIsMobileOpen(false);

  // UTC time updater (Client-side only)
  useEffect(() => {
    setCurrentTime(new Date().toUTCString().replace("GMT", ""));
    const interval = setInterval(() => {
      setCurrentTime(new Date().toUTCString().replace("GMT", ""));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden text-slate-900 font-sans">
      <Sidebar
        isCollapsed={isCollapsed}
        toggleSidebar={toggleSidebar}
        isMobileOpen={isMobileOpen}
        closeMobileSidebar={closeMobileSidebar}
      />

      {/* MAIN CONTENT WRAPPER */}
      <div
        className={cn(
          "flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ease-in-out",
          isCollapsed ? "lg:ml-[72px]" : "lg:ml-[260px]"
        )}
      >
        <Header
          currentTitle="" // Prop kept for interface compatibility but unused
          currentTime={currentTime}
          toggleMobileSidebar={toggleMobileSidebar}
        />

        {/* SCROLLABLE MAIN */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
