import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { callableFunctionOptions } from '../lib/config';
import { db } from '../lib/firebase';
import { logger } from 'firebase-functions';

/**
 * Delete a habit and all its entries for the authenticated user
 */
export const deleteHabit = onCall(callableFunctionOptions, async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { habitId } = request.data;

  if (!habitId) {
    throw new HttpsError('invalid-argument', 'habitId is required');
  }

  try {
    logger.info(`Deleting habit: ${habitId} for user: ${userId}`);

    // Verify habit ownership
    const habitRef = db.collection(`users/${userId}/habits`).doc(habitId);
    const habitDoc = await habitRef.get();

    if (!habitDoc.exists) {
      throw new HttpsError('not-found', 'Habit not found');
    }

    // Delete the habit document (onHabitDelete trigger will clean up entries)
    await habitRef.delete();

    logger.info(`Successfully deleted habit: ${habitId} for user: ${userId}`);
    return { success: true, message: 'Habit deleted successfully' };
  } catch (error) {
    logger.error('Error deleting habit:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to delete habit');
  }
});
