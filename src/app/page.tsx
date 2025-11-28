"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Terminal } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      router.push("/login");
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      {loading && (
        <div className="flex flex-col items-center gap-5 animate-fadeIn">
          {/* Logo Box */}
          <div className="p-5 rounded-2xl border border-zinc-200 shadow-sm bg-white scale-anim">
            <Terminal className="w-12 h-12 text-blue-600 animate-pulse" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight slide-up">
            UOL<span className="text-blue-600">Judge</span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm text-zinc-500 slide-up delay-150">
            Competitive Programming Platform
          </p>

          {/* Animated Loading Brackets */}
          <div className="flex items-center gap-2 mt-2 code-loader">
            <span className="text-blue-600 text-xl font-bold animate-bracket">
              &lt;
            </span>
            <span className="w-3 h-3 rounded-full bg-blue-600 animate-bounce" />
            <span className="w-3 h-3 rounded-full bg-blue-600 animate-bounce delay-150" />
            <span className="w-3 h-3 rounded-full bg-blue-600 animate-bounce delay-300" />
            <span className="text-blue-600 text-xl font-bold animate-bracket">
              &gt;
            </span>
          </div>

          {/* Loading text */}
          <p className="text-zinc-600 text-sm fade-slow">Loading…</p>
        </div>
      )}
    </div>
  );
}
