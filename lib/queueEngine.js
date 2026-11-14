// ============================================================================
// lib/queueEngine.js
// Core Queue & Token Management Logic
// Contains pure, testable functions for token calculations, line positions,
// wait estimations, eligibility checks, and office analytics.
// ============================================================================

import { isWithinOperatingHours, getISTHour } from './time.js';

/**
 * 1. Formats a service prefix and sequence number into a standard token string.
 * Example: prefix="ACC", number=14 -> "ACC-014"
 * @param {string} prefix - Office code (e.g. "ACC", "EXM")
 * @param {number} number - Daily sequence number (e.g. 14)
 * @returns {string} Zero-padded 3-digit token code
 */
export function formatToken(prefix, number) {
  const safePrefix = (prefix || 'TOK').toUpperCase();
  const safeNum = String(number || 0).padStart(3, '0');
  return `${safePrefix}-${safeNum}`;
}

/**
 * 2. Computes the next daily sequential token number for a service.
 * Finds the highest token_no generated today and increments by 1.
 * If no tokens have been issued today, starts at 1.
 * @param {Array} todaysTokens - List of all tokens created today for this service
 * @returns {number}
 */
export function nextTokenNumber(todaysTokens = []) {
  if (!todaysTokens || todaysTokens.length === 0) {
    return 1;
  }
  const maxNo = todaysTokens.reduce((max, t) => {
    const num = Number(t.token_no) || 0;
    return num > max ? num : max;
  }, 0);
  return maxNo + 1;
}

/**
 * 3. Validates whether a student is allowed to take a token right now.
 * Rejection rules:
 * - Service manually marked closed
 * - Current time outside operating hours
 * - Daily token quota exceeded
 * - Student already has an active (waiting or serving) token for this service
 * @param {Object} service - Service record
 * @param {Object} student - Authenticated user record
 * @param {Array} todaysTokens - All tokens for this service today
 * @param {Date} [nowIST] - Current IST timestamp
 * @returns {{ ok: boolean, reason: string|null }}
 */
export function canTakeToken(service, student, todaysTokens = [], nowIST = null) {
  if (!service) {
    return { ok: false, reason: 'Office service not found.' };
  }

  // 1. Is service manually toggled open?
  if (!service.is_open) {
    return {
      ok: false,
      reason: `${service.name} is currently closed by the office staff.`,
    };
  }

  // 2. Is current time within operating hours?
  if (!isWithinOperatingHours(service.open_time, service.close_time, nowIST)) {
    const openFmt = (service.open_time || '10:00').slice(0, 5);
    const closeFmt = (service.close_time || '16:00').slice(0, 5);
    return {
      ok: false,
      reason: `${service.name} operates between ${openFmt} and ${closeFmt}. Please visit during office hours.`,
    };
  }

  // 3. Has the daily token cap been reached?
  const maxLimit = service.max_tokens_per_day || 100;
  if (todaysTokens.length >= maxLimit) {
    return {
      ok: false,
      reason: `The daily token limit of ${maxLimit} for ${service.name} has been reached for today.`,
    };
  }

  // 4. Does the student already hold an active token for this office?
  const studentActiveToken = todaysTokens.find(
    (t) =>
      t.student_id === student.id &&
      (t.status === 'waiting' || t.status === 'serving')
  );

  if (studentActiveToken) {
    return {
      ok: false,
      reason: `You already have an active token (${studentActiveToken.token_code || studentActiveToken.token_no}) for ${service.name}. Please wait for your turn.`,
    };
  }

  return { ok: true, reason: null };
}

/**
 * 4. Determines the FIFO position of a token among waiting tokens.
 * Sorts waiting tokens by creation timestamp. Returns 1 for the very next in line.
 * @param {Object} token - The target token
 * @param {Array} waitingTokens - List of tokens currently in 'waiting' status
 * @returns {number} 1-based position, or 0 if not waiting
 */
export function getPosition(token, waitingTokens = []) {
  if (!token || token.status !== 'waiting') return 0;

  // Sort strictly by created_at ascending (FIFO)
  const sorted = [...waitingTokens].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );

  const idx = sorted.findIndex((t) => t.id === token.id);
  return idx >= 0 ? idx + 1 : 0;
}

/**
 * 5. Calculates average service duration in minutes from recent completed tokens.
 * Averages (completed_at - called_at) for the last 10 completed tokens today.
 * If fewer than 3 tokens exist, falls back to the office's configured default.
 * @param {Array} completedTokens - Completed tokens today
 * @param {number} defaultMinutes - Service default duration (e.g. 8)
 * @returns {number} Average minutes
 */
export function averageServiceMinutes(completedTokens = [], defaultMinutes = 8) {
  const valid = completedTokens.filter(
    (t) => t.completed_at && t.called_at && new Date(t.completed_at) > new Date(t.called_at)
  );

  if (valid.length < 3) {
    return defaultMinutes || 8;
  }

  // Sort newest completed first and take up to 10
  const recent = [...valid]
    .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
    .slice(0, 10);

  const totalMinutes = recent.reduce((sum, t) => {
    const diffMs = new Date(t.completed_at) - new Date(t.called_at);
    return sum + diffMs / (1000 * 60);
  }, 0);

  return Math.max(1, Math.round(totalMinutes / recent.length));
}

