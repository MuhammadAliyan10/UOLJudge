// ============================================================
// BROADCAST MANAGER FOR SERVER-SENT EVENTS
// ============================================================

/**
 * Global registry of active SSE client connections
 * Allows any server action to push real-time updates to all connected clients
 */

type BroadcastEvent = {
    event: 'SCORE_UPDATE' | 'CONTEST_UPDATE' | 'SYSTEM_ALERT';
    data?: any;
    timestamp?: number;
};

// Global set of active SSE client controllers
const activeClients = new Set<ReadableStreamDefaultController>();

/**
 * Register a new SSE client connection
 */
export function registerClient(controller: ReadableStreamDefaultController) {
    activeClients.add(controller);
}

/**
 * Unregister a disconnected SSE client
 */
export function unregisterClient(controller: ReadableStreamDefaultController) {
    activeClients.delete(controller);
}

/**
 * Broadcast an event to all connected SSE clients
 * Automatically removes dead connections
 */
export function broadcast(event: BroadcastEvent) {
    const payload = {
        ...event,
        timestamp: event.timestamp || Date.now(),
    };

    const message = `data: ${JSON.stringify(payload)}\n\n`;


    // Send to all active clients
    activeClients.forEach((controller) => {
        try {
            controller.enqueue(message);
        } catch (error) {
            // Client disconnected - remove from registry
            activeClients.delete(controller);
        }
    });
}

/**
 * Get the count of active connections (for monitoring)
 */
export function getActiveClientCount(): number {
    return activeClients.size;
}
