import { WebSocketServer, WebSocket } from 'ws';
import { createServer, IncomingMessage, ServerResponse } from 'http';

// WebSocket Server - The "Real-Time Pulse" Engine
// Runs on port 3001 for contest control broadcasts

const PORT = 3001;
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

interface ExtendedWebSocket extends WebSocket {
    isAlive: boolean;
}

interface SocketState {
    name: string;
    activeRooms: Set<string>;
}

interface BroadcastMessage {
    type: string;
    payload: any;
    event?: string; // For backward compatibility
}

// Create a raw HTTP server to handle both WS upgrades and Admin API calls
const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    // Enable CORS for local development if needed, though usually server-to-server
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Admin Action Endpoint
    if (req.method === 'POST' && req.url === '/broadcast') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                console.log('📢 Admin Action Received:', data);

                // Broadcast to all connected clients
                wsServer.broadcast(data.type, data.payload);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, clientCount: wsServer.getClientCount() }));
            } catch (error) {
                console.error('Error processing admin action:', error);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
            }
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

class ContestWebSocketServer {
    private wss: WebSocketServer;
    private clients: Set<ExtendedWebSocket>;
    // Store latest status to send to new connections
    private currentStatus: any = {};
    private heartbeatInterval: NodeJS.Timeout | null = null;
    
    // 🎯 PRESENCE SYSTEM - Google Docs-style Real-Time Tracking
    // Maps Submission ID -> Set of Jury Names (The "Room")
    private rooms: Map<string, Set<string>> = new Map();
    // Maps Socket -> User State (name + active rooms for O(1) cleanup)
    private socketState: Map<WebSocket, SocketState> = new Map();

    constructor(httpServer: any) {
        this.wss = new WebSocketServer({ server: httpServer });
        this.clients = new Set();

        console.log(`🔴 Contest WebSocket Server started on port ${PORT}`);

        this.setupServer();
        this.startHeartbeat();
    }

    private setupServer(): void {
        this.wss.on('connection', (ws: WebSocket) => {
            const extWs = ws as ExtendedWebSocket;
            // console.log('✓ Client connected'); // Silenced for production
            this.clients.add(extWs);

            // Mark client as alive
            extWs.isAlive = true;

            // Send current status immediately if available
            if (Object.keys(this.currentStatus).length > 0) {
                extWs.send(JSON.stringify({
                    type: 'CONTEST_STATUS_UPDATE', // Generic type for initial sync
                    payload: this.currentStatus,
                    timestamp: new Date().toISOString()
                }));
            }

            // Heartbeat response
            extWs.on('pong', () => {
                extWs.isAlive = true;
            });

            // Handle client messages (if any)
            extWs.on('message', (message: Buffer) => {
                try {
                    const data = JSON.parse(message.toString());
                    this.handleClientMessage(extWs, data);
                } catch (error) {
                    // Ignore malformed messages
                }
            });

            // Handle disconnection
            extWs.on('close', () => {
                this.clients.delete(extWs);
                this.handleDisconnect(extWs);
            });

            // Handle errors
            extWs.on('error', (error: Error) => {
                console.error('WebSocket error:', error);
                this.clients.delete(extWs);
            });

            // Send connection confirmation
            extWs.send(JSON.stringify({
                type: 'CONNECTION_ESTABLISHED',
                timestamp: new Date().toISOString(),
            }));
        });
    }

    // Ping/Pong Heartbeat to keep connections alive
    private startHeartbeat(): void {
        this.heartbeatInterval = setInterval(() => {
            this.wss.clients.forEach((ws) => {
                const extWs = ws as ExtendedWebSocket;
                if (extWs.isAlive === false) {
                    return extWs.terminate();
                }

                extWs.isAlive = false;
                extWs.ping();
            });
        }, HEARTBEAT_INTERVAL);
    }

