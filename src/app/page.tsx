"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
    <div className="flex min-h-screen items-center justify-center bg-white relative overflow-hidden">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>

      {loading && (
        <div className="relative z-10">
          {/* Main Loading Animation */}
          <div className="relative w-32 h-32">
            {/* Outer rotating ring */}
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-500 animate-spin-slow"></div>

            {/* Middle rotating ring */}
            <div className="absolute inset-3 rounded-full border-4 border-transparent border-t-purple-500 border-r-purple-500 animate-spin-reverse"></div>

            {/* Inner pulsing circle */}
            <div className="absolute inset-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 animate-pulse-scale"></div>

            {/* Center dot */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-white animate-ping-slow"></div>
              <div className="absolute w-3 h-3 rounded-full bg-white"></div>
            </div>

            {/* Orbiting particles */}
            <div className="absolute inset-0 animate-spin-particles">
              <div className="absolute top-0 left-1/2 w-2 h-2 -ml-1 -mt-1 rounded-full bg-blue-400"></div>
            </div>
            <div className="absolute inset-0 animate-spin-particles-reverse">
              <div className="absolute bottom-0 left-1/2 w-2 h-2 -ml-1 -mb-1 rounded-full bg-purple-400"></div>
            </div>
            <div className="absolute inset-0 animate-spin-particles-slow">
              <div className="absolute top-1/2 right-0 w-2 h-2 -mr-1 -mt-1 rounded-full bg-indigo-400"></div>
            </div>
          </div>

          {/* Loading bars beneath */}
          <div className="flex gap-2 justify-center mt-12">
            <div className="w-1.5 h-12 bg-blue-500 rounded-full animate-bar-1"></div>
            <div className="w-1.5 h-12 bg-purple-500 rounded-full animate-bar-2"></div>
            <div className="w-1.5 h-12 bg-indigo-500 rounded-full animate-bar-3"></div>
            <div className="w-1.5 h-12 bg-blue-500 rounded-full animate-bar-4"></div>
            <div className="w-1.5 h-12 bg-purple-500 rounded-full animate-bar-5"></div>
          </div>
        </div>
      )}

      <style jsx>{`
        .bg-grid-pattern {
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          background-size: 50px 50px;
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }

        @keyframes pulse-scale {
          0%, 100% { 
            transform: scale(1);
            opacity: 0.8;
          }
          50% { 
            transform: scale(1.1);
            opacity: 1;
          }
        }

        @keyframes ping-slow {
          75%, 100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }

        @keyframes spin-particles {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes spin-particles-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }

        @keyframes spin-particles-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes bar-wave {
          0%, 100% { 
            transform: scaleY(0.3);
            opacity: 0.3;
          }
          50% { 
            transform: scaleY(1);
            opacity: 1;
          }
        }

        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }

        .animate-spin-reverse {
          animation: spin-reverse 2s linear infinite;
        }

        .animate-pulse-scale {
          animation: pulse-scale 2s ease-in-out infinite;
        }

        .animate-ping-slow {
          animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        .animate-spin-particles {
          animation: spin-particles 4s linear infinite;
        }

        .animate-spin-particles-reverse {
          animation: spin-particles-reverse 3s linear infinite;
        }

        .animate-spin-particles-slow {
          animation: spin-particles-slow 5s linear infinite;
        }

        .animate-bar-1 {
          animation: bar-wave 1s ease-in-out infinite;
          animation-delay: 0s;
        }

        .animate-bar-2 {
          animation: bar-wave 1s ease-in-out infinite;
          animation-delay: 0.1s;
        }

        .animate-bar-3 {
          animation: bar-wave 1s ease-in-out infinite;
          animation-delay: 0.2s;
        }

        .animate-bar-4 {
          animation: bar-wave 1s ease-in-out infinite;
          animation-delay: 0.3s;
        }

        .animate-bar-5 {
          animation: bar-wave 1s ease-in-out infinite;
          animation-delay: 0.4s;
        }
      `}</style>
    </div>
  );
}