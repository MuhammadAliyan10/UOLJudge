"use client";

import { format } from "date-fns";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContestTimelineProps {
    startTime: Date;
    endTime: Date;
    isActive: boolean;
}

export function ContestTimeline({
    startTime,
    endTime,
    isActive
}: ContestTimelineProps) {
    const start = new Date(startTime);
    const end = new Date(endTime);

    const dateFormat = "MMM dd";
    const timeFormat = "hh:mm a";


    return (
        <div className="flex flex-col gap-1.5">
            {/* Start */}
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-700">{format(start, dateFormat)}</span>
                    <span className="font-mono text-slate-500 bg-slate-100 px-1 rounded">{format(start, timeFormat)}</span>
                </div>
            </div>

            {/* Connector */}
            <div className="ml-[2.5px] w-px h-2 bg-slate-200" />

            {/* End */}
            <div className="flex items-center gap-2">
                <div className={cn("w-1.5 h-1.5 rounded-full", isActive ? "bg-emerald-400" : "bg-slate-300")} />
                <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-700">{format(end, dateFormat)}</span>
                    <span className="font-mono text-slate-500 bg-slate-100 px-1 rounded">{format(end, timeFormat)}</span>
                </div>
            </div>
        </div>
    );
}