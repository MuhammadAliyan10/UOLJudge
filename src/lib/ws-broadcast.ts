/**
 * Broadcast utility for sending WebSocket messages to all connected clients
 * Sends HTTP request to WebSocket server's broadcast endpoint
 */
export async function broadcastContestUpdate(eventType: string, payload: any): Promise<void> {
    try {
        await fetch('http://localhost:3001/broadcast', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: eventType,
                payload,
            }),
        });
        console.log(`[WS Broadcast] Sent: ${eventType}`);
    } catch (error) {
        console.error(`[WS Broadcast] Failed for ${eventType}:`, error);
        // Don't throw - broadcasting is non-critical
    }
}
