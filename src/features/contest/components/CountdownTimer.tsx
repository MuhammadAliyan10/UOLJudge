"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
    targetDate: Date;
    className?: string;
}

export const CountdownTimer = ({ targetDate, className }: CountdownTimerProps) => {
    const [isExpired, setIsExpired] = useState(false);
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
    });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const difference = targetDate.getTime() - now.getTime();

            if (difference <= 0) {
                if (!isExpired) {
                    setIsExpired(true);
                }
                return {
                    days: 0,
                    hours: 0,
                    minutes: 0,
                    seconds: 0,
                };
            }

            return {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / (1000 * 60)) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        };

        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate, isExpired]);

    const formatNumber = (num: number) => {
        return num.toString().padStart(2, "0");
    };

    const splitDigits = (num: number) => {
        const formatted = formatNumber(num);
        return [formatted.charAt(0), formatted.charAt(1)];
    };

    const [days1, days2] = splitDigits(timeLeft.days > 99 ? 99 : timeLeft.days);
    const [hours1, hours2] = splitDigits(timeLeft.hours);
    const [minutes1, minutes2] = splitDigits(timeLeft.minutes);
    const [seconds1, seconds2] = splitDigits(timeLeft.seconds);

    return (
        <div className={cn("text-center", className)}>
            {!isExpired && (
                <div className="flex items-center justify-center gap-3 md:gap-6">
                    {timeLeft.days > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs md:text-sm text-slate-500 font-medium uppercase tracking-wider">Days</p>
                            <div className="flex justify-center gap-1">
                                <div className="bg-slate-100 border border-slate-200 w-12 h-14 md:w-16 md:h-20 flex items-center justify-center text-2xl md:text-4xl font-bold text-slate-900 rounded-lg shadow-sm">
                                    {days1}
                                </div>
                                <div className="bg-slate-100 border border-slate-200 w-12 h-14 md:w-16 md:h-20 flex items-center justify-center text-2xl md:text-4xl font-bold text-slate-900 rounded-lg shadow-sm">
                                    {days2}
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="space-y-2">
                        <p className="text-xs md:text-sm text-slate-500 font-medium uppercase tracking-wider">Hours</p>
                        <div className="flex justify-center gap-1">
                            <div className="bg-slate-100 border border-slate-200 w-12 h-14 md:w-16 md:h-20 flex items-center justify-center text-2xl md:text-4xl font-bold text-slate-900 rounded-lg shadow-sm">
                                {hours1}
                            </div>
                            <div className="bg-slate-100 border border-slate-200 w-12 h-14 md:w-16 md:h-20 flex items-center justify-center text-2xl md:text-4xl font-bold text-slate-900 rounded-lg shadow-sm">
                                {hours2}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-xs md:text-sm text-slate-500 font-medium uppercase tracking-wider">Minutes</p>
                        <div className="flex justify-center gap-1">
                            <div className="bg-slate-100 border border-slate-200 w-12 h-14 md:w-16 md:h-20 flex items-center justify-center text-2xl md:text-4xl font-bold text-slate-900 rounded-lg shadow-sm">
                                {minutes1}
                            </div>
                            <div className="bg-slate-100 border border-slate-200 w-12 h-14 md:w-16 md:h-20 flex items-center justify-center text-2xl md:text-4xl font-bold text-slate-900 rounded-lg shadow-sm">
                                {minutes2}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-xs md:text-sm text-slate-500 font-medium uppercase tracking-wider">Seconds</p>
                        <div className="flex justify-center gap-1">
                            <div className="bg-slate-100 border border-slate-200 w-12 h-14 md:w-16 md:h-20 flex items-center justify-center text-2xl md:text-4xl font-bold text-slate-900 rounded-lg shadow-sm">
                                {seconds1}
                            </div>
                            <div className="bg-slate-100 border border-slate-200 w-12 h-14 md:w-16 md:h-20 flex items-center justify-center text-2xl md:text-4xl font-bold text-slate-900 rounded-lg shadow-sm">
                                {seconds2}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
