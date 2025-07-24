import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { callableFunctionOptions } from '../lib/config';
import { db } from '../lib/firebase';
import { logger } from 'firebase-functions';

/**
 * Delete a habit entry for a specific date
 * This will trigger onHabitEntryWrite for streak recalculation
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

    // Check if entry exists
    const entryRef = db.collection(`users/${userId}/habits/${habitId}/entries`).doc(date);
    const entryDoc = await entryRef.get();

    if (!entryDoc.exists) {
      throw new HttpsError('not-found', 'Habit entry not found');
    }

    // Delete the entry
    await entryRef.delete();

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
