"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recalculateSummary = void 0;
const https_1 = require("firebase-functions/v2/https");
const config_1 = require("../lib/config");
const firebase_1 = require("../lib/firebase");
const firebase_functions_1 = require("firebase-functions");
/**
 * Recalculates habit summary statistics
 * Follows DATABASE_SCHEMA.md specifications for HabitDocument analytics
 */
exports.recalculateSummary = (0, https_1.onCall)(config_1.callableFunctionOptions, async (request) => {
    // Check if user is authenticated
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { habitId } = request.data;
    if (!habitId) {
        throw new https_1.HttpsError('invalid-argument', 'habitId is required');
    }
    try {
        firebase_functions_1.logger.info(`Recalculating summary for habit: ${habitId}, user: ${userId}`);
        // Verify habit ownership - use correct collection path
        const habitRef = firebase_1.db.collection(`users/${userId}/habits`).doc(habitId);
        const habitDoc = await habitRef.get();
        if (!habitDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Habit not found');
        }
        const habitData = habitDoc.data();
        if (!habitData) {
            throw new https_1.HttpsError('not-found', 'Habit data not found');
        }
        // Get all habit entries for calculation
        const entriesRef = firebase_1.db.collection(`users/${userId}/habits/${habitId}/entries`);
        const entriesSnapshot = await entriesRef.get();
        let totalCompletions = 0;
        let currentStreak = 0;
        let bestStreak = 0;
        let totalDebt = 0;
        let totalSurplus = 0;
        let tempStreak = 0;
        const entries = entriesSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data()))).sort((a, b) => a.id.localeCompare(b.id)); // Sort by date (YYYY-MM-DD)
        for (const entry of entries) {
            const count = entry.count || 0;
            const goalAtTime = entry.goalAtTime || habitData.goal || 1;
            if (count >= goalAtTime) {
                totalCompletions++;
                tempStreak++;
                if (count > goalAtTime) {
                    totalSurplus += (count - goalAtTime);
                }
            }
            else {
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
            updatedAt: firebase_1.Timestamp.now()
        });
        firebase_functions_1.logger.info(`Successfully recalculated summary for habit: ${habitId}`);
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
    }
    catch (error) {
        firebase_functions_1.logger.error('Error recalculating habit summary:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to recalculate habit summary');
    }
});
//# sourceMappingURL=recalculateSummary.js.map