import { useContext } from 'react';
// Import from our new, dedicated context file.
import { HabitContext, type HabitContextType } from './habit-context';

// Re-export the Habit type for convenience.
export type { Habit } from './habit-context';

// This hook's logic remains the same.
export const useHabits = (): HabitContextType => {
  const context = useContext(HabitContext);
  if (context === undefined) {
    throw new Error('useHabits must be used within a HabitProvider');
  }
  return context;
};