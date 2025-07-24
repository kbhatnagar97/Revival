import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { callableFunctionOptions } from '../lib/config';
import { db } from '../lib/firebase';
import { logger } from 'firebase-functions';

/**
 * Get habit entries for a date range across all habits
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

    const entries: any[] = [];

    // Get all habits for the user
    const habitsRef = db.collection(`users/${userId}/habits`);
    const habitsSnapshot = await habitsRef.get();

    // For each habit, get entries in the date range
    for (const habitDoc of habitsSnapshot.docs) {
      const habitId = habitDoc.id;
      const entriesRef = db.collection(`users/${userId}/habits/${habitId}/entries`);
      
      // Query entries within date range
      const entriesSnapshot = await entriesRef
        .where('__name__', '>=', startDate)
        .where('__name__', '<=', endDate)
        .get();

      entriesSnapshot.docs.forEach(entryDoc => {
        entries.push({
          id: entryDoc.id,
          habitId,
          date: entryDoc.id, // Document ID is the date (YYYY-MM-DD)
          ...entryDoc.data(),
          createdAt: entryDoc.data().createdAt?.toDate().toISOString(),
          updatedAt: entryDoc.data().updatedAt?.toDate().toISOString(),
        });
      });
    }

    // Sort by date
    entries.sort((a, b) => a.date.localeCompare(b.date));

    logger.info(`Retrieved ${entries.length} habit entries for user: ${userId}`);
    return entries;
  } catch (error) {
    logger.error('Error getting habit entries:', error);
    throw new HttpsError('internal', 'Failed to get habit entries');
  }
});
