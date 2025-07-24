import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import { db, Timestamp } from '../lib/firebase';
import { firestoreTriggerOptions } from '../lib/config';

/**
 * Triggered when a habit entry is created/updated
 * Uses INCREMENTAL streak calculation for performance
 * Follows DATABASE_SCHEMA.md specifications
 */
export const onHabitEntryWrite = onDocumentWritten({
  ...firestoreTriggerOptions,
  document: 'users/{userId}/habits/{habitId}/entries/{entryId}'
}, async (event) => {
  const { userId, habitId, entryId } = event.params;

  try {
    logger.info(
      `Processing habit entry update for user: ${userId}, habit: ${habitId}, entry: ${entryId}`
    );

    // Get the entry data from the event
    const entryData = event.data?.after?.data();
    if (!entryData) {
      logger.warn('No entry data found in event');
      return;
    }

    // Get habit document to access current analytics
    const habitRef = db.collection(`users/${userId}/habits`).doc(habitId);
    const habitDoc = await habitRef.get();
    
    if (!habitDoc.exists) {
      logger.warn(`Habit not found: ${habitId}`);
      return;
    }

    const habitData = habitDoc.data();
    if (!habitData) {
      logger.warn(`No habit data found for: ${habitId}`);
      return;
    }

    // Calculate incremental streak update
    const isCompletedToday = entryData.count >= habitData.goal;
    
    // Simple incremental streak calculation
    let newCurrentStreak = habitData.currentStreak || 0;
    let newBestStreak = habitData.bestStreak || 0;
    let newTotalCompletions = habitData.totalCompletions || 0;

    if (isCompletedToday) {
      // If completed today, increment streak and total
      newCurrentStreak += 1;
      newTotalCompletions += 1;
      
      // Update best streak if current is better
      if (newCurrentStreak > newBestStreak) {
        newBestStreak = newCurrentStreak;
      }
    } else {
      // Reset streak if not completed
      newCurrentStreak = 0;
    }

    // Update habit document with new analytics
    await habitRef.update({
      currentStreak: newCurrentStreak,
      bestStreak: newBestStreak,
      totalCompletions: newTotalCompletions,
      'analytics.allTimeConsistency': newTotalCompletions > 0 ? (newTotalCompletions / Math.max(1, newCurrentStreak + 1)) * 100 : 0,
      updatedAt: Timestamp.now()
    });

    logger.info(
      `Successfully updated habit summary for ${habitId}, streak: ${newCurrentStreak}, total: ${newTotalCompletions}`
    );
  } catch (error) {
    logger.error('Error processing habit entry update:', error);
    throw error;
  }
});
