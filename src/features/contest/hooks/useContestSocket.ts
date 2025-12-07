"use client";

import { useEffect, useRef, useState, useCallback } from "react";

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
  | "RETRY_GRANTED"
  | "ANNOUNCEMENT"
  | "CLARIFICATION_UPDATE"
  | "ENTER_SUBMISSION"
  | "LEAVE_SUBMISSION"
  | "PRESENCE_UPDATE";

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
  onNewSubmission?: (payload: {
    submissionId: string;
    contestId: string;
    problemId: string;
    teamName: string;
  }) => void;
  onJuryQueueUpdate?: (payload: { contestId: string; action: string }) => void;
  onSubmissionUpdate?: (payload: {
    submissionId: string;
    status: string;
    judgedById: string;
  }) => void;
  onTeamStatusUpdate?: (payload: {
    teamId: string;
    isBlocked: boolean;
  }) => void;
  onRetryRequested?: (payload: {
    submissionId: string;
    teamName: string;
    reason: string;
    problemTitle: string;
    contestId: string;
  }) => void;
  onRetryGranted?: (payload: {
    submissionId: string;
    contestId: string;
    grantedBy: string;
  }) => void;
  onAnnouncement?: (payload: {
    title: string;
    message: string;
    type: "INFO" | "WARNING" | "CRITICAL";
  }) => void;
  onClarificationUpdate?: (payload: {
    clarificationId: string;
    question: string;
    answer: string;
    isPublic: boolean;
  }) => void;
  onPresenceUpdate?: (payload: {
    submissionId: string;
    activeUsers: string[];
  }) => void;
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
  const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://13.71.29.115:3001";
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
        setIsConnected(true);
        reconnectAttempts.current = 0;
        options.onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WSMessage;
          setLastMessage(message);

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
            case "TEAM_STATUS_UPDATE":
              options.onTeamStatusUpdate?.(message.payload);
              break;
            case "RETRY_REQUESTED":
              options.onRetryRequested?.(message.payload);
              break;
            case "RETRY_GRANTED":
              options.onRetryGranted?.(message.payload);
              break;
            case "ANNOUNCEMENT":
              options.onAnnouncement?.(message.payload);
              break;
            case "CLARIFICATION_UPDATE":
              options.onClarificationUpdate?.(message.payload);
              break;
            case "PRESENCE_UPDATE":
              options.onPresenceUpdate?.(message.payload);
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
        }
        setIsConnected(false);
        options.onDisconnect?.();

        // Exponential backoff up to 30 seconds with Jitter
        const baseDelay = Math.min(
          1000 * Math.pow(2, reconnectAttempts.current),
          30000
        );
        const jitter = Math.random() * 1000; // 0-1000ms random jitter
        const delay = baseDelay + jitter;
        reconnectAttempts.current++;

        // Only log reconnection attempts if we previously connected
        if (hasConnected && reconnectAttempts.current <= 3) {
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

  const sendMessage = useCallback((type: string, payload: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  return {
    isConnected,
    lastMessage,
    sendMessage,
  };
}
