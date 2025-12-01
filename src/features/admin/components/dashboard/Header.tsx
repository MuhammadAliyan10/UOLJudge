"use client";

import { Menu, Clock, Search, Command as CommandIcon, ChevronRight, Laptop, Moon, Sun, Users, Trophy, Settings, Shield } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useContestSocket } from "@/features/contest/hooks/useContestSocket";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/features/shared/ui/command";
import { Button } from "@/features/shared/ui/button";
import { cn } from "@/lib/utils";

export interface HeaderProps {
  currentTitle: string;
  currentTime: string; // Kept for prop compatibility, but we use local time for display
  toggleMobileSidebar: () => void;
}

export default function Header({
  currentTitle,
  currentTime,
  toggleMobileSidebar,
}: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<"ok" | "error">("ok");
  const [now, setNow] = useState(new Date());

  // WS Status
  const { isConnected } = useContestSocket();

  // Keyboard Shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Clock Tick
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // DB Health Poll
  useEffect(() => {
    const checkDb = async () => {
      try {
        const res = await fetch("/api/health");
        if (res.ok) setDbStatus("ok");
        else setDbStatus("error");
      } catch {
        setDbStatus("error");
      }
    };

    checkDb(); // Initial check
    const interval = setInterval(checkDb, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  // Generate breadcrumbs from pathname
  const breadcrumbs = pathname
    .split("/")
    .filter((segment) => segment !== "")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1));

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm transition-all duration-300 sm:px-6">
      {/* Left Section: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-4">
        {/* Mobile Toggle */}
        <button
          className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
          onClick={toggleMobileSidebar}
        >
          <Menu size={20} />
        </button>

        {/* Title / Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-2">
              {index > 0 && <ChevronRight size={14} className="text-slate-300" />}
              <span
                className={
                  index === breadcrumbs.length - 1
                    ? "font-semibold text-slate-900 bg-slate-100/50 px-2 py-1 rounded-md"
                    : "text-slate-500 hidden sm:block"
                }
              >
                {crumb}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Section: Actions & Global Search */}
      <div className="flex items-center gap-2 sm:gap-4">

        {/* Status Indicators (Traffic Lights) */}
        <div className="hidden md:flex items-center gap-3 mr-2">
          <div className="flex items-center gap-1.5" title="WebSocket Connection">
            <div className={cn("h-2.5 w-2.5 rounded-full transition-colors", isConnected ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-red-500")} />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">WS</span>
          </div>
          <div className="flex items-center gap-1.5" title="Database Connection">
            <div className={cn("h-2.5 w-2.5 rounded-full transition-colors", dbStatus === "ok" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-red-500")} />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DB</span>
          </div>
        </div>

        {/* Search Trigger */}
        <button
          onClick={() => setOpen(true)}
          className="group hidden items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 transition-all hover:border-slate-300 hover:bg-slate-100 md:flex"
        >
          <Search
            size={14}
            className="text-slate-400 group-hover:text-slate-500 transition-colors"
          />
          <span className="ml-2 w-32 text-left text-sm text-slate-400 group-hover:text-slate-500">
            Search...
          </span>
          <div className="flex items-center gap-1 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-400">
            <CommandIcon size={10} />
            <span>K</span>
          </div>
        </button>

        <CommandDialog open={open} onOpenChange={setOpen}>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Navigation">
              <CommandItem onSelect={() => runCommand(() => router.push("/admin/dashboard"))}>
                <Laptop className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push("/admin/contests"))}>
                <Trophy className="mr-2 h-4 w-4" />
                <span>Contests</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push("/admin/users/jury"))}>
                <Shield className="mr-2 h-4 w-4" />
                <span>Jury Management</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push("/admin/teams"))}>
                <Users className="mr-2 h-4 w-4" />
                <span>Teams</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="System">
              <CommandItem onSelect={() => runCommand(() => router.push("/admin/settings"))}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandDialog>

        {/* Clock - Formatted */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md">
          <Clock size={14} className="text-slate-400" />
          <span className="text-xs font-medium text-slate-600 font-mono tabular-nums">
            {format(now, "d MMM, h:mm a")}
          </span>
        </div>

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* Profile */}
        <div className="flex items-center gap-2">
          <button className="flex h-8 w-8 items-center justify-center rounded-full bg-[#635BFF] text-white text-sm font-medium ring-2 ring-transparent hover:ring-[#635BFF]/30 transition-all">
            A
          </button>
        </div>
      </div>
    </header>
  );
}