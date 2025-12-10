// ============================================================
// WEBSOCKET BROADCAST UTILITY
// ============================================================

/**
 * Broadcasts a message to all WebSocket clients via the Pulse Engine
 * @param type - Event type (e.g., 'CONTEST_UPDATE', 'TEAM_STATUS_UPDATE')
 * @param payload - Event payload data
 */
export async function broadcastToWebSocket(
  type: string,
  payload: any
): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1000); // 1s timeout

  const wsUrl = process.env.INTERNAL_WS_URL || "http://localhost:3001";

  try {
    await fetch(`${wsUrl}/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type,
        payload,
      }),
      signal: controller.signal,
      cache: "no-store",
    });
  } catch (error: any) {
    // Suppress ECONNRESET and AbortError as they are expected if WS server is busy/down
    if (error.code !== "ECONNRESET" && error.name !== "AbortError") {
      console.error(`[WS Broadcast] Failed for ${type}:`, error.message);
    }
  } finally {
    clearTimeout(timeoutId);
  }
}
