import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { callableFunctionOptions } from '../lib/config';
import { db, Timestamp } from '../lib/firebase';
import { logger } from 'firebase-functions';

/**
 * Update an existing habit for the authenticated user
 */
export const updateHabit = onCall(callableFunctionOptions, async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { habitId, days, sortOrder, isActive, ...updates } = request.data;

  if (!habitId) {
    throw new HttpsError('invalid-argument', 'habitId is required');
  }

  // Helper function to convert days array to scheduledDays object if needed
  function convertDaysToScheduledDays(days?: number[]): { [day: string]: boolean } | undefined {
    if (!days) return undefined;
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const scheduledDays: { [day: string]: boolean } = {};
    dayNames.forEach((dayName, index) => {
      scheduledDays[dayName] = days.includes(index);
    });
    
    return scheduledDays;
  }

  try {
    logger.info(`Updating habit: ${habitId} for user: ${userId}`, updates);

    // Verify habit ownership
    const habitRef = db.collection(`users/${userId}/habits`).doc(habitId);
    const habitDoc = await habitRef.get();

    if (!habitDoc.exists) {
      throw new HttpsError('not-found', 'Habit not found');
    }

    // Prepare update data with schema conversions
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    // Convert legacy fields to new schema
    if (days !== undefined) {
      updateData.scheduledDays = convertDaysToScheduledDays(days);
    }
    
    if (sortOrder !== undefined) {
      updateData.order = sortOrder;
    }
    
    if (isActive !== undefined) {
      updateData.status = isActive ? 'active' : 'paused';
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    await habitRef.update(updateData);

    // Get updated habit
    const updatedDoc = await habitRef.get();
    const updatedHabit = {
      id: updatedDoc.id,
      ...updatedDoc.data(),
      createdAt: updatedDoc.data()?.createdAt?.toDate().toISOString(),
      updatedAt: updatedDoc.data()?.updatedAt?.toDate().toISOString(),
    };

    logger.info(`Successfully updated habit: ${habitId} for user: ${userId}`);
    return updatedHabit;
  } catch (error) {
    logger.error('Error updating habit:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to update habit');
  }
});
