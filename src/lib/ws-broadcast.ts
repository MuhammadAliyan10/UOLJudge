import WebSocket from 'ws';

/**
 * Broadcast utility for sending WebSocket messages to all connected clients
 * Connects temporarily to the WebSocket server and sends the broadcast command
 */
export async function broadcastContestUpdate(eventType: string, payload: any): Promise<void> {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket('ws://localhost:3001');

        ws.on('open', () => {
            // Send broadcast command to server
            ws.send(JSON.stringify({
                type: 'BROADCAST',
                event: eventType,
                payload,
            }));

            // Close connection after sending
            setTimeout(() => {
                ws.close();
                resolve();
            }, 100);
        });

        ws.on('error', (error) => {
            console.error('Failed to broadcast:', error);
            // Don't reject - broadcasting is non-critical
            // The action should succeed even if broadcast fails
            resolve();
        });
    });
}
