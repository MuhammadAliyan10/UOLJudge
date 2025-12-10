"use client";

import Image from "next/image";

export default function Loading() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="animate-pulse">
        <Image
          src="/Logo.png"
          alt="UOLJudge"
          width={120}
          height={120}
          priority
          className="drop-shadow-lg"
        />
      </div>
    </div>
  );
}
