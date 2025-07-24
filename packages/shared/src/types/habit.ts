import { Timestamp } from 'firebase-admin/firestore';

export interface HabitDocument {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  goal: number;
  scheduledDays: { [day: string]: boolean }; // { "mon": true, "tue": false, ... }
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
  sortOrder: number;
  
  // Denormalized summary (calculated by Cloud Functions)
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  completionRate: number; // 0-100
  lastCalculated: Timestamp;
}

export interface CreateHabitRequest {
  name: string;
  icon: string;
  color: string;
  goal: number;
  scheduledDays: { [day: string]: boolean };
}

export interface UpdateHabitRequest {
  name?: string;
  icon?: string;
  color?: string;
  goal?: number;
  scheduledDays?: { [day: string]: boolean };
}
