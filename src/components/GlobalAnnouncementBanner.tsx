"use client";

import { useState, useEffect } from "react";
import { X, Megaphone } from "lucide-react";
import { Button } from "@/features/shared/ui/button";

interface Props {
    message: string;
}

export function GlobalAnnouncementBanner({ message }: Props) {
    // Track dismissal state based on message hash
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined' || !message || message.trim() === '') {
            setDismissed(true);
            return;
        }

        // Hash the message to create a unique identifier
        const currentHash = btoa(encodeURIComponent(message));
        const dismissedHash = localStorage.getItem('dismissedAnnouncement');

        // If this specific message was previously dismissed, keep it dismissed
        if (dismissedHash === currentHash) {
            setDismissed(true);
        } else {
            // New message, show it
            setDismissed(false);
        }
    }, [message]);

    const handleDismiss = () => {
        if (!message || message.trim() === '') return;

        const currentHash = btoa(encodeURIComponent(message));
        localStorage.setItem('dismissedAnnouncement', currentHash);
        setDismissed(true);
    };

    if (!message || message.trim() === "" || dismissed) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                    <Megaphone className="w-5 h-5 flex-shrink-0 animate-pulse" />
                    <p className="font-medium text-sm md:text-base">{message}</p>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="text-white hover:bg-white/20 flex-shrink-0"
                >
                    <X className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}
