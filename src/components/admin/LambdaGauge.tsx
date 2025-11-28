"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Loader2 } from "lucide-react";

interface LambdaGaugeProps {
    value: number | null;
    max: number | null;
    title: string;
    unit: string;
    threshold?: number; // Optional custom threshold (default 70% warning, 90% critical)
}

/**
 * LambdaGauge Component - Displays system metrics as color-coded gauges
 * 
 * Color States:
 * - Green: 0-70% (Safe)
 * - Orange: 70-90% (Warning)
 * - Red: 90-100% (Critical)
 * - Grey: null/undefined (Offline/Loading)
 */
export function LambdaGauge({ value, max, title, unit, threshold = 70 }: LambdaGaugeProps) {
    // Handle offline/null state - CRITICAL: Never snap to 0%
    if (value === null || value === undefined || max === null || max === undefined) {
        return (
            <Card className="border-muted">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center h-[180px]">
                        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground mt-4">Connecting...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Calculate percentage (handle zero division)
    const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;

    // Determine color based on percentage
    const getColor = (pct: number): string => {
        if (pct >= 90) return "hsl(0, 84%, 60%)"; // Red - Critical
        if (pct >= threshold) return "hsl(38, 92%, 50%)"; // Orange - Warning
        return "hsl(142, 76%, 36%)"; // Green - Safe
    };

    const getColorName = (pct: number): string => {
        if (pct >= 90) return "Critical";
        if (pct >= threshold) return "Warning";
        return "Healthy";
    };

    const activeColor = getColor(percentage);
    const colorName = getColorName(percentage);
    const remainingPercentage = 100 - percentage;

    // Pie chart data
    const data = [
        { name: "Used", value: percentage, color: activeColor },
        { name: "Free", value: remainingPercentage, color: "hsl(var(--muted))" },
    ];

    return (
        <Card className="border-muted">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center">
                    {/* Gauge Chart */}
                    <ResponsiveContainer width="100%" height={150}>
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                startAngle={180}
                                endAngle={0}
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Percentage Display */}
                    <div className="text-center -mt-4">
                        <div className="text-3xl font-bold" style={{ color: activeColor }}>
                            {Math.round(percentage)}%
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{colorName}</div>
                    </div>

                    {/* Detailed Stats */}
                    <div className="text-sm text-muted-foreground mt-4 text-center">
                        <div>
                            <span className="font-medium text-foreground">
                                {typeof value === "number" ? value.toFixed(1) : value}
                            </span>{" "}
                            {unit}
                            {" / "}
                            <span className="font-medium text-foreground">
                                {typeof max === "number" ? max.toFixed(1) : max}
                            </span>{" "}
                            {unit}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