    // Broadcast message to all connected clients
    public broadcast(type: string, payload: any): number {
        // Update local state cache
        if (type === 'CONTEST_STATUS' || type === 'CONTEST_STATUS_UPDATE') {
            this.currentStatus = { ...this.currentStatus, ...payload };
        }

        const message = JSON.stringify({
            type,
            payload,
            timestamp: new Date().toISOString(),
        });

        let sentCount = 0;

        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
                sentCount++;
            }
        });

        console.log(`📡 Broadcast [${type}] to ${sentCount} clients`);
        return sentCount;
    }

    // 🎯 PRESENCE SYSTEM - Client Message Handler
    private handleClientMessage(ws: WebSocket, data: any): void {
        const { type, payload } = data;

        switch (type) {
            case 'ENTER_SUBMISSION':
                this.handleEnterSubmission(ws, payload);
                break;
            case 'LEAVE_SUBMISSION':
                this.handleLeaveSubmission(ws, payload);
                break;
            default:
                // Ignore unknown message types
                break;
        }
    }

    // 🎯 PRESENCE - Handle Jury Entering a Submission
    private handleEnterSubmission(ws: WebSocket, payload: { submissionId: string; juryName: string }): void {
        const { submissionId, juryName } = payload;

        // Initialize room if doesn't exist
        if (!this.rooms.has(submissionId)) {
            this.rooms.set(submissionId, new Set());
        }

        // Add jury to the room
        this.rooms.get(submissionId)!.add(juryName);

        // Track socket state for O(1) cleanup
        if (!this.socketState.has(ws)) {
            this.socketState.set(ws, { name: juryName, activeRooms: new Set() });
        }
        this.socketState.get(ws)!.activeRooms.add(submissionId);

        // Broadcast presence update
        this.broadcastPresenceUpdate(submissionId);

        console.log(`👁️  ${juryName} entered submission ${submissionId}`);
    }

    // 🎯 PRESENCE - Handle Jury Leaving a Submission
    private handleLeaveSubmission(ws: WebSocket, payload: { submissionId: string; juryName: string }): void {
        const { submissionId, juryName } = payload;

        // Remove from room
        const room = this.rooms.get(submissionId);
        if (room) {
            room.delete(juryName);
            // Clean up empty rooms
            if (room.size === 0) {
                this.rooms.delete(submissionId);
            }
        }

        // Remove from socket state
        const state = this.socketState.get(ws);
        if (state) {
            state.activeRooms.delete(submissionId);
        }

        // Broadcast presence update
        this.broadcastPresenceUpdate(submissionId);

        console.log(`👁️  ${juryName} left submission ${submissionId}`);
    }

    // 🎯 PRESENCE - Broadcast Current Viewers for a Submission
    private broadcastPresenceUpdate(submissionId: string): void {
        const activeUsers = Array.from(this.rooms.get(submissionId) || []);

        const message = JSON.stringify({
            type: 'PRESENCE_UPDATE',
            payload: { submissionId, activeUsers },
            timestamp: new Date().toISOString(),
        });

        // Broadcast to all connected clients
        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }

    // 🎯 PRESENCE - O(1) Disconnect Cleanup
    private handleDisconnect(ws: WebSocket): void {
        const state = this.socketState.get(ws);
        if (!state) return;

        const { name, activeRooms } = state;

        // Remove user from all their active rooms (O(1) - no iteration over all rooms!)
        activeRooms.forEach((submissionId) => {
            const room = this.rooms.get(submissionId);
            if (room) {
                room.delete(name);
                // Clean up empty rooms
                if (room.size === 0) {
                    this.rooms.delete(submissionId);
                } else {
                    // Broadcast update if room still has people
                    this.broadcastPresenceUpdate(submissionId);
                }
            }
        });

        // Remove socket state
        this.socketState.delete(ws);

        if (activeRooms.size > 0) {
            console.log(`👁️  ${name} disconnected, cleaned up from ${activeRooms.size} room(s)`);
        }
    }

    public getClientCount(): number {
        return this.wss.clients.size;
    }

    public shutdown(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        this.wss.close();
    }
}

// Start the server
const wsServer = new ContestWebSocketServer(server);

server.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    wsServer.shutdown();
    server.close();
});
