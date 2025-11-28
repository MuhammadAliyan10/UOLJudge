import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import * as os from 'os';
import { execSync } from 'child_process'; // Import execSync for disk space

// ============================================================
// TYPES
// ============================================================

interface SystemMetrics {
    totalMemoryGB: number;
    freeMemoryGB: number;
    cpuLoadPercent: number;
    uptimeSeconds: number;
    totalDiskGB: number;
    freeDiskGB: number;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function getTotalMemoryGB(): number {
    return os.totalmem() / (1024 ** 3);
}

function getFreeMemoryGB(): number {
    return os.freemem() / (1024 ** 3);
}

function getCPULoadPercent(): number {
    const cpus = os.cpus().length;
    const loadAvg = os.loadavg()[0];
    return Math.min((loadAvg / cpus) * 100, 100);
}

function getUptimeSeconds(): number {
    return os.uptime();
}

async function getDiskSpaceGB(): Promise<{ total: number; free: number }> {
    try {
        // Get disk usage for root partition (works on macOS and Linux)
        // df -k outputs in 1KB blocks
        const output = execSync('df -k / | tail -1').toString();
        const parts = output.trim().split(/\s+/);

        // df outputs in KB, convert to GB
        const totalKB = parseInt(parts[1]);
        const availableKB = parseInt(parts[3]);

        return {
            total: totalKB / (1024 * 1024), // KB to GB
            free: availableKB / (1024 * 1024), // KB to GB
        };
    } catch (error) {
        console.error('[METRICS] Failed to get disk space:', error);
        return { total: 0, free: 0 };
    }
}

// ============================================================
// METRICS GATHERING
// ============================================================

async function getMetrics(): Promise<SystemMetrics> {
    const diskSpace = await getDiskSpaceGB();

    return {
        totalMemoryGB: parseFloat(getTotalMemoryGB().toFixed(2)),
        freeMemoryGB: parseFloat(getFreeMemoryGB().toFixed(2)),
        cpuLoadPercent: parseFloat(getCPULoadPercent().toFixed(1)),
        uptimeSeconds: Math.floor(getUptimeSeconds()), // Ensure uptime is an integer
        totalDiskGB: parseFloat(diskSpace.total.toFixed(2)),
        freeDiskGB: parseFloat(diskSpace.free.toFixed(2)),
    };
}

// ============================================================
// API ROUTE HANDLER
// ============================================================

export async function GET() {
    try {
        // 1. Authentication Check
        const session = await getSession();

        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // 2. Role Check (only admins and jury can access metrics)
        if (session.role !== 'ADMIN' && session.role !== 'JURY') {
            return NextResponse.json(
                { error: 'Forbidden: Admin or Jury access required' },
                { status: 403 }
            );
        }

        // 3. Gather and return metrics
        const metrics = await getMetrics();

        return NextResponse.json(metrics, {
            headers: {
                'Cache-Control': 'no-store, max-age=0',
            },
        });
    } catch (error) {
        console.error('[METRICS API] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch metrics' },
            { status: 500 }
        );
    }
}
