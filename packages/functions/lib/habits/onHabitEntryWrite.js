"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onHabitEntryWrite = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const firebase_functions_1 = require("firebase-functions");
const firebase_1 = require("../lib/firebase");
const config_1 = require("../lib/config");
/**
 * Triggered when a habit entry is created/updated
 * Uses INCREMENTAL streak calculation for performance
 * Follows DATABASE_SCHEMA.md specifications
 */
exports.onHabitEntryWrite = (0, firestore_1.onDocumentWritten)(Object.assign(Object.assign({}, config_1.firestoreTriggerOptions), { document: 'users/{userId}/habits/{habitId}/entries/{entryId}' }), async (event) => {
    var _a, _b;
    const { userId, habitId, entryId } = event.params;
    try {
        firebase_functions_1.logger.info(`Processing habit entry update for user: ${userId}, habit: ${habitId}, entry: ${entryId}`);
        // Get the entry data from the event
        const entryData = (_b = (_a = event.data) === null || _a === void 0 ? void 0 : _a.after) === null || _b === void 0 ? void 0 : _b.data();
        if (!entryData) {
            firebase_functions_1.logger.warn('No entry data found in event');
            return;
        }
        // Get habit document to access current analytics
        const habitRef = firebase_1.db.collection(`users/${userId}/habits`).doc(habitId);
        const habitDoc = await habitRef.get();
        if (!habitDoc.exists) {
            firebase_functions_1.logger.warn(`Habit not found: ${habitId}`);
            return;
        }
        const habitData = habitDoc.data();
        if (!habitData) {
            firebase_functions_1.logger.warn(`No habit data found for: ${habitId}`);
            return;
        }
        // Calculate incremental streak update
        const isCompletedToday = entryData.count >= habitData.goal;
        // Simple incremental streak calculation
        let newCurrentStreak = habitData.currentStreak || 0;
        let newBestStreak = habitData.bestStreak || 0;
        let newTotalCompletions = habitData.totalCompletions || 0;
        if (isCompletedToday) {
            // If completed today, increment streak and total
            newCurrentStreak += 1;
            newTotalCompletions += 1;
            // Update best streak if current is better
            if (newCurrentStreak > newBestStreak) {
                newBestStreak = newCurrentStreak;
            }
        }
        else {
            // Reset streak if not completed
            newCurrentStreak = 0;
        }
        // Update habit document with new analytics
        await habitRef.update({
            currentStreak: newCurrentStreak,
            bestStreak: newBestStreak,
            totalCompletions: newTotalCompletions,
            'analytics.allTimeConsistency': newTotalCompletions > 0 ? (newTotalCompletions / Math.max(1, newCurrentStreak + 1)) * 100 : 0,
            updatedAt: firebase_1.Timestamp.now()
        });
        firebase_functions_1.logger.info(`Successfully updated habit summary for ${habitId}, streak: ${newCurrentStreak}, total: ${newTotalCompletions}`);
    }
    catch (error) {
        firebase_functions_1.logger.error('Error processing habit entry update:', error);
        throw error;
    }
});
//# sourceMappingURL=onHabitEntryWrite.js.map