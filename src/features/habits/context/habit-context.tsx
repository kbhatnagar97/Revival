import { createContext } from 'react';

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  goal: number;
  count: number;
  lastUpdated: string;
  completionData: { [date: string]: number };
  days: number[];
  debt: number;
  surplus: number;
}

type HabitCreationData = Omit<Habit, 'id' | 'count' | 'lastUpdated' | 'completionData' | 'debt' | 'surplus'>;
type HabitUpdateData = Omit<Habit, 'id' | 'lastUpdated' | 'completionData'>;

export interface HabitContextType {
  habits: Habit[];
  getHabitById: (id: string) => Habit | undefined;
  addHabit: (habit: HabitCreationData) => void;
  deleteHabit: (id: string) => void;
  incrementHabit: (id: string, date: Date) => void;
  decrementHabit: (id: string, date: Date) => void;
  updateHabit: (id: string, updatedData: HabitUpdateData) => void;
  reorderHabits: (activeId: string, overId: string) => void;
}

export const HabitContext = createContext<HabitContextType | undefined>(undefined);