/**
 * Date Formatting Utilities
 *
 * These utilities handle client-side date formatting to avoid
 * React hydration mismatches between server (UTC) and client (local timezone).
 */

/**
 * Format a date/time in the user's local timezone
 * @param date - ISO string or Date object
 * @returns Formatted date and time string (e.g., "Dec 7, 2025, 10:45 AM")
 */
export const formatLocalTime = (date: string | Date): string => {
  return new Date(date).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

/**
 * Format just the time portion in the user's local timezone
 * @param date - ISO string or Date object
 * @returns Formatted time string (e.g., "10:45 AM")
 */
export const formatLocalTimeOnly = (date: string | Date): string => {
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Format just the date portion in the user's local timezone
 * @param date - ISO string or Date object
 * @returns Formatted date string (e.g., "12/7/2025")
 */
export const formatLocalDateOnly = (date: string | Date): string => {
  return new Date(date).toLocaleDateString();
};

/**
 * Get relative time string (e.g., "2 minutes ago", "5 hours ago")
 * @param date - ISO string or Date object
 * @returns Relative time string
 */
export const getRelativeTime = (date: string | Date): string => {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};
