"use client";

import { format } from "date-fns";
import { ArrowRight } from "lucide-react";

interface ContestTimelineProps {
    startTime: Date;
    endTime: Date;
    isActive: boolean;
}

export function ContestTimeline({
    startTime,
    endTime,
}: ContestTimelineProps) {
    const start = new Date(startTime);
    const end = new Date(endTime);

    return (
        <div className="flex items-center gap-2 text-sm text-slate-700">
            <span className="font-medium">{format(start, "MMM dd, h:mm a")}</span>
            <ArrowRight size={14} className="text-slate-400" />
            <span className="font-medium">{format(end, "MMM dd, h:mm a")}</span>
        </div>
    );
}
