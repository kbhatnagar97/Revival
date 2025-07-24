"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onDailyEntryWrite = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const firebase_functions_1 = require("firebase-functions");
const firebase_1 = require("../lib/firebase");
const dateUtils_1 = require("../lib/dateUtils");
const config_1 = require("../lib/config");
/**
 * Triggered when a daily entry is created or updated
 * Recalculates habit streak and statistics
 */
exports.onDailyEntryWrite = (0, firestore_1.onDocumentWritten)(Object.assign(Object.assign({}, config_1.firestoreTriggerOptions), { document: 'users/{userId}/habits/{habitId}/entries/{entryId}' }), async (event) => {
    var _a, _b, _c;
    const { userId, habitId } = event.params;
    const entryData = (_b = (_a = event.data) === null || _a === void 0 ? void 0 : _a.after) === null || _b === void 0 ? void 0 : _b.data();
    if (!entryData) {
        firebase_functions_1.logger.warn(`No entry data found for ${habitId}`);
        return;
    }
    try {
        firebase_functions_1.logger.info(`Processing daily entry for habit: ${habitId}`);
        // Get the habit document
        const habitDoc = await firebase_1.db.collection(`users/${userId}/habits`).doc(habitId).get();
        const habitData = habitDoc.data();
        if (!habitData) {
            firebase_functions_1.logger.warn(`Habit not found: ${habitId}`);
            return;
        }
        // Get user timezone
        const userDoc = await firebase_1.db.collection('users').doc(userId).get();
        const userTimezone = ((_c = userDoc.data()) === null || _c === void 0 ? void 0 : _c.timezone) || 'America/Los_Angeles';
        // Calculate current streak (simplified version)
        const today = dateUtils_1.dateUtils.getTodayMidnight(userTimezone);
        const isCompletedToday = entryData.count >= habitData.goal;
        let currentStreak = 0;
        if (isCompletedToday && dateUtils_1.dateUtils.isDateScheduled(today, habitData.scheduledDays)) {
            currentStreak = habitData.currentStreak + 1;
        }
        // Update habit summary
        await firebase_1.db.collection(`users/${userId}/habits`).doc(habitId).update({
            currentStreak,
            totalCompletions: habitData.totalCompletions + (isCompletedToday ? 1 : 0),
            lastCalculated: firebase_1.Timestamp.now(),
            updatedAt: firebase_1.Timestamp.now(),
        });
        firebase_functions_1.logger.info(`Successfully updated habit summary for: ${habitId}`);
    }
    catch (error) {
        firebase_functions_1.logger.error('Error processing daily entry:', error);
        throw error;
    }
});
//# sourceMappingURL=onDailyEntryWrite.js.map