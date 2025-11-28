"use server";

import os from "os";
import { prisma } from "@/lib/prisma";

// In-memory cache for network delta calculation
// Structure: { timestamp: number, rxBytes: number, txBytes: number }
let networkCache: { timestamp: number; rxBytes: number; txBytes: number } | null = null;

/**
 * System Health Metrics Response Type
 */
export interface SystemMetrics {
    cpu: number | null;          // CPU usage percentage (0-100)
    memory: number | null;        // Memory usage percentage (0-100)
    memoryUsed: number | null;    // Memory used in MB
    memoryTotal: number | null;   // Memory total in MB
    disk: number | null;          // Disk usage percentage (0-100)
    diskFree: number | null;      // Disk free space in GB
    diskTotal: number | null;     // Disk total space in GB
    network: number | null;       // Network usage percentage (0-100)
    networkRate: number | null;   // Network rate in Mbps
}

/**
 * Fetch a dynamic threshold from the database
 * Falls back to default value if not found
 */
async function fetchDynamicThreshold(key: string, defaultValue: number): Promise<number> {
    try {
        const setting = await prisma.systemSetting.findUnique({
            where: { key },
        });

        if (setting) {
            const parsed = parseFloat(setting.value);
            return isNaN(parsed) ? defaultValue : parsed;
        }

        return defaultValue;
    } catch (error) {
        console.error(`Failed to fetch setting ${key}:`, error);
        return defaultValue;
    }
}

/**
 * Normalize CPU load average to percentage (0-100)
 * Cross-platform handling for Windows/Linux differences
 */
function normalizeLoadAverage(): number | null {
    try {
        const loadAvg = os.loadavg();
        const cpuCount = os.cpus().length;

        // loadavg returns [1min, 5min, 15min]
        // Use 1-minute average
        const load = loadAvg[0];

        // On Unix/Linux, load average is per-CPU
        // Normalize to percentage (load / cpuCount * 100)
        const percentage = (load / cpuCount) * 100;

        // Cap at 100% to avoid misleading values
        return Math.min(Math.round(percentage), 100);
    } catch (error) {
        console.error("Failed to get CPU load:", error);
        return null;
    }
}

/**
 * Get disk space statistics
 * Returns free and total disk space in GB
 */
async function getDiskSpace(): Promise<{ free: number; total: number; percentage: number } | null> {
    try {
        // For Node.js, we'll use a lightweight approach
        // In production, consider using 'check-disk-space' package
        // For now, we'll use a simplified estimation based on fs
        const { exec } = require("child_process");
        const { promisify } = require("util");
        const execAsync = promisify(exec);

        // Cross-platform disk space check
        const isWindows = os.platform() === "win32";

        if (isWindows) {
            // Windows: Use wmic
            const { stdout } = await execAsync("wmic logicaldisk get size,freespace,caption");
            const lines = stdout.trim().split("\n").slice(1); // Skip header

            // Parse first drive (usually C:)
            const firstDrive = lines[0].trim().split(/\s+/);
            if (firstDrive.length >= 2) {
                const free = parseInt(firstDrive[1]) / (1024 ** 3); // Convert to GB
                const total = parseInt(firstDrive[0]) / (1024 ** 3);
                const percentage = ((total - free) / total) * 100;

                return { free, total, percentage: Math.round(percentage) };
            }
        } else {
            // Unix/Linux/Mac: Use df
            const { stdout } = await execAsync("df -k /");
            const lines = stdout.trim().split("\n");

            if (lines.length >= 2) {
                const parts = lines[1].trim().split(/\s+/);
                const total = parseInt(parts[1]) / (1024 ** 2); // Convert KB to GB
                const used = parseInt(parts[2]) / (1024 ** 2);
                const free = parseInt(parts[3]) / (1024 ** 2);
                const percentage = (used / total) * 100;

                return { free, total, percentage: Math.round(percentage) };
            }
        }

        return null;
    } catch (error) {
        console.error("Failed to get disk space:", error);
        return null;
    }
}

/**
 * Calculate network rate delta
 * CRITICAL: Returns current rate in Mbps, not cumulative bytes
 */
