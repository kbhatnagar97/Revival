import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Habit {
  id?: string;
  userId: string;
  title: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  targetCount: number;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HabitRecord {
  id?: string;
  habitId: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  completed: boolean;
  count: number;
  createdAt: Date;
}

const HABITS_COLLECTION = 'habits';
const HABIT_RECORDS_COLLECTION = 'habitRecords';

export const habitService = {
  // Create a new habit
  createHabit: async (habitData: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date();
    const habit = {
      ...habitData,
      createdAt: now,
      updatedAt: now,
    };
    
    const docRef = await addDoc(collection(db, HABITS_COLLECTION), habit);
    return { id: docRef.id, ...habit };
  },

  // Get all habits for a user
  getUserHabits: async (userId: string): Promise<Habit[]> => {
    const q = query(
      collection(db, HABITS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
    })) as Habit[];
  },

  // Update a habit
  updateHabit: async (habitId: string, updates: Partial<Habit>) => {
    const habitRef = doc(db, HABITS_COLLECTION, habitId);
    await updateDoc(habitRef, {
      ...updates,
      updatedAt: new Date(),
    });
  },

  // Delete a habit
  deleteHabit: async (habitId: string) => {
    await deleteDoc(doc(db, HABITS_COLLECTION, habitId));
  },

  // Record habit completion
  recordHabit: async (recordData: Omit<HabitRecord, 'id' | 'createdAt'>) => {
    const record = {
      ...recordData,
      createdAt: new Date(),
    };
    
    const docRef = await addDoc(collection(db, HABIT_RECORDS_COLLECTION), record);
    return { id: docRef.id, ...record };
  },

  // Get habit records for a user and date range
  getHabitRecords: async (userId: string, startDate?: string, endDate?: string): Promise<HabitRecord[]> => {
    let q = query(
      collection(db, HABIT_RECORDS_COLLECTION),
      where('userId', '==', userId)
    );

    if (startDate && endDate) {
      q = query(q, where('date', '>=', startDate), where('date', '<=', endDate));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
    })) as HabitRecord[];
  },

  // Update habit record
  updateHabitRecord: async (recordId: string, updates: Partial<HabitRecord>) => {
    const recordRef = doc(db, HABIT_RECORDS_COLLECTION, recordId);
    await updateDoc(recordRef, updates);
  },

  // Delete habit record
  deleteHabitRecord: async (recordId: string) => {
    await deleteDoc(doc(db, HABIT_RECORDS_COLLECTION, recordId));
  },
};
