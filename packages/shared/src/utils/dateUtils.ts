import { Timestamp } from 'firebase-admin/firestore';
import { zonedTimeToUtc, utcToZonedTime, format } from 'date-fns-tz';
import { startOfDay } from 'date-fns';

export const dateUtils = {
  /**
   * Get midnight timestamp for today in user's timezone
   */
  getTodayMidnight(timezone: string): Timestamp {
    const now = new Date();
    const zonedNow = utcToZonedTime(now, timezone);
    const startOfDayZoned = startOfDay(zonedNow);
    const utcMidnight = zonedTimeToUtc(startOfDayZoned, timezone);
    return Timestamp.fromDate(utcMidnight);
  },

  /**
   * Convert date string (YYYY-MM-DD) to midnight timestamp in timezone
   */
  dateStringToTimestamp(dateString: string, timezone: string): Timestamp {
    const [year, month, day] = dateString.split('-').map(Number);
    const zonedDate = new Date(year, month - 1, day);
    const utcMidnight = zonedTimeToUtc(zonedDate, timezone);
    return Timestamp.fromDate(utcMidnight);
  },

  /**
   * Check if a date falls on scheduled days
   */
  isDateScheduled(date: Date, scheduledDays: { [day: string]: boolean }): boolean {
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dayName = dayNames[date.getDay()];
    return scheduledDays[dayName] === true;
  }
};
