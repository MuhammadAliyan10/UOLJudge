"use client";

/**
 * Kill Switch: Full-screen disqualification overlay
 * Prevents all team interaction when blocked by admin
 */
export function BlockedOverlay() {
    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{
                background: "linear-gradient(135deg, #7f1d1d 0%, #1a0000 100%)",
                pointerEvents: "all"
            }}
        >
            <div className="text-center px-8 max-w-2xl">
                {/* Main Warning Icon */}
                <div className="mb-8 animate-pulse">
                    <svg
                        className="w-32 h-32 mx-auto text-red-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                </div>

                {/* Title */}
                <h1 className="text-6xl font-black text-red-500 mb-6 tracking-wider uppercase">
                    Access Revoked
                </h1>

                {/* Subtitle */}
                <p className="text-3xl font-bold text-white mb-4">
                    DISQUALIFIED
                </p>

                {/* Description */}
                <p className="text-xl text-red-200 mb-8 max-w-lg mx-auto">
                    Your team has been blocked by the administrators.
                    All contest access has been suspended.
                </p>

                {/* Animated Border */}
                <div className="relative inline-block">
                    <div className="absolute inset-0 bg-red-600 blur-xl opacity-50 animate-pulse"></div>
                    <div className="relative bg-red-950 border-4 border-red-500 px-8 py-4 rounded-lg">
                        <p className="text-red-300 font-mono text-sm">
                            Contact administrators for assistance
                        </p>
                    </div>
                </div>

                {/* Subtle Pattern Background */}
                <div
                    className="absolute inset-0 opacity-5"
                    style={{
                        backgroundImage: `repeating-linear-gradient(
                            45deg,
                            transparent,
                            transparent 10px,
                            rgba(255, 0, 0, 0.1) 10px,
                            rgba(255, 0, 0, 0.1) 20px
                        )`,
                    }}
                ></div>
            </div>
        </div>
    );
}
