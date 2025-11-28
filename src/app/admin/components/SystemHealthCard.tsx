'use client';

import { useEffect, useState } from 'react';
import { Activity, Cpu, HardDrive, Clock } from 'lucide-react';

// ============================================================
// TYPES
// ============================================================

interface SystemMetrics {
    totalMemoryGB: number;
    freeMemoryGB: number;
    cpuLoadPercent: number;
    uptimeSeconds: number;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Format uptime seconds into human-readable format
 * @param seconds - Total uptime in seconds
 * @returns Formatted string (e.g., "2d 5h 30m")
 */
function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);

    return parts.length > 0 ? parts.join(' ') : '0m';
}

/**
 * Get color class based on load percentage
 * @param percent - Load percentage (0-100)
 * @returns Color classes for text and background
 */
function getLoadColor(percent: number): { text: string; bg: string; badge: string } {
    if (percent <= 50) {
        return {
            text: 'text-emerald-600',
            bg: 'bg-emerald-50',
            badge: 'bg-emerald-500',
        };
    } else if (percent <= 75) {
        return {
            text: 'text-amber-600',
            bg: 'bg-amber-50',
            badge: 'bg-amber-500',
        };
    } else {
        return {
            text: 'text-red-600',
            bg: 'bg-red-50',
            badge: 'bg-red-500',
        };
    }
}

// ============================================================
// COMPONENT
// ============================================================

export default function SystemHealthCard() {
    const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch metrics from API
    const fetchMetrics = async () => {
        try {
            const response = await fetch('/api/metrics');

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data: SystemMetrics = await response.json();
            setMetrics(data);
            setError(null);
        } catch (err) {
            console.error('[SystemHealthCard] Failed to fetch metrics:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
        } finally {
            setIsLoading(false);
        }
    };

    // Poll metrics every 3 seconds
    useEffect(() => {
        fetchMetrics(); // Initial fetch

        const interval = setInterval(fetchMetrics, 3000);

        return () => clearInterval(interval);
    }, []);

    // Calculate memory usage percentage
    const memoryUsedGB = metrics ? metrics.totalMemoryGB - metrics.freeMemoryGB : 0;
    const memoryUsagePercent = metrics
        ? ((memoryUsedGB / metrics.totalMemoryGB) * 100).toFixed(1)
        : '0';

    const cpuColors = getLoadColor(metrics?.cpuLoadPercent ?? 0);
    const memoryColors = getLoadColor(parseFloat(memoryUsagePercent));

    // Loading State
    if (isLoading) {
        return (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-slate-100">
                        <Activity size={20} className="text-slate-600 animate-pulse" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">System Health</p>
                        <p className="text-xs text-slate-400">Loading metrics...</p>
                    </div>
                </div>
                <div className="space-y-3">
                    <div className="h-12 bg-slate-100 rounded animate-pulse" />
                    <div className="h-12 bg-slate-100 rounded animate-pulse" />
                </div>
            </div>
        );
    }

    // Error State
    if (error) {
        return (
            <div className="bg-white p-6 rounded-xl border border-red-200 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-red-50">
                        <Activity size={20} className="text-red-600" />
                    </div>
                    <p className="text-sm font-medium text-red-900">System Health</p>
                </div>
                <p className="text-xs text-red-600 mt-2">{error}</p>
            </div>
        );
    }

    // Main Content
    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] hover:border-slate-300 transition-colors">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-100">
                        <Activity size={20} className="text-slate-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">System Health</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-xs text-slate-400">Live • 3s refresh</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Metrics */}
            <div className="space-y-4">
                {/* CPU Load */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Cpu size={14} className="text-slate-400" />
                            <span className="text-xs font-medium text-slate-600">CPU Load</span>
                        </div>
                        <span className={`text-sm font-bold ${cpuColors.text}`}>
                            {metrics?.cpuLoadPercent.toFixed(1)}%
                        </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${cpuColors.badge} transition-all duration-500 ease-out`}
                            style={{ width: `${Math.min(metrics?.cpuLoadPercent ?? 0, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Memory Usage */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <HardDrive size={14} className="text-slate-400" />
                            <span className="text-xs font-medium text-slate-600">Memory</span>
                        </div>
                        <span className={`text-sm font-bold ${memoryColors.text}`}>
                            {memoryUsedGB.toFixed(1)} / {metrics?.totalMemoryGB.toFixed(0)} GB
                        </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${memoryColors.badge} transition-all duration-500 ease-out`}
                            style={{ width: `${memoryUsagePercent}%` }}
                        />
                    </div>
                </div>

                {/* Uptime */}
                <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock size={14} className="text-slate-400" />
                            <span className="text-xs font-medium text-slate-600">Uptime</span>
                        </div>
                        <span className="text-xs font-mono text-slate-500">
                            {formatUptime(metrics?.uptimeSeconds ?? 0)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
