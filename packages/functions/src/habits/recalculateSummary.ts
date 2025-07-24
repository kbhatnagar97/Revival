import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { callableFunctionOptions } from '../lib/config';
import { db, Timestamp } from '../lib/firebase';
import { logger } from 'firebase-functions';

/**
 * Recalculates habit summary statistics
 * Follows DATABASE_SCHEMA.md specifications for HabitDocument analytics
 */
export const recalculateSummary = onCall(callableFunctionOptions, async (request) => {
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
    logger.info(`Recalculating summary for habit: ${habitId}, user: ${userId}`);

    // Verify habit ownership - use correct collection path
    const habitRef = db.collection(`users/${userId}/habits`).doc(habitId);
    const habitDoc = await habitRef.get();

    if (!habitDoc.exists) {
      throw new HttpsError('not-found', 'Habit not found');
    }

    const habitData = habitDoc.data();
    if (!habitData) {
      throw new HttpsError('not-found', 'Habit data not found');
    }

    // Get all habit entries for calculation
    const entriesRef = db.collection(`users/${userId}/habits/${habitId}/entries`);
    const entriesSnapshot = await entriesRef.get();

    let totalCompletions = 0;
    let currentStreak = 0;
    let bestStreak = 0;
    let totalDebt = 0;
    let totalSurplus = 0;
    let tempStreak = 0;

    // Calculate statistics from entries
    interface HabitEntry {
      count: number;
      goalAtTime: number;
    }

    const entries = entriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as HabitEntry)
    })).sort((a, b) => a.id.localeCompare(b.id)); // Sort by date (YYYY-MM-DD)

    for (const entry of entries) {
      const count = entry.count || 0;
      const goalAtTime = entry.goalAtTime || habitData.goal || 1;
      
      if (count >= goalAtTime) {
        totalCompletions++;
        tempStreak++;
        if (count > goalAtTime) {
          totalSurplus += (count - goalAtTime);
        }
      } else {
        totalDebt += (goalAtTime - count);
        if (tempStreak > bestStreak) {
          bestStreak = tempStreak;
        }
        tempStreak = 0;
      }
    }

    // Final streak check
    if (tempStreak > bestStreak) {
      bestStreak = tempStreak;
    }
    currentStreak = tempStreak;

    // Calculate all-time consistency
    const totalScheduledDays = entries.length;
    const allTimeConsistency = totalScheduledDays > 0 ? (totalCompletions / totalScheduledDays) * 100 : 0;

    // Update habit document with recalculated analytics
    await habitRef.update({
      currentStreak,
      bestStreak,
      totalCompletions,
      'analytics.allTimeConsistency': Math.round(allTimeConsistency * 100) / 100,
      'analytics.totalDebt': totalDebt,
      'analytics.totalSurplus': totalSurplus,
      updatedAt: Timestamp.now()
    });

    logger.info(`Successfully recalculated summary for habit: ${habitId}`);
    
    return { 
      success: true, 
      summary: {
        currentStreak,
        bestStreak,
        totalCompletions,
        allTimeConsistency: Math.round(allTimeConsistency * 100) / 100,
        totalDebt,
        totalSurplus
      }
    };
  } catch (error) {
    logger.error('Error recalculating habit summary:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to recalculate habit summary');
  }
});
