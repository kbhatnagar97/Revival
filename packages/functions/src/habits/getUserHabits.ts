import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { callableFunctionOptions } from '../lib/config';
import { db } from '../lib/firebase';
import { logger } from 'firebase-functions';

/**
 * Get all habits for the authenticated user
 */
export const getUserHabits = onCall(callableFunctionOptions, async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;

  try {
    logger.info(`Getting habits for user: ${userId}`);

    // Get all habits for the user
    const habitsRef = db.collection(`users/${userId}/habits`);
    const habitsSnapshot = await habitsRef.orderBy('sortOrder', 'asc').get();

    const habits = habitsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    logger.info(`Retrieved ${habits.length} habits for user: ${userId}`);
    return habits;
  } catch (error) {
    logger.error('Error getting user habits:', error);
    throw new HttpsError('internal', 'Failed to get user habits');
  }
});
