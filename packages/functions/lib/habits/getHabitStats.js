"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHabitStats = void 0;
const https_1 = require("firebase-functions/v2/https");
const config_1 = require("../lib/config");
const firebase_1 = require("../lib/firebase");
exports.getHabitStats = (0, https_1.onCall)(config_1.callableFunctionOptions, async (request) => {
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
        // Verify habit ownership
        const habitRef = firebase_1.db.collection('habits').doc(habitId);
        const habitDoc = await habitRef.get();
        if (!habitDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Habit not found');
        }
        const habitData = habitDoc.data();
        if ((habitData === null || habitData === void 0 ? void 0 : habitData.userId) !== userId) {
            throw new https_1.HttpsError('permission-denied', 'Not authorized to access this habit');
        }
        // Get all entries for this habit
        const entriesSnapshot = await firebase_1.db
            .collection('habitEntries')
            .where('userId', '==', userId)
            .where('habitId', '==', habitId)
            .orderBy('date', 'desc')
            .get();
        const entries = entriesSnapshot.docs.map(doc => doc.data());
        // Calculate analytics
        const totalEntries = entries.length;
        const completedEntries = entries.filter(entry => entry.completed).length;
        const totalCompletions = entries.reduce((sum, entry) => sum + (entry.count || 0), 0);
        const completionRate = totalEntries > 0 ? (completedEntries / totalEntries) * 100 : 0;
        const averageDaily = totalEntries > 0 ? totalCompletions / totalEntries : 0;
        // Calculate current streak
        let currentStreak = 0;
        const today = new Date().toISOString().split('T')[0];
        const sortedEntries = entries.sort((a, b) => b.date.localeCompare(a.date));
        for (const entry of sortedEntries) {
            if (entry.completed && entry.date <= today) {
                currentStreak++;
            }
            else {
                break;
            }
        }
        // Calculate longest streak
        let longestStreak = 0;
        let tempStreak = 0;
        for (const entry of sortedEntries.reverse()) {
            if (entry.completed) {
                tempStreak++;
                longestStreak = Math.max(longestStreak, tempStreak);
            }
            else {
                tempStreak = 0;
            }
        }
        // Calculate consistency (percentage of expected days completed)
        const consistency = completionRate;
        const lastCompletedEntry = entries.find(entry => entry.completed);
        const lastCompletedDate = lastCompletedEntry === null || lastCompletedEntry === void 0 ? void 0 : lastCompletedEntry.date;
        return {
            currentStreak,
            longestStreak,
            completionRate: Math.round(completionRate * 100) / 100,
            totalCompletions,
            averageDaily: Math.round(averageDaily * 100) / 100,
            consistency: Math.round(consistency * 100) / 100,
            lastCompletedDate,
        };
    }
    catch (error) {
        console.error('Error getting habit stats:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to get habit stats');
    }
});
//# sourceMappingURL=getHabitStats.js.map