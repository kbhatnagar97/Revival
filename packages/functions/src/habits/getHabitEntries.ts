import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { callableFunctionOptions } from '../lib/config';
import { db } from '../lib/firebase';
import { logger } from 'firebase-functions';
import { DailyEntry, HabitEntry } from '../lib/types';

/**
 * Get habit entries for a date range across all habits
 * Now queries the new daily entries collection structure
 */
export const getHabitEntries = onCall(callableFunctionOptions, async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { startDate, endDate } = request.data;

  if (!startDate || !endDate) {
    throw new HttpsError('invalid-argument', 'startDate and endDate are required');
  }

  try {
    logger.info(`Getting habit entries for user: ${userId}, range: ${startDate} to ${endDate}`);

    // Query daily entries collection instead of habit subcollections
    const entriesRef = db.collection(`users/${userId}/entries`);
    const entriesSnapshot = await entriesRef
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .orderBy('date', 'desc')
      .get();

    // Transform daily entries to individual habit entries for backward compatibility
    const habitEntries: HabitEntry[] = [];
    
    entriesSnapshot.docs.forEach(doc => {
      const dailyEntry = doc.data() as DailyEntry;
      
      // Extract each habit entry from the daily entry
      dailyEntry.habits.forEach(habitData => {
        habitEntries.push({
          id: `${doc.id}-${habitData.habitId}`, // Generate unique ID
          habitId: habitData.habitId,
          date: doc.id, // Document ID is the date (YYYY-MM-DD)
          count: habitData.count,
          completed: habitData.completed,
          goalAtTime: habitData.goalAtTime,
          notes: habitData.notes,
          createdAt: habitData.createdAt,
          updatedAt: habitData.lastUpdated,
        });
      });
    });

    // Sort by date (already sorted by query, but ensure consistency)
    habitEntries.sort((a, b) => a.date.localeCompare(b.date));

    logger.info(`Retrieved ${habitEntries.length} habit entries from ${entriesSnapshot.docs.length} daily entries for user: ${userId}`);
    return habitEntries.map(entry => ({
      ...entry,
      createdAt: entry.createdAt?.toDate().toISOString(),
      updatedAt: entry.updatedAt?.toDate().toISOString(),
    }));
  } catch (error) {
    logger.error('Error getting habit entries:', error);
    throw new HttpsError('internal', 'Failed to get habit entries');
  }
});
