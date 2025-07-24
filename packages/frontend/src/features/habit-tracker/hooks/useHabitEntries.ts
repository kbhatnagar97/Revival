import { useState, useEffect, useCallback } from 'react';
import { habitService, type HabitEntry } from '../../../services/habitService';
import { useAuth } from '../../../common/hooks/useAuth';

interface UseHabitEntriesOptions {
  habitId?: string;
  startDate?: string;
  endDate?: string;
  autoRefresh?: boolean;
}

interface UseHabitEntriesReturn {
  entries: HabitEntry[];
  loading: boolean;
  error: string | null;
  refreshEntries: () => Promise<void>;
  updateEntry: (habitId: string, date: string, count: number, completed: boolean, notes?: string) => Promise<void>;
  deleteEntry: (habitId: string, date: string) => Promise<void>;
}

/**
 * Hook for managing habit entries with optional filtering by habit or date range
 */
export const useHabitEntries = (options: UseHabitEntriesOptions = {}): UseHabitEntriesReturn => {
  const { user } = useAuth();
  const { habitId, startDate, endDate, autoRefresh = true } = options;
  
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((error: unknown, operation: string) => {
    console.error(`Error in ${operation}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    setError(`${operation}: ${errorMessage}`);
  }, []);

  const refreshEntries = useCallback(async () => {
    if (!user) {
      setEntries([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let fetchedEntries: HabitEntry[];

      if (habitId) {
        // Fetch entries for a specific habit
        fetchedEntries = await habitService.getHabitEntriesForHabit(habitId, startDate, endDate);
      } else if (startDate && endDate) {
        // Fetch entries for a date range
        fetchedEntries = await habitService.getHabitEntries(startDate, endDate);
      } else {
        // Default to current month
        const now = new Date();
        const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        fetchedEntries = await habitService.getHabitEntries(defaultStartDate, defaultEndDate);
      }

      setEntries(fetchedEntries);
    } catch (error) {
      handleError(error, 'Loading habit entries');
    } finally {
      setLoading(false);
    }
  }, [user, habitId, startDate, endDate, handleError]);

  const updateEntry = useCallback(async (
    habitId: string,
    date: string,
    count: number,
    completed: boolean,
    notes?: string
  ) => {
    try {
      setError(null);
      const updatedEntry = await habitService.updateHabitEntry(habitId, date, {
        count,
        completed,
        notes,
      });

      setEntries(prev => {
        const existingIndex = prev.findIndex(entry => entry.habitId === habitId && entry.date === date);
        if (existingIndex >= 0) {
          const newEntries = [...prev];
          newEntries[existingIndex] = updatedEntry;
          return newEntries;
        } else {
          return [...prev, updatedEntry];
        }
      });
    } catch (error) {
      handleError(error, 'Updating habit entry');
      throw error;
    }
  }, [handleError]);

  const deleteEntry = useCallback(async (habitId: string, date: string) => {
    try {
      setError(null);
      await habitService.deleteHabitEntry(habitId, date);
      setEntries(prev => prev.filter(entry => !(entry.habitId === habitId && entry.date === date)));
    } catch (error) {
      handleError(error, 'Deleting habit entry');
      throw error;
    }
  }, [handleError]);

  // Auto-refresh entries when dependencies change
  useEffect(() => {
    if (autoRefresh) {
      refreshEntries();
    }
  }, [autoRefresh, refreshEntries]);

  return {
    entries,
    loading,
    error,
    refreshEntries,
    updateEntry,
    deleteEntry,
  };
};
