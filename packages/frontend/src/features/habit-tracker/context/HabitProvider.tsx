import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import {
  HabitContext,
  type Habit,
  type HabitEntry,
  type HabitContextType,
  type CreateHabitRequest,
  type UpdateHabitRequest,
} from './habit-context';
import {
  habitService,
  type Habit as BaseHabit,
} from '../../../services/habitService';
import { useAuth } from '../../../common/hooks/useAuth';

const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const HabitProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [baseHabits, setBaseHabits] = useState<BaseHabit[]>([]);
  const [habitEntries, setHabitEntries] = useState<HabitEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Transform BaseHabit to extended Habit with legacy properties
  const habits: Habit[] = useMemo(() => {
    const today = getLocalDateString(new Date());

    return baseHabits.map((baseHabit) => {
      const todayEntry = habitEntries.find(
        (entry) => entry.habitId === baseHabit.id && entry.date === today
      );

      // Create completionData from entries
      const completionData: { [date: string]: number } = {};
      habitEntries
        .filter((entry) => entry.habitId === baseHabit.id)
        .forEach((entry) => {
          completionData[entry.date] = entry.count;
        });

      return {
        ...baseHabit,
        count: todayEntry?.count || 0,
        completionData,
        debt: 0, // Simplified for now
        surplus: 0, // Simplified for now
        lastUpdated: today,
      };
    });
  }, [baseHabits, habitEntries]);

  // Utility function to handle errors
  const handleError = useCallback((error: unknown, operation: string) => {
    console.error(`Error in ${operation}:`, error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    setError(`${operation}: ${errorMessage}`);
  }, []);

  // Load habits from Cloud Functions
  const refreshHabits = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const fetchedHabits = await habitService.getUserHabits();
      setBaseHabits(fetchedHabits);
    } catch (error) {
      console.warn('Cloud Functions not available, using empty state:', error);
      // Fallback to empty state when Cloud Functions are not available
      setBaseHabits([]);
      setError(null); // Don't show error for missing backend
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load habit entries for a date range
  const refreshHabitEntries = useCallback(
    async (startDate?: string, endDate?: string) => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        // Default to current month if no dates provided
        const now = new Date();
        const defaultStartDate =
          startDate ||
          getLocalDateString(new Date(now.getFullYear(), now.getMonth(), 1));
        const defaultEndDate =
          endDate ||
          getLocalDateString(
            new Date(now.getFullYear(), now.getMonth() + 1, 0)
          );

        const fetchedEntries = await habitService.getHabitEntries(
          defaultStartDate,
          defaultEndDate
        );
        setHabitEntries(fetchedEntries);
      } catch (error) {
        console.warn(
          'Cloud Functions not available, using empty entries:',
          error
        );
        // Fallback to empty state when Cloud Functions are not available
        setHabitEntries([]);
        setError(null); // Don't show error for missing backend
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // Load initial data when user changes
  useEffect(() => {
    if (user) {
      refreshHabits();
      refreshHabitEntries();
    } else {
      setBaseHabits([]);
      setHabitEntries([]);
      setError(null);
    }
  }, [user]); // Fixed: removed refreshHabits and refreshHabitEntries from deps to prevent infinite loop

  // Habit CRUD operations
  const createHabit = useCallback(
    async (habitData: CreateHabitRequest) => {
      try {
        setError(null);
        const newHabit = await habitService.createHabit(habitData);
        setBaseHabits((prev) => [...prev, newHabit]);
      } catch (error) {
        handleError(error, 'Creating habit');
        throw error;
      }
    },
    [handleError]
  );

  const updateHabit = useCallback(
    async (habitId: string, updates: UpdateHabitRequest) => {
      try {
        setError(null);
        const updatedHabit = await habitService.updateHabit(habitId, updates);
        setBaseHabits((prev) =>
          prev.map((habit) => (habit.id === habitId ? updatedHabit : habit))
        );
      } catch (error) {
        handleError(error, 'Updating habit');
        throw error;
      }
    },
    [handleError]
  );

  const deleteHabit = useCallback(
    async (habitId: string) => {
      try {
        setError(null);
        await habitService.deleteHabit(habitId);
        setBaseHabits((prev) => prev.filter((habit) => habit.id !== habitId));
        setHabitEntries((prev) =>
          prev.filter((entry) => entry.habitId !== habitId)
        );
      } catch (error) {
        handleError(error, 'Deleting habit');
        throw error;
      }
    },
    [handleError]
  );

  const reorderHabits = useCallback(
    async (habitIds: string[]) => {
      try {
        setError(null);
        await habitService.reorderHabits(habitIds);
        // Optimistically update the order
        const reorderedHabits = habitIds
          .map((id) => baseHabits.find((h) => h.id === id)!)
          .filter(Boolean);
        setBaseHabits(reorderedHabits);
      } catch (error) {
        handleError(error, 'Reordering habits');
        // Refresh habits to get the correct order
        refreshHabits();
        throw error;
      }
    },
    [baseHabits, handleError, refreshHabits]
  );

  const toggleHabitActive = useCallback(
    async (habitId: string) => {
      try {
        setError(null);
        const updatedHabit = await habitService.toggleHabitActive(habitId);
        setBaseHabits((prev) =>
          prev.map((habit) => (habit.id === habitId ? updatedHabit : habit))
        );
      } catch (error) {
        handleError(error, 'Toggling habit status');
        throw error;
      }
    },
    [handleError]
  );

  // Habit entry operations
  const updateHabitEntry = useCallback(
    async (
      habitId: string,
      date: string,
      count: number,
      completed: boolean,
      notes?: string
    ) => {
      try {
        setError(null);
        const updatedEntry = await habitService.updateHabitEntry(
          habitId,
          date,
          {
            count,
            completed,
            notes,
          }
        );

        setHabitEntries((prev) => {
          const existingIndex = prev.findIndex(
            (entry) => entry.habitId === habitId && entry.date === date
          );
          if (existingIndex >= 0) {
            const newEntries = [...prev];
            newEntries[existingIndex] = updatedEntry;
            return newEntries;
          } else {
            return [...prev, updatedEntry];
          }
        });

        // Removed refreshHabits() - Firestore realtime listeners will handle habit analytics updates
      } catch (error) {
        handleError(error, 'Updating habit entry');
        throw error;
      }
    },
    [handleError]
  ); // Removed refreshHabits from dependencies

  const deleteHabitEntry = useCallback(
    async (habitId: string, date: string) => {
      try {
        setError(null);
        await habitService.deleteHabitEntry(habitId, date);
        setHabitEntries((prev) =>
          prev.filter(
            (entry) => !(entry.habitId === habitId && entry.date === date)
          )
        );

        // Removed refreshHabits() - Firestore realtime listeners will handle habit analytics updates
      } catch (error) {
        handleError(error, 'Deleting habit entry');
        throw error;
      }
    },
    [handleError] // Removed refreshHabits from dependencies
  );

  // Utility functions
  const getHabitById = useCallback(
    (id: string): Habit | undefined => {
      return habits.find((habit) => habit.id === id);
    },
    [habits]
  );

  const getHabitEntriesForDate = useCallback(
    (date: string): HabitEntry[] => {
      return habitEntries.filter((entry) => entry.date === date);
    },
    [habitEntries]
  );

  const getHabitEntriesForHabit = useCallback(
    (habitId: string): HabitEntry[] => {
      return habitEntries.filter((entry) => entry.habitId === habitId);
    },
    [habitEntries]
  );

  // Legacy compatibility methods
  const addHabit = useCallback(
    async (
      habitData: Omit<CreateHabitRequest, 'days'> & { days?: number[] }
    ) => {
      const fullHabitData: CreateHabitRequest = {
        ...habitData,
        days: habitData.days || [0, 1, 2, 3, 4, 5, 6], // Default to all days
      };
      await createHabit(fullHabitData);
    },
    [createHabit]
  );

  const incrementHabit = useCallback(
    async (habitId: string, date: Date) => {
      const dateString = getLocalDateString(date);
      const currentEntry = habitEntries.find(
        (entry) => entry.habitId === habitId && entry.date === dateString
      );
      const currentCount = currentEntry?.count || 0;
      const habit = getHabitById(habitId);

      if (habit) {
        const newCount = currentCount + 1;
        const completed = newCount >= habit.goal;
        await updateHabitEntry(habitId, dateString, newCount, completed);
      }
    },
    [habitEntries, getHabitById, updateHabitEntry]
  );

  const decrementHabit = useCallback(
    async (habitId: string, date: Date) => {
      const dateString = getLocalDateString(date);
      const currentEntry = habitEntries.find(
        (entry) => entry.habitId === habitId && entry.date === dateString
      );
      const currentCount = currentEntry?.count || 0;
      const habit = getHabitById(habitId);

      if (habit && currentCount > 0) {
        const newCount = currentCount - 1;
        const completed = newCount >= habit.goal;
        await updateHabitEntry(habitId, dateString, newCount, completed);
      }
    },
    [habitEntries, getHabitById, updateHabitEntry]
  );

  // Legacy reorderHabits compatibility (old signature: activeId, overId)
  const legacyReorderHabits = useCallback(
    async (activeId: string, overId: string) => {
      const activeIndex = habits.findIndex((h) => h.id === activeId);
      const overIndex = habits.findIndex((h) => h.id === overId);

      if (activeIndex !== -1 && overIndex !== -1) {
        const newHabits = [...habits];
        const [removed] = newHabits.splice(activeIndex, 1);
        newHabits.splice(overIndex, 0, removed);

        const habitIds = newHabits.map((h) => h.id);
        await reorderHabits(habitIds);
      }
    },
    [habits, reorderHabits]
  );

  const contextValue: HabitContextType = {
    // State
    habits,
    habitEntries,
    loading,
    error,

    // Habit CRUD operations
    createHabit,
    updateHabit,
    deleteHabit,
    reorderHabits: legacyReorderHabits, // Use legacy signature for compatibility
    toggleHabitActive,

    // Habit entry operations
    updateHabitEntry,
    deleteHabitEntry,

    // Utility functions
    getHabitById,
    getHabitEntriesForDate,
    getHabitEntriesForHabit,

    // Data refresh
    refreshHabits,
    refreshHabitEntries,

    // Legacy compatibility methods
    addHabit,
    incrementHabit,
    decrementHabit,
  };

  return (
    <HabitContext.Provider value={contextValue}>
      {children}
    </HabitContext.Provider>
  );
};

export default HabitProvider;
