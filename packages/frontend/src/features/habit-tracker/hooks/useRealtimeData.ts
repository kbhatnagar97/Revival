import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  type Unsubscribe 
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../common/hooks/useAuth';
import type { Habit, HabitEntry } from '../../../services/habitService';

interface UseRealtimeDataReturn {
  habits: Habit[];
  habitEntries: HabitEntry[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook for real-time Firestore data synchronization
 * This provides live updates when data changes in Firestore
 */
export const useRealtimeData = (): UseRealtimeDataReturn => {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitEntries, setHabitEntries] = useState<HabitEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((error: unknown, operation: string) => {
    console.error(`Error in ${operation}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    setError(`${operation}: ${errorMessage}`);
  }, []);

  useEffect(() => {
    if (!user) {
      setHabits([]);
      setHabitEntries([]);
      setError(null);
      return;
    }

    setLoading(true);
    const unsubscribers: Unsubscribe[] = [];

    try {
      // Set up real-time listener for habits
      const habitsQuery = query(
        collection(db, 'users', user.id, 'habits'),
        orderBy('sortOrder', 'asc')
      );

      const unsubscribeHabits = onSnapshot(
        habitsQuery,
        (snapshot) => {
          const habitsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as Habit[];
          
          setHabits(habitsData);
          setLoading(false);
        },
        (error) => {
          handleError(error, 'Real-time habits sync');
          setLoading(false);
        }
      );

      unsubscribers.push(unsubscribeHabits);

      // Set up real-time listener for habit entries (current month)
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const entriesQuery = query(
        collection(db, 'users', user.id, 'habitEntries'),
        where('date', '>=', startOfMonth.toISOString().split('T')[0]),
        where('date', '<=', endOfMonth.toISOString().split('T')[0]),
        orderBy('date', 'desc')
      );

      const unsubscribeEntries = onSnapshot(
        entriesQuery,
        (snapshot) => {
          const entriesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as HabitEntry[];
          
          setHabitEntries(entriesData);
        },
        (error) => {
          handleError(error, 'Real-time habit entries sync');
        }
      );

      unsubscribers.push(unsubscribeEntries);

    } catch (error) {
      handleError(error, 'Setting up real-time listeners');
      setLoading(false);
    }

    // Cleanup function
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [user, handleError]);

  return {
    habits,
    habitEntries,
    loading,
    error,
  };
};

/**
 * Hook for real-time habit entries within a specific date range
 */
export const useRealtimeHabitEntries = (startDate: string, endDate: string) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((error: unknown, operation: string) => {
    console.error(`Error in ${operation}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    setError(`${operation}: ${errorMessage}`);
  }, []);

  useEffect(() => {
    if (!user || !startDate || !endDate) {
      setEntries([]);
      return;
    }

    setLoading(true);

    const entriesQuery = query(
      collection(db, 'users', user.id, 'habitEntries'),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(
      entriesQuery,
      (snapshot) => {
        const entriesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as HabitEntry[];
        
        setEntries(entriesData);
        setLoading(false);
      },
      (error) => {
        handleError(error, 'Real-time habit entries sync');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, startDate, endDate, handleError]);

  return {
    entries,
    loading,
    error,
  };
};

/**
 * Hook for real-time data for a specific habit
 */
export const useRealtimeHabit = (habitId: string) => {
  const { user } = useAuth();
  const [habit, setHabit] = useState<Habit | null>(null);
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((error: unknown, operation: string) => {
    console.error(`Error in ${operation}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    setError(`${operation}: ${errorMessage}`);
  }, []);

  useEffect(() => {
    if (!user || !habitId) {
      setHabit(null);
      setEntries([]);
      return;
    }

    setLoading(true);
    const unsubscribers: Unsubscribe[] = [];

    try {
      // Listen to specific habit
      const habitQuery = query(
        collection(db, 'users', user.id, 'habits'),
        where('__name__', '==', habitId)
      );

      const unsubscribeHabit = onSnapshot(
        habitQuery,
        (snapshot) => {
          if (!snapshot.empty) {
            const habitDoc = snapshot.docs[0];
            setHabit({
              id: habitDoc.id,
              ...habitDoc.data(),
            } as Habit);
          } else {
            setHabit(null);
          }
          setLoading(false);
        },
        (error) => {
          handleError(error, 'Real-time habit sync');
          setLoading(false);
        }
      );

      unsubscribers.push(unsubscribeHabit);

      // Listen to habit entries for this habit
      const entriesQuery = query(
        collection(db, 'users', user.id, 'habitEntries'),
        where('habitId', '==', habitId),
        orderBy('date', 'desc')
      );

      const unsubscribeEntries = onSnapshot(
        entriesQuery,
        (snapshot) => {
          const entriesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as HabitEntry[];
          
          setEntries(entriesData);
        },
        (error) => {
          handleError(error, 'Real-time habit entries sync');
        }
      );

      unsubscribers.push(unsubscribeEntries);

    } catch (error) {
      handleError(error, 'Setting up real-time habit listeners');
      setLoading(false);
    }

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [user, habitId, handleError]);

  return {
    habit,
    entries,
    loading,
    error,
  };
};
