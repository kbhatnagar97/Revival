import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import type { HabitDocument } from '../lib/types';
import { db, Timestamp } from '../lib/firebase';
import { firestoreTriggerOptions } from '../lib/config';

/**
 * Triggered when a habit document is updated
 */
export const onHabitUpdate = onDocumentUpdated({
  ...firestoreTriggerOptions,
  document: 'users/{userId}/habits/{habitId}'
}, async (event) => {
  const { userId, habitId } = event.params;
  const beforeData = event.data?.before?.data() as HabitDocument;
  const afterData = event.data?.after?.data() as HabitDocument;

  if (!beforeData || !afterData) {
    logger.warn(`Missing habit data for ${habitId}`);
    return;
  }

  try {
    logger.info(`Habit updated: ${habitId} for user: ${userId}`);
    
    // Update the lastCalculated timestamp
    await db.collection(`users/${userId}/habits`).doc(habitId).update({
      updatedAt: Timestamp.now(),
    });

    logger.info(`Successfully processed habit update for: ${habitId}`);
  } catch (error) {
    logger.error('Error processing habit update:', error);
    throw error;
  }
});
