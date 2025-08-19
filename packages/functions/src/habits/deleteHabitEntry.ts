import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { callableFunctionOptions } from '../lib/config';
import { db, Timestamp } from '../lib/firebase';
import { logger } from 'firebase-functions';
import { DailyEntry } from '../lib/types';

/**
 * Delete a habit entry for a specific date
 * Now works with the new daily entries collection structure
 */
export const deleteHabitEntry = onCall(callableFunctionOptions, async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { habitId, date } = request.data;

  if (!habitId || !date) {
    throw new HttpsError('invalid-argument', 'habitId and date are required');
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    throw new HttpsError('invalid-argument', 'Date must be in YYYY-MM-DD format');
  }

  try {
    logger.info(`Deleting habit entry for habit: ${habitId}, date: ${date}, user: ${userId}`);

    // Verify habit ownership
    const habitRef = db.collection(`users/${userId}/habits`).doc(habitId);
    const habitDoc = await habitRef.get();

    if (!habitDoc.exists) {
      throw new HttpsError('not-found', 'Habit not found');
    }

    // Get the daily entry
    const entryRef = db.collection(`users/${userId}/entries`).doc(date);
    const entryDoc = await entryRef.get();

    if (!entryDoc.exists) {
      throw new HttpsError('not-found', 'Daily entry not found');
    }

    const dailyEntry = entryDoc.data() as DailyEntry;
    const habitIndex = dailyEntry.habits.findIndex(h => h.habitId === habitId);

    if (habitIndex === -1) {
      throw new HttpsError('not-found', 'Habit entry not found for this date');
    }

    // Remove the habit from the habits array
    dailyEntry.habits.splice(habitIndex, 1);

    if (dailyEntry.habits.length === 0) {
      // If no habits remain, delete the entire daily entry
      await entryRef.delete();
      logger.info(`Deleted entire daily entry for date: ${date} (no habits remaining)`);
    } else {
      // Update the daily entry with the remaining habits
      await entryRef.update({
        habits: dailyEntry.habits,
        updatedAt: Timestamp.now()
      });
      logger.info(`Removed habit ${habitId} from daily entry for date: ${date}`);
    }

    logger.info(`Successfully deleted habit entry for habit: ${habitId}, date: ${date}`);
    return { success: true, message: 'Habit entry deleted successfully' };
  } catch (error) {
    logger.error('Error deleting habit entry:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to delete habit entry');
  }
});
