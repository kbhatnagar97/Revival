import React, { useState, useEffect, type ReactNode } from 'react';
// Import the context object and types from our new, dedicated file.
import { HabitContext, type Habit, type HabitContextType } from './habit-context';

const HABIT_STORAGE_KEY = 'app-habit-tracker-data';

// This is the single component in this file.
const HabitProvider = ({ children }: { children: ReactNode }) => {
  const [habits, setHabits] = useState<Habit[]>([]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    let loadedHabits: Habit[] = [];
    try {
      const saved = localStorage.getItem(HABIT_STORAGE_KEY);
      loadedHabits = saved ? JSON.parse(saved) : [];
    } catch {
      loadedHabits = [];
    }
    const updatedHabits = loadedHabits.map((habit) =>
      habit.lastUpdated !== today ? { ...habit, count: 0, lastUpdated: today } : habit
    );
    setHabits(updatedHabits);
  }, []);

  const saveToStorage = (updatedHabits: Habit[]) => {
    setHabits(updatedHabits);
    localStorage.setItem(HABIT_STORAGE_KEY, JSON.stringify(updatedHabits));
  };
  
  const addHabit = (newHabitData: Omit<Habit, 'id' | 'count' | 'lastUpdated'>) => {
    const newHabit: Habit = {
      ...newHabitData,
      id: String(Date.now()),
      count: 0,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    saveToStorage([...habits, newHabit]);
  };

  const deleteHabit = (id: string) => saveToStorage(habits.filter(h => h.id !== id));

  const incrementHabit = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    saveToStorage(
      habits.map(h =>
        h.id === id
          ? { ...h, count: Math.min(h.goal, h.count + 1), lastUpdated: today }
          : h
      )
    );
  };
  
  const value: HabitContextType = { habits, addHabit, deleteHabit, incrementHabit };

  // Use the imported HabitContext object here.
  return <HabitContext.Provider value={value}>{children}</HabitContext.Provider>;
};

// Use a default export for the component.
export default HabitProvider;