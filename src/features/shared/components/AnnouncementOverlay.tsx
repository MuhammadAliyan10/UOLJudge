"use client";

import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/features/shared/ui/dialog";
import { AlertTriangle, Info, Megaphone } from "lucide-react";
import { useContestSocket } from "@/features/contest/hooks/useContestSocket";
import { cn } from "@/lib/utils";

export function AnnouncementOverlay() {
    const [open, setOpen] = useState(false);
    const [announcement, setAnnouncement] = useState<{
        title: string;
        message: string;
        type: "INFO" | "WARNING" | "CRITICAL";
    } | null>(null);

    useContestSocket({
        onAnnouncement: (payload) => {
            setAnnouncement(payload);
            setOpen(true);
            // Play sound? Maybe later.
        }
    });

    if (!announcement) return null;

    const getIcon = () => {
        switch (announcement.type) {
            case "CRITICAL": return <AlertTriangle className="h-12 w-12 text-red-600" />;
            case "WARNING": return <AlertTriangle className="h-12 w-12 text-amber-500" />;
            default: return <Megaphone className="h-12 w-12 text-blue-500" />;
        }
    };

    const getBorderColor = () => {
        switch (announcement.type) {
            case "CRITICAL": return "border-red-500 bg-red-50";
            case "WARNING": return "border-amber-500 bg-amber-50";
            default: return "border-blue-500 bg-blue-50";
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className={cn("sm:max-w-[600px] border-l-8", getBorderColor())}>
                <DialogHeader>
                    <div className="flex items-center gap-4">
                        {getIcon()}
                        <div>
                            <DialogTitle className="text-2xl font-bold uppercase tracking-wide">
                                {announcement.title}
                            </DialogTitle>
                            <DialogDescription className="text-base mt-2 font-medium text-slate-800">
                                {announcement.message}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    );
}
