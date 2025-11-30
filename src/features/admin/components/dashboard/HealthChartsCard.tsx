"use client";

import { useEffect, useState } from "react";
import { Activity, TrendingUp } from "lucide-react";
import { getSystemMetrics, type SystemMetrics } from "@/server/actions/admin/system-health";
import { LambdaGauge } from "@/features/admin/components/dashboard/LambdaGauge";

/**
 * HealthChartsCard - Real-time system monitoring with Lambda Gauges
 * Polls system metrics every 2 seconds with proper cleanup
 */
export default function HealthChartsCard() {
    const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch metrics function
    const fetchMetrics = async () => {
        try {
            const data = await getSystemMetrics();
            setMetrics(data);
            setIsLoading(false);
        } catch (error) {
            console.error("[HealthCharts] Failed to fetch metrics:", error);
            // Set all metrics to null on error (triggers offline state)
            setMetrics({
                cpu: null,
                memory: null,
                memoryUsed: null,
                memoryTotal: null,
                disk: null,
                diskFree: null,
                diskTotal: null,
                network: null,
                networkRate: null,
            });
            setIsLoading(false);
        }
    };

    // Poll metrics every 2 seconds (optimized for low-spec servers)
    useEffect(() => {
        fetchMetrics();
        const interval = setInterval(fetchMetrics, 2000);

        // CRITICAL: Cleanup interval on unmount to prevent memory leaks
        return () => clearInterval(interval);
    }, []);

    // Initial Loading State
    if (isLoading) {
        return (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <Activity size={24} className="text-slate-600 animate-pulse" />
                    <h3 className="text-lg font-semibold text-slate-800">
                        System Health Monitoring
                    </h3>
                </div>
                <div className="h-80 flex items-center justify-center">
                    <p className="text-slate-400">Loading system metrics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50">
                        <TrendingUp size={24} className="text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800">
                            System Health Monitoring
                        </h3>
                        <p className="text-xs text-slate-500">
                            Real-time performance metrics • 2s refresh
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-slate-500 font-medium">Live</span>
                </div>
            </div>

            {/* Gauges Grid - 4 columns on large screens */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* CPU Gauge */}
                <LambdaGauge
                    value={metrics?.cpu ?? null}
                    max={100}
                    title="CPU Usage"
                    unit="%"
                    threshold={70}
                />

                {/* Memory Gauge */}
                <LambdaGauge
                    value={metrics?.memoryUsed ?? null}
                    max={metrics?.memoryTotal ?? null}
                    title="Memory Usage"
                    unit="MB"
                    threshold={70}
                />

                {/* Disk Gauge */}
                <LambdaGauge
                    value={
                        metrics?.disk && metrics?.diskTotal
                            ? ((metrics.disk / 100) * metrics.diskTotal)
                            : null
                    }
                    max={metrics?.diskTotal ?? null}
                    title="Disk Usage"
                    unit="GB"
                    threshold={70}
                />

                {/* Network Gauge */}
                <LambdaGauge
                    value={metrics?.network ?? null}
                    max={100}
                    title="Network Load"
                    unit="%"
                    threshold={70}
                />
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-center gap-6 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-emerald-500" />
                        <span className="text-slate-600">Healthy (0-70%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-amber-500" />
                        <span className="text-slate-600">Warning (70-90%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-red-500" />
                        <span className="text-slate-600">Critical (90-100%)</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
