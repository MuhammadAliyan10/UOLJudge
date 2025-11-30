"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Trophy,
  Users,
  FileStack,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Tally1,
  Tally2,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/server/actions/auth/auth";
import { toast } from "sonner";
import Image from "next/image";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/features/shared/ui/alert-dialog";
import { useState } from "react";

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
  { name: "Jury", href: "/admin/users/jury", icon: Shield },
  { name: "Logs", href: "/admin/logs", icon: FileStack },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function Sidebar({
  isCollapsed,
  toggleSidebar,
  isMobileOpen,
  closeMobileSidebar,
}: SidebarProps) {
  const pathname = usePathname();

  const handleLogout = async () => {
    await logoutAction();
  };

  const [openLogout, setOpenLogout] = useState(false);

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          isMobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={closeMobileSidebar}
      />

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-screen flex-col border-r border-slate-200 bg-white transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1)",
          isCollapsed ? "w-[72px]" : "w-[260px]",
          isMobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header/Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
          <div className="flex items-center gap-3 overflow-hidden min-w-0">
            <div className="flex-shrink-0 flex items-center justify-center  text-white">
              {/* Simplified Logo */}
              <Image src={"/Logo.png"} alt="Logo" width={30} height={30} />
            </div>
            <span
              className={cn(
                "font-bold text-slate-800 text-[15px] tracking-tight whitespace-nowrap transition-all duration-300",
                isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
              )}
            >
              UOLJudge
            </span>
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={closeMobileSidebar}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Desktop Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="hidden lg:flex absolute -right-7 top-[45%] bg-white  p-1 text-black hover:text-[#635BFF]  hover:scale-105  transition-all z-50"
        >
          {isCollapsed ? <Tally1 size={15} /> : <Tally2 size={15} />}
        </button>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-0.5 overflow-y-auto custom-scrollbar">

          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileSidebar}
                  className={cn(
                    "group flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-[#635BFF]/10 text-[#635BFF]"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <Icon
                    size={20}
                    className={cn(
                      "flex-shrink-0 transition-colors",
                      isActive
                        ? "text-[#635BFF]"
                        : "text-slate-400 group-hover:text-slate-600"
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span
                    className={cn(
                      "whitespace-nowrap transition-all duration-300 overflow-hidden",
                      isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                    )}
                  >
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>

        </nav>

        {/* Footer - Logout */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/50">
          <AlertDialog open={openLogout} onOpenChange={setOpenLogout}>
            <AlertDialogTrigger asChild>
              <button
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:text-red-600 hover:shadow-sm rounded-md transition-all duration-200 group border border-transparent hover:border-slate-200",
                  isCollapsed && "justify-center"
                )}
              >
                <LogOut
                  size={20}
                  className="flex-shrink-0 text-slate-400 group-hover:text-red-600 transition-colors"
                  strokeWidth={2}
                />
                <span
                  className={cn(
                    "whitespace-nowrap transition-all duration-300 overflow-hidden",
                    isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                  )}
                >
                  Sign Out
                </span>
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white border-slate-200">
              <AlertDialogHeader>
                <AlertDialogTitle>Sign out?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to sign out of the admin console?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-slate-200">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white border-red-700"
                >
                  Sign Out
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </aside>
    </>
  );
}