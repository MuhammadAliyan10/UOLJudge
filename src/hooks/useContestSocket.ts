"use client";

import { useEffect, useRef, useState } from "react";

export type ContestWSEventType =
    | "CONNECTION_ESTABLISHED"
    | "CONTEST_STATUS_UPDATE"
    | "LEADERBOARD_UPDATE"
    | "TIME_UPDATE";

export interface ContestStatusPayload {
    contestId: string;
    isPaused?: boolean;
    pausedAt?: string | null;
    endTime?: string;
    isFrozen?: boolean;
}

export interface WSMessage<T = any> {
    type: ContestWSEventType;
    payload: T;
    timestamp: string;
}

export interface UseContestSocketOptions {
    onStatusUpdate?: (payload: ContestStatusPayload) => void;
    onLeaderboardUpdate?: (payload: any) => void;
    onTimeUpdate?: (payload: { endTime: string }) => void;
    onConnect?: () => void;
    onDisconnect?: () => void;
}

export function useContestSocket(options: UseContestSocketOptions = {}) {
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttempts = useRef(0);

    // Use environment variable or default to localhost
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";

    const connect = () => {
        try {
            const ws = new WebSocket(WS_URL);

            ws.onopen = () => {
                console.log("✓ Connected to contest WebSocket");
                setIsConnected(true);
                reconnectAttempts.current = 0;
                options.onConnect?.();
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data) as WSMessage;
                    setLastMessage(message);
                    console.log("📩 WS Message:", message);

                    switch (message.type) {
                        case "CONTEST_STATUS_UPDATE":
                            options.onStatusUpdate?.(message.payload);
                            break;
                        case "LEADERBOARD_UPDATE":
                            options.onLeaderboardUpdate?.(message.payload);
                            break;
                        case "TIME_UPDATE":
                            options.onTimeUpdate?.(message.payload);
                            break;
                        default:
                            // Handle generic updates if needed
                            if (message.type === ("CONTEST_STATUS" as any)) {
                                options.onStatusUpdate?.(message.payload);
                            }
                            break;
                    }
                } catch (error) {
                    console.error("Error parsing WebSocket message:", error);
                }
            };

            ws.onclose = () => {
                console.log("✗ Disconnected from contest WebSocket");
                setIsConnected(false);
                options.onDisconnect?.();

                // Exponential backoff
                const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
                reconnectAttempts.current++;

                console.log(`Reconnecting in ${delay}ms... (attempt ${reconnectAttempts.current})`);
                reconnectTimeoutRef.current = setTimeout(() => {
                    if (wsRef.current?.readyState === WebSocket.CLOSED) {
                        connect();
                    }
                }, delay);
            };

            ws.onerror = (error) => {
                console.error("WebSocket error:", error);
                ws.close();
            };

            wsRef.current = ws;
        } catch (error) {
            console.error("Failed to create WebSocket connection:", error);
        }
    };

    useEffect(() => {
        connect();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    return {
        isConnected,
        lastMessage,
    };
}