/**
 * 6. Estimates waiting time in minutes for a given queue position.
 * Multiplies position by average service time and rounds UP to nearest 5 minutes.
 * @param {number} position - Position in queue (1 means next)
 * @param {number} avgMinutes - Average minutes per student
 * @returns {number} Estimated minutes (e.g. 5, 10, 15, 20)
 */
export function estimateWaitMinutes(position, avgMinutes = 8) {
  if (!position || position <= 0) return 0;
  const rawWait = position * avgMinutes;
  // Round up to nearest 5 minutes
  return Math.max(5, Math.ceil(rawWait / 5) * 5);
}

/**
 * 7. Picks the next token to be called from the waiting list.
 * Finds the oldest waiting token (earliest created_at).
 * @param {Array} waitingTokens - List of tokens in 'waiting' status
 * @returns {Object|null}
 */
export function getNextToken(waitingTokens = []) {
  if (!waitingTokens || waitingTokens.length === 0) return null;
  return [...waitingTokens].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  )[0] || null;
}

/**
 * 8. Computes alert level for student banner and vibration triggers.
 * - 'now': Token is actively being served at the counter.
 * - 'near': Token is position 1, 2, or 3 in the waiting line.
 * - 'none': Position is 4 or higher, or token is finished/cancelled.
 * @param {number} position - 1-based position
 * @param {string} status - Token status
 * @returns {'none'|'near'|'now'}
 */
export function getAlertLevel(position, status) {
  if (status === 'serving') {
    return 'now';
  }
  if (status === 'waiting' && position >= 1 && position <= 3) {
    return 'near';
  }
  return 'none';
}

/**
 * 9. Aggregates metrics and hourly volume for the admin analytics dashboard.
 * Computes:
 * - Average wait time (called_at - created_at)
 * - Average service time (completed_at - called_at)
 * - No-show rate percentage
 * - Hourly token distribution (IST) from 09:00 to 17:00
 * @param {Array} tokens - Tokens within the selected filter window
 * @returns {Object}
 */
export function getAnalytics(tokens = []) {
  const total = tokens.length;
  if (total === 0) {
    return {
      totalTokens: 0,
      completedCount: 0,
      noShowCount: 0,
      cancelledCount: 0,
      waitingCount: 0,
      avgWaitMinutes: 0,
      avgServiceMinutes: 0,
      noShowRate: '0%',
      hourlyCounts: {
        labels: ['9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM'],
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      },
    };
  }

  let waitTimes = [];
  let serviceTimes = [];
  let noShowCount = 0;
  let completedCount = 0;
  let cancelledCount = 0;
  let waitingCount = 0;

  // Hourly slots for office operating day (9 AM to 5 PM = hours 9 to 17)
  const hoursMap = {
    9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0,
  };

  tokens.forEach((t) => {
    if (t.status === 'completed') completedCount++;
    if (t.status === 'no_show') noShowCount++;
    if (t.status === 'cancelled') cancelledCount++;
    if (t.status === 'waiting') waitingCount++;

    // Wait time: called_at - created_at
    if (t.called_at && t.created_at) {
      const waitMs = new Date(t.called_at) - new Date(t.created_at);
      if (waitMs > 0) {
        waitTimes.push(waitMs / (1000 * 60));
      }
    }

    // Service time: completed_at - called_at
    if (t.completed_at && t.called_at) {
      const servMs = new Date(t.completed_at) - new Date(t.called_at);
      if (servMs > 0) {
        serviceTimes.push(servMs / (1000 * 60));
      }
    }

    // Token creation hour in IST
    const hour = getISTHour(t.created_at);
    if (hoursMap[hour] !== undefined) {
      hoursMap[hour]++;
    }
  });

  const avgWait = waitTimes.length
    ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length)
    : 0;

  const avgServ = serviceTimes.length
    ? Math.round(serviceTimes.reduce((a, b) => a + b, 0) / serviceTimes.length)
    : 0;

  // No-show rate: noShow / (completed + noShow) or total
  const finishedTotal = completedCount + noShowCount;
  const noShowPercent = finishedTotal > 0
    ? Math.round((noShowCount / finishedTotal) * 100)
    : 0;

  return {
    totalTokens: total,
    completedCount,
    noShowCount,
    cancelledCount,
    waitingCount,
    avgWaitMinutes: avgWait,
    avgServiceMinutes: avgServ,
    noShowRate: `${noShowPercent}%`,
    hourlyCounts: {
      labels: ['9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM'],
      data: [
        hoursMap[9],
        hoursMap[10],
        hoursMap[11],
        hoursMap[12],
        hoursMap[13],
        hoursMap[14],
        hoursMap[15],
        hoursMap[16],
        hoursMap[17],
      ],
    },
  };
}
