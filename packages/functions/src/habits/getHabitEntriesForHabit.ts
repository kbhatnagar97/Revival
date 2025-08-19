import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { callableFunctionOptions } from '../lib/config';
import { db } from '../lib/firebase';
import { logger } from 'firebase-functions';
import { DailyEntry, HabitEntry } from '../lib/types';

/**
 * Get habit entries for a specific habit, optionally within a date range
 * Now queries the new daily entries collection structure
 */
export const getHabitEntriesForHabit = onCall(callableFunctionOptions, async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { habitId, startDate, endDate } = request.data;

  if (!habitId) {
    throw new HttpsError('invalid-argument', 'habitId is required');
  }

  try {
    logger.info(`Getting entries for habit: ${habitId}, user: ${userId}`, {
      startDate: startDate || 'not specified',
      endDate: endDate || 'not specified'
    });

    // Verify habit ownership
    const habitRef = db.collection(`users/${userId}/habits`).doc(habitId);
    const habitDoc = await habitRef.get();

    if (!habitDoc.exists) {
      throw new HttpsError('not-found', 'Habit not found');
    }

    // Query daily entries collection
    const entriesRef = db.collection(`users/${userId}/entries`);
    let query = entriesRef.orderBy('date', 'asc');

    // Apply date range filter if provided
    if (startDate) {
      query = query.where('date', '>=', startDate);
    }
    if (endDate) {
      query = query.where('date', '<=', endDate);
    }

    const entriesSnapshot = await query.get();

    // Filter and transform daily entries to get specific habit data
    const habitEntries: HabitEntry[] = [];
    
    entriesSnapshot.docs.forEach(doc => {
      const dailyEntry = doc.data() as DailyEntry;
      
      // Find the specific habit within this daily entry
      const habitData = dailyEntry.habits.find(h => h.habitId === habitId);
      
      if (habitData) {
        habitEntries.push({
          id: `${doc.id}-${habitId}`, // Generate unique ID
          habitId,
          date: doc.id, // Document ID is the date (YYYY-MM-DD)
          count: habitData.count,
          completed: habitData.completed,
          goalAtTime: habitData.goalAtTime,
          notes: habitData.notes,
          createdAt: habitData.createdAt,
          updatedAt: habitData.lastUpdated,
        });
      }
    });

    // Transform timestamps for response
    const entries = habitEntries.map(entry => ({
      ...entry,
      createdAt: entry.createdAt?.toDate().toISOString(),
      updatedAt: entry.updatedAt?.toDate().toISOString(),
    }));

    logger.info(`Retrieved ${entries.length} entries for habit: ${habitId} from ${entriesSnapshot.docs.length} daily entries`);
    return entries;
  } catch (error) {
    logger.error('Error getting habit entries for habit:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to get habit entries');
  }
});
