"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Trophy,
  Users,
  List,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  FileCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/server/actions/auth"; // Import the Server Action
import { toast } from "sonner";

export interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  isMobileOpen: boolean;
  closeMobileSidebar: () => void;
}

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Contests", href: "/admin/contests", icon: Trophy },
  { name: "Teams", href: "/admin/teams", icon: Users },
  { name: "Grading", href: "/admin/grading", icon: FileCheck },
  { name: "Logs", href: "/admin/logs", icon: List },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function Sidebar({
  isCollapsed,
  toggleSidebar,
  isMobileOpen,
  closeMobileSidebar,
}: SidebarProps) {
  const pathname = usePathname();

  // --- LOGOUT LOGIC ---
  const handleLogout = async () => {
    // Optional: Add a loading toast if the network is slow
    toast.loading("Signing out...", { duration: 1000 });

    // Call the Server Action
    // This will clear the cookie, revalidate cache, and redirect to /login
    await logoutAction();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm"
          onClick={closeMobileSidebar}
        />
      )}

      <aside
        className={cn(
          "fixed md:static inset-y-0 left-0 z-50 flex flex-col h-screen bg-white border-r border-slate-200 shadow-[2px_0_8px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 ease-in-out",
          isCollapsed ? "w-[80px]" : "w-[260px]",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Header / Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 mb-2 relative">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="min-w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-blue-200 shadow-md">
              <span className="text-white font-bold text-sm">UJ</span>
            </div>
            <span
              className={cn(
                "font-bold text-slate-800 text-lg tracking-tight whitespace-nowrap transition-opacity duration-300",
                isCollapsed ? "opacity-0" : "opacity-100"
              )}
            >
              UOLJudge
            </span>
          </div>
        </div>

        {/* Toggle Button (Desktop Only) */}
        <button
          onClick={toggleSidebar}
          className="hidden md:flex absolute -right-3 top-20 bg-white border border-slate-200 rounded-full p-1 text-slate-500 hover:text-blue-600 hover:border-blue-300 shadow-sm transition-all z-50"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto py-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileSidebar}
                className={cn(
                  "group flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 mb-1",
                  isActive
                    ? "bg-blue-50 text-blue-700 font-medium shadow-sm ring-1 ring-blue-100"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon
                  size={20}
                  className={cn(
                    "min-w-[20px] transition-colors",
                    isActive
                      ? "text-blue-600"
                      : "text-slate-400 group-hover:text-slate-600"
                  )}
                />
                <span
                  className={cn(
                    "ml-3 whitespace-nowrap transition-all duration-300 overflow-hidden",
                    isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                  )}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer (Logout) */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={handleLogout} // <--- Connected to Server Action
            className="w-full flex items-center px-3 py-2.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all group"
          >
            <LogOut
              size={20}
              className="min-w-[20px] group-hover:text-red-600 text-slate-400"
            />
            <span
              className={cn(
                "ml-3 whitespace-nowrap font-medium transition-all duration-300 overflow-hidden",
                isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
              )}
            >
              Sign Out
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
