"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHabitEntriesForHabit = void 0;
const https_1 = require("firebase-functions/v2/https");
const config_1 = require("../lib/config");
const firebase_1 = require("../lib/firebase");
const firebase_functions_1 = require("firebase-functions");
/**
 * Get habit entries for a specific habit, optionally within a date range
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
        // Get entries for the habit
        const entriesRef = firebase_1.db.collection(`users/${userId}/habits/${habitId}/entries`);
        let query = entriesRef.orderBy('__name__', 'asc');
        // Apply date range filter if provided
        if (startDate) {
            query = query.where('__name__', '>=', startDate);
        }
        if (endDate) {
            query = query.where('__name__', '<=', endDate);
        }
        const entriesSnapshot = await query.get();
        const entries = entriesSnapshot.docs.map(doc => {
            var _a, _b;
            return (Object.assign(Object.assign({ id: doc.id, habitId, date: doc.id }, doc.data()), { createdAt: (_a = doc.data().createdAt) === null || _a === void 0 ? void 0 : _a.toDate().toISOString(), updatedAt: (_b = doc.data().updatedAt) === null || _b === void 0 ? void 0 : _b.toDate().toISOString() }));
        });
        firebase_functions_1.logger.info(`Retrieved ${entries.length} entries for habit: ${habitId}`);
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