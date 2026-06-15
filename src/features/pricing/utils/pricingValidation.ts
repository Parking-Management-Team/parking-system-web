// src/features/pricing/utils/pricingValidation.ts
// ============================================================
// Contains all validation logic for pricing management rules.
// ============================================================

import { CreatePricingWindowRequest } from '../types';

// Convert "HH:mm" or "HH:mm:ss" to minutes from 00:00
export const timeToMinutes = (time: string): number => {
  if (!time) return 0;
  const parts = time.split(':').map(Number);
  const h = parts[0] || 0;
  const m = parts[1] || 0;
  return h * 60 + m;
};

// Calculate minutes for a window (handles overnight case e.g., 18:00 - 06:00)
export const getWindowDurationMinutes = (startTime: string, endTime: string): number => {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  if (start === end) return 1440; // Identical times represent full 24h
  // If end time <= start time => overnight window
  return end < start ? (1440 - start) + end : end - start;
};

// [BR-01] Verify if pricing windows cover exactly 24 hours
export const validate24hCoverage = (windows: CreatePricingWindowRequest[]): {
  isValid: boolean;
  totalMinutes: number;
  message: string;
} => {
  if (windows.length === 0) {
    return { isValid: false, totalMinutes: 0, message: 'No pricing windows have been configured.' };
  }
  const total = windows.reduce((sum, w) => {
    return sum + getWindowDurationMinutes(w.startTime, w.endTime);
  }, 0);

  return {
    isValid: total === 1440,
    totalMinutes: total,
    message: total < 1440
      ? `Total duration is only ${Math.floor(total / 60)}h ${total % 60}m / 24h. Please add or adjust pricing windows.`
      : total > 1440
      ? `Total duration exceeds 24h (${Math.floor(total / 60)}h ${total % 60}m). Please adjust pricing windows.`
      : 'Complete 24h coverage.'
  };
};

// [BR-02] Verify there are no overlapping pricing windows
export const validateNoOverlap = (windows: CreatePricingWindowRequest[]): {
  isValid: boolean;
  conflictPairs: string[];
} => {
  const conflicts: string[] = [];

  // Convert each window to numeric segments in a day
  const segments = windows.map((w) => {
    const start = timeToMinutes(w.startTime);
    const end = timeToMinutes(w.endTime);
    // If overnight, split into two ranges: [start, 1440] and [0, end]
    if (end < start) {
      return {
        name: w.windowName,
        ranges: [
          { s: start, e: 1440 },
          { s: 0, e: end }
        ]
      };
    }
    return {
      name: w.windowName,
      ranges: [{ s: start, e: end }]
    };
  });

  // Compare every pair of segments
  for (let i = 0; i < segments.length; i++) {
    for (let j = i + 1; j < segments.length; j++) {
      const segA = segments[i];
      const segB = segments[j];
      let hasOverlap = false;

      for (const rA of segA.ranges) {
        for (const rB of segB.ranges) {
          // Overlaps if: Max(rA.s, rB.s) < Min(rA.e, rB.e)
          if (Math.max(rA.s, rB.s) < Math.min(rA.e, rB.e)) {
            hasOverlap = true;
            break;
          }
        }
        if (hasOverlap) break;
      }

      if (hasOverlap) {
        conflicts.push(`"${segA.name}" and "${segB.name}" have overlapping time slots.`);
      }
    }
  }

  return { isValid: conflicts.length === 0, conflictPairs: conflicts };
};

// Calculate timeline layout data (for 24h visual bar)
export const computeTimelineSegments = (windows: CreatePricingWindowRequest[]) => {
  return windows.map((w) => {
    const start = timeToMinutes(w.startTime);
    const duration = getWindowDurationMinutes(w.startTime, w.endTime);
    return {
      name: w.windowName,
      startPercent: (start / 1440) * 100,
      widthPercent: (duration / 1440) * 100,
    };
  });
};

// Determine if a pricing window is considered a Night slot
export const isNightSlot = (windowName: string, startTime: string): boolean => {
  const lower = (windowName || '').toLowerCase();
  if (lower.includes('night') || lower.includes('đêm') || lower.includes('tối')) return true;
  if (lower.includes('day') || lower.includes('ngày') || lower.includes('sáng')) return false;
  
  // Parse hour: startTime format is "HH:mm" or "HH:mm:ss"
  const hour = parseInt((startTime || '').split(':')[0], 10);
  return isNaN(hour) ? false : (hour >= 18 || hour < 6);
};
