import { onDocumentDeleted } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import { db } from '../lib/firebase';
import { firestoreTriggerOptions } from '../lib/config';

/**
 * Triggered when a habit document is deleted
 * Cleans up associated daily entries
 */
export const onHabitDelete = onDocumentDeleted({
  ...firestoreTriggerOptions,
  document: 'users/{userId}/habits/{habitId}'
}, async (event) => {
  const { userId, habitId } = event.params;

  try {
    logger.info(`Cleaning up data for deleted habit: ${habitId}`);

    // Delete all daily entries for this habit
    const entriesRef = db.collection(`users/${userId}/habits/${habitId}/entries`);
    const entriesSnapshot = await entriesRef.get();

    const batch = db.batch();
    entriesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    logger.info(`Successfully cleaned up ${entriesSnapshot.size} entries for habit: ${habitId}`);
  } catch (error) {
    logger.error('Error cleaning up habit data:', error);
    throw error;
  }
});
