import { Timestamp } from 'firebase-admin/firestore';

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
  updatedAt: Timestamp;            // When this specific habit entry was last updated
}

export interface UpdateEntryRequest {
  date: string;                    // YYYY-MM-DD format
  habitId: string;                 // Which habit to update
  count?: number;                  // New count value
  completed?: boolean;             // Override completion status
  notes?: string;                  // Update notes
}

export interface UpdateDailyEntryRequest {
  date: string;                    // YYYY-MM-DD format
  habits: Partial<HabitEntryData>[]; // Array of habit updates
}
