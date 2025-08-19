import { createContext } from 'react';
import type { Habit as BaseHabit, HabitEntry, CreateHabitRequest, UpdateHabitRequest } from '../../../services/habitService';

// Extended Habit interface for compatibility with existing components
export interface Habit extends BaseHabit {
  // Legacy properties for backward compatibility
  count: number; // Current count for today
  completionData: { [date: string]: number }; // Date-indexed completion data
  debt: number; // Calculated debt (for backward compatibility)
  surplus: number; // Calculated surplus (for backward compatibility)
  lastUpdated: string; // Last update date
}

export interface HabitContextType {
  // State
  habits: Habit[];
  habitEntries: HabitEntry[];
  loading: boolean;
  error: string | null;
  
  // Habit CRUD operations
  createHabit: (habitData: CreateHabitRequest) => Promise<void>;
  updateHabit: (habitId: string, updates: UpdateHabitRequest) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  reorderHabits: (activeId: string, overId: string) => Promise<void>;
  toggleHabitActive: (habitId: string) => Promise<void>;
  
  // Habit entry operations
  updateHabitEntry: (habitId: string, date: string, count: number, completed: boolean, notes?: string) => Promise<void>;
  deleteHabitEntry: (habitId: string, date: string) => Promise<void>;
  
  // Utility functions
  getHabitById: (id: string) => Habit | undefined;
  getHabitEntriesForDate: (date: string) => HabitEntry[];
  getHabitEntriesForHabit: (habitId: string) => HabitEntry[];
  
  // Data refresh
  refreshHabits: () => Promise<void>;
  refreshHabitEntries: (startDate?: string, endDate?: string) => Promise<void>;
  
  // Legacy compatibility methods (for gradual migration)
  addHabit: (habitData: Omit<CreateHabitRequest, 'days'> & { days?: number[] }) => Promise<void>;
  incrementHabit: (habitId: string, date: Date) => Promise<void>;
  decrementHabit: (habitId: string, date: Date) => Promise<void>;
}

export const HabitContext = createContext<HabitContextType | undefined>(undefined);

// Re-export types for convenience
export type { HabitEntry, CreateHabitRequest, UpdateHabitRequest };