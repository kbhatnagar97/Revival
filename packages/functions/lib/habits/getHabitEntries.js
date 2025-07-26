"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHabitEntries = void 0;
const https_1 = require("firebase-functions/v2/https");
const config_1 = require("../lib/config");
const firebase_1 = require("../lib/firebase");
const firebase_functions_1 = require("firebase-functions");
/**
 * Get habit entries for a date range across all habits
 */
exports.getHabitEntries = (0, https_1.onCall)(config_1.callableFunctionOptions, async (request) => {
    // Check if user is authenticated
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { startDate, endDate } = request.data;
    if (!startDate || !endDate) {
        throw new https_1.HttpsError('invalid-argument', 'startDate and endDate are required');
    }
    try {
        firebase_functions_1.logger.info(`Getting habit entries for user: ${userId}, range: ${startDate} to ${endDate}`);
        const entries = [];
        // Get all habits for the user
        const habitsRef = firebase_1.db.collection(`users/${userId}/habits`);
        const habitsSnapshot = await habitsRef.get();
        // For each habit, get entries in the date range
        for (const habitDoc of habitsSnapshot.docs) {
            const habitId = habitDoc.id;
            const entriesRef = firebase_1.db.collection(`users/${userId}/habits/${habitId}/entries`);
            // Query entries within date range
            const entriesSnapshot = await entriesRef
                .where('__name__', '>=', startDate)
                .where('__name__', '<=', endDate)
                .get();
            entriesSnapshot.docs.forEach(entryDoc => {
                var _a, _b;
                entries.push(Object.assign(Object.assign({ id: entryDoc.id, habitId, date: entryDoc.id }, entryDoc.data()), { createdAt: (_a = entryDoc.data().createdAt) === null || _a === void 0 ? void 0 : _a.toDate().toISOString(), updatedAt: (_b = entryDoc.data().updatedAt) === null || _b === void 0 ? void 0 : _b.toDate().toISOString() }));
            });
        }
        // Sort by date
        entries.sort((a, b) => a.date.localeCompare(b.date));
        firebase_functions_1.logger.info(`Retrieved ${entries.length} habit entries for user: ${userId}`);
        return entries;
    }
    catch (error) {
        firebase_functions_1.logger.error('Error getting habit entries:', error);
        throw new https_1.HttpsError('internal', 'Failed to get habit entries');
    }
});
//# sourceMappingURL=getHabitEntries.js.map