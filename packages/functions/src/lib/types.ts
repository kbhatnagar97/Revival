import { Timestamp } from 'firebase-admin/firestore';

export interface HabitDocument {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  goal: number;
  isActive: boolean;
  sortOrder: number;
  days: number[];
  scheduledDays: number[];
  currentStreak: number;
  totalCompletions: number;
  lastCalculated?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface HabitEntry {
  id: string;
  userId: string;
  habitId: string;
  date: string; // YYYY-MM-DD format
  count: number;
  completed: boolean;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DailyEntry {
  id: string;
  userId: string;
  habitId: string;
  date: string;
  count: number;
  completed: boolean;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserDocument {
  id: string;
  email: string;
  displayName?: string;
  timezone: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastSeenAt: Timestamp;
}
