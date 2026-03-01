/**
 * Simulation time utilities.
 * The simulation clock counts minutes since midnight of Day 1.
 * 1 real second = 1 simulated minute at 1x speed.
 */

export type TimeOfDayPeriod = 'night' | 'dawn' | 'morning' | 'midday' | 'afternoon' | 'dusk';

/** Extract hours (0-23) from simulation clock (total minutes since Day 1 midnight). */
export function getHour(clock: number): number {
  return Math.floor((clock % 1440) / 60);
}

/** Extract minutes (0-59) from simulation clock. */
export function getMinute(clock: number): number {
  return Math.floor(clock % 60);
}

/** Get time-of-day in minutes since midnight (0-1439). */
export function getTimeOfDay(clock: number): number {
  return clock % 1440;
}

/** Get the current day number (1-based). */
export function getDayNumber(clock: number): number {
  return Math.floor(clock / 1440) + 1;
}

/** Is it daytime (5am - 7pm)? */
export function isDaytime(clock: number): boolean {
  const hour = getHour(clock);
  return hour >= 5 && hour < 19;
}

/** Get the named time-of-day period for visual overlays. */
export function getTimeOfDayPeriod(clock: number): TimeOfDayPeriod {
  const hour = getHour(clock);
  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 14) return 'midday';
  if (hour >= 14 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 19) return 'dusk';
  return 'night';
}

/** Format clock value as "HH:MM AM/PM". */
export function formatTime(clock: number): string {
  const h = getHour(clock);
  const m = getMinute(clock);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayHour}:${m.toString().padStart(2, '0')} ${period}`;
}

/** Format as "Day N, HH:MM AM/PM". */
export function formatClockFull(clock: number): string {
  return `Day ${getDayNumber(clock)}, ${formatTime(clock)}`;
}

/**
 * Normalized brightness for the sky: 0 = full night, 1 = full day.
 * Smoothly transitions at dawn and dusk.
 */
export function getSkyBrightness(clock: number): number {
  const tod = getTimeOfDay(clock);
  const hour = tod / 60;

  // Night: 0-5 and 19-24
  if (hour < 5 || hour >= 20) return 0;
  // Full day: 8-17
  if (hour >= 8 && hour < 17) return 1;
  // Dawn ramp: 5-8
  if (hour >= 5 && hour < 8) return (hour - 5) / 3;
  // Dusk ramp: 17-20
  return 1 - (hour - 17) / 3;
}
