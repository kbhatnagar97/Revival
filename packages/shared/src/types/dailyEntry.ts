import { Timestamp } from 'firebase-admin/firestore';

export interface DailyEntry {
  id: string;
  habitId: string;
  userId: string;
  date: Timestamp; // Midnight in user's timezone
  count: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UpdateEntryRequest {
  habitId: string;
  date: string; // YYYY-MM-DD format
  count: number;
}
