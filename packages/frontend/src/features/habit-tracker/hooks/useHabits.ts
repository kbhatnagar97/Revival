import { useContext } from 'react';
import { HabitContext, type HabitContextType } from '../context/habit-context';

export const useHabits = (): HabitContextType => {
  const context = useContext(HabitContext);
  if (context === undefined) {
    throw new Error('useHabits must be used within a HabitProvider');
  }
  return context;
};