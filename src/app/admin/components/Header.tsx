"use client";

import { Menu, Clock } from "lucide-react";

export interface HeaderProps {
  currentTitle: string;
  currentTime: string;
  toggleMobileSidebar: () => void;
}

export default function Header({
  currentTitle,
  currentTime,
  toggleMobileSidebar,
}: HeaderProps) {
  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-md transition"
          onClick={toggleMobileSidebar}
        >
          <Menu size={20} />
        </button>

        {/* Title / Breadcrumb */}
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold text-slate-800 tracking-tight">
            {currentTitle}
          </h2>
        </div>
      </div>

      {/* UTC Clock Badge */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-full">
        <Clock size={14} className="text-slate-500" />
        <span className="text-xs font-medium text-slate-600 font-mono">
          {currentTime} UTC
        </span>
      </div>
    </header>
  );
}
