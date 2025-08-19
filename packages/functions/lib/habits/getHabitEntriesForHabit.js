"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHabitEntriesForHabit = void 0;
const https_1 = require("firebase-functions/v2/https");
const config_1 = require("../lib/config");
const firebase_1 = require("../lib/firebase");
const firebase_functions_1 = require("firebase-functions");
/**
 * Get habit entries for a specific habit, optionally within a date range
 * Now queries the new daily entries collection structure
 */
exports.getHabitEntriesForHabit = (0, https_1.onCall)(config_1.callableFunctionOptions, async (request) => {
    // Check if user is authenticated
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { habitId, startDate, endDate } = request.data;
    if (!habitId) {
        throw new https_1.HttpsError('invalid-argument', 'habitId is required');
    }
    try {
        firebase_functions_1.logger.info(`Getting entries for habit: ${habitId}, user: ${userId}`, {
            startDate: startDate || 'not specified',
            endDate: endDate || 'not specified'
        });
        // Verify habit ownership
        const habitRef = firebase_1.db.collection(`users/${userId}/habits`).doc(habitId);
        const habitDoc = await habitRef.get();
        if (!habitDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Habit not found');
        }
        // Query daily entries collection
        const entriesRef = firebase_1.db.collection(`users/${userId}/entries`);
        let query = entriesRef.orderBy('date', 'asc');
        // Apply date range filter if provided
        if (startDate) {
            query = query.where('date', '>=', startDate);
        }
        if (endDate) {
            query = query.where('date', '<=', endDate);
        }
        const entriesSnapshot = await query.get();
        // Filter and transform daily entries to get specific habit data
        const habitEntries = [];
        entriesSnapshot.docs.forEach(doc => {
            const dailyEntry = doc.data();
            // Find the specific habit within this daily entry
            const habitData = dailyEntry.habits.find(h => h.habitId === habitId);
            if (habitData) {
                habitEntries.push({
                    id: `${doc.id}-${habitId}`, // Generate unique ID
                    habitId,
                    date: doc.id, // Document ID is the date (YYYY-MM-DD)
                    count: habitData.count,
                    completed: habitData.completed,
                    goalAtTime: habitData.goalAtTime,
                    notes: habitData.notes,
                    createdAt: habitData.createdAt,
                    updatedAt: habitData.lastUpdated,
                });
            }
        });
        // Transform timestamps for response
        const entries = habitEntries.map(entry => {
            var _a, _b;
            return (Object.assign(Object.assign({}, entry), { createdAt: (_a = entry.createdAt) === null || _a === void 0 ? void 0 : _a.toDate().toISOString(), updatedAt: (_b = entry.updatedAt) === null || _b === void 0 ? void 0 : _b.toDate().toISOString() }));
        });
        firebase_functions_1.logger.info(`Retrieved ${entries.length} entries for habit: ${habitId} from ${entriesSnapshot.docs.length} daily entries`);
        return entries;
    }
    catch (error) {
        firebase_functions_1.logger.error('Error getting habit entries for habit:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to get habit entries');
    }
});
//# sourceMappingURL=getHabitEntriesForHabit.js.map