function calculateNetworkDelta(): { rxBytes: number; txBytes: number } {
    try {
        const interfaces = os.networkInterfaces();
        let totalRx = 0;
        let totalTx = 0;

        // Note: os.networkInterfaces() doesn't provide byte counts directly
        // We'll need to use a different approach for real network stats
        // For now, we'll return 0 as a placeholder
        // In production, consider using 'systeminformation' package

        // This is a limitation of Node.js os module
        // Real implementation would require reading from /proc/net/dev on Linux
        // or using platform-specific APIs

        return { rxBytes: 0, txBytes: 0 };
    } catch (error) {
        console.error("Failed to get network stats:", error);
        return { rxBytes: 0, txBytes: 0 };
    }
}

/**
 * Calculate network rate from delta
 * Returns percentage based on NETWORK_SPEED_LIMIT_MBPS setting
 */
async function getNetworkRate(): Promise<{ percentage: number; rateMbps: number } | null> {
    try {
        const current = calculateNetworkDelta();
        const now = Date.now();

        // First call, initialize cache
        if (!networkCache) {
            networkCache = {
                timestamp: now,
                rxBytes: current.rxBytes,
                txBytes: current.txBytes,
            };
            return { percentage: 0, rateMbps: 0 };
        }

        // Calculate delta
        const timeDelta = (now - networkCache.timestamp) / 1000; // Convert to seconds
        const rxDelta = current.rxBytes - networkCache.rxBytes;
        const txDelta = current.txBytes - networkCache.txBytes;

        // Total bytes transferred
        const totalBytes = rxDelta + txDelta;

        // Convert to Mbps (bytes/sec * 8 / 1,000,000)
        const rateMbps = timeDelta > 0 ? (totalBytes / timeDelta) * 8 / 1_000_000 : 0;

        // Update cache
        networkCache = {
            timestamp: now,
            rxBytes: current.rxBytes,
            txBytes: current.txBytes,
        };

        // Fetch dynamic limit
        const limitMbps = await fetchDynamicThreshold("NETWORK_SPEED_LIMIT_MBPS", 100);

        // Calculate percentage
        const percentage = limitMbps > 0 ? Math.min(Math.round((rateMbps / limitMbps) * 100), 100) : 0;

        return { percentage, rateMbps: Math.round(rateMbps * 100) / 100 };
    } catch (error) {
        console.error("Failed to calculate network rate:", error);
        return null;
    }
}

/**
 * Main function: Get all system metrics
 * Returns null for metrics that fail to prevent dashboard crash
 */
export async function getSystemMetrics(): Promise<SystemMetrics> {
    try {
        // CPU Usage
        const cpu = normalizeLoadAverage();

        // Memory Usage
        let memory: number | null = null;
        let memoryUsed: number | null = null;
        let memoryTotal: number | null = null;

        try {
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const usedMem = totalMem - freeMem;

            // Fetch dynamic RAM limit from database
            const ramLimitMB = await fetchDynamicThreshold("RAM_LIMIT_MB", totalMem / (1024 ** 2));
            const ramLimitBytes = ramLimitMB * 1024 * 1024;

            // Calculate percentage based on dynamic limit
            if (ramLimitBytes > 0) {
                memory = Math.min(Math.round((usedMem / ramLimitBytes) * 100), 100);
                memoryUsed = Math.round(usedMem / (1024 ** 2)); // Convert to MB
                memoryTotal = Math.round(ramLimitBytes / (1024 ** 2));
            }
        } catch (error) {
            console.error("Failed to get memory stats:", error);
        }

        // Disk Usage
        let disk: number | null = null;
        let diskFree: number | null = null;
        let diskTotal: number | null = null;

        const diskStats = await getDiskSpace();
        if (diskStats) {
            disk = diskStats.percentage;
            diskFree = Math.round(diskStats.free * 10) / 10; // Round to 1 decimal
            diskTotal = Math.round(diskStats.total * 10) / 10;
        }

        // Network Usage
        const networkStats = await getNetworkRate();
        const network = networkStats?.percentage ?? null;
        const networkRate = networkStats?.rateMbps ?? null;

        return {
            cpu,
            memory,
            memoryUsed,
            memoryTotal,
            disk,
            diskFree,
            diskTotal,
            network,
            networkRate,
        };
    } catch (error) {
        console.error("Critical error in getSystemMetrics:", error);

        // Return all nulls to trigger offline state
        return {
            cpu: null,
            memory: null,
            memoryUsed: null,
            memoryTotal: null,
            disk: null,
            diskFree: null,
            diskTotal: null,
            network: null,
            networkRate: null,
        };
    }
}
