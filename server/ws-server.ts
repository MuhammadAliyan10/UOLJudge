import { WebSocketServer, WebSocket } from 'ws';
import { createServer, IncomingMessage, ServerResponse } from 'http';

// WebSocket Server - The "Real-Time Pulse" Engine
// Runs on port 3001 for contest control broadcasts

const PORT = 3001;
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

interface ExtendedWebSocket extends WebSocket {
    isAlive: boolean;
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
            console.log('✓ Client connected');
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
                // Clients usually don't send messages in this architecture, 
                // but we can handle pings or specific client requests here.
            });

            // Handle disconnection
            extWs.on('close', () => {
                this.clients.delete(extWs);
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
        setInterval(() => {
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

    public getClientCount(): number {
        return this.wss.clients.size;
    }

    public shutdown(): void {
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
