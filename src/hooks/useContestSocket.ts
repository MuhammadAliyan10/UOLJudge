"use client";

import { useEffect, useRef, useState } from "react";

export type ContestWSEventType =
    | "CONNECTION_ESTABLISHED"
    | "CONTEST_STATUS_UPDATE"
    | "LEADERBOARD_UPDATE"
    | "SCORE_UPDATE"
    | "CONTEST_UPDATE"
    | "ADMIN_UPDATE"
    | "TEAM_STATUS_UPDATE"
    | "TIME_UPDATE"
    | "NEW_SUBMISSION"
    | "JURY_QUEUE_UPDATE"
    | "SUBMISSION_UPDATE"
    | "RETRY_REQUESTED"
    | "RETRY_GRANTED";

export interface ContestStatusPayload {
    contestId: string;
    isPaused?: boolean;
    pausedAt?: string | null;
    endTime?: string;
    isFrozen?: boolean;
    startTime?: string; // ISO string
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
    onContestUpdate?: (payload: any) => void;
    onAdminUpdate?: (payload: any) => void;
    onNewSubmission?: (payload: { submissionId: string; contestId: string; problemId: string; teamName: string }) => void;
    onJuryQueueUpdate?: (payload: { contestId: string; action: string }) => void;
    onSubmissionUpdate?: (payload: { submissionId: string; status: string; judgedById: string }) => void;
    onRetryRequested?: (payload: { submissionId: string; teamName: string; reason: string; problemTitle: string; contestId: string }) => void;
    onRetryGranted?: (payload: { submissionId: string; contestId: string; grantedBy: string }) => void;
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
        // Stop trying after 5 failed attempts if we never connected
        if (reconnectAttempts.current > 5 && !wsRef.current) {
            // Server not available - stop trying
            return;
        }

        try {
            const ws = new WebSocket(WS_URL);
            let hasConnected = false;

            ws.onopen = () => {
                hasConnected = true;
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
                        case "CONTEST_UPDATE":
                            options.onContestUpdate?.(message.payload);
                            break;
                        case "ADMIN_UPDATE":
                            options.onAdminUpdate?.(message.payload);
                            break;
                        case "NEW_SUBMISSION":
                            options.onNewSubmission?.(message.payload);
                            break;
                        case "JURY_QUEUE_UPDATE":
                            options.onJuryQueueUpdate?.(message.payload);
                            break;
                        case "SUBMISSION_UPDATE":
                            options.onSubmissionUpdate?.(message.payload);
                            break;
                        case "RETRY_REQUESTED":
                            options.onRetryRequested?.(message.payload);
                            break;
                        case "RETRY_GRANTED":
                            options.onRetryGranted?.(message.payload);
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
                // Only log if we previously connected (real disconnection)
                // Silent if never connected (server not running)
                if (hasConnected) {
                    console.log("✗ Disconnected from contest WebSocket");
                }
                setIsConnected(false);
                options.onDisconnect?.();

                // Exponential backoff up to 30 seconds
                const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
                reconnectAttempts.current++;

                // Only log reconnection attempts if we previously connected
                if (hasConnected && reconnectAttempts.current <= 3) {
                    console.log(`Reconnecting in ${delay}ms... (attempt ${reconnectAttempts.current})`);
                }

                // Stop trying after 5 attempts if never connected
                if (!hasConnected && reconnectAttempts.current > 5) {
                    return; // Server not available
                }

                reconnectTimeoutRef.current = setTimeout(() => {
                    if (wsRef.current?.readyState === WebSocket.CLOSED) {
                        connect();
                    }
                }, delay);
            };

            ws.onerror = () => {
                // Silent - Pulse Engine not running is expected during development
                // Only log if we previously connected (real error)
                if (hasConnected) {
                    console.warn("WebSocket connection lost");
                }
                ws.close();
            };

            wsRef.current = ws;
        } catch (error) {
            // Silent - expected when WebSocket server isn't running
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
