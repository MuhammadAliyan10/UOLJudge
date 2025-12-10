"use client";

import Image from "next/image";

export default function Loading() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Image
        src="/Logo.png"
        alt="UOLJudge"
        width={120}
        height={120}
        priority
        className="drop-shadow-lg animate-fade"
      />
      <style jsx global>{`
        @keyframes fade {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
        }
        .animate-fade {
          animation: fade 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
