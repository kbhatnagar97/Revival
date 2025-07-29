import { Timestamp } from 'firebase-admin/firestore';

export interface HabitDocument {
  name: string;
  icon: string;
  color: string;
  goal: number;
  scheduledDays: { [day: string]: boolean }; // e.g., { "Monday": true, "Friday": true }
  status: 'active' | 'paused' | 'archived';
  reminder?: { isEnabled?: boolean; time?: string; message?: string; } | null;
  analytics: {
    totalDebt: number;
    totalSurplus: number;
    currentStreak: number;
    bestStreak: number;
    totalCompletions: number;
    allTimeConsistency: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  order: number;
}

export interface DailyEntry {
  date: string;                    // YYYY-MM-DD format - matches document ID
  habits: HabitEntryData[];        // Array of habit entries for this specific date
  createdAt: Timestamp;            // When first habit was logged for this date
  updatedAt: Timestamp;            // Last modification time
}

export interface HabitEntryData {
  habitId: string;                 // Reference to habit document
  count: number;                   // Number of completions for this day
  completed: boolean;              // Whether goal was met (count >= goalAtTime)
  goalAtTime: number;              // Goal when entry was created
  notes?: string;                  // Optional notes for this habit on this date
  createdAt: Timestamp;            // When this specific habit entry was first created
  lastUpdated: Timestamp;          // When this specific habit entry was last updated
}

// Legacy interface for backward compatibility in API responses
export interface HabitEntry {
  id: string;                      // Generated ID combining date and habitId
  habitId: string;
  date: string;                    // YYYY-MM-DD format
  count: number;
  completed: boolean;
  goalAtTime: number;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;            // Keep as updatedAt for legacy API compatibility
}

export interface UserDocument {
  email: string;
  displayName: string;
  picture?: string;
  provider: 'google.com' | 'password';
  createdAt: Timestamp;
  timezone: string;
  lastSeenAt: Timestamp;
}
