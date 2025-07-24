import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { callableFunctionOptions } from '../lib/config';
import { db } from '../lib/firebase';
import { logger } from 'firebase-functions';

/**
 * Get habit entries for a specific habit, optionally within a date range
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

    // Get entries for the habit
    const entriesRef = db.collection(`users/${userId}/habits/${habitId}/entries`);
    let query = entriesRef.orderBy('__name__', 'asc');

    // Apply date range filter if provided
    if (startDate) {
      query = query.where('__name__', '>=', startDate);
    }
    if (endDate) {
      query = query.where('__name__', '<=', endDate);
    }

    const entriesSnapshot = await query.get();

    const entries = entriesSnapshot.docs.map(doc => ({
      id: doc.id,
      habitId,
      date: doc.id, // Document ID is the date (YYYY-MM-DD)
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate().toISOString(),
    }));

    logger.info(`Retrieved ${entries.length} entries for habit: ${habitId}`);
    return entries;
  } catch (error) {
    logger.error('Error getting habit entries for habit:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to get habit entries');
  }
});
