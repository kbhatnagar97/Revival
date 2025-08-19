import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { callableFunctionOptions } from '../lib/config';
import { db, Timestamp } from '../lib/firebase';
import { logger } from 'firebase-functions';

/**
 * Reorder habits by updating their order field
 * Used for drag-and-drop functionality in the frontend
 */
export const reorderHabits = onCall(callableFunctionOptions, async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { habitIds } = request.data;

  if (!habitIds || !Array.isArray(habitIds) || habitIds.length === 0) {
    throw new HttpsError('invalid-argument', 'habitIds must be a non-empty array');
  }

  try {
    logger.info(`Reordering habits for user: ${userId}`, {
      habitIds,
      count: habitIds.length
    });

    // Use a batch to update all habits atomically
    const batch = db.batch();
    const now = Timestamp.now();

    // Update each habit with its new order
    habitIds.forEach((habitId: string, index: number) => {
      if (typeof habitId !== 'string' || habitId.trim() === '') {
        throw new HttpsError('invalid-argument', `Invalid habitId at index ${index}: ${habitId}`);
      }

      const habitRef = db.collection(`users/${userId}/habits`).doc(habitId);
      batch.update(habitRef, {
        order: index,
        updatedAt: now
      });
    });

    // Commit the batch
    await batch.commit();

    logger.info(`Successfully reordered ${habitIds.length} habits for user: ${userId}`);

    return {
      success: true,
      message: `Successfully reordered ${habitIds.length} habits`,
      habitIds,
      updatedAt: now.toDate().toISOString()
    };

  } catch (error) {
    logger.error('Error reordering habits:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to reorder habits');
  }
});