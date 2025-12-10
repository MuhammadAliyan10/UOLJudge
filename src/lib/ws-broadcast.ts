/**
 * Broadcast utility for sending WebSocket messages to all connected clients
 * Sends HTTP request to WebSocket server's broadcast endpoint
 */
export async function broadcastContestUpdate(
  eventType: string,
  payload: any
): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1000); // 1s timeout

  try {
    const wsUrl = process.env.INTERNAL_WS_URL || "http://localhost:3001";
    await fetch(`${wsUrl}/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: eventType,
        payload,
      }),
      signal: controller.signal,
    });
  } catch (error: any) {
    // Suppress timeout and connection errors - broadcasting is non-critical
    if (error.name !== "AbortError" && error.code !== "ECONNRESET") {
      console.error(
        `[WS Broadcast] Failed for ${eventType}:`,
        error.message || error
      );
    }
  } finally {
    clearTimeout(timeoutId);
  }
}
