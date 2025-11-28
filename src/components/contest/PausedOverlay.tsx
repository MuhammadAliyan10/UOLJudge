"use client";

import { XCircle } from "lucide-react";

interface PausedOverlayProps {
    pausedAt?: Date | null;
}

export function PausedOverlay({ pausedAt }: PausedOverlayProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white border-4 border-red-600 rounded-lg shadow-2xl p-12 max-w-lg mx-4 text-center">
                {/* Icon */}
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <div className="text-6xl">⛔</div>
                </div>

                {/* Heading */}
                <h1 className="text-4xl font-bold text-red-600 mb-4 uppercase tracking-tight">
                    Contest Paused
                </h1>

                {/* Message */}
                <p className="text-lg text-slate-700 mb-6 leading-relaxed">
                    Please wait for instructions from the contest administrator.
                </p>

                <div className="bg-red-50 border-2 border-red-200 rounded-md p-4 mb-6">
                    <p className="text-sm text-red-800 font-semibold">
                        ⚠️ No submissions will be accepted at this time.
                    </p>
                </div>

                {/* Timestamp */}
                {pausedAt && (
                    <div className="text-sm text-slate-500 font-mono">
                        Paused at: {new Date(pausedAt).toLocaleTimeString()}
                    </div>
                )}
            </div>
        </div>
    );
}
