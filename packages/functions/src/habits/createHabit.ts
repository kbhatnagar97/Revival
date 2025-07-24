import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { callableFunctionOptions } from '../lib/config';
import { db, Timestamp } from '../lib/firebase';
import { logger } from 'firebase-functions';

/**
 * Create a new habit for the authenticated user
 */
export const createHabit = onCall(callableFunctionOptions, async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { name, description, icon, color, goal, frequency, days } = request.data;

  // Validate required fields
  if (!name || !icon || !color || !goal || !frequency) {
    throw new HttpsError('invalid-argument', 'Missing required fields: name, icon, color, goal, frequency');
  }

  try {
    logger.info(`Creating habit for user: ${userId}`, { name, goal, frequency });

    // Get current max sort order
    const habitsRef = db.collection(`users/${userId}/habits`);
    const existingHabits = await habitsRef.orderBy('sortOrder', 'desc').limit(1).get();
    const maxSortOrder = existingHabits.empty ? 0 : existingHabits.docs[0].data().sortOrder || 0;

    // Create new habit document
    const habitData = {
      name,
      description: description || '',
      icon,
      color,
      goal,
      frequency,
      days: days || [1, 2, 3, 4, 5, 6, 0], // Default to all days
      isActive: true,
      sortOrder: maxSortOrder + 1,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      // Initialize analytics
      currentStreak: 0,
      longestStreak: 0,
      completionRate: 0,
      totalCompletions: 0,
      averageDaily: 0,
      consistency: 0,
      lastCompletedDate: null,
    };

    const docRef = await habitsRef.add(habitData);
    
    const createdHabit = {
      id: docRef.id,
      ...habitData,
      createdAt: habitData.createdAt.toDate().toISOString(),
      updatedAt: habitData.updatedAt.toDate().toISOString(),
    };

    logger.info(`Successfully created habit: ${docRef.id} for user: ${userId}`);
    return createdHabit;
  } catch (error) {
    logger.error('Error creating habit:', error);
    throw new HttpsError('internal', 'Failed to create habit');
  }
});
