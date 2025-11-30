// ============================================================
// WEBSOCKET BROADCAST UTILITY
// ============================================================

/**
 * Broadcasts a message to all WebSocket clients via the Pulse Engine
 * @param type - Event type (e.g., 'CONTEST_UPDATE', 'TEAM_STATUS_UPDATE')
 * @param payload - Event payload data
 */
export async function broadcastToWebSocket(type: string, payload: any): Promise<void> {
    try {
        await fetch('http://localhost:3001/broadcast', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type,
                payload,
            }),
        });
    } catch (error) {
        console.error(`[WS Broadcast] Failed for ${type}:`, error);
        // Don't throw - broadcasting is non-critical
    }
}
