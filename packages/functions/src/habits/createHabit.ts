import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { callableFunctionOptions } from '../lib/config';
import { db, Timestamp } from '../lib/firebase';
import { logger } from 'firebase-functions';

// Helper function to convert days array to scheduledDays object
function convertDaysToScheduledDays(days?: number[]): { [day: string]: boolean } {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const defaultDays = [1, 2, 3, 4, 5, 6, 0]; // Default to all days
  const daysToUse = days || defaultDays;
  
  const scheduledDays: { [day: string]: boolean } = {};
  dayNames.forEach((dayName, index) => {
    scheduledDays[dayName] = daysToUse.includes(index);
  });
  
  return scheduledDays;
}

/**
 * Create a new habit for the authenticated user
 */
export const createHabit = onCall(callableFunctionOptions, async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { name, icon, color, goal, days } = request.data;

  // Validate required fields
  if (!name || !icon || !color || !goal) {
    throw new HttpsError('invalid-argument', 'Missing required fields: name, icon, color, goal');
  }

  try {
    logger.info(`Creating habit for user: ${userId}`, { name, goal });

    // Get current max sort order
    const habitsRef = db.collection(`users/${userId}/habits`);
    const existingHabits = await habitsRef.orderBy('sortOrder', 'desc').limit(1).get();
    const maxSortOrder = existingHabits.empty ? 0 : existingHabits.docs[0].data().sortOrder || 0;

    // Create new habit document
    const habitData = {
      name,
      icon,
      color,
      goal,
      scheduledDays: convertDaysToScheduledDays(days),
      status: 'active' as const,
      reminder: null,
      analytics: {
        totalDebt: 0,
        totalSurplus: 0,
        currentStreak: 0,
        bestStreak: 0,
        totalCompletions: 0,
        allTimeConsistency: 0,
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      order: maxSortOrder + 1,
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
