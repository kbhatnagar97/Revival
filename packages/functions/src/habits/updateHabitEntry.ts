import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { callableFunctionOptions } from '../lib/config';
import { db, Timestamp } from '../lib/firebase';
import { logger } from 'firebase-functions';

/**
 * Update or create a habit entry for a specific date
 * This will trigger onHabitEntryWrite for streak calculation
 */
export const updateHabitEntry = onCall(callableFunctionOptions, async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { habitId, date, count, completed, notes } = request.data;

  if (!habitId || !date) {
    throw new HttpsError('invalid-argument', 'habitId and date are required');
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    throw new HttpsError('invalid-argument', 'Date must be in YYYY-MM-DD format');
  }

  try {
    logger.info(`Updating habit entry for habit: ${habitId}, date: ${date}, user: ${userId}`, {
      count,
      completed,
      notes: notes ? 'provided' : 'not provided'
    });

    // Verify habit ownership
    const habitRef = db.collection(`users/${userId}/habits`).doc(habitId);
    const habitDoc = await habitRef.get();

    if (!habitDoc.exists) {
      throw new HttpsError('not-found', 'Habit not found');
    }

    const habitData = habitDoc.data();
    if (!habitData) {
      throw new HttpsError('not-found', 'Habit data not found');
    }

    // Get or create the entry
    const entryRef = db.collection(`users/${userId}/habits/${habitId}/entries`).doc(date);
    const entryDoc = await entryRef.get();

    const now = Timestamp.now();
    let entryData;

    if (entryDoc.exists) {
      // Update existing entry
      const updates: any = {
        updatedAt: now,
      };

      if (count !== undefined) updates.count = count;
      if (completed !== undefined) updates.completed = completed;
      if (notes !== undefined) updates.notes = notes;

      // Determine completion status
      const finalCount = count !== undefined ? count : entryDoc.data()?.count || 0;
      updates.completed = finalCount >= habitData.goal;

      await entryRef.update(updates);

      // Get updated entry
      const updatedDoc = await entryRef.get();
      entryData = updatedDoc.data();
    } else {
      // Create new entry
      const finalCount = count || 0;
      entryData = {
        count: finalCount,
        completed: finalCount >= habitData.goal,
        notes: notes || '',
        goalAtTime: habitData.goal, // Store goal at time of entry
        createdAt: now,
        updatedAt: now,
      };

      await entryRef.set(entryData);
    }

    if (!entryData) {
      throw new HttpsError('internal', 'Failed to create/update entry data');
    }

    const result = {
      id: date,
      habitId,
      date,
      ...entryData,
      createdAt: entryData.createdAt.toDate().toISOString(),
      updatedAt: entryData.updatedAt.toDate().toISOString(),
    };

    logger.info(`Successfully updated habit entry for habit: ${habitId}, date: ${date}`);
    return result;
  } catch (error) {
    logger.error('Error updating habit entry:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to update habit entry');
  }
});
