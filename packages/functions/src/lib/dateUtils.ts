import { zonedTimeToUtc } from 'date-fns-tz';

export const dateUtils = {
  getTodayMidnight: (timezone: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return zonedTimeToUtc(today, timezone);
  },

  isDateScheduled: (date: Date, scheduledDays: number[]) => {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    return scheduledDays.includes(dayOfWeek);
  }
};
