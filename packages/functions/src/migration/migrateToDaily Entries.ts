import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { callableFunctionOptions } from '../lib/config';
import { db, Timestamp } from '../lib/firebase';
import { logger } from 'firebase-functions';
import { DailyEntry, HabitEntryData } from '../lib/types';

/**
 * Migration script to convert from old habit subcollections to new daily entries structure
 * This should be run once during the schema migration
 */
export const migrateToDailyEntries = onCall(callableFunctionOptions, async (request) => {
  // Check if user is authenticated and is an admin (you may want to add admin check)
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { userId, dryRun = true } = request.data;

  if (!userId) {
    throw new HttpsError('invalid-argument', 'userId is required');
  }

  try {
    logger.info(`Starting migration for user: ${userId}, dryRun: ${dryRun}`);

    // Get all habits for the user
    const habitsRef = db.collection(`users/${userId}/habits`);
    const habitsSnapshot = await habitsRef.get();

    if (habitsSnapshot.empty) {
      logger.info(`No habits found for user: ${userId}`);
      return { success: true, message: 'No habits to migrate', migratedEntries: 0 };
    }

    // Collect all habit entries grouped by date
    const entriesByDate: { [date: string]: HabitEntryData[] } = {};
    let totalEntries = 0;

    // Process each habit
    for (const habitDoc of habitsSnapshot.docs) {
      const habitId = habitDoc.id;
      const habitData = habitDoc.data();
      
      logger.info(`Processing habit: ${habitId}`);

      // Get all entries for this habit
      const entriesRef = db.collection(`users/${userId}/habits/${habitId}/entries`);
      const entriesSnapshot = await entriesRef.get();

      // Process each entry
      entriesSnapshot.docs.forEach(entryDoc => {
        const date = entryDoc.id; // Document ID is the date
        const entryData = entryDoc.data();

        // Initialize date group if it doesn't exist
        if (!entriesByDate[date]) {
          entriesByDate[date] = [];
        }

        // Create habit entry data
        const habitEntryData: HabitEntryData = {
          habitId,
          habitName: habitData.name || 'Unknown Habit',
          count: entryData.count || 0,
          completed: entryData.completed || false,
          goalAtTime: entryData.goalAtTime || habitData.goal || 1,
          notes: entryData.notes || '',
          createdAt: entryData.createdAt || Timestamp.now(),
          lastUpdated: entryData.lastUpdated || Timestamp.now(),
        };

        entriesByDate[date].push(habitEntryData);
        totalEntries++;
      });
    }

    logger.info(`Found ${totalEntries} entries across ${Object.keys(entriesByDate).length} dates`);

    if (dryRun) {
      // Return summary without making changes
      return {
        success: true,
        message: 'Dry run completed',
        totalEntries,
        totalDates: Object.keys(entriesByDate).length,
        sampleDates: Object.keys(entriesByDate).slice(0, 5),
        dryRun: true
      };
    }

    // Create daily entries
    const batch = db.batch();
    let batchCount = 0;
    const maxBatchSize = 500;

    for (const [date, habits] of Object.entries(entriesByDate)) {
      const dailyEntry: DailyEntry = {
        date,
        habits,
        createdAt: habits.reduce((earliest, habit) => 
          habit.createdAt < earliest ? habit.createdAt : earliest, habits[0].createdAt),
        updatedAt: habits.reduce((latest, habit) => 
          habit.lastUpdated > latest ? habit.lastUpdated : latest, habits[0].lastUpdated),
      };

      const dailyEntryRef = db.collection(`users/${userId}/entries`).doc(date);
      batch.set(dailyEntryRef, dailyEntry);
      batchCount++;

      // Commit batch if it reaches max size
      if (batchCount >= maxBatchSize) {
        await batch.commit();
        logger.info(`Committed batch of ${batchCount} daily entries`);
        batchCount = 0;
      }
    }

    // Commit remaining entries
    if (batchCount > 0) {
      await batch.commit();
      logger.info(`Committed final batch of ${batchCount} daily entries`);
    }

    logger.info(`Successfully migrated ${totalEntries} entries to ${Object.keys(entriesByDate).length} daily entries`);

    return {
      success: true,
      message: 'Migration completed successfully',
      totalEntries,
      totalDailyEntries: Object.keys(entriesByDate).length,
      dryRun: false
    };

  } catch (error) {
    logger.error('Error during migration:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Migration failed');
  }
});

/**
 * Cleanup function to remove old habit entry subcollections after successful migration
 * Should only be run after verifying the migration was successful
 */
export const cleanupOldHabitEntries = onCall(callableFunctionOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { userId, confirmCleanup = false } = request.data;

  if (!userId || !confirmCleanup) {
    throw new HttpsError('invalid-argument', 'userId and confirmCleanup=true are required');
  }

  try {
    logger.info(`Starting cleanup of old habit entries for user: ${userId}`);

    // Get all habits for the user
    const habitsRef = db.collection(`users/${userId}/habits`);
    const habitsSnapshot = await habitsRef.get();

    let deletedCount = 0;

    // Process each habit
    for (const habitDoc of habitsSnapshot.docs) {
      const habitId = habitDoc.id;
      
      // Get all entries for this habit
      const entriesRef = db.collection(`users/${userId}/habits/${habitId}/entries`);
      const entriesSnapshot = await entriesRef.get();

      // Delete all entries in batches
      const batch = db.batch();
      let batchCount = 0;

      entriesSnapshot.docs.forEach(entryDoc => {
        batch.delete(entryDoc.ref);
        batchCount++;
        deletedCount++;

        // Commit batch if it reaches max size
        if (batchCount >= 500) {
          batch.commit();
          batchCount = 0;
        }
      });

      // Commit remaining deletions
      if (batchCount > 0) {
        await batch.commit();
      }

      logger.info(`Deleted ${entriesSnapshot.docs.length} entries for habit: ${habitId}`);
    }

    logger.info(`Successfully deleted ${deletedCount} old habit entries`);

    return {
      success: true,
      message: 'Cleanup completed successfully',
      deletedEntries: deletedCount
    };

  } catch (error) {
    logger.error('Error during cleanup:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Cleanup failed');
  }
});