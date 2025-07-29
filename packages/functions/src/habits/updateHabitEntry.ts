import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { callableFunctionOptions } from '../lib/config';
import { db, Timestamp } from '../lib/firebase';
import { logger } from 'firebase-functions';
import { DailyEntry, HabitEntryData } from '../lib/types';

/**
 * Update or create a habit entry for a specific date
 * Now works with the new daily entries collection structure
 */
export const updateHabitEntry = onCall(callableFunctionOptions, async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { habitId, date, count, completed, notes } = request.data;

  if (!habitId || !date) {
    throw new HttpsError('invalid-argument', 'habitId and date are required');
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    throw new HttpsError('invalid-argument', 'Date must be in YYYY-MM-DD format');
  }

  try {
    logger.info(`Updating habit entry for habit: ${habitId}, date: ${date}, user: ${userId}`, {
      count,
      completed,
      notes: notes ? 'provided' : 'not provided'
    });

    // Verify habit ownership
    const habitRef = db.collection(`users/${userId}/habits`).doc(habitId);
    const habitDoc = await habitRef.get();

    if (!habitDoc.exists) {
      throw new HttpsError('not-found', 'Habit not found');
    }

    const habitData = habitDoc.data();
    if (!habitData) {
      throw new HttpsError('not-found', 'Habit data not found');
    }

    // Get or create the daily entry
    const entryRef = db.collection(`users/${userId}/entries`).doc(date);
    const entryDoc = await entryRef.get();

    const now = Timestamp.now();
    let dailyEntry: DailyEntry;
    let habitEntryData: HabitEntryData;

    if (entryDoc.exists) {
      // Update existing daily entry
      dailyEntry = entryDoc.data() as DailyEntry;
      const habitIndex = dailyEntry.habits.findIndex(h => h.habitId === habitId);

      if (habitIndex >= 0) {
        // Update existing habit entry within daily entry
        const existingHabitEntry = dailyEntry.habits[habitIndex];
        const finalCount = count !== undefined ? count : existingHabitEntry.count;
        
        habitEntryData = {
          ...existingHabitEntry,
          count: finalCount,
          completed: completed !== undefined ? completed : finalCount >= habitData.goal,
          notes: notes !== undefined ? notes : existingHabitEntry.notes,
          lastUpdated: now,
        };

        dailyEntry.habits[habitIndex] = habitEntryData;
      } else {
        // Add new habit entry to existing daily entry
        const finalCount = count || 0;
        habitEntryData = {
          habitId,
          count: finalCount,
          completed: completed !== undefined ? completed : finalCount >= habitData.goal,
          goalAtTime: habitData.goal,
          notes: notes || '',
          createdAt: now,
          lastUpdated: now,
        };

        dailyEntry.habits.push(habitEntryData);
      }

      // Update the daily entry
      await entryRef.update({
        habits: dailyEntry.habits,
        updatedAt: now
      });
    } else {
      // Create new daily entry with first habit
      const finalCount = count || 0;
      habitEntryData = {
        habitId,
        count: finalCount,
        completed: completed !== undefined ? completed : finalCount >= habitData.goal,
        goalAtTime: habitData.goal,
        notes: notes || '',
        createdAt: now,
        lastUpdated: now,
      };

      dailyEntry = {
        date,
        habits: [habitEntryData],
        createdAt: now,
        updatedAt: now,
      };

      await entryRef.set(dailyEntry);
    }

    // Return habit entry in legacy format for backward compatibility
    const result = {
      id: `${date}-${habitId}`,
      habitId,
      date,
      count: habitEntryData.count,
      completed: habitEntryData.completed,
      goalAtTime: habitEntryData.goalAtTime,
      notes: habitEntryData.notes,
      createdAt: habitEntryData.createdAt.toDate().toISOString(),
      updatedAt: habitEntryData.lastUpdated.toDate().toISOString(),
    };

    logger.info(`Successfully updated habit entry for habit: ${habitId}, date: ${date}`);
    return result;
  } catch (error) {
    logger.error('Error updating habit entry:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to update habit entry');
  }
});
