import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { registerClient, unregisterClient } from '@/lib/broadcast';

// ============================================================
// SERVER-SENT EVENTS (SSE) ENDPOINT
// ============================================================

/**
 * GET /api/events
 * 
 * Establishes a persistent Server-Sent Events connection
 * for real-time updates (leaderboard, contest changes, etc.)
 * 
 * @security Requires active user session
 * @returns SSE stream with real-time event broadcasts
 */
export async function GET(request: NextRequest) {
    // 1. Authentication Check
    const session = await getSession();

    if (!session) {
        return new Response('Unauthorized', { status: 401 });
    }

    // 2. Create SSE Stream
    const stream = new ReadableStream({
        start(controller) {
            // Register this client for broadcasts
            registerClient(controller);

            // Send initial connection message
            const welcome = `data: ${JSON.stringify({
                event: 'CONNECTED',
                message: 'Real-time updates active',
                timestamp: Date.now(),
            })}\n\n`;

            controller.enqueue(welcome);

            // Heartbeat to keep connection alive (every 30 seconds)
            const heartbeatInterval = setInterval(() => {
                try {
                    controller.enqueue(`: heartbeat\n\n`);
                } catch {
                    // Connection closed - cleanup
                    clearInterval(heartbeatInterval);
                    unregisterClient(controller);
                }
            }, 30000);

            // Cleanup on client disconnect
            request.signal.addEventListener('abort', () => {
                clearInterval(heartbeatInterval);
                unregisterClient(controller);
            });
        },
    });

    // 3. Return SSE Response
    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no', // Disable nginx buffering
        },
    });
}
