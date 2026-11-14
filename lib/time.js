// ============================================================================
// lib/time.js
// Centralized Indian Standard Time (IST - Asia/Kolkata) time utilities.
// Crucial for Vercel serverless environments which default to UTC.
// ============================================================================

const TIMEZONE = 'Asia/Kolkata';

/**
 * Returns a JavaScript Date object shifted to represent current IST wall-clock time.
 */
export function getNowIST() {
  const now = new Date();
  const istString = now.toLocaleString('en-US', { timeZone: TIMEZONE });
  return new Date(istString);
}

/**
 * Returns today's date in IST formatted as 'YYYY-MM-DD'.
 * Used for database queries against the token_date column.
 */
export function getTodayISTDateString() {
  const now = getNowIST();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns the date N days before today in IST formatted as 'YYYY-MM-DD'.
 */
export function getPastISTDateString(daysAgo = 7) {
  const now = getNowIST();
  now.setDate(now.getDate() - daysAgo);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Checks whether current IST time is within an office's open and close times.
 * Supports strings like "10:00", "10:00:00", or Date objects.
 * @param {string} openTime - e.g. "10:00:00"
 * @param {string} closeTime - e.g. "16:00:00"
 * @param {Date} [nowDate] - Optional override for testing
 * @returns {boolean}
 */
export function isWithinOperatingHours(openTime, closeTime, nowDate = null) {
  const now = nowDate || getNowIST();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const parseTimeToMinutes = (tStr) => {
    if (!tStr) return 0;
    const parts = tStr.split(':').map(Number);
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  };

  const openM = parseTimeToMinutes(openTime);
  const closeM = parseTimeToMinutes(closeTime);

  return currentMinutes >= openM && currentMinutes < closeM;
}

/**
 * Extracts the IST hour (0 to 23) from an ISO timestamp string or Date.
 * Used for group-by-hour analytics.
 * @param {string|Date} timestamp
 * @returns {number} 0-23
 */
export function getISTHour(timestamp) {
  if (!timestamp) return 0;
  const d = new Date(timestamp);
  const hourStr = d.toLocaleTimeString('en-US', {
    timeZone: TIMEZONE,
    hour: 'numeric',
    hour12: false,
  });
  return parseInt(hourStr, 10);
}

/**
 * Formats a timestamp into friendly IST 12-hour time (e.g. "11:45 AM").
 */
export function formatISTTime(timestamp) {
  if (!timestamp) return '--';
  return new Date(timestamp).toLocaleTimeString('en-IN', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Formats a date into a clean display format in IST (e.g. "14 Nov 2026, 02:30 PM").
 */
export function formatISTDateTime(timestamp) {
  if (!timestamp) return '--';
  return new Date(timestamp).toLocaleString('en-IN', {
    timeZone: TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
