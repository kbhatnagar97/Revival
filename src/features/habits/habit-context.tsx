import { createContext } from 'react';

// Define and export the Habit type.
export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  goal: number;
  count: number;
  lastUpdated: string;
}

// Define and export the shape of the context's value.
export interface HabitContextType {
  habits: Habit[];
  addHabit: (habit: Omit<Habit, 'id' | 'count' | 'lastUpdated'>) => void;
  deleteHabit: (id: string) => void;
  incrementHabit: (id: string) => void;
}

// Create and export the actual context object.
// This is what other files will use to connect.
export const HabitContext = createContext<HabitContextType | undefined>(undefined);