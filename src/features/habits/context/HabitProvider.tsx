import { useState, useEffect, type ReactNode } from 'react';
import { HabitContext, type Habit, type HabitContextType } from './habit-context';

const HABIT_STORAGE_KEY = 'app-habit-tracker-data';

const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const HabitProvider = ({ children }: { children: ReactNode }) => {
  const [habits, setHabits] = useState<Habit[]>(() => {
    const today = getLocalDateString(new Date());
    let loadedHabits: any[] = [];

    try {
      const saved = localStorage.getItem(HABIT_STORAGE_KEY);
      loadedHabits = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(loadedHabits)) loadedHabits = [];
    } catch {
      loadedHabits = [];
    }

    const processedHabits = loadedHabits.map((habit) => {
      if (habit.history && !habit.completionData) {
        habit.completionData = {};
        habit.history.forEach((dateString: string) => {
          habit.completionData[dateString] = habit.goal;
        });
        delete habit.history;
      }

      const completionData = habit.completionData || {};
      let debt = habit.debt || 0;
      let surplus = habit.surplus || 0;
      const days = habit.days || [0, 1, 2, 3, 4, 5, 6];

      if (habit.lastUpdated < today) {
        const lastUpdatedDate = new Date(habit.lastUpdated + 'T00:00:00');
        const lastUpdatedDayOfWeek = lastUpdatedDate.getUTCDay();

        if (days.includes(lastUpdatedDayOfWeek)) {
          const countOnLastDay = completionData[habit.lastUpdated] || 0;
          const diff = countOnLastDay - habit.goal;
          if (diff < 0) {
            debt += Math.abs(diff);
          } else if (diff > 0) {
            surplus += diff;
          }
        }

        if (debt > 0 && surplus > 0) {
          const paidOff = Math.min(debt, surplus);
          debt -= paidOff;
          surplus -= paidOff;
        }
        return { ...habit, lastUpdated: today, completionData, debt, surplus, days };
      }
      return { ...habit, completionData, debt, surplus, days };
    });

    return processedHabits;
  });

  useEffect(() => {
    localStorage.setItem(HABIT_STORAGE_KEY, JSON.stringify(habits));
  }, [habits]);

  const addHabit = (newHabitData: Omit<Habit, 'id' | 'count' | 'lastUpdated' | 'completionData' | 'debt' | 'surplus'>) => {
    const today = getLocalDateString(new Date());
    const newHabit: Habit = {
      ...newHabitData,
      id: String(Date.now()),
      count: 0,
      lastUpdated: today,
      completionData: {},
      debt: 0,
      surplus: 0,
    };
    setHabits((prevHabits) => [...prevHabits, newHabit]);
  };

  const deleteHabit = (id: string) => {
    setHabits((prevHabits) => prevHabits.filter((h) => h.id !== id));
  };

  const incrementHabit = (id: string, date: Date) => {
    const dateString = getLocalDateString(date);
    setHabits((prevHabits) =>
      prevHabits.map((h) => {
        if (h.id === id) {
          const newCompletionData = { ...h.completionData };
          const currentCount = newCompletionData[dateString] || 0;
          newCompletionData[dateString] = currentCount + 1;

          return { ...h, completionData: newCompletionData };
        }
        return h;
      })
    );
  };

  const decrementHabit = (id: string, date: Date) => {
    const dateString = getLocalDateString(date);
    setHabits((prevHabits) =>
      prevHabits.map((h) => {
        if (h.id === id) {
          const newCompletionData = { ...h.completionData };
          const currentCount = newCompletionData[dateString] || 0;
          const newCount = Math.max(0, currentCount - 1);

          if (newCount === 0) {
            delete newCompletionData[dateString];
          } else {
            newCompletionData[dateString] = newCount;
          }

          return { ...h, completionData: newCompletionData };
        }
        return h;
      })
    );
  };

  const updateHabit = (id: string, updatedData: Omit<Habit, 'id' | 'lastUpdated' | 'completionData'>) => {
    setHabits((prevHabits) =>
      prevHabits.map((habit) => {
        if (habit.id === id) {
          return {
            ...habit,
            ...updatedData,
          };
        }
        return habit;
      })
    );
  };

  const reorderHabits = (activeId: string, overId: string) => {
    const oldIndex = habits.findIndex((item) => item.id === activeId);
    const newIndex = habits.findIndex((item) => item.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedHabits = [...habits];
    const [removed] = reorderedHabits.splice(oldIndex, 1);
    reorderedHabits.splice(newIndex, 0, removed);
    setHabits(reorderedHabits);
  };

  const getHabitById = (id: string) => {
    return habits.find((h) => h.id === id);
  };

  const value: HabitContextType = { habits, getHabitById, addHabit, deleteHabit, incrementHabit, decrementHabit, updateHabit, reorderHabits };

  return <HabitContext.Provider value={value}>{children}</HabitContext.Provider>;
};

export default HabitProvider;