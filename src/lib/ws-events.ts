/**
 * Centralized WebSocket Event Constants
 * 
 * This file prevents typos and ensures type safety across the application.
 * All WebSocket event names are defined here and exported as constants.
 */

export const WS_EVENTS = {
    CONNECTION_ESTABLISHED: "CONNECTION_ESTABLISHED",
    CONTEST_STATUS_UPDATE: "CONTEST_STATUS_UPDATE",
    LEADERBOARD_UPDATE: "LEADERBOARD_UPDATE",
    SCORE_UPDATE: "SCORE_UPDATE",
    CONTEST_UPDATE: "CONTEST_UPDATE",
    ADMIN_UPDATE: "ADMIN_UPDATE",
    TEAM_STATUS_UPDATE: "TEAM_STATUS_UPDATE",
    TIME_UPDATE: "TIME_UPDATE",
    NEW_SUBMISSION: "NEW_SUBMISSION",
    JURY_QUEUE_UPDATE: "JURY_QUEUE_UPDATE",
    SUBMISSION_UPDATE: "SUBMISSION_UPDATE",
    RETRY_REQUESTED: "RETRY_REQUESTED",
    RETRY_GRANTED: "RETRY_GRANTED",
} as const;

export type WSEventType = (typeof WS_EVENTS)[keyof typeof WS_EVENTS];

/**
 * Type-safe WebSocket message creator
 * Ensures payload is always wrapped correctly
 */
export function createWSMessage<T>(type: WSEventType, payload: T) {
    return {
        type,
        payload,
    };
}

/**
 * WebSocket message structure
 */
export interface WSMessage<T = any> {
    type: WSEventType;
    payload: T;
    timestamp?: string;
}
